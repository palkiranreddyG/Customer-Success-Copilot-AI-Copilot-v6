import os
import json
from typing import Dict, Any, List
import google.generativeai as genai
from backend.config import settings

def validate_planner_output(result: Dict[str, Any]):
    if not isinstance(result, dict):
        raise ValueError("Output must be a dictionary")
    if "interaction_type" not in result or "agents" not in result or "rationale" not in result:
        raise ValueError("Missing required keys in planner output")
    if result["interaction_type"] not in ["renewal_call", "support_escalation", "qbr", "onboarding"]:
        raise ValueError(f"Invalid interaction type: {result['interaction_type']}")
    if not isinstance(result["agents"], list):
        raise ValueError("Agents must be a list of strings")
    valid_agents = ["ingestion", "retrieval", "analysis", "recommendation", "explanation", "evaluation"]
    for agent in result["agents"]:
        if agent not in valid_agents:
            raise ValueError(f"Agent name '{agent}' not in registry: {valid_agents}")

def run_planner(raw_text: str, account_context: dict) -> dict:
    default_fallback = {
        "interaction_type": "renewal_call",
        "agents": ["ingestion", "retrieval", "analysis", "recommendation", "explanation", "evaluation"],
        "rationale": "Fallback default sequence used due to an orchestration execution failure."
    }
    
    gemini_key = settings.GEMINI_API_KEY or os.getenv("GEMINI_API_KEY")
    if not gemini_key:
        print("Planner Agent: No GEMINI_API_KEY found, using hardcoded fallback.")
        default_fallback["rationale"] = "Fallback default sequence used because GEMINI_API_KEY is not configured."
        return default_fallback
        
    try:
        genai.configure(api_key=gemini_key)
        model = genai.GenerativeModel(
            model_name="gemini-2.5-flash",
            generation_config={"response_mime_type": "application/json"}
        )
        
        system_prompt = (
            "You are an orchestration planner for a customer success decision platform. "
            "Given the interaction text and account context, classify the interaction type (renewal_call, support_escalation, qbr, onboarding) "
            "and output the ordered list of agents to invoke from: [ingestion, retrieval, analysis, recommendation, explanation, evaluation]. "
            "Return JSON only conforming to this schema:\n"
            "{\n"
            "  \"interaction_type\": \"string\",\n"
            "  \"agents\": [\"string\"],\n"
            "  \"rationale\": \"string\"\n"
            "}"
        )
        
        prompt = f"Account Context: {json.dumps(account_context, indent=2)}\n\nInteraction Text:\n{raw_text}"
        
        # Call model (Attempt 1)
        response = model.generate_content(
            contents=[
                {"role": "user", "parts": [f"{system_prompt}\n\n{prompt}"]}
            ]
        )
        response_text = response.text.strip()
        
        try:
            result = json.loads(response_text)
            validate_planner_output(result)
            return result
        except Exception as e:
            print(f"Planner Agent Attempt 1 failed validation: {e}. Re-prompting...")
            
            # Re-prompt once (Attempt 2) using chat history
            chat = model.start_chat(history=[
                {"role": "user", "parts": [f"{system_prompt}\n\n{prompt}"]},
                {"role": "model", "parts": [response_text]}
            ])
            response2 = chat.send_message("Your last output was invalid JSON, return ONLY valid JSON matching the schema")
            response2_text = response2.text.strip()
            
            result = json.loads(response2_text)
            validate_planner_output(result)
            return result
            
    except Exception as e2:
        print(f"Planner Agent error: {e2}. Falling back to default order.")
        fallback = default_fallback.copy()
        fallback["rationale"] = f"Fallback triggered. Error details: {str(e2)}"
        return fallback
