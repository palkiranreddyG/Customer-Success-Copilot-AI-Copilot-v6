import requests
import time
import json
from backend.services.evaluation_rules import evaluate_deterministic_rules

def test_unit_evaluation_rules():
    print("Running Unit Test on evaluation_rules.py...")
    # Deliberately vague mock recommendation (low confidence, no evidence)
    mock_vague_rec = {
        "action_title": "Fix things soon",
        "action_type": "RETENTION",
        "confidence": 0.3,
        "priority": 3,
        "business_impact": "This recommendation should fail due to low confidence and missing evidence.",
        "evidence": None
    }
    
    reasons = evaluate_deterministic_rules(mock_vague_rec)
    print("Flagged Reasons:", reasons)
    assert len(reasons) > 0, "Unit test failed: low-confidence recommendation was not flagged!"
    assert any("Confidence score" in r for r in reasons), "Did not flag confidence score."
    assert any("evidence citation" in r.lower() for r in reasons), "Did not flag missing evidence."
    print("Unit Test Passed successfully!\n")

def test_end_to_end_pipeline():
    print("Running End-to-End Pipeline Verification...")
    transcript = open("backend/data/demo_transcript.txt", "r").read()
    
    resp = requests.post(
        "http://localhost:8000/api/v1/pipeline/run",
        json={"account_id": "acc-2", "raw_text": transcript}
    )
    data = resp.json()
    session_id = data["session_id"]
    print(f"Triggered Session: {session_id}")
    
    for i in range(15):
        time.sleep(3)
        poll = requests.get(f"http://localhost:8000/api/v1/pipeline/{session_id}")
        result = poll.json()
        status = result["status"]
        print(f"Poll {i + 1} - Status: {status}")
        if status in ("complete", "failed"):
            break
            
    # Pull recommendations from dedicated GET endpoint
    recs_resp = requests.get(f"http://localhost:8000/api/v1/pipeline/{session_id}/recommendations")
    recs = recs_resp.json()
    print("\nRecommendations Output:")
    print(json.dumps(recs, indent=2))
    
    assert len(recs) == 3, f"Expected 3 recommendations, got {len(recs)}"
    for idx, r in enumerate(recs):
        print(f"\nChecking Rec {idx + 1}: '{r['action_title']}'")
        evidence = r.get("evidence")
        assert evidence is not None, "Evidence is missing!"
        print(f"  - Supported: {evidence['supported']}")
        print(f"  - Source: {evidence['source']}")
        print(f"  - Section: {evidence['section']}")
        print(f"  - Quote: '{evidence['quoted_text']}'")
        
        status = r.get("evaluation_status")
        passed = r.get("evaluation_passed")
        print(f"  - Evaluation status: {status} (passed={passed})")
        if not passed:
            print(f"  - Evaluation reasons: {r.get('evaluation_reasons')}")
            
    print("\nEnd-to-End Pipeline Verification Passed successfully!")

if __name__ == "__main__":
    test_unit_evaluation_rules()
    test_end_to_end_pipeline()
