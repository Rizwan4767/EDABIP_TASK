"""Password-reset email must match how /auth/forgot-password queues it.

The RBAC rewrite started calling send_password_reset_email with three
arguments (to, name, link). The helper still required a fourth web_link,
which TypeError'd when SMTP was configured and showed up as HTTP 500.
"""
from __future__ import annotations

import importlib.util
import os
import unittest
from pathlib import Path
from unittest.mock import patch

# Settings requires DATABASE_URL; this test never opens a connection.
os.environ.setdefault("DATABASE_URL", "mysql+pymysql://user:pass@localhost:3306/edabip")

_EMAIL_PATH = Path(__file__).resolve().parents[1] / "utils" / "email.py"


def _load_email_module():
    spec = importlib.util.spec_from_file_location("edabip_email", _EMAIL_PATH)
    module = importlib.util.module_from_spec(spec)
    assert spec.loader is not None
    spec.loader.exec_module(module)
    return module


class SendPasswordResetEmailTests(unittest.TestCase):
    def test_three_argument_call_used_by_forgot_password_does_not_typeerror(self):
        email_mod = _load_email_module()
        send_password_reset_email = email_mod.send_password_reset_email

        link = "http://localhost:5173/reset-password?token=abc"

        with patch.object(email_mod, "send_email", return_value=True) as mocked:
            result = send_password_reset_email(
                "user@edabip.com",
                "Ada Lovelace",
                link,
            )

        self.assertTrue(result)
        mocked.assert_called_once()
        _to, _subject, html, text = mocked.call_args.args
        self.assertIn(link, html)
        self.assertIn(link, text)


if __name__ == "__main__":
    unittest.main()
