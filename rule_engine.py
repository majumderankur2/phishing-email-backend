def detect_phishing_keywords(text):

    phishing_keywords = [

        "urgent",
        "verify",
        "password",
        "bank",
        "suspended",
        "click below",
        "login",
        "account",
        "winner",
        "lottery",
        "claim now",
        "security alert",
        "limited time",
        "confirm identity"

    ]

    text = text.lower()

    indicators = []

    score = 0

    for keyword in phishing_keywords:

        if keyword in text:

            indicators.append(
                f"Detected keyword: {keyword}"
            )

            score += 10

    return {

        "score": score,

        "indicators": indicators
    }