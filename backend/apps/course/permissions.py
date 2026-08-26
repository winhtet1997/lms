from rest_framework.permissions import BasePermission


class CanCreateCourse(BasePermission):
    message = "You do not have permission to create courses."

    def has_permission(self, request, view):
        return (
            request.user.is_authenticated
            and "lms_course.create_course" in request.user.get_all_permissions()
        )


class CanEditCourse(BasePermission):
    message = "You do not have permission to edit courses."

    def has_permission(self, request, view):
        return (
            request.user.is_authenticated
            and "lms_course.edit_course" in request.user.get_all_permissions()
        )


class CanDeleteCourse(BasePermission):
    message = "You do not have permission to delete courses."

    def has_permission(self, request, view):
        return (
            request.user.is_authenticated
            and "lms_course.delete_course" in request.user.get_all_permissions()
        )


class CanChangeCourseStatus(BasePermission):
    message = "You do not have permission to change the course status."

    def has_permission(self, request, view):
        return (
            request.user.is_authenticated
            and "lms_course.can_change_course_status"
            in request.user.get_all_permissions()
        )

class CanViewItem(BasePermission):
    message = "You do not have permission to view items."

    def has_permission(self, request, view):
        return (
            request.user.is_authenticated
            and "lms_course.view_item" in request.user.get_all_permissions()
        )


class CanCreateItem(BasePermission):
    message = "You do not have permission to create items."

    def has_permission(self, request, view):
        return (
            request.user.is_authenticated
            and "lms_course.create_item" in request.user.get_all_permissions()
        )


class CanEditItem(BasePermission):
    message = "You do not have permission to edit items."

    def has_permission(self, request, view):
        return (
            request.user.is_authenticated
            and "lms_course.edit_item" in request.user.get_all_permissions()
        )


class CanDeleteItem(BasePermission):
    message = "You do not have permission to delete items."

    def has_permission(self, request, view):
        return (
            request.user.is_authenticated
            and "lms_course.delete_item" in request.user.get_all_permissions()
        )


class CanChangeItemStatus(BasePermission):
    message = "You do not have permission to change the item status."

    def has_permission(self, request, view):
        return (
            request.user.is_authenticated
            and "lms_course.can_change_item_status"
            in request.user.get_all_permissions()
        )


class CanCreateDailyQuiz(BasePermission):
    message = "You do not have permission to create daily quizzes."

    def has_permission(self, request, view):
        return (
            request.user.is_authenticated
            and "lms_course.create_daily_quiz" in request.user.get_all_permissions()
        )


class CanViewDailyQuiz(BasePermission):
    message = "You do not have permission to view daily quizzes."

    def has_permission(self, request, view):
        return (
            request.user.is_authenticated
            and "lms_course.view_daily_quiz" in request.user.get_all_permissions()
        )


"""

No permissons for chapter and lesson created yet

class CanCreateChapter(BasePermission):
    message = "You do not have permission to create chapters."

    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.has_perm(
            "lms_course.add_chapter"
        )


class CanChangeChapter(BasePermission):
    message = "You do not have permission to edit chapters."

    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.has_perm(
            "lms_course.change_chapter"
        )


class CanDeleteChapter(BasePermission):
    message = "You do not have permission to delete chapters."

    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.has_perm(
            "lms_course.delete_chapter"
        )


class CanCreateLesson(BasePermission):
    message = "You do not have permission to create lessons."

    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.has_perm(
            "lms_course.add_lesson"
        )


class CanChangeLesson(BasePermission):
    message = "You do not have permission to edit lessons."

    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.has_perm(
            "lms_course.change_lesson"
        )


class CanDeleteLesson(BasePermission):
    message = "You do not have permission to delete lessons."

    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.has_perm(
            "lms_course.delete_lesson"
        )

"""
