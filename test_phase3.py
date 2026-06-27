import requests
import time
import json

# Step 1: POST transcript for TechBridge (acc-2)
transcript = open("backend/data/demo_transcript.txt", "r").read()
print("Starting Phase 3 pipeline execution for acc-2 (TechBridge)...")
resp = requests.post(
    "http://localhost:8000/api/v1/pipeline/run",
    json={"account_id": "acc-2", "raw_text": transcript}
)
data = resp.json()
print("POST Response:", json.dumps(data, indent=2))
session_id = data["session_id"]

# Step 2: Poll GET endpoint
for i in range(15):
    time.sleep(3)
    poll = requests.get("http://localhost:8000/api/v1/pipeline/" + session_id)
    result = poll.json()
    status = result["status"]
    print(f"Poll {i + 1} - Status: {status}")
    if status in ("complete", "failed"):
        print("\nFinal pipeline state returned:")
        print(json.dumps(result, indent=2))
        break

# Step 3: Verify recommendations endpoint
print("\nFetching recommendations from the dedicated GET endpoint:")
recs_resp = requests.get(f"http://localhost:8000/api/v1/pipeline/{session_id}/recommendations")
recs = recs_resp.json()
print(json.dumps(recs, indent=2))

# Step 4: Validate acceptance criteria
assert len(recs) == 3, f"Expected exactly 3 recommendations, got {len(recs)}"
valid_types = {"RETENTION", "EXPANSION", "ESCALATION", "ENABLEMENT"}
for r in recs:
    assert r["action_type"] in valid_types, f"Invalid action_type: {r['action_type']}"
    assert 0.0 <= r["confidence"] <= 1.0, f"Confidence out of range: {r['confidence']}"
    assert 1 <= r["priority"] <= 3, f"Priority out of range: {r['priority']}"
    assert len(r["action_title"].split()) <= 8, f"Action title has more than 8 words: {r['action_title']}"

print("\nAll Phase 3 acceptance criteria passed successfully!")
