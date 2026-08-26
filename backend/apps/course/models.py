from django.conf import settings
from django.db import models
from django.db.models import Count
from django.utils.translation import gettext_lazy as _
from parler.models import TranslatableModel, TranslatedFields
from taggit.managers import TaggableManager

GRADE_LEVELS = [
    ("6", _("6")),
    ("7", _("7")),
    ("8", _("8")),
    ("9", _("9")),
    ("10", _("10")),
    ("11", _("11")),
    ("12", _("12")),
]

ITEM_CHOICES = [
    ("video", _("Video")),
    ("document", _("Document")),
    ("scorm", _("SCORM")),
    ("activity", _("Activity")),
    ("quiz", _("Quiz")),
    ("assessment", _("Assessment")),
]

CORRECT_CHOICES = [
    ("A", "Choice A"),
    ("B", "Choice B"),
    ("C", "Choice C"),
    ("D", "Choice D"),
]

class CourseDashboard(models.Model):
    """Proxy model used as a ContentType anchor for dashboard permissions.
    Permissions are created via the assign_permissions management command."""
    class Meta:
        managed = False
        default_permissions = ()
        verbose_name = _("course_dashboard")
        verbose_name_plural = _("course_dashboards")



class Subject(TranslatableModel):
    translations = TranslatedFields(
        name=models.CharField(max_length=100)
    )

    def __str__(self):
        return self.safe_translation_getter("name", any_language=True)


class Course(TranslatableModel):
    translations = TranslatedFields(
        title=models.CharField(max_length=255, default=_("Title")),
        description=models.TextField(blank=True, null=True),
    )
    subject = models.ForeignKey(
        Subject, on_delete=models.CASCADE, related_name="course", null=True, blank=True)
    grade_level = models.CharField(
        max_length=15, choices=GRADE_LEVELS, blank=True, null=True
    )
    created_at = models.DateTimeField(auto_now_add=True)
    publication_status = models.BooleanField(default=False, null=True,
                                             blank=True)

    class Meta:
        unique_together = ("subject", "grade_level")

    def __str__(self):
        title = self.safe_translation_getter("title", any_language=True)
        return f"{str(title)} - {self.subject}" if title else str(self.id)

    def get_grade_level(self, obj):
        return dict(GRADE_LEVELS).get(obj.grade_level)

    def get_subject(self, obj):
        return self.subject

    def get_course_progress(self, user):
        if user.is_anonymous:
            return 0
        chapters = list(self.chapters.all())
        if not chapters:
            return 0
        chapter_totals = dict(
            Item.objects.filter(lesson__chapter__course=self)
            .values("lesson__chapter")
            .annotate(n=Count("id", distinct=True))
            .values_list("lesson__chapter", "n")
        )
        chapter_completed = dict(
            UserItemProgress.objects.filter(
                user=user, item__lesson__chapter__course=self, status="completed"
            )
            .values("item__lesson__chapter")
            .annotate(n=Count("id"))
            .values_list("item__lesson__chapter", "n")
        )
        total_progress = 0
        for chapter in chapters:
            total = chapter_totals.get(chapter.id, 0)
            if total == 0:
                continue
            completed = chapter_completed.get(chapter.id, 0)
            total_progress += round((completed / total) * 100)
        return round(total_progress / len(chapters))


class Chapter(TranslatableModel):
    course = models.ForeignKey(
        Course, on_delete=models.CASCADE, related_name="chapters"
    )
    translations = TranslatedFields(
        title=models.CharField(max_length=255, default=_("Title")),
        description=models.TextField(blank=True, null=True),
    )
    icon = models.FileField(upload_to="chapter_icons/", null=True,
                            blank=True)
    priority_index = models.IntegerField(default=0, null=True, blank=True)
    is_free_preview = models.BooleanField(default=False)

    class Meta:
        ordering = ["priority_index"]

    def __str__(self):
        title = self.safe_translation_getter("title", any_language=True)
        return str(title) if title else str(self.id)

    def get_chapter_progress(self, user):
        if user.is_anonymous:
            return 0
        total = Item.objects.filter(lesson__chapter=self).count()
        if total == 0:
            return 0
        completed = UserItemProgress.objects.filter(
            user=user, item__lesson__chapter=self, status="completed"
        ).count()
        return round((completed / total) * 100)


class Item(TranslatableModel):
    translations = TranslatedFields(
        title=models.CharField(max_length=255, default=_("Title")),
        description=models.TextField(blank=True, null=True),
    )
    type = models.CharField(max_length=20, choices=ITEM_CHOICES,
                            default="video")
    file = models.FileField(upload_to="media/", null=True, blank=True)
    file_size = models.BigIntegerField(null=True, blank=True)
    duration = models.FloatField(blank=True, null=True, default=0.0)
    grade_level = models.CharField(
        max_length=15, choices=GRADE_LEVELS, blank=True, null=True
    )
    tags = TaggableManager(verbose_name="Tags", blank=True)
    created_at = models.DateTimeField(auto_now_add=True, null=True)
    activity_code = models.TextField(blank=True, null=True)
    priority_index = models.IntegerField(default=0, null=True, blank=True)
    publication_status = models.BooleanField(default=False, null=True,
                                             blank=True)

    class Meta:
        ordering = ["priority_index"]

    def get_type(self, obj):
        return dict(ITEM_CHOICES).get(obj.type)

    def get_questions_length(self):
        if self.type == "quiz":
            quiz = Quiz.objects.filter(item=self).first()
            if hasattr(quiz, "questions"):
                return len(quiz.questions.all())
        return 0

    def __str__(self):
        title = self.safe_translation_getter("title", any_language=True)
        return str(title) if title else str(self.id)


class Lesson(TranslatableModel):
    chapter = models.ForeignKey(
        Chapter, on_delete=models.CASCADE, related_name="lessons"
    )
    translations = TranslatedFields(
        title=models.CharField(max_length=255, default=_("Title")),
        description=models.TextField(blank=True, null=True),
    )
    items = models.ManyToManyField(Item, blank=True)
    priority_index = models.IntegerField(default=0, null=True, blank=True)

    class Meta:
        ordering = ["priority_index"]


PROGRESS_STATUS = [
    ("in_progress", _("In Progress")),
    ("completed", _("Completed")),
]


class UserItemProgress(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="item_progress",
    )
    item = models.ForeignKey(
        Item,
        on_delete=models.CASCADE,
        related_name="user_progress",
    )
    progress = models.IntegerField(default=0)
    status = models.CharField(
        max_length=20, choices=PROGRESS_STATUS, default="in_progress"
    )
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ("user", "item")

    def __str__(self):
        title = self.item.safe_translation_getter('title', any_language=True)
        return f"""{self.user.username} - {title}:
        {self.progress}% ({self.status})"""


class DailyQuizQuestion(TranslatableModel):
    translations = TranslatedFields(
        question_text=models.CharField(max_length=500),
        choice_a=models.CharField(max_length=255),
        choice_b=models.CharField(max_length=255),
        choice_c=models.CharField(max_length=255),
        choice_d=models.CharField(max_length=255),
    )
    correct_answer = models.CharField(max_length=1, choices=CORRECT_CHOICES)
    course = models.ForeignKey(
        Course, on_delete=models.SET_NULL, related_name="quiz_questions",
        null=True, blank=True
    )
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        text = self.safe_translation_getter("question_text", any_language=True)
        return f"{text}"


DAILY_QUIZ_STATUS = [
    ("not_started", _("Not Started")),
    ("in_progress", _("In Progress")),
    ("completed", _("Completed")),
]


class DailyQuiz(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="daily_quizzes",
    )
    course = models.ForeignKey(
        Course, on_delete=models.CASCADE, related_name="daily_quizzes",
        null=True, blank=True
    )
    date = models.DateField()
    questions = models.ManyToManyField(
        DailyQuizQuestion,
        related_name="daily_quizzes",
    )
    status = models.CharField(
        max_length=20, choices=DAILY_QUIZ_STATUS, default="not_started"
    )
    score = models.PositiveSmallIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        unique_together = ("user", "date", "course")

    def __str__(self):
        return f"{self.user.username} — Quiz {self.date}"


class DailyQuizAnswer(models.Model):
    quiz = models.ForeignKey(
        DailyQuiz,
        on_delete=models.CASCADE,
        related_name="answers",
    )
    question = models.ForeignKey(
        DailyQuizQuestion,
        on_delete=models.CASCADE,
        related_name="user_answers",
    )
    selected_answer = models.CharField(max_length=1, choices=CORRECT_CHOICES)
    is_correct = models.BooleanField(default=False)
    answered_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("quiz", "question")

    def save(self, *args, **kwargs):
        self.is_correct = self.selected_answer == self.question.correct_answer
        super().save(*args, **kwargs)

    def __str__(self):
        return (
            f"{self.quiz.user.username} — Q{self.question.id}: "
            f"{self.selected_answer} ({'correct' if self.is_correct else 'wrong'})"
        )


class QuizQuestion(TranslatableModel):
    translations = TranslatedFields(
        question_text=models.CharField(max_length=500),
        choice_a=models.CharField(max_length=255),
        choice_b=models.CharField(max_length=255),
        choice_c=models.CharField(max_length=255),
        choice_d=models.CharField(max_length=255),
        explanation=models.TextField(blank=True, null=True),
    )
    correct_answer = models.CharField(max_length=1, choices=CORRECT_CHOICES)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        text = self.safe_translation_getter("question_text", any_language=True)
        return str(text) if text else str(self.id)


class Quiz(models.Model):
    item = models.OneToOneField(
        Item, on_delete=models.CASCADE, related_name="quiz"
    )
    questions = models.ManyToManyField(
        QuizQuestion, blank=True, related_name="quizzes"
    )
    passing_score = models.PositiveSmallIntegerField(default=70)
    time_limit_minutes = models.PositiveSmallIntegerField(null=True, blank=True)

    def __str__(self):
        title = self.item.safe_translation_getter("title", any_language=True)
        return f"Quiz: {title}"


QUIZ_ATTEMPT_STATUS = [
    ("in_progress", _("In Progress")),
    ("completed", _("Completed")),
]


class QuizAttempt(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="quiz_attempts",
    )
    quiz = models.ForeignKey(
        Quiz, on_delete=models.CASCADE, related_name="attempts"
    )
    status = models.CharField(
        max_length=20, choices=QUIZ_ATTEMPT_STATUS, default="in_progress"
    )
    score = models.PositiveSmallIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f"{self.user.username} — {self.quiz} #{self.pk}"


class QuizAnswer(models.Model):
    attempt = models.ForeignKey(
        QuizAttempt, on_delete=models.CASCADE, related_name="answers"
    )
    question = models.ForeignKey(
        QuizQuestion, on_delete=models.CASCADE, related_name="quiz_answers"
    )
    selected_answer = models.CharField(max_length=1, choices=CORRECT_CHOICES)
    is_correct = models.BooleanField(default=False)
    answered_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("attempt", "question")

    def save(self, *args, **kwargs):
        self.is_correct = self.selected_answer == self.question.correct_answer
        super().save(*args, **kwargs)

    def __str__(self):
        return (
            f"{self.attempt.user.username} — Q{self.question.id}: "
            f"{self.selected_answer} ({'correct' if self.is_correct else 'wrong'})"
        )
