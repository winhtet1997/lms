from rest_framework.permissions import BasePermission


class IsTutor(BasePermission):
    message = "Only tutors can perform this action."

    def has_permission(self, request, view):
        return (request.user.is_authenticated and request.user.role == 3) or (request.user.is_authenticated and request.user.role == 999)


class IsStudent(BasePermission):
    message = "Only students can perform this action."

    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 1


class IsAdmin(BasePermission):
    message = "Only superadmins can perform this action."

    def has_permission(self, request, view):
        return (request.user.is_authenticated and request.user.role == 999) or "lms_auth.view_session" not in request.user.get_all_permissions()


class IsSessionParticipant(BasePermission):
    message = "You are not a participant of this session."

    def has_object_permission(self, request, view, obj):
        user = request.user
        if user == obj.tutor or user == obj.host_student or user.role == 999:
            return True
        return obj.participants.filter(student=user).exists()



class CanCreateSession(BasePermission):
    message = "You do not have permission to create a session."

    def has_permission(self, request, view):
        return (
            request.user.is_authenticated
            and "lms_sessions.can_create_session"
            in request.user.get_all_permissions()
        )
    

class CanViewSession(BasePermission):
    message = "You do not have permission to view a session."

    def has_permission(self, request, view):
        return (
            request.user.is_authenticated
            and "lms_sessions.can_view_session"
            in request.user.get_all_permissions()
        )

class CanEditSession(BasePermission):
    message = "You do not have permission to edit a session."

    def has_permission(self, request, view):
        return (
            request.user.is_authenticated
            and "lms_sessions.can_edit_session"
            in request.user.get_all_permissions()
        )
    
class CanDeleteSession(BasePermission):
    message = "You do not have permission to delete a session."

    def has_permission(self, request, view):
        return (
            request.user.is_authenticated
            and "lms_sessions.can_delete_session"
            in request.user.get_all_permissions()
        )