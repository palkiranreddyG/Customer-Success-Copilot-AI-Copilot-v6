# Live Demo Walkthrough Script

This script guides you through demonstrating the full end-to-end functionality of the Customer Success Copilot Copilot system in under 5 minutes.

---

## Prerequisites
1. Start the backend:
   ```bash
   cd backend
   python -m uvicorn backend.main:app --port 8000 --host 127.0.0.1
   ```
2. Start the frontend:
   ```bash
   cd frontend
   npm run dev
   ```
3. Open a browser page at `http://localhost:5173`.

---

## Walkthrough Steps

### Step 1: Initial Dashboard Inspection (1 min)
- **Visual Overview**: Show the sidebar, navigation options, and the **Platform Health** stats cards at the top (Total runs, Avg Confidence, Approval Rate).
- **Portfolio Selection**: Under "Portfolio Accounts", point out **TechBridge** (the active selected account). Observe that its health score is currently low (45).

### Step 2: Ingest & Run Analysis (1 min)
- **Copy Transcript**: Open `backend/data/demo_transcript.txt` and copy its entire text.
- **Upload**: In the **Transcript Upload** area on the right, paste the copied transcript into the raw text input area.
- **Trigger**: Click **Run Analysis**.
- **Live Activity Tracking**: Point directly to the **Agent Activity Stream** below. Watch the `AgentActivityTimeline` sequentially check off steps:
  1. *Planner* - classifies the call as a Renewal and determines routing.
  2. *Ingestion* - identifies key stakeholders.
  3. *Retrieval* - pulls playbooks and queries memory.
  4. *Analysis* - highlights severe customer churn risks.
  5. *Recommendation* - outputs candidate actions.
  6. *Explanation* - retrieves evidence citations.
  7. *Evaluation* - passes quality gates.

### Step 3: Review Recommendations & Citations (1.5 min)
- **Grid Layout**: Show the 3 recommendation cards displayed in the center. Mention the confidence colors (e.g. green for >=0.8, yellow/orange for 0.6-0.8).
- **Verify Citations**: On one card, click **Why this action?** to trigger the popover. Show the exact playbook quotation, source file, and section title proving the suggestion's validity.
- **Make Decisions**:
  1. Click **Approve** on the first recommendation (e.g., *Offer contract renewal discount*). Observe the toast notification popping up.
  2. Click **Reject** on the second recommendation (e.g., *Propose executive health score review*). Type the note: *"Too early to bring this up with their execs"* and click Submit.
  3. Observe that both are updated in the UI card.

### Step 4: Audit Trail & Memory Check (1 min)
- **Check Audit Log**: Scroll down to the **Audit Log Table**. Verify that the approval and rejection decisions are recorded in SQLite, including the rejection note and timestamp.
- **Re-run Conflict Check**:
  - Paste the transcript in the uploader again and click **Run Analysis**.
  - Let the pipeline run. Once complete, inspect the new recommendations.
  - **Confirm Memory Block**: Point out that the rejected action (*Propose executive health score review*) is **no longer present** in the recommendations list. It has been blocked by the Memory Service and substituted with a unique fallback recommendation.
- **Platform Health Stats Update**: Show the updated totals in the Platform Stats Panel.
- **Done!**
