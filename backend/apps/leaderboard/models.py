from django.conf import settings
from django.db import models
from django.utils.translation import gettext_lazy as _

from apps.course.models import Chapter, Course

POINT_EVENT_CHOICES = [
    ("registration", _("Registration")),
    ("profile_complete", _("Profile Completed")),
    ("daily_login", _("Daily Login")),
    ("daily_quiz", _("Daily Quiz Completed")),
    ("item_complete", _("Item Completed")),
    ("chapter_complete", _("Chapter Completed")),
    ("course_complete", _("Course Completed")),
]


class PointTransaction(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="point_transactions",
    )
    event_type = models.CharField(max_length=20, choices=POINT_EVENT_CHOICES)
    points = models.PositiveIntegerField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.user.username} +{self.points} ({self.event_type})"


class UserPoints(models.Model):
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="leaderboard_points",
    )
    total_points = models.PositiveIntegerField(default=0)
    grade_points = models.PositiveIntegerField(default=0)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.user.username}: {self.total_points}"


class DailyLoginRecord(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="daily_login_records",
    )
    date = models.DateField()

    class Meta:
        unique_together = ("user", "date")


class ProfileCompletionAward(models.Model):
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="profile_completion_award",
    )
    awarded_at = models.DateTimeField(auto_now_add=True)


class ChapterCompletion(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="chapter_completions",
    )
    chapter = models.ForeignKey(
        Chapter, on_delete=models.CASCADE, related_name="completions"
    )
    completed_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("user", "chapter")


class CourseCompletion(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="course_completions",
    )
    course = models.ForeignKey(
        Course, on_delete=models.CASCADE, related_name="completions"
    )
    completed_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("user", "course")
