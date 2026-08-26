import base64
import hashlib
import hmac
import json
from urllib.parse import quote

from django.conf import settings
from Crypto.Cipher import AES, PKCS1_v1_5
from Crypto.PublicKey import RSA

PAYMENT_STATUS = {
    "SUCCESS": {"status": "success", "reason": None},
    "DECLINED": {"status": "failed", "reason": "Insufficient balance"},
    "TIMEOUT": {"status": "failed", "reason": "Payment timed out"},
    "CANCELLED": {"status": "cancelled", "reason": "Payment cancelled"},
    "SYSTEM_ERROR": {"status": "failed", "reason": "Payment provider error"},
    "ERROR": {"status": "failed", "reason": "Payment failed"},
}


def build_checkout_url(transaction):
    payer = transaction.payer or transaction.user

    if not payer.email:
        raise ValueError("Customer email is required.")

    if transaction.amount <= 0:
        raise ValueError("Invalid payment amount.")

    item_name = (
        transaction.plan.safe_translation_getter("name", any_language=True)
        or f"{transaction.plan.course} - {transaction.plan.days} days"
    )
    if transaction.user_id != payer.id:
        item_name = f"{item_name} — {transaction.user.username}"

    payload = {
        "clientId": settings.DINGER_CLIENT_ID,
        "publicKey": settings.DINGER_PUBLIC_KEY,
        "merchantKey": settings.DINGER_API_KEY,
        "projectName": "mathmentor",
        "merchantName": "Win Win Htet",
        "customerName": payer.username,
        "merchantOrderId": transaction.order_number,
        "totalAmount": int(transaction.amount),
        "email": payer.email,
        "billCity": "Mandalay",
        "billAddress": "Mandalay",
        "state": "Mandalay",
        "country": "MM",
        "postalCode": "05011",
        "items": json.dumps(
            [
                {
                    "name": item_name,
                    "amount": int(transaction.amount),
                    "quantity": 1,
                }
            ]
        ),
    }

    json_string = json.dumps(payload)
    encoded_payload = _encrypt_payload(json_string)
    hash_value = _generate_hash(json_string)
    url_payload = quote(encoded_payload, safe="")

    return f"{settings.DINGER_BASE_URL}?payload={url_payload}&hashValue={hash_value}"


def _encrypt_payload(json_string):
    try:
        public_key = RSA.import_key(
            "-----BEGIN PUBLIC KEY-----\n"
            + settings.DINGER_ENCRYPTION_KEY
            + "\n-----END PUBLIC KEY-----"
        )
        cipher = PKCS1_v1_5.new(public_key)

        payload_bytes = json_string.encode()
        chunk_size = 64
        encrypted_bytes = b"".join(
            cipher.encrypt(payload_bytes[i : i + chunk_size])
            for i in range(0, len(payload_bytes), chunk_size)
        )
        return base64.b64encode(encrypted_bytes).decode()
    except Exception:
        raise ValueError("Unable to encrypt payment payload.")


def _generate_hash(json_string):
    try:
        return hmac.new(
            settings.DINGER_SECRET_KEY.encode("utf-8"),
            json_string.encode("utf-8"),
            hashlib.sha256,
        ).hexdigest()
    except Exception:
        raise ValueError("Unable to generate payment hash.")


def decrypt_callback(payment_result, checksum):
    encrypted = base64.b64decode(payment_result)

    cipher = AES.new(settings.DINGER_CALLBACK_KEY.encode("utf-8"), AES.MODE_ECB)
    decrypted_bytes = cipher.decrypt(encrypted)
    decrypted = decrypted_bytes.decode("utf-8")

    pad_length = ord(decrypted[-1])
    decrypted = decrypted[:-pad_length]

    generated_checksum = hashlib.sha256(decrypted.encode("utf-8")).hexdigest()
    if generated_checksum != checksum:
        raise ValueError("Invalid checksum")

    return json.loads(decrypted)
