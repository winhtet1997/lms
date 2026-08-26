from datetime import timedelta
from uuid import uuid4

from django.conf import settings
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework.exceptions import ValidationError

from . import gateways
from .models import Enrollment, PaymentTransaction, SubscriptionPlan


def initialize_payment(payer, plan_id, target_user=None):
    target_user = target_user or payer

    if target_user != payer and target_user.parent_id != payer.id:
        raise ValidationError("You can only buy a subscription for your own children.")

    plan = get_object_or_404(SubscriptionPlan, pk=plan_id, is_active=True)

    pending_transaction = (
        PaymentTransaction.objects.filter(
            user=target_user, plan__course=plan.course, status="pending"
        )
        .order_by("-created_at")
        .first()
    )

    if pending_transaction:
        if pending_transaction.created_at >= timezone.now() - timedelta(minutes=1):
            raise ValidationError("A payment is already in progress.")

        pending_transaction.status = "failed"
        pending_transaction.failure_reason = "Payment session expired"
        pending_transaction.processed_at = timezone.now()
        pending_transaction.save(
            update_fields=["status", "failure_reason", "processed_at"]
        )

    transaction = PaymentTransaction.objects.create(
        payer=payer,
        user=target_user,
        plan=plan,
        amount=plan.price,
        currency=plan.currency,
        order_number=f"MM-{uuid4().hex[:12].upper()}",
        transaction_id=str(uuid4()),
    )

    try:
        checkout_url = gateways.build_checkout_url(transaction)
    except Exception as e:
        transaction.status = "failed"
        transaction.failure_reason = str(e)
        transaction.processed_at = timezone.now()
        transaction.save(update_fields=["status", "failure_reason", "processed_at"])
        raise

    return {"transaction": transaction, "checkout_url": checkout_url}


def complete_payment(order_number):
    transaction = PaymentTransaction.objects.select_related("plan__course").get(
        order_number=order_number
    )

    if transaction.status == "success" and Enrollment.objects.filter(
        user=transaction.user, course=transaction.plan.course
    ).exists():
        return transaction

    transaction.status = "success"
    transaction.processed_at = timezone.now()
    transaction.save(update_fields=["status", "processed_at"])

    plan = transaction.plan
    enrollment, created = Enrollment.objects.get_or_create(
        user=transaction.user,
        course=plan.course,
        defaults={
            "plan": plan,
            "is_active": True,
            "started_at": timezone.now(),
            "expires_at": timezone.now() + timedelta(days=plan.days),
        },
    )

    if not created:
        is_renewal = enrollment.sync_active_status()
        enrollment.plan = plan
        enrollment.is_active = True
        if not is_renewal:
            enrollment.started_at = timezone.now()
        enrollment.expires_at = enrollment.compute_expiry(
            start=enrollment.expires_at if is_renewal else enrollment.started_at
        )
        enrollment.save(
            update_fields=["plan", "is_active", "started_at", "expires_at"]
        )

    return transaction


def process_callback(payment_result, checksum):
    if settings.DINGER_DEV_CALLBACK:
        from . import dinger_dev_fixture

        payment_result, checksum = (
            dinger_dev_fixture.PAYMENT_RESULT,
            dinger_dev_fixture.CHECKSUM,
        )

    payload = gateways.decrypt_callback(payment_result, checksum)

    if settings.DINGER_DEV_CALLBACK:
        latest_transaction = (
            PaymentTransaction.objects.order_by("-created_at").first()
        )
        if latest_transaction:
            payload["merchantOrderId"] = latest_transaction.order_number

    order_number = payload.get("merchantOrderId")

    transaction = PaymentTransaction.objects.filter(
        order_number=order_number
    ).first()

    if not transaction:
        raise ValueError(f"Transaction not found: {order_number}")

    if transaction.status == "success":
        return payload

    transaction.callback_payload = payload
    transaction.callback_received_at = timezone.now()
    transaction.provider_transaction_id = payload.get("transactionId")
    transaction.save(
        update_fields=[
            "callback_payload",
            "callback_received_at",
            "provider_transaction_id",
        ]
    )

    dinger_status = payload.get("transactionStatus", "").upper().strip()
    status_info = gateways.PAYMENT_STATUS.get(
        dinger_status, {"status": "failed", "reason": dinger_status}
    )
    mapped_status = status_info["status"]
    failure_reason = status_info["reason"]

    callback_amount = payload.get("totalAmount")
    if callback_amount is not None and float(callback_amount) != float(transaction.amount):
        transaction.status = "failed"
        transaction.failure_reason = "AMOUNT_MISMATCH"
        transaction.processed_at = timezone.now()
        transaction.save(update_fields=["status", "failure_reason", "processed_at"])
        raise ValueError("Amount mismatch")

    if mapped_status == "success":
        try:
            complete_payment(order_number)
        except Exception:
            transaction.status = "failed"
            transaction.failure_reason = "ENROLLMENT_ACTIVATION_FAILED"
            transaction.processed_at = timezone.now()
            transaction.save(
                update_fields=["status", "failure_reason", "processed_at"]
            )
            raise
    else:
        transaction.status = mapped_status
        transaction.failure_reason = failure_reason
        transaction.processed_at = timezone.now()
        transaction.save(update_fields=["status", "failure_reason", "processed_at"])

    return payload
