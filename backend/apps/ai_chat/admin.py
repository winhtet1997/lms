from django.contrib import admin

from . import models


@admin.register(models.CourseMathAIMapping)
class CourseMathAIMappingAdmin(admin.ModelAdmin):
    list_display = ("course", "mathai_subject_id", "updated_at")
    search_fields = ("mathai_subject_id", "course__translations__title")
    raw_id_fields = ("course",)


@admin.register(models.ChapterMathAIMapping)
class ChapterMathAIMappingAdmin(admin.ModelAdmin):
    list_display = ("chapter", "mathai_lesson_id", "updated_at")
    search_fields = ("mathai_lesson_id", "chapter__translations__title")
    raw_id_fields = ("chapter",)


@admin.register(models.ChatThread)
class ChatThreadAdmin(admin.ModelAdmin):
    list_display = ("id", "user", "scope", "chapter", "course", "mathai_chat_id", "is_archived", "updated_at")
    list_filter = ("scope", "is_archived")
    search_fields = ("user__username", "user__email", "mathai_chat_id")
    raw_id_fields = ("user", "course", "chapter")
    readonly_fields = ("mathai_subject_id", "mathai_lesson_id", "mathai_chat_id", "created_at", "updated_at")
