from celery import shared_task
from django.utils import timezone
from .models import Enrollment


@shared_task
def sweep_expired_enrollments():
    """Daily safety-net sweep: bulk-flip enrollments whose expiry has
    passed. `Enrollment.sync_active_status()` remains the source of truth
    for access control on every gated read; this just keeps `is_active`
    accurate for admin/reporting views without waiting for a user to visit."""
    return Enrollment.objects.filter(
        is_active=True, expires_at__lt=timezone.now()
    ).update(is_active=False)
