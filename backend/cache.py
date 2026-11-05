import time
from functools import wraps

_cache = {}
CACHE_TTL = 300  # 5 minutes

def cached(ttl=CACHE_TTL):
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            key = (func.__name__, args, tuple(sorted(kwargs.items())))
            now = time.time()
            if key in _cache:
                val, ts = _cache[key]
                if now - ts < ttl:
                    return val
            result = func(*args, **kwargs)
            _cache[key] = (result, now)
            return result
        return wrapper
    return decorator

def clear_cache():
    _cache.clear()