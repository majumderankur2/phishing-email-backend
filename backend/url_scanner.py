import re

def detect_suspicious_urls(text):

    indicators = []

    score = 0

    urls = re.findall(
        r'(https?://[^\\s]+)',
        text
    )

    suspicious_words = [

        "login",
        "verify",
        "secure",
        "bank",
        "update"

    ]

    for url in urls:

        indicators.append(
            "Suspicious URL detected"
        )

        score += 20

        for word in suspicious_words:

            if word in url.lower():

                indicators.append(
                    f"Suspicious domain: {word}"
                )

                score += 10

    return {

        "score": score,

        "indicators": indicators
    }