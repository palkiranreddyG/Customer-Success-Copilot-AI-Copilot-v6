from pydantic import BaseModel

class AccountBase(BaseModel):
    name: str
    arr: float
    health_score: int
    tenure_months: int

class AccountCreate(AccountBase):
    id: str | None = None

class Account(AccountBase):
    id: str

    class Config:
        from_attributes = True

class ChunkResult(BaseModel):
    text: str
    source: str
    section: str
    score: float

class SearchResponse(BaseModel):
    chunks: list[ChunkResult]

class HealthResponse(BaseModel):
    status: str
