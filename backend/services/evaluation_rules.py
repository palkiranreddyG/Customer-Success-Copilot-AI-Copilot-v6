CONFIDENCE_THRESHOLD = 0.6

def evaluate_deterministic_rules(rec: dict) -> list[str]:
    reasons = []
    
    # 1. Check confidence threshold
    confidence = rec.get("confidence", 0.0)
    if confidence < CONFIDENCE_THRESHOLD:
        reasons.append(f"Confidence score {confidence} is below required threshold of {CONFIDENCE_THRESHOLD}.")
        
    # 2. Check all required fields present
    required_fields = ["action_title", "action_type", "confidence", "priority", "business_impact"]
    for field in required_fields:
        val = rec.get(field)
        if val is None or (isinstance(val, str) and not val.strip()):
            reasons.append(f"Missing or empty required field: {field}.")
            
    # 3. Check evidence supported
    evidence = rec.get("evidence")
    if not evidence:
        reasons.append("No evidence citation provided.")
    elif not isinstance(evidence, dict):
        reasons.append("Evidence citation format is invalid.")
    elif not evidence.get("supported"):
        reasons.append("Evidence is not supported by retrieved knowledge base chunks.")
        
    return reasons
