import uuid
from fastapi import APIRouter, HTTPException, Path
from backend.models.schemas import Account, AccountCreate
from backend.db.sqlite import (
    get_all_accounts,
    get_account_by_id,
    add_account,
    update_account,
    delete_account
)

router = APIRouter(prefix="/api/v1/accounts", tags=["Accounts"])

@router.get("", response_model=list[Account])
async def list_accounts():
    accounts_data = get_all_accounts()
    return [Account(**acc) for acc in accounts_data]

@router.get("/{id}", response_model=Account)
async def get_account(id: str = Path(..., description="The Account ID")):
    acc = get_account_by_id(id)
    if not acc:
        raise HTTPException(status_code=404, detail="Account not found")
    return Account(**acc)

@router.post("", response_model=Account)
async def create_new_account(payload: AccountCreate):
    account_id = payload.id or f"acc-{str(uuid.uuid4())[:8]}"
    existing = get_account_by_id(account_id)
    if existing:
        raise HTTPException(status_code=400, detail="Account ID already exists")
    
    add_account(
        id=account_id,
        name=payload.name,
        arr=payload.arr,
        health_score=payload.health_score,
        tenure_months=payload.tenure_months,
        industry=payload.industry or "Technology",
        renewal_date=payload.renewal_date or "2026-12-31",
        risk_level=payload.risk_level or "Low",
        last_interaction=payload.last_interaction or "2026-06-01"
    )
    
    return Account(id=account_id, **payload.model_dump(exclude={"id"}))

@router.put("/{id}", response_model=Account)
async def update_existing_account(id: str, payload: AccountCreate):
    existing = get_account_by_id(id)
    if not existing:
        raise HTTPException(status_code=404, detail="Account not found")
    
    update_account(
        id=id,
        name=payload.name,
        arr=payload.arr,
        health_score=payload.health_score,
        tenure_months=payload.tenure_months,
        industry=payload.industry or existing.get("industry", "Technology"),
        renewal_date=payload.renewal_date or existing.get("renewal_date", "2026-12-31"),
        risk_level=payload.risk_level or existing.get("risk_level", "Low"),
        last_interaction=payload.last_interaction or existing.get("last_interaction", "2026-06-01")
    )
    
    return Account(id=id, **payload.model_dump(exclude={"id"}))

@router.delete("/{id}")
async def delete_existing_account(id: str):
    existing = get_account_by_id(id)
    if not existing:
        raise HTTPException(status_code=404, detail="Account not found")
    delete_account(id)
    return {"status": "deleted", "id": id}
