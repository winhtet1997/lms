from django.contrib import admin
from parler.admin import TranslatableAdmin
from . import models


@admin.register(models.SubscriptionPlan)
class SubscriptionPlanAdmin(TranslatableAdmin):
    list_display = ("name", "description")


@admin.register(models.Enrollment)
class EnrollmentAdmin(admin.ModelAdmin):
    list_display = (
        "user", "course", "plan", "is_active", "started_at", "expires_at",
    )
    list_filter = ("is_active", "plan__days")
    search_fields = ("user__username", "user__email", "course__translations__title")


@admin.register(models.PaymentTransaction)
class PaymentTransactionAdmin(admin.ModelAdmin):
    list_display = (
        "order_number", "user", "plan", "amount", "status", "created_at",
    )
    list_filter = ("status",)
    search_fields = ("order_number", "transaction_id", "user__username", "user__email")
