from flask import Flask, request, jsonify
from flask_cors import CORS
import re

app = Flask(__name__)
CORS(app)

def detect_phishing(email):

    suspicious_words = [
        "urgent",
        "verify",
        "bank",
        "password",
        "click",
        "winner",
        "limited time",
        "login",
        "account suspended",
        "free money"
    ]

    score = 0

    for word in suspicious_words:
        if word.lower() in email.lower():
            score += 1

    links = re.findall(r'https?://\\S+', email)

    if len(links) > 2:
        score += 2

    if score >= 5:
        return "Phishing", 95

    elif score >= 2:
        return "Suspicious", 70

    else:
        return "Safe", 15


@app.route('/analyze', methods=['POST'])
def analyze():

    data = request.json

    email = data.get('email', '')

    prediction, confidence = detect_phishing(email)

    return jsonify({
        "prediction": prediction,
        "confidence": confidence
    })


if __name__ == '__main__':
    app.run(debug=True)