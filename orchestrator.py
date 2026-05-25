import concurrent.futures
from groq_service import analyze_with_groq
from ml_service import analyze_with_ml
from rule_engine import analyze_with_rules
from url_scanner import analyze_urls
from bert_service import analyze_with_bert
from gemini_service import analyze_with_gemini

# Weights for each engine (must sum to 1.0)
WEIGHTS = {
    "groq":   0.30,
    "gemini": 0.25,
    "bert":   0.15,
    "ml":     0.15,
    "rules":  0.10,
    "url":    0.05,
}

def run_all_engines(email_text, urls=[]):
    """Run all engines in parallel for speed"""
    results = {}

    with concurrent.futures.ThreadPoolExecutor(max_workers=6) as executor:
        futures = {
            executor.submit(analyze_with_groq,   email_text): "groq",
            executor.submit(analyze_with_gemini, email_text): "gemini",
            executor.submit(analyze_with_bert,   email_text): "bert",
            executor.submit(analyze_with_ml,     email_text): "ml",
            executor.submit(analyze_with_rules,  email_text): "rules",
            executor.submit(analyze_urls,        urls):       "url",
        }
        for future in concurrent.futures.as_completed(futures):
            name = futures[future]
            try:
                results[name] = future.result()
            except Exception as e:
                results[name] = {"is_phishing": False, "confidence": 0.5, "error": str(e)}

    return results