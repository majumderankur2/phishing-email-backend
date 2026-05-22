# ml_service.py  —  Upgraded
import joblib
import os
import logging

logger = logging.getLogger(__name__)

# Try both possible model locations
MODEL_PATHS = [
    os.path.join(os.path.dirname(__file__), "ml", "phishing_model.pkl"),
    os.path.join(os.path.dirname(__file__), "phishing_model.pkl"),
]

def _load_model():
    for path in MODEL_PATHS:
        if os.path.exists(path):
            logger.info(f"ML model loaded from {path}")
            return joblib.load(path)
    raise FileNotFoundError("phishing_model.pkl not found. Run train_model.py first.")

try:
    model = _load_model()
    MODEL_LOADED = True
except Exception as e:
    model = None
    MODEL_LOADED = False
    logger.error(f"ML model load failed: {e}")


def predict_email(text):
    if not MODEL_LOADED or model is None:
        return {"prediction": "unknown", "score": 50, "is_phishing": False, "confidence": 0.5}
    try:
        prediction  = model.predict([text])[0]
        proba       = model.predict_proba([text])[0]
        classes     = list(model.classes_)
        phish_idx   = classes.index("phishing") if "phishing" in classes else 1
        phish_score = round(proba[phish_idx] * 100, 1)

        return {
            "prediction":  prediction,
            "score":       phish_score,
            "is_phishing": prediction == "phishing",
            "confidence":  round(proba[phish_idx], 3),
        }
    except Exception as e:
        logger.error(f"ML prediction error: {e}")
        return {"prediction": "unknown", "score": 50, "is_phishing": False, "confidence": 0.5}