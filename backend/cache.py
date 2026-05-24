# ============================================================
#  cache.py  —  Redis Cache Layer for Phishing Detection API
#  Uses Upstash Redis (TLS) via REDIS_URL environment variable
# ============================================================

import os
import json
import hashlib
import logging

logger = logging.getLogger(__name__)

# ── Try to connect to Redis ──────────────────────────────────
redis_client = None
_hits   = 0   # in-process counter (resets on restart)
_misses = 0   # in-process counter (resets on restart)

try:
    import redis                                    # pip install redis==5.0.4

    REDIS_URL = os.environ.get("REDIS_URL", "").strip()

    if not REDIS_URL:
        logger.warning("⚠️  REDIS_URL not set — cache disabled")
    else:
        redis_client = redis.from_url(
            REDIS_URL,
            decode_responses=True,          # keys/values come back as str, not bytes
            socket_connect_timeout=3,       # fail fast so app never hangs
            socket_timeout=3,
        )
        redis_client.ping()                 # verify the connection is real
        logger.info("✅ Redis cache connected successfully")

except ImportError:
    logger.warning("⚠️  redis package not installed — cache disabled")
except Exception as e:
    logger.warning(f"⚠️  Redis connection failed: {e} — cache disabled")
    redis_client = None


# ============================================================
#  HELPERS
# ============================================================

def _is_available() -> bool:
    """Return True only when redis_client is live."""
    return redis_client is not None


def make_cache_key(email_text: str) -> str:
    """
    Create a stable, short cache key from email content.
    - Strips leading/trailing whitespace
    - Collapses internal whitespace runs to a single space
    - Case-insensitive (lowercased before hashing)
    This means 'Hello   World' and 'hello world' share the same key.
    """
    normalised = " ".join(email_text.lower().split())
    digest = hashlib.md5(normalised.encode("utf-8")).hexdigest()
    return f"phishing:v1:{digest}"


# ============================================================
#  PUBLIC API
# ============================================================

def get_cached_result(email_text: str):
    """
    Look up a previously saved scan result.

    Returns:
        dict  — the cached result  (cache HIT)
        None  — not in cache       (cache MISS)
    """
    global _misses, _hits

    if not _is_available():
        return None

    try:
        key  = make_cache_key(email_text)
        raw  = redis_client.get(key)

        if raw is None:
            _misses += 1
            logger.debug(f"Cache MISS  key={key[:30]}…")
            return None

        _hits += 1
        logger.debug(f"Cache HIT   key={key[:30]}…")
        return json.loads(raw)

    except Exception as e:
        # Never crash the main request because of a cache error
        logger.error(f"Cache GET error: {e}")
        return None


def save_to_cache(email_text: str, result: dict, ttl_seconds: int = 86_400) -> bool:
    """
    Persist a scan result in Redis.

    Args:
        email_text   : original email body (used to derive the key)
        result       : the dict returned by calculate_final_score()
        ttl_seconds  : how long to keep it (default = 24 hours)

    Returns:
        True on success, False on failure.
    """
    if not _is_available():
        return False

    try:
        key = make_cache_key(email_text)

        # Don't cache the cache_hit flag itself — it's metadata, not result data
        payload = {k: v for k, v in result.items() if k != "cache_hit"}

        redis_client.setex(key, ttl_seconds, json.dumps(payload))
        logger.debug(f"Cache SAVE  key={key[:30]}…  TTL={ttl_seconds}s")
        return True

    except Exception as e:
        logger.error(f"Cache SET error: {e}")
        return False


def clear_cache_for_email(email_text: str) -> bool:
    """
    Delete one cached entry (useful for testing or force-refresh).

    Returns True if the key was deleted, False otherwise.
    """
    if not _is_available():
        return False

    try:
        key     = make_cache_key(email_text)
        deleted = redis_client.delete(key)        # returns number of keys deleted
        logger.info(f"Cache DELETE key={key[:30]}…  deleted={bool(deleted)}")
        return bool(deleted)

    except Exception as e:
        logger.error(f"Cache DELETE error: {e}")
        return False


def get_cache_stats() -> dict:
    """
    Return hit/miss stats and total number of cached keys.

    The hits/misses counters are in-process only (reset on server restart).
    total_keys is the real count from Redis.
    """
    stats = {
        "cache_enabled": _is_available(),
        "hits":          _hits,
        "misses":        _misses,
        "total_requests": _hits + _misses,
        "hit_rate_pct":  round(_hits / (_hits + _misses) * 100, 1) if (_hits + _misses) > 0 else 0,
        "total_keys":    0,
    }

    if _is_available():
        try:
            # Count only OUR keys (prefixed with "phishing:v1:")
            cursor, keys = redis_client.scan(cursor=0, match="phishing:v1:*", count=1000)
            stats["total_keys"] = len(keys)
        except Exception as e:
            logger.error(f"Cache STATS error: {e}")
            stats["total_keys"] = -1   # -1 signals "couldn't retrieve"

    return stats