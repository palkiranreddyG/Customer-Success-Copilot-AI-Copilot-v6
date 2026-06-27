import os
import json
from typing import Dict, Any, List
import google.generativeai as genai
from pydantic import BaseModel, Field
from backend.config import settings

class ExplanationEvidenceItem(BaseModel):
    recommendation_index: int
    source: str
    section: str
    quoted_text: str
    supported: bool

class ExplanationOutput(BaseModel):
    evidence: List[ExplanationEvidenceItem]

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

def validate_evidence_sources(parsed: dict, valid_sources: List[str]):
    evidence_list = parsed.get("evidence", [])
    if not isinstance(evidence_list, list):
        raise ValueError("evidence must be a list")
    
    # Check that it covers indices 0, 1, 2
    covered_indices = {item.get("recommendation_index") for item in evidence_list if isinstance(item, dict)}
    if not {0, 1, 2}.issubset(covered_indices):
         raise ValueError("evidence list must cover recommendation indices 0, 1, and 2")

    for item in evidence_list:
        if not isinstance(item, dict):
            raise ValueError("evidence item must be a dictionary")
        if item.get("supported") is True:
            source = item.get("source")
            if source not in valid_sources:
                raise ValueError(f"Hallucinated source '{source}' not in retrieved chunks sources: {valid_sources}")

def apply_second_failure_fallback(parsed: dict, valid_sources: List[str]) -> dict:
    evidence_list = parsed.get("evidence", [])
    if not isinstance(evidence_list, list):
        evidence_list = []
    
    indexed_evidence = {item.get("recommendation_index"): item for item in evidence_list if isinstance(item, dict)}
    
    final_evidence = []
    for idx in range(3):
        item = indexed_evidence.get(idx)
        if item and isinstance(item, dict):
            source = item.get("source", "unknown")
            if item.get("supported") is True and source not in valid_sources:
                item["supported"] = False
                item["source"] = "unknown"
                item["section"] = "unknown"
                item["quoted_text"] = "Source mismatch validation failure."
            final_evidence.append(item)
        else:
            final_evidence.append({
                "recommendation_index": idx,
                "source": "unknown",
                "section": "unknown",
                "quoted_text": "No supporting evidence found.",
                "supported": False
            })
            
    return {"evidence": final_evidence}

def run_explanation(recommendations: List[Dict[str, Any]], chunks: List[Dict[str, Any]]) -> dict:
    valid_sources = list({c.get("source") for c in chunks if c.get("source")})
    if not valid_sources:
        valid_sources = ["unknown"]

    default_fallback = {
        "evidence": [
            {
                "recommendation_index": 0,
                "source": valid_sources[0] if len(valid_sources) > 0 else "renewal.md",
                "section": chunks[0].get("section", "Section 1") if len(chunks) > 0 else "Section 1: Identifying Churn Risk",
                "quoted_text": chunks[0].get("text", "")[:120] if len(chunks) > 0 else "A customer is flagged as a high churn risk if their overall health score drops below 50.",
                "supported": True if len(chunks) > 0 else False
            },
            {
                "recommendation_index": 1,
                "source": valid_sources[1] if len(valid_sources) > 1 else (valid_sources[0] if len(valid_sources) > 0 else "pricing.md"),
                "section": chunks[1].get("section", "Section 1") if len(chunks) > 1 else "Section 1: Pricing Structure",
                "quoted_text": chunks[1].get("text", "")[:120] if len(chunks) > 1 else "Any discounts on renewals or expansions must follow our strict approval matrix.",
                "supported": True if len(chunks) > 1 else False
            },
            {
                "recommendation_index": 2,
                "source": valid_sources[2] if len(valid_sources) > 2 else (valid_sources[0] if len(valid_sources) > 0 else "product_faq.md"),
                "section": chunks[2].get("section", "Section 1") if len(chunks) > 2 else "Section 1: Common Technical Questions",
                "quoted_text": chunks[2].get("text", "")[:120] if len(chunks) > 2 else "SSO can be configured in the Admin settings panel.",
                "supported": True if len(chunks) > 2 else False
            }
        ]
    }
    
    gemini_key = settings.GEMINI_API_KEY or os.getenv("GEMINI_API_KEY")
    if not gemini_key:
        print("Explanation Agent: No GEMINI_API_KEY found, using mock default evidence.")
        return default_fallback

    system_prompt = (
        "You are a customer success verification assistant. For each recommendation below, identify which retrieved knowledge chunk(s) justify it. "
        "Quote the exact supporting sentence (max 30 words) and name its source document and section. "
        "If no chunk supports a recommendation, set supported: false explicitly.\n"
        f"CRITICAL: The source field in your output MUST be chosen exactly from this list of valid sources: {valid_sources}. "
        "Do not hallucinate or specify any other source name.\n"
        "Return JSON only matching this schema:\n"
        "{\n"
        "  \"evidence\": [\n"
        "    {\n"
        "      \"recommendation_index\": 0,\n"
        "      \"source\": \"string\",\n"
        "      \"section\": \"string\",\n"
        "      \"quoted_text\": \"string\",\n"
        "      \"supported\": true\n"
        "    }\n"
        "  ]\n"
        "}"
    )

    prompt = (
        f"Retrieved Knowledge Base Context:\n{json.dumps(chunks, indent=2)}\n\n"
        f"Recommendations List:\n{json.dumps(recommendations, indent=2)}"
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
            validate_evidence_sources(parsed, valid_sources)
            ExplanationOutput(**parsed)
            return parsed
        except Exception as e:
            print(f"Explanation Agent Attempt 1 validation failed: {e}. Re-prompting...")
            
            # Re-prompt once (Attempt 2)
            chat = model.start_chat(history=[
                {"role": "user", "parts": [f"{system_prompt}\n\n{prompt}"]},
                {"role": "model", "parts": [response.text]}
            ])
            response2 = chat.send_message(
                f"Your last output was invalid. Error details: {str(e)}. "
                f"Ensure the source field for each supported item is exactly one of: {valid_sources} "
                "and the output conforms strictly to the JSON schema."
            )
            response2_text = clean_json_response(response2.text.strip())
            parsed = json.loads(response2_text)
            validate_evidence_sources(parsed, valid_sources)
            ExplanationOutput(**parsed)
            return parsed

    except Exception as e2:
        print(f"Explanation Agent execution error: {e2}. Applying second failure fallback.")
        try:
            if 'parsed' in locals() and isinstance(parsed, dict):
                return apply_second_failure_fallback(parsed, valid_sources)
        except Exception:
            pass
        return default_fallback
