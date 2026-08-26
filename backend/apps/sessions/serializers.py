from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.utils import timezone
from . import models

User = get_user_model()


class TutorBriefSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "full_name", "username", "avatar"]


class TutorAvailabilitySerializer(serializers.ModelSerializer):
    day_label = serializers.CharField(source="get_day_of_week_display", read_only=True)

    class Meta:
        model = models.TutorAvailability
        fields = ["id", "day_of_week", "day_label", "start_time", "end_time", "is_active"]


class SessionParticipantSerializer(serializers.ModelSerializer):
    student = TutorBriefSerializer(read_only=True)

    class Meta:
        model = models.SessionParticipant
        fields = ["id", "student", "joined_at", "left_at"]


class SessionRatingSerializer(serializers.ModelSerializer):
    class Meta:
        model = models.SessionRating
        fields = ["id", "rating", "comment", "created_at"]
        read_only_fields = ["created_at"]


class SessionSerializer(serializers.ModelSerializer):
    tutor = TutorBriefSerializer(read_only=True)
    tutor_id = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.filter(role=3), source="tutor", write_only=True
    )
    host_student = TutorBriefSerializer(read_only=True)
    participants = SessionParticipantSerializer(many=True, read_only=True)
    rating = SessionRatingSerializer(read_only=True)
    status_label = serializers.CharField(source="get_status_display", read_only=True)
    session_type_label = serializers.CharField(source="get_session_type_display", read_only=True)

    class Meta:
        model = models.Session
        fields = [
            "id", "session_type", "session_type_label", "status", "status_label",
            "tutor", "tutor_id", "host_student",
            "topic", "scheduled_at", "duration_minutes", "max_participants",
            "daily_room_name", "daily_room_url",
            "recording_id", "recording_url", "recording_status",
            "participants", "rating",
            "created_at", "updated_at",
        ]
        read_only_fields = [
            "host_student", "status", "daily_room_name", "daily_room_url",
            "recording_id", "recording_url", "recording_status",
            "created_at", "updated_at",
        ]

    def create(self, validated_data):
        validated_data["host_student"] = self.context["request"].user
        return super().create(validated_data)


class BookSessionSerializer(serializers.ModelSerializer):
    tutor_id = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.filter(role=3), source="tutor"
    )

    class Meta:
        model = models.Session
        fields = ["tutor_id", "session_type", "topic", "scheduled_at", "duration_minutes", "max_participants"]

    def validate_scheduled_at(self, value):
        if value <= timezone.now():
            raise serializers.ValidationError("Session must be scheduled in the future.")
        return value

    def create(self, validated_data):
        validated_data["host_student"] = self.context["request"].user
        return models.Session.objects.create(**validated_data)


class GroupSessionCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = models.Session
        fields = ["topic", "scheduled_at", "duration_minutes", "max_participants"]

    def validate_scheduled_at(self, value):
        if value <= timezone.now():
            raise serializers.ValidationError("Session must be scheduled in the future.")
        return value

    def create(self, validated_data):
        validated_data["session_type"] = "group"
        validated_data["tutor"] = self.context["request"].user
        validated_data["host_student"] = self.context["request"].user
        return models.Session.objects.create(**validated_data)


class JoinSessionResponseSerializer(serializers.Serializer):
    token = serializers.CharField()
    room_url = serializers.CharField()
    room_name = serializers.CharField()


class AdminSessionSerializer(serializers.ModelSerializer):
    tutor = TutorBriefSerializer(read_only=True)
    host_student = TutorBriefSerializer(read_only=True)
    participant_count = serializers.SerializerMethodField()
    status_label = serializers.CharField(source="get_status_display", read_only=True)
    session_type_label = serializers.CharField(source="get_session_type_display", read_only=True)

    class Meta:
        model = models.Session
        fields = [
            "id", "session_type", "session_type_label", "status", "status_label",
            "tutor", "host_student", "topic", "scheduled_at", "duration_minutes",
            "max_participants", "participant_count",
            "daily_room_name", "daily_room_url",
            "recording_status", "recording_url",
            "created_at",
        ]

    def get_participant_count(self, obj):
        return obj.participants.count() + 1  # +1 for host_student
