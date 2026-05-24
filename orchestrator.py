import concurrent.futures
from groq_service import analyze_with_groq
from ml_service import analyze_with_ml
from rule_engine import analyze_with_rules
from url_scanner import analyze_urls
from bert_service import analyze_with_bert

# Weights for each engine (must sum to 1.0)
WEIGHTS = {
    "groq":  0.30,
    "bert":  0.25,
    "ml":    0.20,
    "rules": 0.15,
    "url":   0.10,
}

def run_all_engines(email_text, urls=[]):
    """Run all 5 AI engines in parallel for speed"""
    results = {}

    with concurrent.futures.ThreadPoolExecutor(max_workers=5) as executor:
        futures = {
            executor.submit(analyze_with_groq, email_text): "groq",
            executor.submit(analyze_with_bert, email_text): "bert",
            executor.submit(analyze_with_ml, email_text):   "ml",
            executor.submit(analyze_with_rules, email_text):"rules",
            executor.submit(analyze_urls, urls):            "url",
        }
        for future in concurrent.futures.as_completed(futures):
            name = futures[future]
            try:
                results[name] = future.result()
            except Exception as e:
                results[name] = {"is_phishing": False, "confidence": 0.5, "error": str(e)}

    return results

def calculate_final_score(engine_results):
    """Weighted ensemble scoring"""
    weighted_score = 0.0
    votes_phishing = 0
    total_engines = len(engine_results)

    for engine, result in engine_results.items():
        weight = WEIGHTS.get(engine, 0.1)
        # Normalize each engine result to 0.0–1.0
        if result.get("is_phishing"):
            votes_phishing += 1
            weighted_score += weight * result.get("confidence", 0.8)
        else:
            weighted_score += weight * (1 - result.get("confidence", 0.8))

    # Majority vote check (extra safety)
    majority_says_phishing = votes_phishing > (total_engines / 2)

    final_score = round(weighted_score * 100, 1)
    label = "phishing" if final_score > 50 else "legitimate"

    # Override: if majority votes phishing, never label as safe
    if majority_says_phishing and label == "legitimate":
        label = "suspicious"

    return {
        "score": final_score,
        "label": label,
        "votes_phishing": votes_phishing,
        "total_engines": total_engines,
        "engine_breakdown": engine_results
    }