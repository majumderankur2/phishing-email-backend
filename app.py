# ============================================================
#  app.py  —  Phishing Detection API  (Groq + Gemini + 3 more)
# ============================================================

import logging
import concurrent.futures
from flask import Flask, request, jsonify
from flask_cors import CORS

# ── Services ─────────────────────────────────────────────────
from groq_service import analyze_with_groq
from ml_service   import predict_email
from rule_engine  import detect_phishing_keywords
from url_scanner  import detect_suspicious_urls

# ── Gemini ───────────────────────────────────────────────────
try:
    from gemini_service import analyze_with_gemini
    GEMINI_AVAILABLE = True
    print("✅ Gemini engine loaded")
except ImportError:
    GEMINI_AVAILABLE = False
    print("⚠️  gemini_service.py not found — Gemini disabled")

# ── BERT ─────────────────────────────────────────────────────
try:
    from bert_service import analyze_with_bert
    BERT_AVAILABLE = True
except ImportError:
    BERT_AVAILABLE = False

# ── Redis Cache ───────────────────────────────────────────────
try:
    from cache import get_cached_result, save_to_cache, get_cache_stats
    CACHE_AVAILABLE = True
    print("✅ Redis cache imported successfully")
except ImportError:
    CACHE_AVAILABLE = False
    print("⚠️  cache.py not found — caching disabled")

# ── Logging ──────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  %(levelname)s  %(message)s"
)
logger = logging.getLogger(__name__)

# ── Flask app ─────────────────────────────────────────────────
app = Flask(__name__)
CORS(app, origins=[
    "http://localhost:5173",
    "https://phishing-email-frontend.vercel.app",
    "https://phishing-email-frontend-git-main-majumderankur2s-projects.vercel.app",
])

# ============================================================
#  NORMALISE: convert every engine result to same shape
# ============================================================
def normalise_groq(result):
    label    = str(result.get("label", "")).lower()
    score    = float(result.get("score", 0))
    is_phish = label in ("suspicious", "phishing")
    return {
        "is_phishing": is_phish,
        "confidence":  round(score / 100, 3),
        "explanation": result.get("explanation", ""),
        "indicators":  [],
    }

def normalise_gemini(result):
    is_phish   = result.get("is_phish", False)
    confidence = float(result.get("confidence", 0.5))
    return {
        "is_phishing": is_phish,
        "confidence":  round(confidence, 3),
        "explanation": result.get("reason", ""),
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
    capped     = min(score, 100)
    is_phish   = capped >= 20
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

    tasks = {
        "groq":  (analyze_with_groq,        email_text),
        "ml":    (predict_email,             email_text),
        "rules": (detect_phishing_keywords,  email_text),
        "url":   (detect_suspicious_urls,    email_text),
    }
    if GEMINI_AVAILABLE:
        tasks["gemini"] = (analyze_with_gemini, email_text)
    if BERT_AVAILABLE:
        tasks["bert"] = (analyze_with_bert, email_text)

    with concurrent.futures.ThreadPoolExecutor(max_workers=6) as executor:
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

    normalised = {}
    if "groq"   in raw: normalised["groq"]   = normalise_groq(raw["groq"])
    if "gemini" in raw: normalised["gemini"] = normalise_gemini(raw["gemini"])
    if "ml"     in raw: normalised["ml"]     = normalise_ml(raw["ml"])
    if "rules"  in raw: normalised["rules"]  = normalise_rules(raw["rules"])
    if "url"    in raw: normalised["url"]    = normalise_url(raw["url"])
    if "bert"   in raw: normalised["bert"]   = normalise_bert(raw["bert"])

    return normalised

# ============================================================
#  SCORER: weighted ensemble
# ============================================================
def calculate_final_score(engine_results):
    base_weights = {
        "groq":   0.35,
        "gemini": 0.25,
        "ml":     0.18,
        "rules":  0.12,
        "url":    0.10,
        "bert":   0.00,  # disabled on free tier
    }

    active_weights = {k: v for k, v in base_weights.items() if k in engine_results and v > 0}
    total_w        = sum(active_weights.values())
    weights        = {k: v / total_w for k, v in active_weights.items()}

    weighted_score   = 0.0
    votes_phishing   = 0
    all_indicators   = []
    groq_explanation = ""
    gemini_explanation = ""

    for name, result in engine_results.items():
        w          = weights.get(name, 0.0)
        confidence = result.get("confidence", 0.5)
        is_phish   = result.get("is_phishing", False)

        if is_phish:
            votes_phishing += 1
            weighted_score += w * confidence
        else:
            weighted_score += w * 0.0

        all_indicators += result.get("indicators", [])
        if name == "groq":
            groq_explanation = result.get("explanation", "")
        if name == "gemini":
            gemini_explanation = result.get("explanation", "")

    total_engines = len(engine_results)
    final_score   = round(weighted_score * 100, 1)

    if final_score >= 65:
        label = "phishing"
    elif final_score >= 35:
        label = "suspicious"
    else:
        label = "safe"

    return {
        "score":              final_score,
        "label":              label,
        "confidence":         round(abs(final_score - 50) / 50, 2),
        "votes":              f"{votes_phishing}/{total_engines} engines flagged",
        "indicators":         list(set(all_indicators)),
        "explanation":        groq_explanation or gemini_explanation,
        "gemini_explanation": gemini_explanation,
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
@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "alive"}), 200

@app.route("/", methods=["GET"])
def health_check():
    return jsonify({
        "status":          "running",
        "version":         "3.0",
        "bert_available":  BERT_AVAILABLE,
        "gemini_available": GEMINI_AVAILABLE,
        "cache_enabled":   CACHE_AVAILABLE,
        "engines":         (
            ["groq", "ml", "rules", "url"]
            + (["gemini"] if GEMINI_AVAILABLE else [])
            + (["bert"]   if BERT_AVAILABLE   else [])
        ),
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

        if CACHE_AVAILABLE:
            cached = get_cached_result(email_text)
            if cached is not None:
                logger.info("Cache HIT — returning saved result")
                cached["cache_hit"] = True
                return jsonify(cached), 200

        logger.info("Cache MISS — running all engines")
        engine_results     = run_all_engines(email_text)
        final              = calculate_final_score(engine_results)
        final["cache_hit"] = False

        if CACHE_AVAILABLE:
            save_to_cache(email_text, final)
            logger.info("Result saved to Redis cache (TTL: 24h)")

        logger.info(f"Result — label: {final['label']}, score: {final['score']}")
        return jsonify(final), 200

    except concurrent.futures.TimeoutError:
        return jsonify({"error": "Engines timed out — please retry"}), 503
    except ValueError as e:
        return jsonify({"error": "Invalid input", "detail": str(e)}), 400
    except Exception as e:
        logger.error(f"Unhandled error: {e}", exc_info=True)
        return jsonify({"error": "Internal server error", "detail": str(e)}), 500

@app.route("/api/cache/clear", methods=["POST"])
def clear_cache():
    if not CACHE_AVAILABLE:
        return jsonify({"error": "Cache not enabled"}), 503
    try:
        import redis, os
        r = redis.from_url(os.getenv("REDIS_URL", "redis://localhost:6379"))
        r.flushdb()
        return jsonify({"status": "Cache cleared successfully"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/cache/stats", methods=["GET"])
def cache_stats():
    if not CACHE_AVAILABLE:
        return jsonify({"error": "Cache is not enabled"}), 503
    try:
        stats = get_cache_stats()
        return jsonify(stats), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/engines/status", methods=["GET"])
def engine_status():
    return jsonify({
        "groq":         True,
        "gemini":       GEMINI_AVAILABLE,
        "bert":         BERT_AVAILABLE,
        "ml":           True,
        "rules":        True,
        "url":          True,
        "total_active": 4 + (1 if GEMINI_AVAILABLE else 0) + (1 if BERT_AVAILABLE else 0),
        "cache":        CACHE_AVAILABLE,
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
    logger.info("Starting Phishing Detection API v3.0")
    logger.info(f"Gemini engine: {'ENABLED' if GEMINI_AVAILABLE else 'DISABLED'}")
    logger.info(f"BERT engine:   {'ENABLED' if BERT_AVAILABLE else 'DISABLED'}")
    logger.info(f"Redis cache:   {'ENABLED' if CACHE_AVAILABLE else 'DISABLED'}")
    app.run(debug=True, host="0.0.0.0", port=5000)
