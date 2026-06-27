import requests
import time
import json

# Step 1: POST transcript for TechBridge (acc-2)
transcript = open("backend/data/demo_transcript.txt", "r").read()
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
    print("\nPoll " + str(i + 1) + " - Status: " + status)
    if status in ("partial_complete", "failed"):
        print("Final Result:")
        print(json.dumps(result, indent=2))
        break
