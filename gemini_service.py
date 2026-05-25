import os
import google.generativeai as genai

genai.configure(api_key=os.environ.get("GEMINI_API_KEY"))
model = genai.GenerativeModel("gemini-1.5-flash")

def analyze_with_gemini(email_text: str) -> dict:
    try:
        prompt = f"""You are a cybersecurity expert specializing in phishing email detection.

Analyze the following email and determine if it is phishing/suspicious or safe.

EMAIL:
{email_text[:3000]}

Respond in EXACTLY this format, nothing else:
VERDICT: phishing
CONFIDENCE: 0.95
REASON: Brief reason here

OR

VERDICT: safe
CONFIDENCE: 0.90
REASON: Brief reason here

VERDICT must be exactly 'phishing' or 'safe' (lowercase).
CONFIDENCE must be a number between 0.0 and 1.0.
"""
        response = model.generate_content(prompt)
        text = response.text.strip()

        verdict = "safe"
        confidence = 0.5
        reason = "No reason provided"

        for line in text.split("\n"):
            line = line.strip()
            if line.startswith("VERDICT:"):
                verdict = line.split(":", 1)[1].strip().lower()
            elif line.startswith("CONFIDENCE:"):
                try:
                    confidence = float(line.split(":", 1)[1].strip())
                except:
                    confidence = 0.5
            elif line.startswith("REASON:"):
                reason = line.split(":", 1)[1].strip()

        is_phish = verdict in ("phishing", "suspicious")
        score = round(confidence * 100) if is_phish else round((1 - confidence) * 100)

        # Cap scores: safe max 35, phishing min 60
        if not is_phish:
            score = min(score, 35)
        else:
            score = max(score, 60)

        return {
            "engine": "gemini",
            "label": verdict,
            "score": score,
            "confidence": confidence,
            "reason": reason,
            "is_phish": is_phish
        }

    except Exception as e:
        return {
            "engine": "gemini",
            "label": "safe",
            "score": 0,
            "confidence": 0.0,
            "reason": f"Gemini error: {str(e)}",
            "is_phish": False
        }