import logging

from celery import shared_task

from apps.common.utils import sms

logger = logging.getLogger(__name__)


@shared_task(
    bind=True,
    max_retries=3,
    autoretry_for=(),
    retry_backoff=True,
    retry_backoff_max=20,
    retry_jitter=True,
)
def send_otp_sms_task(self, phone, otp, purpose="verification"):
    try:
        sms.send_otp_sms(phone, otp, purpose=purpose)
    except sms.SMSPohError as exc:
        logger.warning(
            "SMS send attempt failed for %s (purpose=%s): %s", phone, purpose, exc
        )
        raise self.retry(exc=exc, countdown=min(2 ** self.request.retries, 20))
