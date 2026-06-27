from typing import TypedDict, List, Dict, Any

class AgentState(TypedDict):
    session_id: str
    account_id: str
    raw_text: str
    interaction_type: str
    retrieved_chunks: List[Dict[str, Any]]
    planner_decision: Dict[str, Any]
    analysis: Dict[str, Any]
    recommendations: List[Dict[str, Any]]
    evaluation_attempts: int
    critique: str
    errors: List[str]
