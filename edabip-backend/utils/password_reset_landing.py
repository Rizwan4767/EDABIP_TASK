"""Build password-reset URLs that work on physical devices (not localhost)."""

import socket
from dataclasses import dataclass
from urllib.parse import quote

from config import settings


def _get_lan_ip() -> str | None:
    if settings.dev_lan_ip:
        return settings.dev_lan_ip.strip()
    try:
        probe = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        probe.connect(("8.8.8.8", 80))
        ip = probe.getsockname()[0]
        probe.close()
        return ip
    except OSError:
        return None


def _replace_local_host(url: str, host: str) -> str:
    return url.replace("localhost", host).replace("127.0.0.1", host)


def resolve_frontend_base() -> str:
    """SPA origin reachable from a phone on the same Wi‑Fi."""
    if settings.frontend_mobile_url:
        return settings.frontend_mobile_url.rstrip("/")

    base = settings.frontend_url.rstrip("/")
    if "localhost" in base or "127.0.0.1" in base:
        lan = _get_lan_ip()
        if lan:
            base = _replace_local_host(base, lan)
    return base


def resolve_api_public_base() -> str:
    """Backend origin reachable from a phone (for the reset landing page)."""
    if settings.api_public_url:
        return settings.api_public_url.rstrip("/")

    port = settings.app_port
    lan = _get_lan_ip()
    if lan:
        return f"http://{lan}:{port}"
    return f"http://localhost:{port}"


def get_resolved_frontend_origin() -> str:
    return resolve_frontend_base()


@dataclass(frozen=True)
class PasswordResetLinks:
    web: str
    mobile: str | None
    landing: str
    android_intent: str | None


def build_password_reset_links(token: str) -> PasswordResetLinks:
    web = f"{resolve_frontend_base()}/reset-password?token={token}"
    landing = f"{resolve_api_public_base()}/auth/password-reset?token={token}"

    scheme = (settings.mobile_app_scheme or "").strip().replace("://", "")
    mobile = f"{scheme}://reset-password?token={token}" if scheme else None

    android_intent = None
    if scheme and settings.mobile_app_package:
        fallback = quote(web, safe="")
        android_intent = (
            f"intent://reset-password?token={token}"
            f"#Intent;scheme={scheme};package={settings.mobile_app_package};"
            f"S.browser_fallback_url={fallback};end"
        )

    return PasswordResetLinks(
        web=web,
        mobile=mobile,
        landing=landing,
        android_intent=android_intent,
    )


def render_password_reset_landing_html(token: str) -> str:
    links = build_password_reset_links(token)
    app_href = links.android_intent or links.mobile or links.web
    app_label = "Open in EDABIP App" if links.mobile else "Reset Password"

    return f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Reset your EDABIP password</title>
  <style>
    body {{
      font-family: system-ui, -apple-system, Segoe UI, sans-serif;
      background: #0d2f2f;
      color: #151515;
      margin: 0;
      padding: 24px 16px;
    }}
    .card {{
      max-width: 420px;
      margin: 0 auto;
      background: #fff;
      border-radius: 16px;
      padding: 28px 20px;
      box-shadow: 0 8px 32px rgba(0,0,0,0.2);
    }}
    h1 {{ font-size: 22px; margin: 0 0 8px; }}
    p {{ color: #52525b; line-height: 1.5; margin: 0 0 20px; font-size: 15px; }}
    a.btn {{
      display: block;
      text-align: center;
      text-decoration: none;
      padding: 14px 18px;
      border-radius: 999px;
      font-weight: 600;
      margin-bottom: 12px;
    }}
    .primary {{ background: #134b4a; color: #fff; }}
    .secondary {{ background: #fff; color: #134b4a; border: 1.5px solid #134b4a; }}
    .hint {{ font-size: 13px; color: #71717a; margin-top: 16px; }}
  </style>
</head>
<body>
  <div class="card">
    <h1>Reset your password</h1>
    <p>Choose how you want to continue. On your phone, use the app if EDABIP is installed, or continue in the browser.</p>
    <a class="btn primary" id="open-app" href="{app_href}">{app_label}</a>
    <a class="btn secondary" href="{links.web}">Continue in browser</a>
    <p class="hint">Link expires in 1 hour. If the app does not open, install the EDABIP dev build or use the browser option.</p>
  </div>
</body>
</html>"""
