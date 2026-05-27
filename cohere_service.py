import os
import cohere

client = cohere.ClientV2(api_key=os.environ.get("COHERE_API_KEY", ""))

def analyze_with_cohere(email_text):
    try:
        response = client.chat(
            model="command-r-plus-08-2024",
            messages=[
                {
                    "role": "user",
                    "content": f"""You are a cybersecurity expert specializing in phishing detection.

Analyze this email and respond with ONLY a JSON object, nothing else:
{{
  "verdict": "phishing" or "suspicious" or "safe",
  "confidence": <number 0-100>,
  "reasons": ["reason1", "reason2"]
}}

Email to analyze:
{email_text}"""
                }
            ]
        )

        import json, re
        raw = response.message.content[0].text
        match = re.search(r'\{.*\}', raw, re.DOTALL)
        if not match:
            raise ValueError("No JSON found")
        data = json.loads(match.group())

        verdict = data.get("verdict", "safe").lower()
        confidence = float(data.get("confidence", 50))
        reasons = data.get("reasons", [])

        if verdict == "phishing":
            risk_score = confidence
        elif verdict == "suspicious":
            risk_score = confidence * 0.6
        else:
            risk_score = confidence * 0.1

        return {
            "verdict": verdict,
            "confidence": confidence,
            "risk_score": risk_score,
            "reasons": reasons,
            "engine": "cohere"
        }

    except Exception as e:
        return {
            "verdict": "safe",
            "confidence": 0,
            "risk_score": 0,
            "reasons": [f"Cohere error: {str(e)}"],
            "engine": "cohere"
        }