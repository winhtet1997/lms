from .models import Enrollment


def has_chapter_access(user, chapter):
    """Whether `user` may view the content of `chapter` (not just its metadata)."""
    if chapter.is_free_preview:
        return True
    if not user or not user.is_authenticated:
        return False
    if "lms_auth.view_dashboard" in user.get_all_permissions():
        return True
    enrollment = Enrollment.objects.filter(user=user, course_id=chapter.course_id).first()
    return bool(enrollment and enrollment.sync_active_status())


def has_item_access(user, chapter):
    if not user or not user.is_authenticated:
        return False
    if chapter.is_free_preview:
        return True
    if "lms_auth.view_dashboard" in user.get_all_permissions():
        return True
    enrollment = Enrollment.objects.filter(user=user, course_id=chapter.course_id).first()
    return bool(enrollment and enrollment.sync_active_status())