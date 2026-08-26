from rest_framework import serializers

from .models import UserPoints


class LeaderboardEntrySerializer(serializers.ModelSerializer):
    user_id = serializers.IntegerField(source="user.id")
    username = serializers.CharField(source="user.username")
    full_name = serializers.CharField(source="user.full_name", allow_null=True)
    avatar = serializers.ImageField(source="user.avatar", allow_null=True, required=False)
    grade_level = serializers.CharField(source="user.grade_level", allow_null=True)
    rank = serializers.SerializerMethodField()

    class Meta:
        model = UserPoints
        fields = [
            "rank",
            "user_id",
            "username",
            "full_name",
            "avatar",
            "grade_level",
            "total_points",
        ]

    def get_rank(self, obj) -> int | None:
        return self.context.get("rank_map", {}).get(obj.pk)


class GradeLeaderboardEntrySerializer(serializers.ModelSerializer):
    user_id = serializers.IntegerField(source="user.id")
    username = serializers.CharField(source="user.username")
    full_name = serializers.CharField(source="user.full_name", allow_null=True)
    avatar = serializers.ImageField(source="user.avatar", allow_null=True, required=False)
    grade_level = serializers.CharField(source="user.grade_level", allow_null=True)
    total_points = serializers.IntegerField(source="grade_points")
    rank = serializers.SerializerMethodField()

    class Meta:
        model = UserPoints
        fields = [
            "rank",
            "user_id",
            "username",
            "full_name",
            "avatar",
            "grade_level",
            "total_points",
        ]

    def get_rank(self, obj) -> int | None:
        return self.context.get("rank_map", {}).get(obj.pk)
