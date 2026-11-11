"""
Request throttling.

Mirrors `edabip-backend/utils/security.py` — the same sliding-window counter,
the same `x-forwarded-for`-aware client key, the same 429 — so a limit hit
here looks to the frontend exactly like a limit hit on /auth/login. That
module cannot be imported (`edabip-backend` is not a valid Python package
name, and it is a separate process with its own config), so the small amount
of logic below is kept behaviour-compatible on purpose rather than shared. If
the two backends are ever merged, delete this file and use that one.

Why the Settings module needs this at all: `POST /settings/security/me/
change-password` verifies the caller's CURRENT password (app/routers/
security.py). Without a limit that endpoint is an unthrottled oracle against
the live login credential — unlimited guesses, and because the check happens
here rather than at /auth/login it never increments the auth backend's
`failed_login_attempts` or trips `locked_until`. The limiter below is what
stops a stolen session token from being walked into a known password.

In-process and per-worker, exactly like the auth backend's: good enough for a
single uvicorn process, not a substitute for a shared store behind several.
"""
from __future__ import annotations

import time
from collections import defaultdict, deque
from threading import Lock
from typing import Dict

from fastapi import HTTPException, Request, status


class RateLimiter:
    def __init__(self, max_requests: int, window_seconds: int):
        self.max_requests = max_requests
        self.window_seconds = window_seconds
        self._hits: Dict[str, deque] = defaultdict(deque)
        self._lock = Lock()

    def check(self, key: str) -> bool:
        """Record a hit for `key`. False once the window is full."""
        now = time.time()
        with self._lock:
            hits = self._hits[key]
            while hits and hits[0] <= now - self.window_seconds:
                hits.popleft()
            if len(hits) >= self.max_requests:
                return False
            hits.append(now)
            return True

    def reset(self) -> None:
        """Drop all recorded hits. For tests, which must not inherit counts
        from whichever test ran before them."""
        with self._lock:
            self._hits.clear()


# Same budget the auth backend gives its own password-reset endpoint
# (password_reset_limiter: 5 per 15 minutes). Every attempt counts, successful
# or not, matching how that module's login_limiter behaves — a legitimate user
# has no reason to change their password five times in a quarter of an hour.
change_password_limiter = RateLimiter(max_requests=5, window_seconds=900)


def _client_ip(request: Request) -> str:
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else "unknown"


def enforce_rate_limit(request: Request, limiter: RateLimiter, extra_key: str = "") -> None:
    """Raise 429 once this caller has spent its budget.

    `extra_key` identifies the account being acted on, and when present it is
    the WHOLE key — the client IP is deliberately left out. The auth backend
    combines the two, which is right for /auth/login, where an unauthenticated
    stranger names any account they like. It is wrong here: reaching this
    endpoint already requires a token for the account being changed, so the
    account is the thing to count. Mixing the IP in would let an attacker with
    one stolen token rotate addresses to buy fresh budget against that single
    account, and would let one user behind a shared NAT eat everyone else's.

    Falls back to the client IP when no account is supplied, so the function
    is still safe for an unauthenticated caller.
    """
    if not limiter.check(extra_key or _client_ip(request)):
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Too many password change attempts. Please wait a few minutes and try again.",
        )
