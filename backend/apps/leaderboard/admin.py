from django.contrib import admin

from . import models


@admin.register(models.PointTransaction)
class PointTransactionAdmin(admin.ModelAdmin):
    list_display = ("user", "event_type", "points", "created_at")
    list_filter = ("event_type",)
    search_fields = ("user__username", "user__email")
    ordering = ("-created_at",)

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False


@admin.register(models.UserPoints)
class UserPointsAdmin(admin.ModelAdmin):
    list_display = ("user", "total_points", "grade_points", "updated_at")
    search_fields = ("user__username", "user__email")
    ordering = ("-total_points",)

    def has_add_permission(self, request):
        return False
