import os

from groq import Groq

from dotenv import load_dotenv

load_dotenv()

client = Groq(
    api_key=os.getenv(
        "GROQ_API_KEY"
    )
)

def analyze_with_groq(email_text):

    try:

        prompt = f"""
        Analyze this email for phishing attacks.

        Email:
        {email_text}

        Return:
        - phishing or safe
        - confidence score
        - detailed explanation
        """

        completion = client.chat.completions.create(

            model="llama-3.3-70b-versatile",

            messages=[
                {
                    "role": "user",
                    "content": prompt
                }
            ],

            temperature=0.3
        )

        result = (
            completion
            .choices[0]
            .message
            .content
        )

        label = "Safe"

        score = 40

        if "phishing" in result.lower():

            label = "Suspicious"

            score = 90

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