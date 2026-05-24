import os
from groq import Groq
from dotenv import load_dotenv

load_dotenv()

client = Groq(api_key=os.getenv("GROQ_API_KEY"))

def analyze_with_groq(email_text):
    try:
        prompt = "You are a strict phishing email detector. Analyze the email below.\n\nONLY classify as phishing if you find concrete evidence such as:\n- Suspicious or spoofed URLs (e.g. fake bank domains, .tk .xyz domains)\n- Requests for passwords, credit cards, or sensitive credentials\n- Impersonation of a real company or institution\n- Threats of account suspension or urgent action required\n- Mismatched sender domains or forged headers\n\nDo NOT classify as phishing based on:\n- Casual or informal language\n- Internal team communications\n- Meeting invites, lunch plans, social messages\n- Any email with no suspicious links or credential requests\n\nEmail to analyze:\n" + email_text + "\n\nRespond in exactly this format:\nVERDICT: phishing OR safe\nCONFIDENCE: a number from 0 to 100\nEXPLANATION: your detailed reasoning"

        completion = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.1
        )

        result = completion.choices[0].message.content
        lines = result.strip().split("\n")

        verdict = "safe"
        confidence = 30

        for line in lines:
            if line.startswith("VERDICT:"):
                val = line.replace("VERDICT:", "").strip().lower()
                if val == "phishing":
                    verdict = "phishing"
            if line.startswith("CONFIDENCE:"):
                try:
                    confidence = int(line.replace("CONFIDENCE:", "").strip())
                except:
                    pass

        if verdict == "phishing":
            label = "phishing"
            score = max(confidence, 60)
        else:
            label = "safe"
            score = min(confidence, 35)

        return {
            "label": label,
            "score": score,
            "explanation": result
        }

    except Exception as e:
        return {
            "label": "Error",
            "score": 0,
            "explanation": str(e)
        }