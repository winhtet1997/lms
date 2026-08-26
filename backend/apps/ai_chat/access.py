from apps.billing.models import Enrollment

DASHBOARD_BYPASS_PERM = "lms_auth.view_dashboard"


def has_dashboard_bypass(user):
    """Users with the dashboard permission can chat in any scope without
    an enrollment, unconditionally."""
    return bool(
        user
        and user.is_authenticated
        and DASHBOARD_BYPASS_PERM in user.get_all_permissions()
    )


def has_course_chat_access(user, course):
    """Whether `user` may use Course-specific or Chapter-specific AI chat
    for `course`.

    Unlike apps.billing.access.has_chapter_access, this does NOT bypass on
    Chapter.is_free_preview — Ask AI is a paid-subscription feature
    regardless of whether the chapter's content is free to view. It also
    requires a real (plan-backed) enrollment, not just any active row.
    """
    if not user or not user.is_authenticated or course is None:
        return False
    if has_dashboard_bypass(user):
        return True
    enrollment = Enrollment.objects.filter(
        user=user, course=course, plan__isnull=False
    ).first()
    return bool(enrollment and enrollment.sync_active_status())
