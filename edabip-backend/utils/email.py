import logging
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from config import settings

logger = logging.getLogger(__name__)


def send_email(to: str, subject: str, html_body: str, text_body: str = "") -> bool:
    """Send an HTML email via SMTP. Returns True on success."""
    if not settings.smtp_user:
        print(f"[EMAIL STUB] To: {to} | Subject: {subject}")
        return True

    try:
        msg = MIMEMultipart("alternative")
        msg["From"] = f"{settings.email_from_name} <{settings.email_from}>"
        msg["To"] = to
        msg["Subject"] = subject

        if text_body:
            msg.attach(MIMEText(text_body, "plain"))
        msg.attach(MIMEText(html_body, "html"))

        with smtplib.SMTP(settings.smtp_host, settings.smtp_port) as server:
            server.ehlo()
            server.starttls()
            server.login(settings.smtp_user, settings.smtp_password)
            server.sendmail(settings.email_from, to, msg.as_string())
        return True
    except Exception as e:
        print(f"[EMAIL ERROR] {e}")
        return False


def send_otp_email(to: str, name: str, otp: str) -> bool:
    html = f"""
    <div style="font-family:sans-serif;max-width:480px;margin:auto;padding:32px;
                background:#fff;border-radius:12px;border:1px solid #e4e4e7">
      <h2 style="color:#1c1917;margin:0 0 8px">{settings.app_name}</h2>
      <p style="color:#71717a;margin:0 0 24px">Hi {name}, your verification code:</p>
      <div style="font-size:36px;font-weight:700;letter-spacing:12px;
                  color:#1c1917;text-align:center;padding:24px;
                  background:#f4f4f5;border-radius:8px">{otp}</div>
      <p style="color:#71717a;margin:24px 0 0;font-size:14px">
        This code expires in <strong>10 minutes</strong>. Do not share it.
      </p>
    </div>
    """
    return send_email(to, f"Your {settings.app_name} Verification Code", html, f"Your OTP: {otp}")


def send_otp_email_safe(to: str, name: str, otp: str) -> None:
    """Background send. Must not raise: BaseHTTPMiddleware turns that into HTTP 500."""
    try:
        send_otp_email(to, name, otp)
    except Exception:
        logger.exception("OTP email failed")


def send_password_reset_email(
    to: str,
    name: str,
    landing_link: str,
    web_link: str | None = None,
    mobile_link: str | None = None,
) -> bool:
    # /auth/forgot-password may queue only one link; use it for both.
    web_link = web_link or landing_link
    mobile_note = ""
    if mobile_link:
        mobile_note = (
            "<p style=\"color:#71717a;font-size:13px;margin-top:16px\">"
            "On your phone, the reset page lets you open the EDABIP app or continue in the browser."
            "</p>"
        )

    html = f"""
    <div style="font-family:sans-serif;max-width:480px;margin:auto;padding:32px;
                background:#fff;border-radius:12px;border:1px solid #e4e4e7">
      <h2 style="color:#1c1917;margin:0 0 8px">Password Reset</h2>
      <p style="color:#71717a">Hi {name}, click below to reset your password:</p>
      <a href="{landing_link}" style="display:inline-block;margin:16px 0;padding:12px 24px;
         background:#134b4a;color:#fff;text-decoration:none;border-radius:8px;font-weight:600">
        Reset Password
      </a>
      {mobile_note}
      <p style="color:#71717a;font-size:14px">Link expires in 1 hour.</p>
    </div>
    """
    text_body = f"Reset your password: {landing_link}\nBrowser: {web_link}"
    if mobile_link:
        text_body += f"\nMobile app: {mobile_link}"
    return send_email(to, f"Reset Your {settings.app_name} Password", html, text_body)
