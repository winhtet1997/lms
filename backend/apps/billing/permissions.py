from rest_framework.permissions import BasePermission


class CanEditSubscriptionPlan(BasePermission):
    message = "You do not have permission to manage subscription plans."

    def has_permission(self, request, view):
        return (
            request.user.is_authenticated
            and "lms_billing.edit_subscription_plan" in request.user.get_all_permissions()
        )


class CanViewEnrollments(BasePermission):
    message = "You do not have permission to view enrollments."

    def has_permission(self, request, view):
        return (
            request.user.is_authenticated
            and "lms_billing.view_enrollment" in request.user.get_all_permissions()
        )


class CanEditEnrollment(BasePermission):
    message = "You do not have permission to manage enrollments."

    def has_permission(self, request, view):
        return (
            request.user.is_authenticated
            and "lms_billing.edit_enrollment" in request.user.get_all_permissions()
        )


class CanViewPaymentTransactions(BasePermission):
    message = "You do not have permission to view payment transactions."

    def has_permission(self, request, view):
        return (
            request.user.is_authenticated
            and "lms_billing.view_payment_transaction" in request.user.get_all_permissions()
        )
