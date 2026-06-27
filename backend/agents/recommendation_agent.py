import os
import json
import numpy as np
from typing import Dict, Any, List
import google.generativeai as genai
from backend.config import settings
from backend.models.recommendation import RecommendationList, RecommendationModel
from backend.services.memory_service import get_memory_entries, query_similar_rejected_actions

PADDING_ITEM = {
    "action_title": "Schedule account review call",
    "action_type": "RETENTION",
    "confidence": 0.85,
    "priority": 3,
    "business_impact": "Conduct a check-in with the primary stakeholder to align on the account health score and address current pain points."
}

def clean_json_response(text: str) -> str:
    text = text.strip()
    if text.startswith("```"):
        lines = text.split("\n")
        if lines[0].startswith("```"):
            lines = lines[1:]
        if lines and lines[-1].strip() == "```":
            lines = lines[:-1]
        text = "\n".join(lines).strip()
    return text

def ensure_three_recommendations(parsed: dict) -> dict:
    recs = parsed.get("recommendations", [])
    if not isinstance(recs, list):
        recs = []
    
    valid_recs = []
    for item in recs:
        try:
            model = RecommendationModel(**item)
            valid_recs.append(model.model_dump())
        except Exception:
            continue
            
    while len(valid_recs) < 3:
        valid_recs.append(PADDING_ITEM.copy())
    
    valid_recs = valid_recs[:3]
    return {"recommendations": valid_recs}

def check_similarity_conflict(account_id: str, title: str, rejected_actions: List[str]) -> tuple[bool, str]:
    if not rejected_actions:
        return False, ""
    try:
        from backend.db.chroma import DynamicEmbeddingFunction
        emb_func = DynamicEmbeddingFunction()
        
        # Embed the generated title and all rejected action titles
        texts = [title] + rejected_actions
        embs = emb_func(texts)
        
        v_gen = np.array(embs[0])
        for i, rejected_title in enumerate(rejected_actions):
            v_rej = np.array(embs[i + 1])
            dot_prod = np.dot(v_gen, v_rej)
            norm_gen = np.linalg.norm(v_gen)
            norm_rej = np.linalg.norm(v_rej)
            if norm_gen > 0 and norm_rej > 0:
                sim = dot_prod / (norm_gen * norm_rej)
                # Check similarity threshold > 0.8
                if sim > 0.8:
                    return True, rejected_title
    except Exception as e:
        print(f"Recommendation Agent similarity check error: {e}. Using fallback direct text matching.")
        # Fallback to direct lowercase matching or substring check
        for rejected_title in rejected_actions:
            if title.lower() in rejected_title.lower() or rejected_title.lower() in title.lower():
                return True, rejected_title
    return False, ""

def run_recommendation(analysis_output: Dict[str, Any], account_context: Dict[str, Any], critique: str = "") -> dict:
    account_id = account_context.get("id", "")
    
    # 1. Fetch previous approved/rejected/modified decisions for the current account
    past_decisions = get_memory_entries(account_id)
    blocked_actions = []
    memory_context_lines = []
    
    for item in past_decisions:
        title = item.get("action_title", "")
        decision = item.get("decision", "")
        note = item.get("note", "")
        if decision == "rejected":
            blocked_actions.append(title)
        
        line = f"- Previous Action '{title}' was {decision.upper()}."
        if note:
            line += f" Reason given: '{note}'"
        memory_context_lines.append(line)
        
    memory_context = ""
    if memory_context_lines:
        memory_context = "\n".join(memory_context_lines)
        
    # 2. Falls back to mock values if GEMINI_API_KEY is not defined
    gemini_key = settings.GEMINI_API_KEY or os.getenv("GEMINI_API_KEY")
    if not gemini_key:
        print("Recommendation Agent: No GEMINI_API_KEY found, returning mock recommendations with conflict avoidance.")
        recs = [
            {
                "action_title": "Schedule account review call",
                "action_type": "RETENTION",
                "confidence": 0.85,
                "priority": 3,
                "business_impact": "Conduct a check-in with the primary stakeholder to align on the account health score and address current pain points."
            },
            {
                "action_title": "Offer contract renewal discount",
                "action_type": "RETENTION",
                "confidence": 0.90,
                "priority": 1,
                "business_impact": "Provide a 10% discount on renewal to mitigate contract risk and retain TechBridge."
            },
            {
                "action_title": "Schedule technical onboarding training",
                "action_type": "ENABLEMENT",
                "confidence": 0.80,
                "priority": 2,
                "business_impact": "Host a training session with the developer team to increase product utilization and usage depth."
            }
        ]
        
        # Large pool of unique fallback replacements for blocked actions
        FALLBACK_POOL = [
            {"action_title": "Propose executive health score review", "action_type": "RETENTION", "confidence": 0.88, "priority": 2, "business_impact": "Escalate low health metrics to executive sponsors to secure partnership alignment."},
            {"action_title": "Initiate executive partnership alignment", "action_type": "RETENTION", "confidence": 0.82, "priority": 3, "business_impact": "Engage executive sponsor to coordinate next quarterly business reviews."},
            {"action_title": "Deploy feature adoption success plan", "action_type": "ENABLEMENT", "confidence": 0.79, "priority": 3, "business_impact": "Work with the technical lead to build an adoption roadmap for underutilised features."},
            {"action_title": "Launch strategic account success review", "action_type": "RETENTION", "confidence": 0.81, "priority": 2, "business_impact": "Conduct a strategic review to realign account goals with product capabilities."},
            {"action_title": "Engage product champion network", "action_type": "EXPANSION", "confidence": 0.77, "priority": 3, "business_impact": "Identify and nurture internal champions to drive broader product adoption."},
            {"action_title": "Coordinate quarterly milestone success check", "action_type": "RETENTION", "confidence": 0.76, "priority": 3, "business_impact": "Run a structured quarterly review to track milestone completion and satisfaction."},
            {"action_title": "Activate risk mitigation playbook", "action_type": "ESCALATION", "confidence": 0.83, "priority": 1, "business_impact": "Trigger the churn risk playbook to proactively address account health decline."},
            {"action_title": "Schedule executive business review", "action_type": "RETENTION", "confidence": 0.85, "priority": 2, "business_impact": "Host a senior-level business review to align on strategic outcomes and roadmap."},
        ]
        # Adjust mock list if any action conflicts with blocked actions
        adjusted_recs = []
        fallback_idx = 0
        used_titles = set()
        overflow_counter = [0]  # mutable counter for unique overflow titles
        for rec in recs:
            conflict, rejected_title = check_similarity_conflict(account_id, rec["action_title"], blocked_actions)
            if conflict:
                # Find the next fallback not already used AND not in blocked_actions
                while fallback_idx < len(FALLBACK_POOL) and (
                    FALLBACK_POOL[fallback_idx]["action_title"] in used_titles or
                    FALLBACK_POOL[fallback_idx]["action_title"] in blocked_actions
                ):
                    fallback_idx += 1
                if fallback_idx < len(FALLBACK_POOL):
                    replacement = FALLBACK_POOL[fallback_idx].copy()
                    fallback_idx += 1
                else:
                    # All pool entries exhausted — generate a guaranteed-unique title
                    overflow_counter[0] += 1
                    replacement = {
                        "action_title": f"Custom success action {overflow_counter[0]}",
                        "action_type": "RETENTION",
                        "confidence": 0.75,
                        "priority": 3,
                        "business_impact": "Tailored action based on account context and prior feedback."
                    }
                used_titles.add(replacement["action_title"])
                adjusted_recs.append(replacement)
            else:
                used_titles.add(rec["action_title"])
                adjusted_recs.append(rec)
        return {"recommendations": adjusted_recs}

    system_prompt = (
        "Based on the analysis provided, recommend exactly 3 next best actions. "
        "For each action, return: action_title (max 8 words), action_type (RETENTION|EXPANSION|ESCALATION|ENABLEMENT), "
        "confidence (0.0-1.0), priority (1-3), business_impact (one sentence). "
        "Be specific: name a stakeholder, product feature, or date range where possible.\n"
        "CRITICAL: You must reference at least one specific metric from the account context (such as the health score, ARR, or tenure) "
        "in at least one of your recommendations' business impacts to justify the action.\n"
        "Return JSON only matching the schema:\n"
        "{\n"
        "  \"recommendations\": [\n"
        "    {\n"
        "      \"action_title\": \"string\",\n"
        "      \"action_type\": \"RETENTION|EXPANSION|ESCALATION|ENABLEMENT\",\n"
        "      \"confidence\": 0.85,\n"
        "      \"priority\": 1,\n"
        "      \"business_impact\": \"string\"\n"
        "    }\n"
        "  ]\n"
        "}"
    )
    
    if memory_context:
        system_prompt += (
            f"\n\nCRITICAL CONTEXT: Past Human Decisions on this account:\n"
            f"{memory_context}\n"
            f"Note: You MUST NOT generate recommendations that are substantially similar to previously rejected actions "
            f"unless you explicitly justify in the business impact why the previous rejection no longer applies."
        )

    prompt = (
        f"Account Context Metrics:\n"
        f"- ARR: ${account_context.get('arr', 0):,.2f}\n"
        f"- Health Score: {account_context.get('health_score', 0)}\n"
        f"- Tenure: {account_context.get('tenure_months', 0)} months\n\n"
        f"Analysis Output:\n{json.dumps(analysis_output, indent=2)}"
    )
    
    if critique:
        prompt += (
            f"\n\nCRITICAL CRITIQUE OF PREVIOUS ATTEMPT:\n"
            f"Your previous recommendations failed the quality gate for the following reasons:\n"
            f"{critique}\n"
            f"Please revise your recommendations to resolve these specific errors."
        )

    try:
        genai.configure(api_key=gemini_key)
        model = genai.GenerativeModel(
            model_name="gemini-2.5-flash",
            generation_config={"response_mime_type": "application/json"}
        )

        response = model.generate_content(
            contents=[{"role": "user", "parts": [f"{system_prompt}\n\n{prompt}"]}]
        )
        response_text = clean_json_response(response.text.strip())
        parsed = json.loads(response_text)
        result = ensure_three_recommendations(parsed)
        
        # 3. Check for similarity conflicts with blocked actions
        has_conflict = False
        conflict_msg = ""
        for rec in result["recommendations"]:
            conflict, rejected_title = check_similarity_conflict(account_id, rec["action_title"], blocked_actions)
            if conflict:
                has_conflict = True
                conflict_msg = f"Recommendation '{rec['action_title']}' is too similar (similarity > 0.8) to rejected action '{rejected_title}'."
                break
                
        # 4. Regenerate once if conflict found
        if has_conflict:
            print(f"Similarity Conflict Found: {conflict_msg}. Triggering one-time regeneration...")
            regeneration_prompt = (
                f"{prompt}\n\n"
                f"REGENERATE ERROR: Your last recommendations generated a conflict:\n{conflict_msg}\n"
                f"Please rewrite the recommendations. Do NOT repeat or offer '{rejected_title}' or anything similar. "
                "Ensure you provide exactly 3 valid recommendations."
            )
            response2 = model.generate_content(
                contents=[{"role": "user", "parts": [f"{system_prompt}\n\n{regeneration_prompt}"]}]
            )
            response2_text = clean_json_response(response2.text.strip())
            parsed = json.loads(response2_text)
            result = ensure_three_recommendations(parsed)
            
        return result

    except Exception as e:
        print(f"Recommendation Agent error: {e}. Returning mock recommendations.")
        # Fallback to conflict-adjusted mock list
        recs = [
            {
                "action_title": "Schedule account review call",
                "action_type": "RETENTION",
                "confidence": 0.85,
                "priority": 3,
                "business_impact": "Conduct a check-in with the primary stakeholder to align on the account health score and address current pain points."
            },
            {
                "action_title": "Offer contract renewal discount",
                "action_type": "RETENTION",
                "confidence": 0.90,
                "priority": 1,
                "business_impact": "Provide a 10% discount on renewal to mitigate contract risk and retain TechBridge."
            },
            {
                "action_title": "Schedule technical onboarding training",
                "action_type": "ENABLEMENT",
                "confidence": 0.80,
                "priority": 2,
                "business_impact": "Host a training session with the developer team to increase product utilization and usage depth."
            }
        ]
        
        # Large pool of unique fallback replacements for blocked actions
        FALLBACK_POOL = [
            {"action_title": "Propose executive health score review", "action_type": "RETENTION", "confidence": 0.88, "priority": 2, "business_impact": "Escalate low health metrics to executive sponsors to secure partnership alignment."},
            {"action_title": "Initiate executive partnership alignment", "action_type": "RETENTION", "confidence": 0.82, "priority": 3, "business_impact": "Engage executive sponsor to coordinate next quarterly business reviews."},
            {"action_title": "Deploy feature adoption success plan", "action_type": "ENABLEMENT", "confidence": 0.79, "priority": 3, "business_impact": "Work with the technical lead to build an adoption roadmap for underutilised features."},
            {"action_title": "Launch strategic account success review", "action_type": "RETENTION", "confidence": 0.81, "priority": 2, "business_impact": "Conduct a strategic review to realign account goals with product capabilities."},
            {"action_title": "Engage product champion network", "action_type": "EXPANSION", "confidence": 0.77, "priority": 3, "business_impact": "Identify and nurture internal champions to drive broader product adoption."},
            {"action_title": "Coordinate quarterly milestone success check", "action_type": "RETENTION", "confidence": 0.76, "priority": 3, "business_impact": "Run a structured quarterly review to track milestone completion and satisfaction."},
            {"action_title": "Activate risk mitigation playbook", "action_type": "ESCALATION", "confidence": 0.83, "priority": 1, "business_impact": "Trigger the churn risk playbook to proactively address account health decline."},
            {"action_title": "Schedule executive business review", "action_type": "RETENTION", "confidence": 0.85, "priority": 2, "business_impact": "Host a senior-level business review to align on strategic outcomes and roadmap."},
        ]
        adjusted_recs = []
        fallback_idx = 0
        used_titles = set()
        overflow_counter = [0]
        for rec in recs:
            conflict, rejected_title = check_similarity_conflict(account_id, rec["action_title"], blocked_actions)
            if conflict:
                # Find the next fallback not already used AND not in blocked_actions
                while fallback_idx < len(FALLBACK_POOL) and (
                    FALLBACK_POOL[fallback_idx]["action_title"] in used_titles or
                    FALLBACK_POOL[fallback_idx]["action_title"] in blocked_actions
                ):
                    fallback_idx += 1
                if fallback_idx < len(FALLBACK_POOL):
                    replacement = FALLBACK_POOL[fallback_idx].copy()
                    fallback_idx += 1
                else:
                    overflow_counter[0] += 1
                    replacement = {
                        "action_title": f"Custom success action {overflow_counter[0]}",
                        "action_type": "RETENTION",
                        "confidence": 0.75,
                        "priority": 3,
                        "business_impact": "Tailored action based on account context and prior feedback."
                    }
                used_titles.add(replacement["action_title"])
                adjusted_recs.append(replacement)
            else:
                used_titles.add(rec["action_title"])
                adjusted_recs.append(rec)
        return {"recommendations": adjusted_recs}
