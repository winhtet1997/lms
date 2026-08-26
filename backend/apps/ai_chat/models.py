from django.conf import settings
from django.db import models
from django.utils.translation import gettext_lazy as _

class AiChatDashboard(models.Model):
    """Proxy model used as a ContentType anchor for dashboard permissions.
    Permissions are created via the assign_permissions management command."""
    class Meta:
        managed = False
        default_permissions = ()
        verbose_name = _("ai_chat_dashboard")
        verbose_name_plural = _("ai_chat_dashboards")


SCOPE_CHOICES = [
    ("global", _("Global")),
    ("course", _("Course")),
    # Wire value kept as "lesson" (not "chapter") because the frontend
    # (ai-chat/page.js) already checks `thread.scope === "lesson"` for a
    # MathMentor Chapter-scoped thread. Not to be confused with the
    # unrelated apps.course.Lesson model.
    ("lesson", _("Chapter")),
]


class ChatThread(models.Model):
    """One Math AI conversation. Maps a MathMentor user + scope to a
    `mathai_chat_id` on the Math AI side, so resuming the same scope
    continues the same conversation instead of starting a new one.
    """

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="ai_chat_threads",
    )
    scope = models.CharField(max_length=10, choices=SCOPE_CHOICES, default="global")

    course = models.ForeignKey(
        "lms_course.Course",
        on_delete=models.SET_NULL,
        related_name="ai_chat_threads",
        null=True,
        blank=True,
    )
    chapter = models.ForeignKey(
        "lms_course.Chapter",
        on_delete=models.SET_NULL,
        related_name="ai_chat_threads",
        null=True,
        blank=True,
    )

    mathai_subject_id = models.CharField(max_length=255, null=True, blank=True)
    mathai_lesson_id = models.CharField(max_length=255, null=True, blank=True)
    mathai_chat_id = models.CharField(max_length=255, unique=True, null=True, blank=True)

    title = models.CharField(max_length=255, blank=True, default="")
    is_archived = models.BooleanField(default=False)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-updated_at"]
        indexes = [
            models.Index(fields=["user", "scope", "chapter"]),
            models.Index(fields=["user", "scope", "course"]),
        ]

    def __str__(self):
        return f"{self.user_id} · {self.scope} · {self.mathai_chat_id}"


class CourseMathAIMapping(models.Model):
    """Maps a MathMentor Course to a Math AI subject_id.

    Math AI's own docs describe their curriculum as Course -> Subject ->
    Lesson, where their "Subject" corresponds to one of our Courses. This
    is admin-managed rather than inferred, so a wrong match doesn't
    silently mis-scope a course's chat with no visibility to anyone.
    """

    course = models.OneToOneField(
        "lms_course.Course",
        on_delete=models.CASCADE,
        related_name="mathai_mapping",
    )
    mathai_subject_id = models.CharField(
        max_length=255,
        help_text="External Math AI subject_id representing this course "
        "(see GET /api/external/v1/subjects).",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.course} → subject={self.mathai_subject_id}"


class ChapterMathAIMapping(models.Model):
    """Maps a MathMentor Chapter to a specific Math AI lesson_id (within
    its parent course's mapped subject_id).

    A MathMentor Chapter corresponds to one Math AI lesson — so a
    chapter-scoped Ask AI chat restricts to just that chapter's topic.
    `mathai_lesson_id` may be blank if not yet mapped by an admin; chat
    creation for that chapter is blocked until it's filled in.
    """

    chapter = models.OneToOneField(
        "lms_course.Chapter",
        on_delete=models.CASCADE,
        related_name="mathai_mapping",
    )
    mathai_lesson_id = models.CharField(
        max_length=255,
        blank=True,
        default="",
        help_text="External Math AI lesson_id representing this chapter "
        "(see the lessons array under GET /api/external/v1/subjects/{id}). "
        "Leave blank if not yet mapped.",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.chapter} → lesson={self.mathai_lesson_id or '(unmapped)'}"
