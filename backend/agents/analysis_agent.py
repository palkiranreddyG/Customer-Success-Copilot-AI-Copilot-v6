import os
import json
from typing import Dict, Any, List
import google.generativeai as genai
from pydantic import BaseModel, Field, field_validator, model_validator
from enum import Enum
from backend.config import settings

class Severity(str, Enum):
    HIGH = "HIGH"
    MEDIUM = "MEDIUM"
    LOW = "LOW"

class RiskModel(BaseModel):
    description: str
    severity: Severity

class AnalysisModel(BaseModel):
    risks: List[RiskModel] = Field(default_factory=list)
    opportunities: List[str] = Field(default_factory=list)
    missing_info: List[str] = Field(default_factory=list)

    @model_validator(mode='after')
    def validate_both_not_empty(self) -> 'AnalysisModel':
        if not self.risks and not self.opportunities:
            raise ValueError("Both risks and opportunities cannot be empty.")
        return self

def clean_json_response(text: str) -> str:
    text = text.strip()
    if text.startswith("```"):
        # remove ```json and ```
        lines = text.split("\n")
        if lines[0].startswith("```"):
            lines = lines[1:]
        if lines and lines[-1].strip() == "```":
            lines = lines[:-1]
        text = "\n".join(lines).strip()
    return text

def run_analysis(cleaned_text: str, chunks: List[Dict[str, Any]], account_context: Dict[str, Any]) -> dict:
    default_fallback = {
        "risks": [{"description": "Unable to determine — manual review needed", "severity": "MEDIUM"}],
        "opportunities": [],
        "missing_info": []
    }
    
    gemini_key = settings.GEMINI_API_KEY or os.getenv("GEMINI_API_KEY")
    if not gemini_key:
        print("Analysis Agent: No GEMINI_API_KEY found, returning fallback analysis.")
        return default_fallback

    system_prompt = (
        "You are an enterprise customer success analyst. Given the interaction text, retrieved knowledge base context, and account metrics (ARR, health score, tenure), identify: "
        "(1) risks with severity HIGH/MEDIUM/LOW, (2) expansion opportunities, (3) missing information. "
        "Return JSON only matching the schema:\n"
        "{\n"
        "  \"risks\": [\n"
        "    { \"description\": \"string\", \"severity\": \"HIGH|MEDIUM|LOW\" }\n"
        "  ],\n"
        "  \"opportunities\": [\"string\"],\n"
        "  \"missing_info\": [\"string\"]\n"
        "}"
    )

    prompt = (
        f"Account Metrics:\n- ARR: ${account_context.get('arr', 0):,.2f}\n- Health Score: {account_context.get('health_score', 0)}\n- Tenure: {account_context.get('tenure_months', 0)} months\n\n"
        f"Retrieved Knowledge Base Context:\n{json.dumps(chunks, indent=2)}\n\n"
        f"Interaction Text:\n{cleaned_text}"
    )

    try:
        genai.configure(api_key=gemini_key)
        model = genai.GenerativeModel(
            model_name="gemini-2.5-flash",
            generation_config={"response_mime_type": "application/json"}
        )

        # Attempt 1
        response = model.generate_content(
            contents=[{"role": "user", "parts": [f"{system_prompt}\n\n{prompt}"]}]
        )
        response_text = clean_json_response(response.text.strip())

        try:
            parsed = json.loads(response_text)
            AnalysisModel(**parsed)
            return parsed
        except Exception as e:
            print(f"Analysis Agent Attempt 1 validation failed: {e}. Re-prompting...")
            # Re-prompt once (Attempt 2)
            chat = model.start_chat(history=[
                {"role": "user", "parts": [f"{system_prompt}\n\n{prompt}"]},
                {"role": "model", "parts": [response.text]}
            ])
            response2 = chat.send_message(
                "Your last output was invalid JSON or violated schema. Return ONLY valid JSON matching the schema. "
                "Ensure risks is a list of objects with description and severity, opportunities is a list of strings, and missing_info is a list of strings. "
                "Both risks and opportunities cannot be empty, and severity must be HIGH, MEDIUM, or LOW."
            )
            response2_text = clean_json_response(response2.text.strip())
            parsed = json.loads(response2_text)
            AnalysisModel(**parsed)
            return parsed

    except Exception as e2:
        print(f"Analysis Agent execution error: {e2}. Returning fallback.")
        return default_fallback
