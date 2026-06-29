import os
import time
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, Query, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from backend.config import settings
from backend.db.sqlite import init_db, get_all_accounts, get_db_connection
from backend.db.chroma import get_kb_collection
from backend.models.schemas import Account, SearchResponse, ChunkResult, HealthResponse

logger = logging.getLogger("antigravity.api")

@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    yield

app = FastAPI(
    title=settings.PROJECT_NAME,
    lifespan=lifespan
)

# ── Response-time logging middleware ────────────────────────────────────────
@app.middleware("http")
async def log_response_time(request: Request, call_next) -> Response:
    start = time.perf_counter()
    response = await call_next(request)
    elapsed_ms = (time.perf_counter() - start) * 1000
    response.headers["X-Response-Time-Ms"] = f"{elapsed_ms:.1f}"
    if request.url.path.startswith("/api/"):
        logger.info(
            "%-6s %-55s %d  %.1fms",
            request.method, request.url.path, response.status_code, elapsed_ms
        )
    return response

# Enable CORS for frontend development server
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from backend.routers.pipeline_router import router as pipeline_router
from backend.routers.approval_router import router as approval_router
from backend.routers.accounts_router import router as accounts_router
from backend.routers.kb_router import router as kb_router

app.include_router(pipeline_router, prefix="/api/v1/pipeline", tags=["pipeline"])
app.include_router(approval_router)
app.include_router(accounts_router)
app.include_router(kb_router)

@app.get("/api/v1/health", response_model=HealthResponse)
async def health_check():
    return HealthResponse(status="ok")

@app.get("/api/v1/kb/search", response_model=SearchResponse)
async def kb_search(
    q: str = Query(..., description="Query string for search"),
    k: int = Query(5, description="Number of results to retrieve")
):
    collection = get_kb_collection()
    results = collection.query(query_texts=[q], n_results=k)
    chunks = []
    if results and "documents" in results and results["documents"]:
        documents = results["documents"][0]
        metadatas = results["metadatas"][0]
        distances = results["distances"][0] if "distances" in results and results["distances"] else [0.0] * len(documents)
        for doc, meta, dist in zip(documents, metadatas, distances):
            chunks.append(ChunkResult(
                text=doc,
                source=meta.get("source", "unknown"),
                section=meta.get("section", "unknown"),
                score=float(dist)
            ))
    return SearchResponse(chunks=chunks)

# ── Platform Stats endpoint ─────────────────────────────────────────────────
@app.get("/api/v1/platform/stats")
async def platform_stats():
    """Aggregate stats: total runs, avg confidence, approval rate, total accounts."""
    conn = get_db_connection()
    cur = conn.cursor()

    # Total sessions (unique pipeline runs)
    total_runs = cur.execute(
        "SELECT COUNT(DISTINCT session_id) FROM pipeline_runs"
    ).fetchone()[0]

    # Average recommendation confidence
    avg_conf_row = cur.execute(
        "SELECT AVG(confidence) FROM recommendations"
    ).fetchone()
    avg_confidence = float(avg_conf_row[0]) if avg_conf_row[0] is not None else 0.0

    # Approval rate from audit log
    total_decisions = cur.execute("SELECT COUNT(*) FROM audit_log").fetchone()[0]
    approved_count  = cur.execute(
        "SELECT COUNT(*) FROM audit_log WHERE decision = 'approved'"
    ).fetchone()[0]
    approval_rate = (approved_count / total_decisions) if total_decisions > 0 else 0.0

    # Total accounts
    total_accounts = cur.execute("SELECT COUNT(*) FROM accounts").fetchone()[0]

    conn.close()
    return {
        "total_runs": total_runs,
        "avg_confidence": round(avg_confidence, 4),
        "approval_rate": round(approval_rate, 4),
        "total_accounts": total_accounts,
    }
