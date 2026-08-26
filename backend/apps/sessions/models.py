from django.db import models
from django.conf import settings
from django.utils.translation import gettext_lazy as _

User = settings.AUTH_USER_MODEL

class SessionDashboard(models.Model):
    """Proxy model used as a ContentType anchor for dashboard permissions.
    Permissions are created via the assign_permissions management command."""
    class Meta:
        managed = False
        default_permissions = ()
        verbose_name = _("session_dashboard")
        verbose_name_plural = _("session_dashboards")



class TutorAvailability(models.Model):
    DAY_CHOICES = [
        (0, _("Monday")),
        (1, _("Tuesday")),
        (2, _("Wednesday")),
        (3, _("Thursday")),
        (4, _("Friday")),
        (5, _("Saturday")),
        (6, _("Sunday")),
    ]

    tutor = models.ForeignKey(User, on_delete=models.CASCADE, related_name="availability")
    day_of_week = models.IntegerField(choices=DAY_CHOICES)
    start_time = models.TimeField()
    end_time = models.TimeField()
    is_active = models.BooleanField(default=True)

    class Meta:
        unique_together = ["tutor", "day_of_week", "start_time"]

    def __str__(self):
        return f"{self.tutor} - {self.get_day_of_week_display()} {self.start_time}-{self.end_time}"


class Session(models.Model):
    SESSION_TYPE = [
        ("private", _("Private")),
        ("group", _("Group")),
    ]
    STATUS = [
        ("pending", _("Pending Approval")),
        ("approved", _("Approved")),
        ("rejected", _("Rejected")),
        ("live", _("Live")),
        ("completed", _("Completed")),
        ("cancelled", _("Cancelled")),
    ]

    session_type = models.CharField(max_length=10, choices=SESSION_TYPE)
    status = models.CharField(max_length=20, choices=STATUS, default="pending")
    tutor = models.ForeignKey(User, on_delete=models.CASCADE, related_name="tutor_sessions")
    host_student = models.ForeignKey(User, on_delete=models.CASCADE, related_name="hosted_sessions")
    topic = models.TextField(blank=True)
    scheduled_at = models.DateTimeField()
    duration_minutes = models.IntegerField(default=60)
    max_participants = models.IntegerField(default=2)

    daily_room_name = models.CharField(max_length=255, blank=True)
    daily_room_url = models.URLField(blank=True)

    recording_id = models.CharField(max_length=255, blank=True)
    recording_url = models.URLField(blank=True)
    recording_status = models.CharField(max_length=50, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.get_session_type_display()} - {self.topic or 'No topic'} ({self.get_status_display()})"


class SessionParticipant(models.Model):
    session = models.ForeignKey(Session, on_delete=models.CASCADE, related_name="participants")
    student = models.ForeignKey(User, on_delete=models.CASCADE)
    joined_at = models.DateTimeField(null=True, blank=True)
    left_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        unique_together = ["session", "student"]

    def __str__(self):
        return f"{self.student} in {self.session}"


class SessionRating(models.Model):
    session = models.OneToOneField(Session, on_delete=models.CASCADE, related_name="rating")
    student = models.ForeignKey(User, on_delete=models.CASCADE)
    rating = models.IntegerField()
    comment = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.student} rated {self.session} - {self.rating}/5"
