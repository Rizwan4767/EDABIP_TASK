
import re
import time
from collections import defaultdict, deque
from threading import Lock
from datetime import datetime, timedelta
from typing import Tuple, Dict

from fastapi import HTTPException, Request

from config import settings


# ── Password Policy ──────────────────────────────────────

def validate_password_strength(password: str) -> Tuple[bool, str]:
    # Mirrors the frontend's own client-side rule (getPasswordRules in
    # SignupForm.jsx) so the backend never rejects anything the UI already
    # allowed through, while still enforcing the same policy for direct API use.
    if not password or len(password) < 8:
        return False, "Password must be at least 8 characters long"
    if len(password) > settings.max_password_length:
        return False, f"Password must not exceed {settings.max_password_length} characters"
    if not re.search(r"[a-z]", password):
        return False, "Password must contain at least one lowercase letter"
    if not re.search(r"[A-Z]", password):
        return False, "Password must contain at least one uppercase letter"
    if not re.search(r"[0-9]", password):
        return False, "Password must contain at least one number"
    if not re.search(r"[^A-Za-z0-9]", password):
        return False, "Password must contain at least one special character"
    return True, ""

class RateLimiter:
    def __init__(self, max_requests: int, window_seconds: int):
        self.max_requests = max_requests
        self.window_seconds = window_seconds
        self._hits: Dict[str, deque] = defaultdict(deque)
        self._lock = Lock()

    def check(self, key: str) -> bool:
        now = time.time()
        with self._lock:
            dq = self._hits[key]
            while dq and dq[0] <= now - self.window_seconds:
                dq.popleft()
            if len(dq) >= self.max_requests:
                return False
            dq.append(now)
            return True


global_limiter          = RateLimiter(max_requests=settings.rate_limit_per_minute, window_seconds=60)
login_limiter            = RateLimiter(max_requests=10, window_seconds=300)
register_limiter         = RateLimiter(max_requests=8,  window_seconds=3600)
otp_verify_limiter        = RateLimiter(max_requests=10, window_seconds=600)
otp_resend_limiter        = RateLimiter(max_requests=5,  window_seconds=900)
password_reset_limiter    = RateLimiter(max_requests=5,  window_seconds=900)


def _client_ip(request: Request) -> str:
    fwd = request.headers.get("x-forwarded-for")
    if fwd:
        return fwd.split(",")[0].strip()
    return request.client.host if request.client else "unknown"


def enforce_rate_limit(request: Request, limiter: RateLimiter, extra_key: str = "") -> None:
    key = f"{_client_ip(request)}:{extra_key}"
    if not limiter.check(key):
        raise HTTPException(status_code=429, detail="Too many requests. Please slow down and try again shortly.")


# ── Account Lockout ───────────────────────────────────────

def is_account_locked(user) -> bool:
    return bool(user.locked_until and user.locked_until > datetime.utcnow())


def register_failed_login(db, user) -> None:
    user.failed_login_attempts = (user.failed_login_attempts or 0) + 1
    if user.failed_login_attempts >= settings.max_login_attempts:
        user.locked_until = datetime.utcnow() + timedelta(minutes=settings.login_lockout_minutes)
        user.failed_login_attempts = 0
    db.commit()


def register_successful_login(db, user) -> None:
    user.failed_login_attempts = 0
    user.locked_until = None
    db.commit()


# ── OTP Attempt Tracking ─────────────────────────────────

MAX_OTP_ATTEMPTS = 5

def register_failed_otp(db, user) -> bool:
    """Increments the attempt counter. Returns True if the OTP was invalidated."""
    user.otp_attempts = (user.otp_attempts or 0) + 1
    invalidate = user.otp_attempts >= MAX_OTP_ATTEMPTS
    if invalidate:
        user.otp_code = None
        user.otp_expires_at = None
        user.otp_attempts = 0
    db.commit()
    return invalidate


def reset_otp_attempts(db, user) -> None:
    user.otp_attempts = 0
    db.commit()
