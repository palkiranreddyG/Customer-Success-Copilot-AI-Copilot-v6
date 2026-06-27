import json
import os
import sqlite3
from pathlib import Path
from backend.config import settings

def get_db_connection():
    conn = sqlite3.connect(settings.DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Create accounts table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS accounts (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            arr REAL NOT NULL,
            health_score INTEGER NOT NULL,
            tenure_months INTEGER NOT NULL
        )
    """)
    
    # Create pipeline_runs table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS pipeline_runs (
            id TEXT PRIMARY KEY,
            session_id TEXT NOT NULL,
            account_id TEXT NOT NULL,
            state_json TEXT NOT NULL,
            status TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_pipeline_runs_session_id ON pipeline_runs (session_id)")

    # Create recommendations table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS recommendations (
            id TEXT PRIMARY KEY,
            session_id TEXT NOT NULL,
            account_id TEXT NOT NULL,
            action_title TEXT NOT NULL,
            action_type TEXT NOT NULL,
            confidence REAL NOT NULL,
            priority INTEGER NOT NULL,
            business_impact TEXT NOT NULL,
            evidence_json TEXT,
            evaluation_passed BOOLEAN,
            evaluation_reasons TEXT,
            evaluation_status TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_recommendations_session_id ON recommendations (session_id)")
    
    # Alter table dynamically to add Phase 4 and 5 columns if table already exists
    try:
        cursor.execute("ALTER TABLE recommendations ADD COLUMN evidence_json TEXT")
    except sqlite3.OperationalError:
        pass
    try:
        cursor.execute("ALTER TABLE recommendations ADD COLUMN evaluation_passed BOOLEAN")
    except sqlite3.OperationalError:
        pass
    try:
        cursor.execute("ALTER TABLE recommendations ADD COLUMN evaluation_reasons TEXT")
    except sqlite3.OperationalError:
        pass
    try:
        cursor.execute("ALTER TABLE recommendations ADD COLUMN evaluation_status TEXT")
    except sqlite3.OperationalError:
        pass
    # Create audit_log table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS audit_log (
            id TEXT PRIMARY KEY,
            session_id TEXT NOT NULL,
            account_id TEXT NOT NULL,
            recommendation_id TEXT NOT NULL,
            decision TEXT NOT NULL,
            note TEXT,
            decided_by TEXT,
            timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_audit_log_account_id ON audit_log (account_id)")
    conn.commit()
    
    # Check if empty, and seed if so
    cursor.execute("SELECT COUNT(*) FROM accounts")
    count = cursor.fetchone()[0]
    
    if count == 0:
        mock_file_path = Path(settings.DB_PATH).parent / "data" / "mock_accounts.json"
        if mock_file_path.exists():
            with open(mock_file_path, "r", encoding="utf-8") as f:
                accounts = json.load(f)
                for acc in accounts:
                    cursor.execute("""
                        INSERT INTO accounts (id, name, arr, health_score, tenure_months)
                        VALUES (?, ?, ?, ?, ?)
                    """, (acc["id"], acc["name"], acc["arr"], acc["health_score"], acc["tenure_months"]))
            conn.commit()
            print(f"Database seeded with {len(accounts)} accounts.")
        else:
            print(f"Warning: Mock accounts file not found at {mock_file_path}")
            
    conn.close()

def get_all_accounts() -> list[dict]:
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT id, name, arr, health_score, tenure_months FROM accounts")
    rows = cursor.fetchall()
    conn.close()
    return [dict(row) for row in rows]

def get_account_by_id(account_id: str) -> dict | None:
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT id, name, arr, health_score, tenure_months FROM accounts WHERE id = ?", (account_id,))
    row = cursor.fetchone()
    conn.close()
    return dict(row) if row else None

def create_pipeline_run(session_id: str, account_id: str, raw_text: str):
    import uuid
    conn = get_db_connection()
    cursor = conn.cursor()
    initial_state = {
        "session_id": session_id,
        "account_id": account_id,
        "raw_text": raw_text,
        "interaction_type": "",
        "retrieved_chunks": [],
        "planner_decision": {},
        "analysis": {},
        "recommendations": [],
        "evaluation_attempts": 0,
        "critique": "",
        "errors": []
    }
    cursor.execute("""
        INSERT INTO pipeline_runs (id, session_id, account_id, state_json, status)
        VALUES (?, ?, ?, ?, ?)
    """, (str(uuid.uuid4()), session_id, account_id, json.dumps(initial_state), "running"))
    conn.commit()
    conn.close()

def update_pipeline_run_state(session_id: str, state: dict, status: str):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        UPDATE pipeline_runs
        SET state_json = ?, status = ?
        WHERE session_id = ?
    """, (json.dumps(state), status, session_id))
    conn.commit()
    conn.close()

def get_pipeline_run(session_id: str) -> dict | None:
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT id, session_id, account_id, state_json, status, created_at
        FROM pipeline_runs
        WHERE session_id = ?
    """, (session_id,))
    row = cursor.fetchone()
    conn.close()
    return dict(row) if row else None

def save_recommendations(session_id: str, account_id: str, recommendations: list[dict]):
    import uuid
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM recommendations WHERE session_id = ?", (session_id,))
    for rec in recommendations:
        evidence = rec.get("evidence")
        evidence_str = json.dumps(evidence) if evidence else None
        
        reasons = rec.get("evaluation_reasons")
        reasons_str = json.dumps(reasons) if reasons else None
        
        rec_id = rec.get("id") or str(uuid.uuid4())
        
        cursor.execute("""
            INSERT INTO recommendations (
                id, session_id, account_id, action_title, action_type, 
                confidence, priority, business_impact, 
                evidence_json, evaluation_passed, evaluation_reasons, evaluation_status
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            rec_id,
            session_id,
            account_id,
            rec.get("action_title"),
            rec.get("action_type"),
            rec.get("confidence"),
            rec.get("priority"),
            rec.get("business_impact"),
            evidence_str,
            rec.get("evaluation_passed"),
            reasons_str,
            rec.get("evaluation_status", "approved" if rec.get("evaluation_passed") else "flagged_low_confidence")
        ))
    conn.commit()
    conn.close()

def get_recommendations_by_session(session_id: str) -> list[dict]:
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT id, session_id, account_id, action_title, action_type, confidence, priority, business_impact, 
               evidence_json, evaluation_passed, evaluation_reasons, evaluation_status, created_at
        FROM recommendations
        WHERE session_id = ?
        ORDER BY priority ASC, confidence DESC
    """, (session_id,))
    rows = cursor.fetchall()
    conn.close()
    
    results = []
    for r in rows:
        d = dict(r)
        if d.get("evidence_json"):
            try:
                d["evidence"] = json.loads(d["evidence_json"])
            except Exception:
                d["evidence"] = None
        else:
            d["evidence"] = None
            
        if d.get("evaluation_reasons"):
            try:
                d["evaluation_reasons"] = json.loads(d["evaluation_reasons"])
            except Exception:
                d["evaluation_reasons"] = []
        else:
            d["evaluation_reasons"] = []
            
        d["evaluation_status"] = d.get("evaluation_status") or ("approved" if d.get("evaluation_passed") else "flagged_low_confidence")
        results.append(d)
        
    return results

def get_recommendation_by_id(recommendation_id: str) -> dict | None:
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT id, session_id, account_id, action_title, action_type, confidence, priority, business_impact, 
               evidence_json, evaluation_passed, evaluation_reasons, evaluation_status
        FROM recommendations
        WHERE id = ?
    """, (recommendation_id,))
    row = cursor.fetchone()
    conn.close()
    if row:
        d = dict(row)
        if d.get("evidence_json"):
            try:
                d["evidence"] = json.loads(d["evidence_json"])
            except Exception:
                d["evidence"] = None
        else:
            d["evidence"] = None
            
        if d.get("evaluation_reasons"):
            try:
                d["evaluation_reasons"] = json.loads(d["evaluation_reasons"])
            except Exception:
                d["evaluation_reasons"] = []
        else:
            d["evaluation_reasons"] = []
            
        d["evaluation_status"] = d.get("evaluation_status") or ("approved" if d.get("evaluation_passed") else "flagged_low_confidence")
        return d
    return None

def update_recommendation_status(recommendation_id: str, status: str):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        UPDATE recommendations
        SET evaluation_status = ?
        WHERE id = ?
    """, (status, recommendation_id))
    conn.commit()
    conn.close()

def create_audit_log_entry(id: str, session_id: str, account_id: str, recommendation_id: str, decision: str, note: str | None, decided_by: str | None):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO audit_log (id, session_id, account_id, recommendation_id, decision, note, decided_by)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    """, (id, session_id, account_id, recommendation_id, decision, note, decided_by))
    conn.commit()
    conn.close()

def get_audit_log_by_account(account_id: str) -> list[dict]:
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT id, session_id, account_id, recommendation_id, decision, note, decided_by, timestamp
        FROM audit_log
        WHERE account_id = ?
        ORDER BY timestamp DESC
    """, (account_id,))
    rows = cursor.fetchall()
    conn.close()
    return [dict(row) for row in rows]


