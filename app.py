import os
import logging
import concurrent.futures
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
load_dotenv()

from groq_service  import analyze_with_groq
from groq2_service import analyze_with_groq2
from ml_service    import predict_email
from rule_engine   import detect_phishing_keywords
from url_scanner   import detect_suspicious_urls

try:
    from cohere_service import analyze_with_cohere
    COHERE_AVAILABLE = True
    print("✅ Cohere engine loaded")
except ImportError as e:
    COHERE_AVAILABLE = False
    print(f"⚠️  Cohere not available: {e}")

try:
    from cache import get_cached_result, save_to_cache, get_cache_stats
    CACHE_AVAILABLE = True
    print("✅ Redis cache imported successfully")
except ImportError:
    CACHE_AVAILABLE = False
    print("⚠️  cache.py not found — caching disabled")

logging.basicConfig(level=logging.INFO, format="%(asctime)s  %(levelname)s  %(message)s")
logger = logging.getLogger(__name__)
app = Flask(__name__)
CORS(app)

ENGINE_WEIGHTS = {
    "groq":   0.30,
    "groq2":  0.25,
    "cohere": 0.20,
    "ml":     0.15,
    "rules":  0.07,
    "url":    0.03
}

def normalise_groq(r):
    label = str(r.get("label","")).lower()
    score = float(r.get("score",0))
    return {"is_phishing": label in ("suspicious","phishing"), "confidence": round(score/100,3), "explanation": r.get("explanation",""), "indicators": []}

def normalise_groq2(r):
    label = str(r.get("label","")).lower()
    score = float(r.get("score",0))
    return {"is_phishing": label=="phishing", "confidence": round(score/100,3), "explanation": r.get("explanation",""), "indicators": []}

def normalise_cohere(r):
    verdict = str(r.get("verdict","safe")).lower()
    risk_score = float(r.get("risk_score",0))
    confidence = float(r.get("confidence",0))
    return {"is_phishing": verdict in ("phishing","suspicious"), "confidence": round(risk_score/100,3), "explanation": ", ".join(r.get("reasons",[])), "indicators": []}

def normalise_ml(r):
    prediction = str(r.get("prediction","")).lower()
    score = float(r.get("score",0))
    return {"is_phishing": prediction=="phishing" or score>=50, "confidence": round(score/100,3), "explanation": "", "indicators": []}

def normalise_rules(r):
    score = min(float(r.get("score",0)),100)
    return {"is_phishing": score>=20, "confidence": round(score/100,3), "explanation": "", "indicators": r.get("indicators",[])}

def normalise_url(r):
    score = min(float(r.get("score",0)),100)
    return {"is_phishing": score>=20, "confidence": round(score/100,3), "explanation": "", "indicators": r.get("indicators",[])}

def run_all_engines(email_text):
    tasks = {
        "groq":   (analyze_with_groq,          email_text),
        "groq2":  (analyze_with_groq2,          email_text),
        "ml":     (predict_email,               email_text),
        "rules":  (detect_phishing_keywords,    email_text),
        "url":    (detect_suspicious_urls,      email_text),
    }
    if COHERE_AVAILABLE:
        tasks["cohere"] = (analyze_with_cohere, email_text)

    raw = {}
    with concurrent.futures.ThreadPoolExecutor(max_workers=6) as executor:
        future_map = {executor.submit(fn, arg): name for name, (fn, arg) in tasks.items()}
        for future in concurrent.futures.as_completed(future_map, timeout=30):
            name = future_map[future]
            try:
                raw[name] = future.result()
            except Exception as e:
                logger.error(f"Engine '{name}' error: {e}")
                raw[name] = {"score": 0, "indicators": [], "error": str(e)}

    normalise_fn = {
        "groq":   normalise_groq,
        "groq2":  normalise_groq2,
        "cohere": normalise_cohere,
        "ml":     normalise_ml,
        "rules":  normalise_rules,
        "url":    normalise_url
    }
    normalised = {}
    for name, result in raw.items():
        try:
            normalised[name] = normalise_fn[name](result)
        except Exception as e:
            normalised[name] = {"is_phishing": False, "confidence": 0.0, "explanation": f"Error: {e}", "indicators": []}
    return normalised

def calculate_final_score(engine_results):
    active = {k: v for k, v in ENGINE_WEIGHTS.items() if k in engine_results}
    total_w = sum(active.values()) or 1.0
    w = {k: v/total_w for k, v in active.items()}
    weighted_score = 0.0
    votes_phishing = 0
    all_indicators = []
    groq_explanation = ""
    for name, result in engine_results.items():
        confidence = result.get("confidence", 0.0)
        is_phish = result.get("is_phishing", False)
        if is_phish:
            votes_phishing += 1
            weighted_score += w.get(name, 0.1) * confidence
        all_indicators += result.get("indicators", [])
        if name == "groq" and result.get("explanation"):
            groq_explanation = result["explanation"]
    final_score = round(weighted_score * 100, 1)
    label = "phishing" if final_score >= 65 else "suspicious" if final_score >= 35 else "safe"
    return {
        "score": final_score,
        "label": label,
        "confidence": round(abs(final_score-50)/50, 2),
        "votes": f"{votes_phishing}/{len(engine_results)} engines flagged",
        "indicators": list(set(all_indicators)),
        "explanation": groq_explanation,
        "engine_breakdown": {name: {"is_phishing": r["is_phishing"], "confidence": r["confidence"]} for name, r in engine_results.items()}
    }

@app.route("/health", methods=["GET"])
def health():
    return {"status": "alive"}, 200

@app.route("/", methods=["GET"])
def root():
    engines = list(ENGINE_WEIGHTS.keys()) if COHERE_AVAILABLE else [e for e in ENGINE_WEIGHTS.keys() if e != "cohere"]
    return {"status": "running", "version": "5.0", "cache_enabled": CACHE_AVAILABLE, "engines": engines}, 200

@app.route("/api/scan", methods=["POST"])
def scan_email():
    try:
        data = request.get_json(force=True)
        email_text = str(data.get("email_text","")).strip()
        if not email_text:
            return {"error": "email_text is required"}, 400
        if len(email_text) > 20000:
            return {"error": "email_text too long"}, 400
        logger.info(f"Scan request — {len(email_text)} chars")
        if CACHE_AVAILABLE:
            cached = get_cached_result(email_text)
            if cached is not None:
                cached["cache_hit"] = True
                return cached, 200
        engine_results = run_all_engines(email_text)
        final = calculate_final_score(engine_results)
        final["cache_hit"] = False
        if CACHE_AVAILABLE:
            save_to_cache(email_text, final)
        logger.info(f"Result — label: {final['label']}, score: {final['score']}")
        return final, 200
    except concurrent.futures.TimeoutError:
        return {"error": "Engines timed out"}, 503
    except Exception as e:
        logger.error(f"Error: {e}", exc_info=True)
        return {"error": "Internal server error", "detail": str(e)}, 500

@app.route("/api/cache/clear", methods=["POST"])
def clear_cache():
    if not CACHE_AVAILABLE:
        return {"error": "Cache not enabled"}, 503
    try:
        import redis
        r = redis.from_url(os.getenv("REDIS_URL","redis://localhost:6379"))
        r.flushdb()
        return {"status": "Cache cleared successfully"}, 200
    except Exception as e:
        return {"error": str(e)}, 500

@app.route("/api/cache/stats", methods=["GET"])
def cache_stats():
    if not CACHE_AVAILABLE:
        return {"error": "Cache not enabled"}, 503
    try:
        return get_cache_stats(), 200
    except Exception as e:
        return {"error": str(e)}, 500

@app.route("/api/engines/status", methods=["GET"])
def engine_status():
    return {
        "groq": True, "groq2": True, "cohere": COHERE_AVAILABLE,
        "ml": True, "rules": True, "url": True,
        "total_active": 6 if COHERE_AVAILABLE else 5,
        "cache": CACHE_AVAILABLE
    }, 200

@app.errorhandler(404)
def not_found(e):
    return {"error": "Route not found"}, 404

@app.errorhandler(405)
def method_not_allowed(e):
    return {"error": "Method not allowed"}, 405

if __name__ == "__main__":
    port = int(os.getenv("PORT", 5000))
    logger.info("Starting Phishing Detection API v5.0")
    logger.info(f"Cohere engine: {'ENABLED' if COHERE_AVAILABLE else 'DISABLED'}")
    logger.info(f"Redis cache: {'ENABLED' if CACHE_AVAILABLE else 'DISABLED'}")
    app.run(debug=True, host="0.0.0.0", port=port)