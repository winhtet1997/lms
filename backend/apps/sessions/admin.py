from django.contrib import admin
from . import models


@admin.register(models.TutorAvailability)
class TutorAvailabilityAdmin(admin.ModelAdmin):
    list_display = ["tutor", "day_of_week", "start_time", "end_time", "is_active"]
    list_filter = ["day_of_week", "is_active"]


@admin.register(models.Session)
class SessionAdmin(admin.ModelAdmin):
    list_display = ["id", "session_type", "status", "tutor", "host_student", "scheduled_at", "daily_room_name"]
    list_filter = ["session_type", "status"]
    search_fields = ["topic", "tutor__full_name", "host_student__full_name"]
    readonly_fields = ["daily_room_name", "daily_room_url", "recording_id", "recording_url"]


@admin.register(models.SessionParticipant)
class SessionParticipantAdmin(admin.ModelAdmin):
    list_display = ["session", "student", "joined_at", "left_at"]


@admin.register(models.SessionRating)
class SessionRatingAdmin(admin.ModelAdmin):
    list_display = ["session", "student", "rating", "created_at"]
