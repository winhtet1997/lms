import uuid
import requests
from django.conf import settings


DAILY_API_BASE = settings.DAILY_API_BASE_URL
HEADERS = {
    "Authorization": f"Bearer {settings.DAILY_API_KEY}",
    "Content-Type": "application/json",
}


def create_room(session):
    room_name = f"mm-{session.id}-{uuid.uuid4().hex[:8]}"
    exp = int(session.scheduled_at.timestamp()) + session.duration_minutes * 60 + 1800
    payload = {
        "name": room_name,
        "privacy": "private",
        "properties": {
            "exp": exp,
            "max_participants": session.max_participants + 2,
            # "enable_recording": "cloud",
            "start_audio_off": False,
            "start_video_off": False,
            "enable_chat": True,
        },
    }
    response = requests.post(f"{DAILY_API_BASE}/rooms", json=payload, headers=HEADERS)
    response.raise_for_status()
    data = response.json()
    return data["name"], data["url"]


def create_meeting_token(room_name, user, is_owner=False, exp=None):
    payload = {
        "properties": {
            "room_name": room_name,
            "user_name": user.full_name or user.username,
            "user_id": str(user.id),
            "is_owner": is_owner,
        }
    }
    if exp:
        payload["properties"]["exp"] = exp
    response = requests.post(f"{DAILY_API_BASE}/meeting-tokens", json=payload, headers=HEADERS)
    response.raise_for_status()
    return response.json()["token"]


def delete_room(room_name):
    requests.delete(f"{DAILY_API_BASE}/rooms/{room_name}", headers=HEADERS)
