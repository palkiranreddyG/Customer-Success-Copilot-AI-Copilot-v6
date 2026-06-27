import uuid
from fastapi import APIRouter, HTTPException, Path
from pydantic import BaseModel
from typing import Optional, List
from backend.db.sqlite import (
    get_recommendation_by_id,
    create_audit_log_entry,
    get_audit_log_by_account,
    update_recommendation_status
)
from backend.services.memory_service import add_memory_entry

router = APIRouter(prefix="/api/v1", tags=["Human Approval & Audit Log"])

class DecisionRequest(BaseModel):
    decision: str  # "approved" | "rejected" | "modified"
    note: Optional[str] = None

class DecisionResponse(BaseModel):
    audit_log_id: str
    status: str

class AuditLogEntry(BaseModel):
    id: str
    session_id: str
    account_id: str
    recommendation_id: str
    decision: str
    note: Optional[str]
    decided_by: Optional[str]
    timestamp: str

@router.post("/recommendations/{id}/decision", response_model=DecisionResponse)
def record_decision(id: str, payload: DecisionRequest):
    decision = payload.decision
    note = payload.note
    
    if decision not in ("approved", "rejected", "modified"):
        raise HTTPException(status_code=400, detail="Decision must be one of approved, rejected, modified.")
        
    # 1. Fetch from SQLite (source of truth)
    rec = get_recommendation_by_id(id)
    if not rec:
        raise HTTPException(status_code=404, detail=f"Recommendation with ID '{id}' not found.")
        
    session_id = rec["session_id"]
    account_id = rec["account_id"]
    
    # 2. Write to SQLite audit log (Synchronous / Source of Truth)
    audit_log_id = str(uuid.uuid4())
    try:
        create_audit_log_entry(
            id=audit_log_id,
            session_id=session_id,
            account_id=account_id,
            recommendation_id=id,
            decision=decision,
            note=note,
            decided_by="Human User"
        )
        
        # Update the recommendation status in recommendations table
        update_recommendation_status(id, decision)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to record audit log: {str(e)}")
        
    # 3. Add to ChromaDB Memory collection (Best-effort, safe from crashing request)
    try:
        add_memory_entry(
            account_id=account_id,
            rec=rec,
            decision=decision,
            note=note
        )
    except Exception as e:
        print(f"Approval Router: Best-effort vector store save failed: {e}")
        
    return DecisionResponse(audit_log_id=audit_log_id, status="recorded")

@router.get("/accounts/{id}/audit-log", response_model=List[AuditLogEntry])
def read_audit_log(id: str = Path(..., description="The Account ID")):
    try:
        entries = get_audit_log_by_account(id)
        # Convert timestamp to string if it is an object
        formatted_entries = []
        for entry in entries:
            formatted_entries.append(AuditLogEntry(
                id=entry["id"],
                session_id=entry["session_id"],
                account_id=entry["account_id"],
                recommendation_id=entry["recommendation_id"],
                decision=entry["decision"],
                note=entry["note"],
                decided_by=entry["decided_by"],
                timestamp=str(entry["timestamp"])
            ))
        return formatted_entries
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch audit log: {str(e)}")
