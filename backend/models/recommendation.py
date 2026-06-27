from pydantic import BaseModel, Field, field_validator
from typing import List, Optional
from enum import Enum

class ActionType(str, Enum):
    RETENTION = "RETENTION"
    EXPANSION = "EXPANSION"
    ESCALATION = "ESCALATION"
    ENABLEMENT = "ENABLEMENT"

class EvidenceModel(BaseModel):
    source: str
    section: str
    quoted_text: str
    supported: bool

class RecommendationModel(BaseModel):
    id: Optional[str] = None
    action_title: str = Field(..., description="Title of the action (max 8 words)")
    action_type: ActionType = Field(..., description="Type of next best action")
    confidence: float = Field(..., description="Confidence score between 0.0 and 1.0", ge=0.0, le=1.0)
    priority: int = Field(..., description="Priority tier (1-3)", ge=1, le=3)
    business_impact: str = Field(..., description="One sentence business impact")
    evidence: Optional[EvidenceModel] = None
    evaluation_status: Optional[str] = "approved"
    evaluation_passed: Optional[bool] = True
    evaluation_reasons: Optional[List[str]] = Field(default_factory=list)

    @field_validator('action_title')
    @classmethod
    def validate_word_count(cls, v: str) -> str:
        words = v.strip().split()
        if len(words) > 8:
            raise ValueError(f"Action title must be max 8 words, got {len(words)} words.")
        return v

class RecommendationList(BaseModel):
    recommendations: List[RecommendationModel]

    @field_validator('recommendations')
    @classmethod
    def validate_count(cls, v: List[RecommendationModel]) -> List[RecommendationModel]:
        if len(v) != 3:
            raise ValueError(f"Must contain exactly 3 recommendations, got {len(v)}.")
        return v
