from datetime import timedelta
from django.conf import settings
from django.db import models
from django.utils import timezone
from django.utils.translation import gettext_lazy as _
from parler.models import TranslatableModel, TranslatedFields
from apps.course.models import Course



class BillingDashboard(models.Model):
    """Proxy model used as a ContentType anchor for billing permissions.
    Permissions are created via the assign_permissions management command."""
    class Meta:
        managed = False
        default_permissions = ()
        verbose_name = _("billing_dashboard")
        verbose_name_plural = _("billing_dashboards")


class SubscriptionPlan(TranslatableModel):
    translations = TranslatedFields(
        name=models.CharField(max_length=100, blank=True, default=""),
        description=models.TextField(blank=True, default=""),
    )
    course = models.ForeignKey(
        Course, on_delete=models.CASCADE, related_name="subscription_plans"
    )
    days = models.IntegerField(default=30, null=False, blank=False)
    price = models.DecimalField(max_digits=8, decimal_places=2)
    currency = models.CharField(max_length=5, default="USD")
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    is_recommended = models.BooleanField(default=False)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["course"],
                condition=models.Q(is_recommended=True),
                name="unique_recommended_plan_per_course",
            ),
        ]

    def __str__(self):
        name = self.safe_translation_getter("name", any_language=True)
        return name or f"{self.course} - {self.days} days ({self.price} {self.currency})"

    def save(self, *args, **kwargs):
        if self.is_recommended:
            # Recommending this plan automatically un-recommends whichever
            # other plan held that spot for the course, instead of erroring
            # against unique_recommended_plan_per_course.
            SubscriptionPlan.objects.filter(
                course=self.course, is_recommended=True
            ).exclude(pk=self.pk).update(is_recommended=False)
        super().save(*args, **kwargs)


class Enrollment(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="enrollments"
    )
    course = models.ForeignKey(
        Course, on_delete=models.CASCADE, related_name="enrollments"
    )
    plan = models.ForeignKey(
        SubscriptionPlan, on_delete=models.SET_NULL, null=True, blank=True,
        related_name="enrollments"
    )
    is_active = models.BooleanField(default=False)
    started_at = models.DateTimeField(null=True, blank=True)
    expires_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ("user", "course")

    def __str__(self):
        return f"{self.user} - {self.course} ({'active' if self.is_active else 'inactive'})"

    def save(self, *args, **kwargs):
        if self.is_active and self.plan and not self.started_at:
            self.started_at = timezone.now()
            self.expires_at = self.compute_expiry(self.started_at)

        if self.expires_at:
            local_expiry = timezone.localtime(self.expires_at)
            self.expires_at = local_expiry.replace(
                hour=23, minute=59, second=59, microsecond=0
            )
        super().save(*args, **kwargs)

    def compute_expiry(self, start=None):
        """Expiry counted `self.plan.days` days from `start`. Always ends up
        normalized to 23:59 on save() regardless of the exact value computed
        here."""
        if not self.plan:
            return None
        start = start or self.started_at or timezone.now()
        return start + timedelta(days=self.plan.days)

    def sync_active_status(self):
        """Call on every gated-content read. Lazily flips is_active off once
        the subscription has passed its expiry — the source of truth for
        access control, independent of the daily sweep task below."""
        if self.is_active and self.expires_at and timezone.now() > self.expires_at:
            self.is_active = False
            self.save(update_fields=["is_active"])
        return self.is_active


class PaymentTransaction(models.Model):
    STATUS_CHOICES = [
        ("pending", "Pending"),
        ("success", "Success"),
        ("failed", "Failed"),
        ("cancelled", "Cancelled"),
    ]

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="payment_transactions",
    )
    payer = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="paid_transactions",
        null=True,
        blank=True,
    )
    plan = models.ForeignKey(
        SubscriptionPlan, on_delete=models.PROTECT, related_name="payment_transactions"
    )
    amount = models.DecimalField(max_digits=8, decimal_places=2)
    currency = models.CharField(max_length=5)
    order_number = models.CharField(max_length=50, unique=True)
    transaction_id = models.CharField(max_length=255, unique=True)
    provider_transaction_id = models.CharField(max_length=255, blank=True, null=True)
    callback_payload = models.JSONField(blank=True, null=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="pending")
    failure_reason = models.TextField(blank=True, null=True)
    callback_received_at = models.DateTimeField(blank=True, null=True)
    processed_at = models.DateTimeField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        indexes = [
            models.Index(fields=["status"]),
            models.Index(fields=["order_number"]),
        ]

    def __str__(self):
        return f"{self.user} - {self.order_number} ({self.status})"
