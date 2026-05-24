import os
from groq import Groq
from dotenv import load_dotenv

load_dotenv()

client = Groq(api_key=os.getenv("GROQ_API_KEY"))

def analyze_with_groq(email_text):
    try:
        prompt = f"""You are a strict phishing email detector. Analyze the email below.

ONLY classify as phishing if you find concrete evidence such as:
- Suspicious or spoofed URLs (e.g. fake bank domains, .tk .xyz domains)
- Requests for passwords, credit cards, or sensitive credentials
- Impersonation of a real company or institution
- Threats of account suspension or urgent action required
- Mismatched sender domains or forged headers

Do NOT classify as phishing based on:
- Casual or informal language
- Internal team communications
- Meeting invites, lunch plans, social messages
- Any email with no suspicious links or credential requests

Email to analyze:
{email_text}

Respond in exactly this format: