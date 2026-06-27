import os
import json
from backend.config import settings
import google.generativeai as genai

def run_ingestion(raw_text: str) -> dict:
    if not raw_text or not raw_text.strip():
        # Failure case: return error key so it gets added to state["errors"]
        return {
            "cleaned_text": "",
            "detected_entities": [],
            "error": "Ingestion Agent: empty input transcript text provided."
        }
        
    gemini_key = settings.GEMINI_API_KEY or os.getenv("GEMINI_API_KEY")
    if not gemini_key:
        print("Ingestion Agent: No GEMINI_API_KEY, using fallback regex/string cleaning.")
        # Rule-based clean up as fallback
        lines = [line.strip() for line in raw_text.split("\n") if line.strip()]
        cleaned = "\n".join(lines)
        return {
            "cleaned_text": cleaned,
            "detected_entities": ["Customer Success Representative"] # default fallback entity
        }
        
    try:
        genai.configure(api_key=gemini_key)
        model = genai.GenerativeModel(
            model_name="gemini-2.5-flash",
            generation_config={"response_mime_type": "application/json"}
        )
        
        prompt = (
            "You are an ingestion agent. Clean the following raw transcript text by removing filler words, "
            "transcript noise, and formatting it with clear speaker turns. Also extract a list of detected stakeholder names.\n"
            "Return JSON only conforming to this schema:\n"
            "{\n"
            "  \"cleaned_text\": \"string\",\n"
            "  \"detected_entities\": [\"string\"]\n"
            "}\n\n"
            f"Raw Transcript:\n{raw_text}"
        )
        
        response = model.generate_content(prompt)
        res = json.loads(response.text.strip())
        
        return {
            "cleaned_text": res.get("cleaned_text", raw_text),
            "detected_entities": res.get("detected_entities", [])
        }
    except Exception as e:
        print(f"Ingestion Agent error: {e}. Returning raw text with warning.")
        return {
            "cleaned_text": raw_text.strip(),
            "detected_entities": [],
            "error": f"Ingestion Agent: LLM execution failed, returned raw text. Details: {str(e)}"
        }
