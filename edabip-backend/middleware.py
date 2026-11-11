
import time
import uuid
import json
from typing import Callable
from fastapi import Request, Response
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
from sqlalchemy.orm import Session
from database import SessionLocal
from config import settings


class TimingMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        start = time.perf_counter()
        response = await call_next(request)
        elapsed = time.perf_counter() - start
        response.headers["X-Process-Time"] = f"{elapsed:.4f}s"
        response.headers["X-Request-ID"] = str(uuid.uuid4())
        return response


class RateLimitMiddleware(BaseHTTPMiddleware):
 
    SKIP_PREFIXES = ("/uploads/", "/docs", "/redoc", "/openapi", "/health")

    def __init__(self, app):
        super().__init__(app)
        from utils.security import global_limiter, _client_ip
        self._limiter = global_limiter
        self._client_ip = _client_ip

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        if any(request.url.path.startswith(p) for p in self.SKIP_PREFIXES):
            return await call_next(request)
        key = self._client_ip(request)
        if not self._limiter.check(key):
            return JSONResponse(status_code=429, content={"detail": "Too many requests. Please slow down."})
        return await call_next(request)


class AuditMiddleware(BaseHTTPMiddleware):
    SKIP_PREFIXES = ("/auth/", "/uploads/", "/docs", "/redoc", "/openapi")
    SKIP_METHODS  = ("GET", "OPTIONS", "HEAD")

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        path = request.url.path
        if request.method in self.SKIP_METHODS:
            return await call_next(request)
        if any(path.startswith(p) for p in self.SKIP_PREFIXES):
            return await call_next(request)

        response = await call_next(request)

        if 200 <= response.status_code < 300:
            try:
                user_id = None
                auth_header = request.headers.get("Authorization", "")
                if auth_header.startswith("Bearer "):
                    from utils.auth import decode_token
                    try:
                        payload = decode_token(auth_header.split(" ")[1])
                        user_id = int(payload.get("sub", 0)) or None
                    except Exception:
                        pass

                db: Session = SessionLocal()
                try:
                    from models.user import AuditLog
                    log = AuditLog(
                        user_id=user_id,
                        action=f"{request.method} {path}",
                        entity=path.split("/")[1] if "/" in path else path,
                        details=json.dumps({
                            "method": request.method, "path": path,
                            "status": response.status_code, "query": str(request.query_params),
                        }),
                        ip_address=request.client.host if request.client else None,
                    )
                    db.add(log)
                    db.commit()
                finally:
                    db.close()
            except Exception as e:
                print(f"[AUDIT LOG ERROR] {e}")

        return response


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        response = await call_next(request)
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Permissions-Policy"] = "geolocation=(), microphone=(), camera=()"
        if not settings.debug:
            response.headers["Strict-Transport-Security"] = "max-age=63072000; includeSubDomains"
        return response
