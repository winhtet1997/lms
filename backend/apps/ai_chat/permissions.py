from rest_framework.permissions import BasePermission


class CanManageMathAIMapping(BasePermission):
    message = "You do not have permission to manage Math AI mappings."

    def has_permission(self, request, view):
        return (
            request.user.is_authenticated
            and "lms_ai_chat.manage_mathai_mapping" in request.user.get_all_permissions()
        )
