from django.db import transaction
from django.db.models import F

from .models import PointTransaction, UserPoints

STUDENT_ROLE = 1

REGISTRATION = "registration"
PROFILE_COMPLETE = "profile_complete"
DAILY_LOGIN = "daily_login"
DAILY_QUIZ = "daily_quiz"
ITEM_COMPLETE = "item_complete"
CHAPTER_COMPLETE = "chapter_complete"
COURSE_COMPLETE = "course_complete"

POINT_VALUES = {
    REGISTRATION: 500,
    PROFILE_COMPLETE: 200,
    DAILY_LOGIN: 100,
    DAILY_QUIZ: 200,
    ITEM_COMPLETE: 300,
    CHAPTER_COMPLETE: 500,
    COURSE_COMPLETE: 1000,
}

GRADE_EVENT_TYPES = {DAILY_QUIZ, ITEM_COMPLETE, CHAPTER_COMPLETE, COURSE_COMPLETE}


def award_points(user, event_type):
    """Record a point transaction for a student and update their running totals.

    No-op for non-students so the leaderboard only ever contains student activity.
    Updates total_points for every event, and grade_points only for events that
    count toward the grade-specific leaderboard (GRADE_EVENT_TYPES).
    """
    if user.role != STUDENT_ROLE:
        return None

    points = POINT_VALUES[event_type]
    with transaction.atomic():
        txn = PointTransaction.objects.create(
            user=user, event_type=event_type, points=points
        )
        UserPoints.objects.get_or_create(user=user)
        update_fields = {"total_points": F("total_points") + points}
        if event_type in GRADE_EVENT_TYPES:
            update_fields["grade_points"] = F("grade_points") + points
        UserPoints.objects.filter(user=user).update(**update_fields)
    return txn
