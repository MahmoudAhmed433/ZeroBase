import hashlib
import json
import re
import time
from base64 import urlsafe_b64decode, urlsafe_b64encode
from datetime import timedelta
from functools import wraps
from hmac import compare_digest, new
from uuid import uuid4

from django.conf import settings
from django.core.cache import cache
from django.core.exceptions import ValidationError
from django.core.validators import validate_email
from django.utils import timezone


class SecurityError(Exception):
    pass


def now_ts() -> int:
    return int(time.time())


def _b64e(data: bytes) -> str:
    return urlsafe_b64encode(data).rstrip(b"=").decode()


def _b64d(data: str) -> bytes:
    padding = "=" * ((4 - len(data) % 4) % 4)
    return urlsafe_b64decode((data + padding).encode())


def make_jwt(payload: dict) -> str:
    secret = settings.SECRET_KEY.encode()
    header = {"alg": "HS256", "typ": "JWT"}
    h = _b64e(json.dumps(header, separators=(",", ":"), sort_keys=True).encode())
    p = _b64e(json.dumps(payload, separators=(",", ":"), sort_keys=True).encode())
    sig = _b64e(new(secret, f"{h}.{p}".encode(), hashlib.sha256).digest())
    return f"{h}.{p}.{sig}"


def parse_jwt(token: str) -> dict:
    try:
        header, payload, signature = token.split(".")
    except ValueError as exc:
        raise SecurityError("Malformed token") from exc
    secret = settings.SECRET_KEY.encode()
    expected = _b64e(new(secret, f"{header}.{payload}".encode(), hashlib.sha256).digest())
    if not compare_digest(signature, expected):
        raise SecurityError("Invalid token signature")
    decoded = json.loads(_b64d(payload))
    if int(decoded.get("exp", 0)) < now_ts():
        raise SecurityError("Token expired")
    return decoded


def token_hash(raw_token: str) -> str:
    return hashlib.sha256(raw_token.encode()).hexdigest()


def build_access_token(user_id: int, role: str, ttl_minutes: int = 15) -> str:
    ts = now_ts()
    return make_jwt(
        {
            "sub": str(user_id),
            "role": role,
            "typ": "access",
            "iat": ts,
            "exp": ts + ttl_minutes * 60,
            "jti": str(uuid4()),
        }
    )


def build_refresh_token(user_id: int, ttl_days: int = 7) -> tuple[str, str, timezone.datetime]:
    ts = now_ts()
    jti = str(uuid4())
    expires = timezone.now() + timedelta(days=ttl_days)
    token = make_jwt(
        {
            "sub": str(user_id),
            "typ": "refresh",
            "iat": ts,
            "exp": int(expires.timestamp()),
            "jti": jti,
        }
    )
    return token, jti, expires


def validate_email_or_raise(email: str) -> str:
    try:
        validate_email(email)
    except ValidationError as exc:
        raise SecurityError("Invalid email format") from exc
    return email.lower().strip()


STRONG_PASSWORD_RE = re.compile(r"^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$")
TAG_RE = re.compile(r"<[^>]+>")


def validate_password_strength(password: str) -> None:
    if not STRONG_PASSWORD_RE.match(password):
        raise SecurityError(
            "Weak password. Must be 8+ chars and include upper/lowercase, number and symbol."
        )


def ensure_safe_text(value: str, field_name: str) -> str:
    if TAG_RE.search(value or ""):
        raise SecurityError(f"{field_name} contains disallowed HTML")
    return value.strip()


def rate_limit(key_prefix: str, limit: int = 10, window_seconds: int = 60):
    def decorator(func):
        @wraps(func)
        def wrapped(request, *args, **kwargs):
            ident = request.META.get("REMOTE_ADDR", "unknown")
            key = f"rate:{key_prefix}:{ident}"
            current = cache.get(key, 0)
            if current >= limit:
                from django.http import JsonResponse

                return JsonResponse(
                    {"ok": False, "error": "Too many requests. Please retry later."},
                    status=429,
                )
            cache.set(key, current + 1, timeout=window_seconds)
            return func(request, *args, **kwargs)

        return wrapped

    return decorator
