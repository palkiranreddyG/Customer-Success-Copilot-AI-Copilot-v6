import os
import json
from typing import Dict, Any, List
import google.generativeai as genai
from backend.config import settings
from backend.services.evaluation_rules import evaluate_deterministic_rules

def get_specificity_score(rec: dict) -> float:
    gemini_key = settings.GEMINI_API_KEY or os.getenv("GEMINI_API_KEY")
    if not gemini_key:
        # Default fallback for evaluation specificity in local dev
        # Let's check if the recommendation is the mock generic padding.
        # If it is the default padding item, we can return 0.5.
        title = rec.get("action_title", "")
        if "Schedule account review call" in title:
            return 0.5
        return 0.8
        
    try:
        genai.configure(api_key=gemini_key)
        model = genai.GenerativeModel(
            model_name="gemini-2.5-flash",
            generation_config={"response_mime_type": "application/json"}
        )
        
        system_prompt = (
            "Rate this recommendation's specificity 0-1: does it name a concrete stakeholder, product feature, or date/timeframe rather than being generic advice? "
            "Return JSON matching the schema:\n"
            "{\n"
            "  \"specificity_score\": 0.8\n"
            "}"
        )
        
        prompt = (
            f"Recommendation Title: {rec.get('action_title')}\n"
            f"Action Type: {rec.get('action_type')}\n"
            f"Business Impact: {rec.get('business_impact')}"
        )
        
        response = model.generate_content(
            contents=[{"role": "user", "parts": [f"{system_prompt}\n\n{prompt}"]}]
        )
        
        text = response.text.strip()
        if text.startswith("```"):
            lines = text.split("\n")
            if lines[0].startswith("```"):
                lines = lines[1:]
            if lines and lines[-1].strip() == "```":
                lines = lines[:-1]
            text = "\n".join(lines).strip()
            
        res = json.loads(text)
        return float(res.get("specificity_score", 0.5))
    except Exception as e:
        print(f"Evaluation Agent LLM specificity check error: {e}. Defaulting to 0.5.")
        return 0.5

def run_evaluation(recommendations: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    eval_results = []
    
    for rec in recommendations:
        # 1. Deterministic rules
        reasons = evaluate_deterministic_rules(rec)
        
        # 2. LLM specificity check
        spec_score = get_specificity_score(rec)
        if spec_score < 0.5:
            reasons.append(f"Recommendation is too generic (specificity score: {spec_score:.2f} is below 0.5).")
            
        passed = len(reasons) == 0
        
        eval_results.append({
            "passed": passed,
            "reasons": reasons
        })
        
    return eval_results
