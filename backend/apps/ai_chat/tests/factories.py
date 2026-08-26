from datetime import timedelta
from decimal import Decimal

from django.contrib.auth import get_user_model
from django.contrib.contenttypes.models import ContentType
from django.contrib.auth.models import Permission
from django.utils import timezone

from apps.ai_chat.models import AiChatDashboard
from apps.auth.models import UserDashboard
from apps.billing.models import Enrollment, SubscriptionPlan
from apps.course.models import Chapter, Course

User = get_user_model()


def make_user(username, role=1, email=None):
    return User.objects.create_user(
        username=username,
        email=email or f"{username}@test.com",
        password="StrongPass123",
        role=role,
        is_verified=True,
    )


def make_dashboard_user(username):
    """A user with the custom 'view_dashboard' permission that
    has_dashboard_bypass treats as an unconditional bypass."""
    user = make_user(username)
    content_type = ContentType.objects.get_for_model(UserDashboard)
    permission, _created = Permission.objects.get_or_create(
        codename="view_dashboard",
        content_type=content_type,
        defaults={"name": "Can view dashboard"},
    )
    user.user_permissions.add(permission)
    return user


def make_mapping_admin(username):
    """A user with the custom 'manage_mathai_mapping' permission that
    CanManageMathAIMapping requires."""
    user = make_user(username)
    content_type = ContentType.objects.get_for_model(AiChatDashboard)
    permission, _created = Permission.objects.get_or_create(
        codename="manage_mathai_mapping",
        content_type=content_type,
        defaults={"name": "Manage Math AI Mapping"},
    )
    user.user_permissions.add(permission)
    return user


def make_course(grade_level="6"):
    return Course.objects.create(grade_level=grade_level)


def make_chapter(course, title="Test Chapter", is_free_preview=False, priority_index=0):
    chapter = Chapter.objects.create(
        course=course, is_free_preview=is_free_preview, priority_index=priority_index
    )
    chapter.set_current_language("en")
    chapter.title = title
    chapter.save()
    return chapter


def make_plan(course, price="9.99"):
    return SubscriptionPlan.objects.create(course=course, price=Decimal(price), days=30)


def make_paid_enrollment(user, course, plan=None):
    return Enrollment.objects.create(
        user=user,
        course=course,
        plan=plan or make_plan(course),
        is_active=True,
        started_at=timezone.now(),
        expires_at=timezone.now() + timedelta(days=30),
    )


def make_expired_enrollment(user, course, plan=None):
    return Enrollment.objects.create(
        user=user,
        course=course,
        plan=plan or make_plan(course),
        is_active=True,
        started_at=timezone.now() - timedelta(days=60),
        expires_at=timezone.now() - timedelta(days=30),
    )


def make_free_enrollment(user, course):
    return Enrollment.objects.create(user=user, course=course, plan=None, is_active=True)
