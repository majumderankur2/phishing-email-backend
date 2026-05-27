"""
groq2_service.py — Second Groq Engine
Model: mixtral-8x7b-32768
Focus: Social engineering, sender credibility, urgency tactics, impersonation detection
"""

import os
from groq import Groq

client = Groq(api_key=os.environ.get("GROQ_API_KEY"))


def analyze_with_groq2(email_text: str) -> dict:
    """
    Analyze email text for phishing using a second Groq model (Mixtral).
    Returns a dict with label, score, explanation, is_phish.
    """
    try:
        response = client.chat.completions.create(
            model="mixtral-8x7b-32768",
            messages=[
                {
                    "role": "system",
                    "content": (
                        "You are a cybersecurity analyst specializing in social engineering "
                        "and phishing detection. Focus on sender credibility, urgency tactics, "
                        "impersonation attempts, and trust manipulation techniques. "
                        "Be precise and concise. Never add extra commentary."
                    )
                },
                {
                    "role": "user",
                    "content": (
                        f"Analyze this email for phishing indicators:\n\n{email_text[:3000]}\n\n"
                        "Reply in EXACTLY this format, nothing else:\n"
                        "VERDICT: phishing\nCONFIDENCE: 95\nREASON: one line reason\n\n"
                        "OR\n\n"
                        "VERDICT: safe\nCONFIDENCE: 90\nREASON: one line reason\n\n"
                        "VERDICT must be exactly 'phishing' or 'safe' (lowercase). "
                        "CONFIDENCE is a number 0-100. No extra text."
                    )
                }
            ],
            temperature=0.1,
            max_tokens=120,
        )

        text = response.choices[0].message.content.strip()

        verdict    = "safe"
        confidence = 50.0
        reason     = "No reason provided"

        for line in text.split("\n"):
            line = line.strip()
            if line.startswith("VERDICT:"):
                verdict = line.split(":", 1)[1].strip().lower()
            elif line.startswith("CONFIDENCE:"):
                try:
                    confidence = float(line.split(":", 1)[1].strip())
                except Exception:
                    confidence = 50.0
            elif line.startswith("REASON:"):
                reason = line.split(":", 1)[1].strip()

        # Clamp confidence to valid range
        confidence = max(0.0, min(100.0, confidence))

        is_phish = verdict == "phishing"

        return {
            "label":       verdict,
            "score":       confidence,
            "explanation": reason,
            "is_phish":    is_phish,
        }

    except Exception as e:
        return {
            "label":       "safe",
            "score":       0.0,
            "explanation": f"Groq2 error: {str(e)}",
            "is_phish":    False,
        }