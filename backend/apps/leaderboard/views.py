from django.db.models import Sum
from django.utils.translation import gettext_lazy as _
from drf_spectacular.utils import OpenApiParameter, extend_schema
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import POINT_EVENT_CHOICES, PointTransaction, UserPoints
from .serializers import GradeLeaderboardEntrySerializer, LeaderboardEntrySerializer

STUDENT_ROLE = 1


class LeaderboardListView(APIView):
    """GET /api/leaderboard/ — ranked list of students by total points."""

    permission_classes = [IsAuthenticated]

    @extend_schema(
        parameters=[
            OpenApiParameter(
                name="page", required=False, type=int, location=OpenApiParameter.QUERY
            ),
            OpenApiParameter(
                name="page_size",
                required=False,
                type=int,
                location=OpenApiParameter.QUERY,
            ),
        ],
        responses={200: LeaderboardEntrySerializer(many=True)},
    )
    def get(self, request):
        try:
            page = max(1, int(request.query_params.get("page", 1)))
            page_size = max(1, int(request.query_params.get("page_size", 20)))
        except (ValueError, TypeError):
            page, page_size = 1, 20
        page_size = min(page_size, 100)

        entries = (
            UserPoints.objects.filter(user__role=STUDENT_ROLE)
            .select_related("user")
            .order_by("-total_points", "user_id")
        )

        total_count = entries.count()
        total_pages = max(1, (total_count + page_size - 1) // page_size)
        page = min(page, total_pages)

        start = (page - 1) * page_size
        page_entries = list(entries[start : start + page_size])
        rank_map = {entry.pk: start + i + 1 for i, entry in enumerate(page_entries)}

        serializer = LeaderboardEntrySerializer(
            page_entries, many=True, context={"rank_map": rank_map}
        )
        return Response(
            {
                "total_count": total_count,
                "total_pages": total_pages,
                "page": page,
                "page_size": page_size,
                "results": serializer.data,
            }
        )


class GradeLeaderboardListView(APIView):
    """GET /api/leaderboard/grade/ — ranked list of students within a grade level."""

    permission_classes = [IsAuthenticated]

    @extend_schema(
        parameters=[
            OpenApiParameter(
                name="grade_level",
                required=False,
                type=str,
                location=OpenApiParameter.QUERY,
            ),
            OpenApiParameter(
                name="page", required=False, type=int, location=OpenApiParameter.QUERY
            ),
            OpenApiParameter(
                name="page_size",
                required=False,
                type=int,
                location=OpenApiParameter.QUERY,
            ),
        ],
        responses={200: GradeLeaderboardEntrySerializer(many=True)},
    )
    def get(self, request):
        grade_level = request.query_params.get("grade_level") or request.user.grade_level
        if not grade_level:
            return Response(
                {"error": _("A grade_level is required to view this leaderboard.")},
                status=400,
            )

        try:
            page = max(1, int(request.query_params.get("page", 1)))
            page_size = max(1, int(request.query_params.get("page_size", 20)))
        except (ValueError, TypeError):
            page, page_size = 1, 20
        page_size = min(page_size, 100)

        entries = (
            UserPoints.objects.filter(
                user__role=STUDENT_ROLE, user__grade_level=grade_level
            )
            .select_related("user")
            .order_by("-grade_points", "user_id")
        )

        total_count = entries.count()
        total_pages = max(1, (total_count + page_size - 1) // page_size)
        page = min(page, total_pages)

        start = (page - 1) * page_size
        page_entries = list(entries[start : start + page_size])
        rank_map = {entry.pk: start + i + 1 for i, entry in enumerate(page_entries)}

        serializer = GradeLeaderboardEntrySerializer(
            page_entries, many=True, context={"rank_map": rank_map}
        )
        return Response(
            {
                "grade_level": grade_level,
                "total_count": total_count,
                "total_pages": total_pages,
                "page": page,
                "page_size": page_size,
                "results": serializer.data,
            }
        )


class MyLeaderboardStatsView(APIView):
    """GET /api/leaderboard/me/ — the current student's rank, points and breakdown."""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        if user.role != STUDENT_ROLE:
            return Response(
                {"error": _("Leaderboard is only available for students.")},
                status=403,
            )

        user_points = UserPoints.objects.filter(user=user).first()
        total_points = user_points.total_points if user_points else 0
        grade_points = user_points.grade_points if user_points else 0

        rank = (
            UserPoints.objects.filter(
                user__role=STUDENT_ROLE, total_points__gt=total_points
            ).count()
            + 1
        )

        grade_level = user.grade_level
        grade_rank = None
        if grade_level:
            grade_rank = (
                UserPoints.objects.filter(
                    user__role=STUDENT_ROLE,
                    user__grade_level=grade_level,
                    grade_points__gt=grade_points,
                ).count()
                + 1
            )

        event_labels = dict(POINT_EVENT_CHOICES)
        breakdown = (
            PointTransaction.objects.filter(user=user)
            .values("event_type")
            .annotate(total=Sum("points"))
            .order_by("-total")
        )
        breakdown_data = [
            {
                "event_type": row["event_type"],
                "label": event_labels.get(row["event_type"], row["event_type"]),
                "total": row["total"],
            }
            for row in breakdown
        ]

        return Response(
            {
                "total_points": total_points,
                "rank": rank,
                "grade_level": grade_level,
                "grade_points": grade_points,
                "grade_rank": grade_rank,
                "breakdown": breakdown_data,
            }
        )
