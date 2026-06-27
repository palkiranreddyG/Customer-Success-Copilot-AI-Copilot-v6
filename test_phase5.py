"""
Phase 5 Acceptance Test
Verifies: Human approval, rejection with note, audit log persistence, and
memory-aware conflict avoidance on a subsequent pipeline run.
"""
import requests
import time
import sys

BASE = "http://localhost:8000/api/v1"
ACCOUNT_ID = "acc-2"


def wait_complete(session_id, timeout_polls=20):
    for i in range(timeout_polls):
        time.sleep(3)
        r = requests.get(f"{BASE}/pipeline/{session_id}")
        status = r.json()["status"]
        print(f"  poll {i+1}: {status}")
        if status in ("complete", "failed"):
            return status
    return "timeout"


def run_test():
    transcript = open("backend/data/demo_transcript.txt").read()

    # -- Run 1 ------------------------------------------------------------------
    print("\n[1/5] Trigger Run #1 for TechBridge (acc-2)...")
    r1 = requests.post(f"{BASE}/pipeline/run", json={"account_id": ACCOUNT_ID, "raw_text": transcript})
    assert r1.status_code == 200, f"Run failed: {r1.text}"
    sid1 = r1.json()["session_id"]
    print(f"      session: {sid1}")

    status1 = wait_complete(sid1)
    assert status1 == "complete", f"Expected 'complete', got '{status1}'"

    recs_r = requests.get(f"{BASE}/pipeline/{sid1}/recommendations")
    recs = recs_r.json()
    print("      Recommendations:")
    for rec in recs:
        print(f"        [{rec['priority']}] {rec['id']} | {rec['action_title']}")
    assert len(recs) == 3, f"Expected 3 recs, got {len(recs)}"

    # Pick: approve rec[0], reject rec[1]
    rec_approve = recs[0]
    rec_reject  = recs[1]

    # -- Approve rec[0] ---------------------------------------------------------
    print(f"\n[2/5] Approve '{rec_approve['action_title']}' ...")
    ra = requests.post(
        f"{BASE}/recommendations/{rec_approve['id']}/decision",
        json={"decision": "approved"}
    )
    assert ra.status_code == 200, f"Approve failed: {ra.text}"
    assert ra.json()["status"] == "recorded"
    print(f"      PASS - audit_log_id: {ra.json()['audit_log_id']}")

    # -- Reject rec[1] with note ------------------------------------------------
    REJECT_NOTE = "too aggressive for this account"
    print(f"\n[3/5] Reject '{rec_reject['action_title']}' with note ...")
    rr = requests.post(
        f"{BASE}/recommendations/{rec_reject['id']}/decision",
        json={"decision": "rejected", "note": REJECT_NOTE}
    )
    assert rr.status_code == 200, f"Reject failed: {rr.text}"
    assert rr.json()["status"] == "recorded"
    print(f"      PASS - audit_log_id: {rr.json()['audit_log_id']}")

    # -- Audit log check --------------------------------------------------------
    print(f"\n[4/5] GET /accounts/{ACCOUNT_ID}/audit-log ...")
    al = requests.get(f"{BASE}/accounts/{ACCOUNT_ID}/audit-log")
    assert al.status_code == 200, f"Audit log fetch failed: {al.text}"
    entries = al.json()
    print(f"      {len(entries)} total entries")
    by_rec = {e["recommendation_id"]: e for e in entries}

    assert rec_approve["id"] in by_rec, "Approved rec not in audit log"
    assert by_rec[rec_approve["id"]]["decision"] == "approved"

    assert rec_reject["id"] in by_rec, "Rejected rec not in audit log"
    assert by_rec[rec_reject["id"]]["decision"] == "rejected"
    assert by_rec[rec_reject["id"]]["note"] == REJECT_NOTE
    assert "timestamp" in by_rec[rec_reject["id"]]
    print("      PASS - Both decisions present with correct fields and timestamps")

    # -- Run 2 (memory awareness) -----------------------------------------------
    print(f"\n[5/5] Trigger Run #2 - memory should block '{rec_reject['action_title']}' ...")
    r2 = requests.post(f"{BASE}/pipeline/run", json={"account_id": ACCOUNT_ID, "raw_text": transcript})
    assert r2.status_code == 200, f"Run2 failed: {r2.text}"
    sid2 = r2.json()["session_id"]
    print(f"      session: {sid2}")

    status2 = wait_complete(sid2)
    assert status2 == "complete", f"Expected 'complete', got '{status2}'"

    recs2_r = requests.get(f"{BASE}/pipeline/{sid2}/recommendations")
    recs2 = recs2_r.json()
    titles2 = [r["action_title"] for r in recs2]
    print(f"      Run #2 titles: {titles2}")

    # No title should be a duplicate
    assert len(set(titles2)) == len(titles2), f"Duplicate titles in Run #2: {titles2}"

    # The rejected title must NOT appear verbatim
    assert rec_reject["action_title"] not in titles2, (
        f"Memory conflict avoidance FAILED: '{rec_reject['action_title']}' still in Run #2 output"
    )
    print(f"      PASS - Rejected action is absent from Run #2")

    print("\n" + "=" * 60)
    print("ALL PHASE 5 ACCEPTANCE TESTS PASSED")
    print("=" * 60)


if __name__ == "__main__":
    try:
        run_test()
    except AssertionError as e:
        print(f"\nFAIL - ASSERTION ERROR: {e}")
        sys.exit(1)
    except Exception as e:
        print(f"\nFAIL - UNEXPECTED ERROR: {e}")
        sys.exit(1)
