"""Thin client for the Math AI ("LuLu AI") external tutoring API.

Contract documented in docs/math-ai.md — but that doc never shows a single
response body, only request curl examples. The chat-lifecycle response
shapes below (chat_id location, the GET /chats/{id} envelope) come from a
prior integration attempt in this repo's git history that was confirmed
against the live API; everything else (subjects list/detail shape) follows
the same doc conventions but is not independently confirmed, so callers
should access response data defensively.
"""

import uuid

import requests
from django.conf import settings

TIMEOUT = 60  # AI replies are slow; the frontend already budgets 30-90s.


class MathAIError(Exception):
    """Raised for any non-2xx, failed, or malformed response from Math AI."""

    def __init__(self, message, status_code=None, payload=None):
        super().__init__(message)
        self.status_code = status_code
        self.payload = payload


def _headers(idempotent=False):
    headers = {
        "Authorization": f"Bearer {settings.MATHAI_API_KEY}",
        "Content-Type": "application/json",
    }
    if idempotent:
        headers["Idempotency-Key"] = str(uuid.uuid4())
    return headers


def _url(path):
    return f"{settings.MATHAI_API_BASE_URL.rstrip('/')}/{path.lstrip('/')}"


def _safe_json(response):
    try:
        return response.json()
    except ValueError:
        return None


def _request(method, path, *, json=None, params=None, idempotent=False):
    try:
        response = requests.request(
            method,
            _url(path),
            headers=_headers(idempotent),
            json=json,
            params=params,
            timeout=TIMEOUT,
        )
    except requests.RequestException as exc:
        raise MathAIError(f"Math AI request failed: {exc}") from exc

    data = _safe_json(response)

    if not response.ok:
        raise MathAIError(
            f"Math AI returned {response.status_code}",
            status_code=response.status_code,
            payload=data,
        )
    if isinstance(data, dict) and data.get("success") is False:
        raise MathAIError(
            data.get("message", "Math AI reported failure"),
            status_code=response.status_code,
            payload=data,
        )
    return data


def list_subjects():
    return _request("GET", "/subjects")


def get_subject(subject_id):
    return _request("GET", f"/subjects/{subject_id}")


def create_chat(message, external_user_id, language="en", subject_id=None, lesson_id=None):
    """POST /chats — creates a chat AND sends its first message in one call.

    Builds the payload per the 3 documented shapes: global (no subject_id),
    subject-scoped (+subject_id), lesson-scoped (+subject_id +lesson_id).
    """
    payload = {"external_user_id": external_user_id, "message": message, "language": language}
    if subject_id:
        payload["subject_id"] = subject_id
        if lesson_id:
            payload["lesson_id"] = lesson_id
    return _request("POST", "/chats", json=payload, idempotent=True)


def send_message(chat_id, message, language="en"):
    payload = {"message": message, "language": language}
    return _request("POST", f"/chats/{chat_id}/messages", json=payload, idempotent=True)


def get_chat_detail(chat_id):
    """GET /chats/{id} — confirmed shape:
    {"data": {"chat": {...}, "messages": [{"role", "content"}, ...]}}
    """
    return _request("GET", f"/chats/{chat_id}")


def extract_chat_id(create_chat_result):
    """Confirmed: chat_id lives at data.chat_id in create_chat's response."""
    return (create_chat_result or {}).get("data", {}).get("chat_id")


def get_last_assistant_reply(chat_detail_result):
    """Neither create_chat's nor send_message's own response includes the
    reply text — always re-fetch chat detail and take the newest assistant
    message.
    """
    messages = ((chat_detail_result or {}).get("data") or {}).get("messages") or []
    for msg in reversed(messages):
        if isinstance(msg, dict) and msg.get("role") == "assistant":
            return msg.get("content")
    return None
