"""Thin client for the SMSPoh RESTful API v3.0 (Send Message endpoint).

Docs: SMSPoh RESTful API Specification v3.0. Auth uses a Bearer token that is
base64(APIKey:APISecret) — this mirrors the mail helper in
apps/common/utils/message.py, including the SMS_DISABLE dev/test switch.
"""

import base64
import logging

import requests
from django.conf import settings

logger = logging.getLogger(__name__)

TIMEOUT = (5, 10)


class SMSPohError(Exception):
    """Raised for any non-2xx, failed, or malformed response from SMSPoh."""

    def __init__(self, message, status_code=None, payload=None):
        super().__init__(message)
        self.status_code = status_code
        self.payload = payload


def _auth_header():
    raw = f"{settings.SMSPOH_API_KEY}:{settings.SMSPOH_API_SECRET}".encode()
    token = base64.b64encode(raw).decode()
    return {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json",
    }


def _safe_json(response):
    try:
        return response.json()
    except ValueError:
        return None


_session = requests.Session()

def send_sms(to, message, client_reference=None):
    """Send a single SMS via SMSPoh.

    `to` should be a mobile number in one of SMSPoh's accepted formats
    (09xxxxxxxx, 959xxxxxxx, or +959xxxxxxx).

    No-ops (and returns None) when settings.SMS_DISABLE is True, so local/dev
    environments don't need live SMSPoh credentials — same convention as
    MAIL_DISABLE for email.
    """
    if getattr(settings, "SMS_DISABLE", False) is True:
        logger.info("SMS_DISABLE is set — skipping SMS to %s: %s", to, message)
        return None

    payload = {
        "to": to,
        "message": message,
        "from": settings.SMSPOH_SENDER_ID,
    }
    if client_reference:
        payload["clientReference"] = client_reference

    url = f"{settings.SMSPOH_BASE_URL.rstrip('/')}/send"

    try:
        response = _session.post(
            url, json=payload, headers=_auth_header(), timeout=TIMEOUT
        )
    except requests.RequestException as exc:
        raise SMSPohError(f"SMSPoh request failed: {exc}") from exc

    data = _safe_json(response)

    if not response.ok:
        raise SMSPohError(
            (data or {}).get("message", f"SMSPoh returned {response.status_code}"),
            status_code=response.status_code,
            payload=data,
        )
    return data


def send_otp_sms(to, otp, purpose="verification", brand="MathMentor"):
    """Convenience wrapper that formats and sends an OTP message."""
    message = (
        f"[{brand}] Your {purpose} OTP code is {otp}. "
        f"Do not share this code with anyone."
    )
    return send_sms(to, message)
