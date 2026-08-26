from django.contrib import admin
from parler.admin import TranslatableAdmin
from . import models

@admin.register(models.Subject)
class SubjectAdmin(TranslatableAdmin):
    list_display = ("name", )


@admin.register(models.Course)
class CourseAdmin(TranslatableAdmin):
    list_display = ("title", "subject", "grade_level")


@admin.register(models.Chapter)
class ChapterAdmin(TranslatableAdmin):
    list_display = ("title", "course",)


@admin.register(models.Lesson)
class LessonAdmin(TranslatableAdmin):
    list_display = ("title", "chapter", )


@admin.register(models.Item)
class ItemAdmin(TranslatableAdmin):
    list_display = ("title", "grade_level", "type")


admin.site.register(models.UserItemProgress)


@admin.register(models.DailyQuizQuestion)
class DailyQuizQuestionAdmin(TranslatableAdmin):
    list_display = ("question_text", )


admin.site.register(models.DailyQuiz)
admin.site.register(models.DailyQuizAnswer)


@admin.register(models.QuizQuestion)
class QuizQuestionAdmin(TranslatableAdmin):
    list_display = ("question_text", "correct_answer", "created_at")


@admin.register(models.Quiz)
class QuizAdmin(admin.ModelAdmin):
    list_display = ("item", "passing_score", "time_limit_minutes")
    filter_horizontal = ("questions",)


admin.site.register(models.QuizAttempt)
admin.site.register(models.QuizAnswer)
