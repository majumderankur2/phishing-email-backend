# ============================================================
#  app.py  —  Phishing Detection API  (Full Multi-AI Version)
# ============================================================

import logging
import concurrent.futures
from flask import Flask, request, jsonify
from flask_cors import CORS

# ── Your existing services (using their actual function names) ──
from groq_service import analyze_with_groq          # returns {label, score, explanation}
from ml_service   import predict_email               # returns {prediction, score}
from rule_engine  import detect_phishing_keywords    # returns {score, indicators}
from url_scanner  import detect_suspicious_urls      # returns {score, indicators}

# ── BERT service ────────────────────────────────────────────
try:
    from bert_service import analyze_with_bert
    BERT_AVAILABLE = True
except ImportError:
    BERT_AVAILABLE = False

# ── Logging ─────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  %(levelname)s  %(message)s"
)
logger = logging.getLogger(__name__)

# ── Flask app ────────────────────────────────────────────────
app = Flask(__name__)
CORS(app, origins=[
    "http://localhost:5173",           # local dev
    "https://your-app.vercel.app",     # production (fill this in later)
])

# ============================================================
#  NORMALISE: convert every engine result to same shape
# ============================================================
def normalise_groq(result):
    label = str(result.get("label", "")).lower()
    score = float(result.get("score", 0))
    is_phish = label in ("suspicious", "phishing") or score >= 50
    return {
        "is_phishing": is_phish,
        "confidence":  round(score / 100, 3),
        "explanation": result.get("explanation", ""),
        "indicators":  [],
    }

def normalise_ml(result):
    prediction = str(result.get("prediction", "")).lower()
    score      = float(result.get("score", 0))
    is_phish   = prediction == "phishing" or score >= 50
    return {
        "is_phishing": is_phish,
        "confidence":  round(score / 100, 3),
        "explanation": "",
        "indicators":  [],
    }

def normalise_rules(result):
    score      = float(result.get("score", 0))
    indicators = result.get("indicators", [])
    # rule score is additive (10 per keyword), cap at 100
    capped     = min(score, 100)
    is_phish   = capped >= 20   # 2+ keywords = suspicious
    return {
        "is_phishing": is_phish,
        "confidence":  round(capped / 100, 3),
        "explanation": "",
        "indicators":  indicators,
    }

def normalise_url(result):
    score      = float(result.get("score", 0))
    indicators = result.get("indicators", [])
    capped     = min(score, 100)
    is_phish   = capped >= 20
    return {
        "is_phishing": is_phish,
        "confidence":  round(capped / 100, 3),
        "explanation": "",
        "indicators":  indicators,
    }

def normalise_bert(result):
    return {
        "is_phishing": bool(result.get("is_phishing", False)),
        "confidence":  round(float(result.get("confidence", 0.5)), 3),
        "explanation": "",
        "indicators":  [],
    }

# ============================================================
#  ORCHESTRATOR: run all engines in parallel
# ============================================================
def run_all_engines(email_text):
    raw = {}

    # Define tasks using actual function names
    tasks = {
        "groq":  (analyze_with_groq,           email_text),
        "ml":    (predict_email,                email_text),
        "rules": (detect_phishing_keywords,     email_text),
        "url":   (detect_suspicious_urls,       email_text),
    }
    if BERT_AVAILABLE:
        tasks["bert"] = (analyze_with_bert, email_text)

    with concurrent.futures.ThreadPoolExecutor(max_workers=5) as executor:
        future_map = {
            executor.submit(fn, arg): name
            for name, (fn, arg) in tasks.items()
        }
        for future in concurrent.futures.as_completed(future_map, timeout=30):
            name = future_map[future]
            try:
                raw[name] = future.result()
            except Exception as e:
                logger.error(f"Engine '{name}' error: {e}")
                raw[name] = {"score": 0, "indicators": [], "error": str(e)}

    # Normalise each engine result
    normalised = {}
    if "groq"  in raw: normalised["groq"]  = normalise_groq(raw["groq"])
    if "ml"    in raw: normalised["ml"]    = normalise_ml(raw["ml"])
    if "rules" in raw: normalised["rules"] = normalise_rules(raw["rules"])
    if "url"   in raw: normalised["url"]   = normalise_url(raw["url"])
    if "bert"  in raw: normalised["bert"]  = normalise_bert(raw["bert"])

    return normalised

# ============================================================
#  SCORER: weighted ensemble + majority vote
# ============================================================
def calculate_final_score(engine_results):
    # Weights — adjust based on which engines are available
    base_weights = {
        "groq":  0.35,
        "bert":  0.25,
        "ml":    0.20,
        "rules": 0.12,
        "url":   0.08,
    }

    # Only use weights for engines that ran
    active_weights = {k: v for k, v in base_weights.items() if k in engine_results}

    # Re-normalise weights to sum to 1.0
    total_w = sum(active_weights.values())
    weights = {k: v / total_w for k, v in active_weights.items()}

    weighted_score  = 0.0
    votes_phishing  = 0
    all_indicators  = []
    groq_explanation = ""

    for name, result in engine_results.items():
        w          = weights.get(name, 0.1)
        confidence = result.get("confidence", 0.5)
        is_phish   = result.get("is_phishing", False)

        if is_phish:
            votes_phishing += 1
            weighted_score += w * confidence
        else:
            weighted_score += w * (1.0 - confidence)

        all_indicators += result.get("indicators", [])
        if name == "groq":
            groq_explanation = result.get("explanation", "")

    total_engines = len(engine_results)
    final_score   = round(weighted_score * 100, 1)
    majority      = votes_phishing > (total_engines / 2)

    # Label
    if final_score >= 65:
        label = "phishing"
    elif final_score >= 35 or majority:
        label = "suspicious"
    else:
        label = "safe"

    # Safety override
    if majority and label == "safe":
        label = "suspicious"

    return {
        "score":            final_score,
        "label":            label,
        "confidence":       round(abs(final_score - 50) / 50, 2),
        "votes":            f"{votes_phishing}/{total_engines} engines flagged",
        "indicators":       list(set(all_indicators)),
        "explanation":      groq_explanation,
        "engine_breakdown": {
            name: {
                "is_phishing": r["is_phishing"],
                "confidence":  r["confidence"],
            }
            for name, r in engine_results.items()
        },
    }

# ============================================================
#  ROUTES
# ============================================================

@app.route("/", methods=["GET"])
def health_check():
    return jsonify({
        "status":  "running",
        "version": "2.0",
        "bert_available": BERT_AVAILABLE,
        "engines": list(["groq", "ml", "rules", "url"] + (["bert"] if BERT_AVAILABLE else [])),
    })


@app.route("/api/scan", methods=["POST"])
def scan_email():
    try:
        data       = request.get_json(force=True)
        email_text = str(data.get("email_text", "")).strip()

        if not email_text:
            return jsonify({"error": "email_text is required"}), 400
        if len(email_text) > 20000:
            return jsonify({"error": "email_text too long (max 20,000 chars)"}), 400

        logger.info(f"Scan request — length: {len(email_text)} chars")

        engine_results = run_all_engines(email_text)
        final          = calculate_final_score(engine_results)

        logger.info(f"Result — label: {final['label']}, score: {final['score']}, votes: {final['votes']}")

        return jsonify(final), 200

    except concurrent.futures.TimeoutError:
        return jsonify({"error": "Engines timed out — please retry"}), 503
    except ValueError as e:
        return jsonify({"error": "Invalid input", "detail": str(e)}), 400
    except Exception as e:
        logger.error(f"Unhandled error: {e}", exc_info=True)
        return jsonify({"error": "Internal server error", "detail": str(e)}), 500


@app.route("/api/engines/status", methods=["GET"])
def engine_status():
    return jsonify({
        "groq":         True,
        "bert":         BERT_AVAILABLE,
        "ml":           True,
        "rules":        True,
        "url":          True,
        "total_active": 4 + (1 if BERT_AVAILABLE else 0),
    })


# ============================================================
#  ERROR HANDLERS
# ============================================================

@app.errorhandler(404)
def not_found(e):
    return jsonify({"error": "Route not found"}), 404

@app.errorhandler(405)
def method_not_allowed(e):
    return jsonify({"error": "Method not allowed"}), 405

@app.errorhandler(Exception)
def unhandled_exception(e):
    logger.error(f"Unhandled exception: {e}", exc_info=True)
    return jsonify({"error": "Unexpected server error", "detail": str(e)}), 500


# ============================================================
#  ENTRY POINT
# ============================================================
if __name__ == "__main__":
    logger.info("Starting Phishing Detection API v2.0")
    logger.info(f"BERT engine: {'ENABLED' if BERT_AVAILABLE else 'DISABLED'}")
    app.run(debug=True, host="0.0.0.0", port=5000)