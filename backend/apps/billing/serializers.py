from rest_framework import serializers
from . import models


class SubscriptionPlanSerializer(serializers.ModelSerializer):
    class Meta:
        model = models.SubscriptionPlan
        fields = [
            "id",
            "course",
            "course_title",
            "name",
            "description",
            "days",
            "price",
            "currency",
            "is_active",
            "is_recommended",
            "created_at",
        ]
        read_only_fields = ["id", "course_title", "created_at"]

    name = serializers.CharField(max_length=100)
    description = serializers.CharField(required=False, allow_blank=True, default="")
    course_title = serializers.SerializerMethodField(read_only=True)

    def get_course_title(self, obj):
        if not obj.course:
            return None
        return obj.course.safe_translation_getter("title", any_language=True)


class EnrollmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = models.Enrollment
        fields = [
            "id",
            "user",
            "course",
            "course_title",
            "course_progress",
            "plan",
            "plan_id",
            "is_active",
            "started_at",
            "expires_at",
            "created_at",
            "updated_at",
            "full_name",
        ]
        read_only_fields = [
            "id",
            "user",
            "course",
            "course_title",
            "course_progress",
            "started_at",
            "expires_at",
            "created_at",
            "updated_at",
            "full_name",
        ]

    plan = serializers.SerializerMethodField()
    plan_id = serializers.PrimaryKeyRelatedField(
        source="plan",
        queryset=models.SubscriptionPlan.objects.all(),
        write_only=True,
        required=False,
        allow_null=True,
    )
    user = serializers.SerializerMethodField(read_only=True)
    full_name = serializers.SerializerMethodField(read_only=True)
    course_title = serializers.SerializerMethodField(read_only=True)
    course_progress = serializers.SerializerMethodField(read_only=True)

    def validate(self, attrs):
        if self.instance and self.instance.started_at and "plan" in attrs:
            if attrs["plan"] != self.instance.plan:
                raise serializers.ValidationError({
                    "plan_id": (
                        "Plan is locked once the enrollment has been "
                        "activated. Use a renewal/purchase to change it."
                    ),
                })
        return attrs

    def create(self, validated_data):
        validated_data["user"] = self.context["request"].user
        return models.Enrollment.objects.create(**validated_data)

    def get_plan(self, obj):
        if obj.plan:
            return SubscriptionPlanSerializer(obj.plan).data
        return "Free"

    def get_user(self, obj):
        return obj.user.username if obj.user else None

    def get_full_name(self, obj):
        return obj.user.full_name if obj.user else None

    def get_course_title(self, obj):
        if not obj.course:
            return None
        return obj.course.safe_translation_getter("title", any_language=True)

    def get_course_progress(self, obj):
        if not obj.course or not obj.user:
            return 0
        return obj.course.get_course_progress(obj.user)


class PaymentTransactionSerializer(serializers.ModelSerializer):
    """Read-only — payment transactions are a system-generated audit trail,
    never created or edited through the API."""

    class Meta:
        model = models.PaymentTransaction
        fields = [
            "id",
            "order_number",
            "transaction_id",
            "provider_transaction_id",
            "payer",
            "user",
            "course_title",
            "plan_name",
            "amount",
            "currency",
            "status",
            "failure_reason",
            "callback_received_at",
            "processed_at",
            "created_at",
        ]
        read_only_fields = fields

    payer = serializers.SerializerMethodField()
    user = serializers.SerializerMethodField()
    course_title = serializers.SerializerMethodField()
    plan_name = serializers.SerializerMethodField()

    def get_payer(self, obj):
        return obj.payer.username if obj.payer else None

    def get_user(self, obj):
        return obj.user.username if obj.user else None

    def get_course_title(self, obj):
        if not obj.plan or not obj.plan.course:
            return None
        return obj.plan.course.safe_translation_getter("title", any_language=True)

    def get_plan_name(self, obj):
        if not obj.plan:
            return None
        return obj.plan.safe_translation_getter("name", any_language=True)
