# Customer Success Copilot Copilot - Customer Success AI Assistant

An advanced, production-grade Customer Success AI Copilot built with LangGraph, FastAPI, ChromaDB, SQLite, and React (Vite + TS). The system processes customer transcripts to detect health risks, identify opportunities, map relevant success playbooks, and generate cited, human-in-the-loop next-best-action recommendations with persistent decision memory.

---

## Key Features

1. **Intelligent Router (Planner)**: Classifies the interaction type (QBR, renewal call, sales call, support escalation) and plans agent routing sequences dynamically.
2. **Deterministic & Semantic Retrieval**: Ingests playbook documentation into ChromaDB and retrieves relevant rules. Also queries memory to block duplicate/rejected actions.
3. **Reasoning Agent**: Pinpoints specific customer risks, product expansion opportunities, and missing context.
4. **Recommendation Generator**: Proposes exactly three ranked recommendations, each with priority, confidence, and business impact context.
5. **Explanation Agent**: Generates real evidence passages with exact quoted text citations from source playbooks.
6. **Evaluation Gate**: Validates quality rules (e.g. discount caps, formatting checks) before allowing recommendations to reach the queue.
7. **Human-in-the-Loop Approval & Memory**: CS managers can approve, reject (with notes), or modify recommendations. Rejected actions are stored in ChromaDB memory and SQLite audit logs, blocking similar actions from appearing in subsequent runs.
8. **Premium Dashboard UI**: Built with responsive layouts, animated timelines, platform stats panels, and skeleton loaders.

---

## Project Structure

```
.
├── backend/
│   ├── agents/
│   │   ├── planner_agent.py
│   │   ├── ingestion_agent.py
│   │   ├── retrieval_agent.py
│   │   ├── analysis_agent.py
│   │   ├── recommendation_agent.py
│   │   ├── explanation_agent.py
│   │   ├── evaluation_agent.py
│   │   └── state.py
│   ├── db/
│   │   ├── sqlite.py
│   │   └── chroma.py
│   ├── models/
│   │   ├── schemas.py
│   │   └── recommendation.py
│   ├── services/
│   │   ├── ingestion_service.py
│   │   ├── memory_service.py
│   │   └── evaluation_rules.py
│   ├── routers/
│   │   ├── pipeline_router.py
│   │   └── approval_router.py
│   ├── scripts/
│   │   └── seed_chroma.py
│   ├── main.py
│   ├── config.py
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── skeletons/
│   │   │   │   └── Skeletons.tsx
│   │   │   ├── AccountList.tsx
│   │   │   ├── AgentActivityTimeline.tsx
│   │   │   ├── AgentActivityStream.tsx
│   │   │   ├── ApprovalQueue.tsx
│   │   │   ├── AuditLogTable.tsx
│   │   │   ├── ConfidenceBadge.tsx
│   │   │   ├── DashboardLayout.tsx
│   │   │   ├── EmptyState.tsx
│   │   │   ├── EvidencePopover.tsx
│   │   │   ├── PlannerExplanationCard.tsx
│   │   │   ├── PlatformStatsPanel.tsx
│   │   │   ├── RecommendationCard.tsx
│   │   │   ├── RiskBadge.tsx
│   │   │   ├── ToastProvider.tsx
│   │   │   └── TranscriptUpload.tsx
│   │   ├── lib/
│   │   │   └── api.ts
│   │   ├── App.tsx
│   │   ├── index.css
│   │   └── main.tsx
│   ├── package.json
│   ├── tailwind.config.js
│   └── index.html
├── docs/
│   ├── ARCHITECTURE.md
│   └── DEMO_SCRIPT.md
├── test_phase5.py
└── README.md
```

---

## Setup & Running Guide

### 1. Backend Installation & Running

Ensure you have Python 3.10+ installed.

1. Navigate to the `backend/` directory:
   ```bash
   cd backend
   ```
2. Create and activate a virtual environment:
   ```bash
   python -m venv venv
   # On Windows:
   venv\Scripts\activate
   # On macOS/Linux:
   source venv/bin/activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Set your LLM Provider Key (Optional, fallback modes are integrated automatically):
   ```bash
   # On Windows (cmd):
   set GEMINI_API_KEY=your_gemini_key
   # On Windows (PowerShell):
   $env:GEMINI_API_KEY="your_gemini_key"
   # On macOS/Linux:
   export GEMINI_API_KEY="your_gemini_key"
   ```
5. Ingest playbook documentation into ChromaDB:
   ```bash
   python scripts/seed_chroma.py --force
   ```
6. Start the FastAPI backend:
   ```bash
   python -m uvicorn backend.main:app --port 8000 --host 127.0.0.1
   ```
   API docs will be live at: `http://localhost:8000/docs`

---

### 2. Frontend Installation & Running

Ensure you have Node.js (v18+) and npm installed.

1. Navigate to the `frontend/` directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the Vite React development server:
   ```bash
   npm run dev
   ```
   The dashboard will be live at: `http://localhost:5173`

---

## Running the Acceptance Tests

Verify the end-to-end functionality of all phases:

```bash
# In the workspace root:
python test_phase5.py
```
This test checks the human approval pipeline, database persistence, and memory-aware recommendation blocking.

---

## Demo Script

To walk through a complete end-to-end live flow of the system:
1. Open the UI at `http://localhost:5173/`.
2. Select **TechBridge** from the portfolio.
3. Paste or upload the contents of `backend/data/demo_transcript.txt` and click **Run Analysis**.
4. Observe the `AgentActivityTimeline` animating live.
5. Review the recommendations, approve one, and reject another with a note.
6. Re-run the analysis for the same account to observe the memory blocking duplicate/similar actions.
7. Check the Platform Health Panel stats.
*(See [docs/DEMO_SCRIPT.md](docs/DEMO_SCRIPT.md) for full script details)*
