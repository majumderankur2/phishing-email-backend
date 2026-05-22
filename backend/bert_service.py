# bert_service.py
from transformers import pipeline
import logging

logger = logging.getLogger(__name__)

# Loads once when server starts (~30 seconds first time, cached after)
try:
    classifier = pipeline(
        "text-classification",
        model="ealvaradob/bert-finetuned-phishing",
        truncation=True,
        max_length=512
    )
    logger.info("BERT model loaded successfully")
except Exception as e:
    classifier = None
    logger.error(f"BERT model failed to load: {e}")


def analyze_with_bert(email_text):
    if classifier is None:
        return {"is_phishing": False, "confidence": 0.5, "error": "BERT not loaded"}
    try:
        result = classifier(email_text[:1000])[0]
        label  = result["label"].lower()
        score  = result["score"]
        return {
            "is_phishing": label == "phishing",
            "confidence":  round(score, 3)
        }
    except Exception as e:
        logger.error(f"BERT analysis error: {e}")
        return {"is_phishing": False, "confidence": 0.5, "error": str(e)}