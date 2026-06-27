from fastapi import APIRouter, BackgroundTasks, HTTPException
from pydantic import BaseModel
import uuid
import json
from backend.db.sqlite import create_pipeline_run, get_pipeline_run, get_recommendations_by_session
from backend.graph.build_graph import execute_graph_task
from backend.models.recommendation import RecommendationModel

router = APIRouter()

class PipelineRunRequest(BaseModel):
    account_id: str
    raw_text: str

class PipelineRunResponse(BaseModel):
    session_id: str
    status: str

class PipelineStatusResponse(BaseModel):
    status: str
    planner_decision: dict | None = None
    analysis: dict | None = None
    recommendations: list = []
    retrieved_chunks: list = []
    errors: list[str] = []

@router.post("/run", response_model=PipelineRunResponse)
async def run_pipeline(payload: PipelineRunRequest, background_tasks: BackgroundTasks):
    session_id = str(uuid.uuid4())
    
    # Initialize pipeline run record in SQLite with "running" status
    create_pipeline_run(session_id, payload.account_id, payload.raw_text)
    
    # Trigger graph execution in a background task
    background_tasks.add_task(execute_graph_task, session_id, payload.account_id, payload.raw_text)
    
    return PipelineRunResponse(session_id=session_id, status="running")

@router.get("/{session_id}", response_model=PipelineStatusResponse)
async def get_pipeline_status(session_id: str):
    run = get_pipeline_run(session_id)
    if not run:
        raise HTTPException(status_code=404, detail="Pipeline run session not found.")
        
    try:
        state = json.loads(run["state_json"])
    except Exception:
        state = {}
        
    return PipelineStatusResponse(
        status=run["status"],
        planner_decision=state.get("planner_decision"),
        analysis=state.get("analysis"),
        recommendations=state.get("recommendations", []),
        retrieved_chunks=state.get("retrieved_chunks", []),
        errors=state.get("errors", [])
    )

@router.get("/{session_id}/recommendations", response_model=list[RecommendationModel])
async def get_pipeline_recommendations(session_id: str):
    run = get_pipeline_run(session_id)
    if not run:
        raise HTTPException(status_code=404, detail="Pipeline run session not found.")
    
    recs = get_recommendations_by_session(session_id)
    return [RecommendationModel(**r) for r in recs]
