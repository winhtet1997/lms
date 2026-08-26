from rest_framework import serializers

from . import models


class ChatThreadSerializer(serializers.ModelSerializer):
    chapter_id = serializers.IntegerField(source="chapter.id", read_only=True, default=None)
    course_id = serializers.IntegerField(source="course.id", read_only=True, default=None)

    class Meta:
        model = models.ChatThread
        fields = [
            "id",
            "scope",
            "chapter_id",
            "course_id",
            "title",
            "created_at",
            "updated_at",
        ]


class StartThreadRequestSerializer(serializers.Serializer):
    chapter_id = serializers.IntegerField(required=False, allow_null=True)
    course_id = serializers.IntegerField(required=False, allow_null=True)
    subject_id = serializers.CharField(required=False, allow_null=True, allow_blank=True)
    new_chat = serializers.BooleanField(required=False, default=False)


class SendMessageRequestSerializer(serializers.Serializer):
    message = serializers.CharField(allow_blank=False, trim_whitespace=True)
    language = serializers.CharField(required=False, allow_null=True, allow_blank=True, default="en")


class SendMessageResponseSerializer(serializers.Serializer):
    reply = serializers.CharField()


class ChatMessageSerializer(serializers.Serializer):
    role = serializers.CharField()
    content = serializers.CharField()
    created_at = serializers.CharField(required=False, allow_null=True)
