from django.contrib.auth import get_user_model
from django.db.models import Q
from django.http import Http404
from drf_spectacular.utils import extend_schema, OpenApiParameter
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.exceptions import ValidationError
from apps.course import models as course_models
from . import serializers, models, permissions, payments

User = get_user_model()


def _resolve_child(request, child_id):
    """A parent may only act on behalf of their own children."""
    return User.objects.filter(pk=child_id, parent=request.user).first()


class SubscriptionPlanListApiView(APIView):
    serializer_class = serializers.SubscriptionPlanSerializer

    def get_permissions(self):
        if self.request.method == "GET":
            return [AllowAny()]
        return [permissions.CanEditSubscriptionPlan()]

    @extend_schema(
        parameters=[
            OpenApiParameter(
                name="course_id",
                description="Filter plans to a single course",
                required=False,
                type=int,
                location=OpenApiParameter.QUERY,
            ),
        ],
    )
    def get(self, request):
        course_id = request.query_params.get("course_id")
        can_manage = request.user.is_authenticated and (
            "lms_billing.view_subscription_plan" in request.user.get_all_permissions()
            or "lms_billing.edit_subscription_plan" in request.user.get_all_permissions()
        )
        plans = models.SubscriptionPlan.objects.all() if can_manage else (
            models.SubscriptionPlan.objects.filter(is_active=True)
        )
        if course_id:
            plans = plans.filter(course_id=course_id)
        serializer = self.serializer_class(plans, many=True)
        return Response(serializer.data)

    def post(self, request):
        serializer = self.serializer_class(data=request.data)
        if serializer.is_valid():
            plan = serializer.save()
            return Response(self.serializer_class(plan).data, status=201)
        return Response(serializer.errors, status=400)


class SubscriptionPlanDetailApiView(APIView):
    serializer_class = serializers.SubscriptionPlanSerializer

    def get_permissions(self):
        if self.request.method == "GET":
            return [AllowAny()]
        return [permissions.CanEditSubscriptionPlan()]

    def get(self, request, pk):
        try:
            plan = models.SubscriptionPlan.objects.get(pk=pk)
        except models.SubscriptionPlan.DoesNotExist:
            return Response({"error": "Plan not found"}, status=404)
        return Response(self.serializer_class(plan).data)

    def patch(self, request, pk):
        try:
            plan = models.SubscriptionPlan.objects.get(pk=pk)
        except models.SubscriptionPlan.DoesNotExist:
            return Response({"error": "Plan not found"}, status=404)
        serializer = self.serializer_class(plan, data=request.data, partial=True)
        if serializer.is_valid():
            plan = serializer.save()
            return Response(self.serializer_class(plan).data)
        return Response(serializer.errors, status=400)

    def delete(self, request, pk):
        try:
            plan = models.SubscriptionPlan.objects.get(pk=pk)
        except models.SubscriptionPlan.DoesNotExist:
            return Response({"error": "Plan not found"}, status=404)
        plan.delete()
        return Response({"message": "Plan deleted successfully"}, status=204)


class MyEnrollmentApiView(APIView):
    """GET /api/billing/enrollments/me/ — the current user's enrollment(s).
    Pass ?course_id=<id> for a single course's status; omit it to get every
    enrollment the user has, across all courses. Pass ?child_id=<id> to check
    a linked child's enrollment instead (parent accounts only)."""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        course_id = request.query_params.get("course_id")
        child_id = request.query_params.get("child_id")

        target_user = request.user
        if child_id:
            target_user = _resolve_child(request, child_id)
            if not target_user:
                return Response({"error": "Child not found."}, status=404)

        if not course_id:
            enrollments = list(
                models.Enrollment.objects
                .filter(user=target_user)
                .select_related("plan", "course")
                .order_by("-is_active", "-expires_at")
            )
            for enrollment in enrollments:
                enrollment.sync_active_status()
            return Response(
                serializers.EnrollmentSerializer(enrollments, many=True).data
            )

        enrollment = models.Enrollment.objects.filter(
            user=target_user, course_id=course_id
        ).first()
        if not enrollment:
            return Response({"enrolled": False, "is_active": False})

        is_active = enrollment.sync_active_status()
        return Response({
            "enrolled": True,
            **serializers.EnrollmentSerializer(enrollment).data,
            "is_active": is_active,
        })


class EnrollmentListApiView(APIView):
    """POST /api/billing/enrollments/ — create a pending enrollment for the
    current user. `is_active` stays False until an admin activates it (or,
    later, until a payment gateway confirms payment)."""

    serializer_class = serializers.EnrollmentSerializer

    def get_permissions(self):
        if self.request.method == "GET":
            return [permissions.CanViewEnrollments()]
        return [IsAuthenticated()]

    def get(self, request):
        enrollments = models.Enrollment.objects.all()
        course_id = request.query_params.get("course_id")
        if course_id:
            enrollments = enrollments.filter(course_id=course_id)
        serializer = self.serializer_class(enrollments, many=True)
        return Response(serializer.data)

    def post(self, request):
        course_id = request.data.get("course")
        plan_id = request.data.get("plan")

        try:
            course = course_models.Course.objects.get(pk=course_id)
        except (course_models.Course.DoesNotExist, TypeError, ValueError):
            return Response({"error": "Course not found."}, status=404)

        plan = None
        if plan_id:
            plan = models.SubscriptionPlan.objects.filter(pk=plan_id, course=course).first()
            if not plan:
                return Response({"error": "Plan not found for this course."}, status=404)

        # Only staff holding edit_enrollment may enroll someone else or
        # activate on creation — everyone else always enrolls themselves,
        # pending, exactly like before.
        can_manage = "lms_billing.edit_enrollment" in request.user.get_all_permissions()

        target_user = request.user
        requested_user_id = request.data.get("user")
        if can_manage and requested_user_id:
            try:
                target_user = User.objects.get(pk=requested_user_id)
            except User.DoesNotExist:
                return Response({"error": "User not found."}, status=404)

        defaults = {"plan": plan}
        if can_manage and "is_active" in request.data:
            defaults["is_active"] = bool(request.data.get("is_active"))

        enrollment, created = models.Enrollment.objects.get_or_create(
            user=target_user, course=course, defaults=defaults
        )
        if not created:
            update_fields = []
            if plan:
                if enrollment.started_at and enrollment.plan_id != plan.id:
                    return Response(
                        {
                            "plan": [
                                "Plan is locked once the enrollment has "
                                "been activated. Use a renewal/purchase to "
                                "change it."
                            ]
                        },
                        status=400,
                    )
                enrollment.plan = plan
                update_fields.append("plan")
            if can_manage and "is_active" in request.data:
                enrollment.is_active = bool(request.data.get("is_active"))
                update_fields.append("is_active")
            if update_fields:
                enrollment.save(update_fields=update_fields)

        return Response(
            serializers.EnrollmentSerializer(enrollment).data,
            status=201 if created else 200,
        )


class EnrollmentDetailApiView(APIView):
    """GET/PATCH /api/billing/enrollments/<pk>/ — admin view and edit of a
    single enrollment (plan and active status)."""

    serializer_class = serializers.EnrollmentSerializer

    def get_permissions(self):
        if self.request.method == "GET":
            return [permissions.CanViewEnrollments()]
        return [permissions.CanEditEnrollment()]

    def get(self, request, pk):
        try:
            enrollment = models.Enrollment.objects.get(pk=pk)
        except models.Enrollment.DoesNotExist:
            return Response({"error": "Enrollment not found"}, status=404)
        return Response(self.serializer_class(enrollment).data)

    def patch(self, request, pk):
        try:
            enrollment = models.Enrollment.objects.get(pk=pk)
        except models.Enrollment.DoesNotExist:
            return Response({"error": "Enrollment not found"}, status=404)
        serializer = self.serializer_class(enrollment, data=request.data, partial=True)
        if serializer.is_valid():
            enrollment = serializer.save()
            return Response(self.serializer_class(enrollment).data)
        return Response(serializer.errors, status=400)


class InitializePaymentApiView(APIView):
    """POST /api/billing/payments/initialize/ — start a Dinger checkout for a
    subscription plan. Self-serve by default; pass `child_id` for a parent to
    buy access for one of their linked children instead."""

    permission_classes = [IsAuthenticated]

    def post(self, request):
        plan_id = request.data.get("plan_id")
        if not plan_id:
            return Response({"success": False, "message": "plan_id is required."}, status=400)

        target_user = None
        child_id = request.data.get("child_id")
        if child_id:
            target_user = _resolve_child(request, child_id)
            if not target_user:
                return Response({"success": False, "message": "Child not found."}, status=404)

        try:
            result = payments.initialize_payment(request.user, plan_id, target_user=target_user)
        except Http404:
            return Response(
                {"success": False, "message": "Subscription plan not found."}, status=404
            )
        except ValidationError as e:
            return Response(
                {"success": False, "message": str(e.detail[0]) if hasattr(e, "detail") else str(e)},
                status=400,
            )
        except Exception as e:
            return Response({"success": False, "message": str(e)}, status=500)

        return Response({
            "checkout_url": result["checkout_url"],
            "order_number": result["transaction"].order_number,
        })


class PaymentStatusApiView(APIView):
    """GET /api/billing/payments/status/<order_number>/ — poll a payment's
    status and whether it has activated the resulting enrollment."""

    permission_classes = [IsAuthenticated]

    def get(self, request, order_number):
        transaction = (
            models.PaymentTransaction.objects
            .select_related("plan__course")
            .filter(Q(payer=request.user) | Q(user=request.user), order_number=order_number)
            .first()
        )
        if not transaction:
            return Response({"success": False, "message": "Transaction not found"}, status=404)

        enrollment = models.Enrollment.objects.filter(
            user=transaction.user, course=transaction.plan.course
        ).first()

        return Response({
            "success": True,
            "order_number": transaction.order_number,
            "status": transaction.status,
            "failure_reason": transaction.failure_reason,
            "enrollment_active": bool(enrollment and enrollment.sync_active_status()),
            "course_id": transaction.plan.course_id,
        })


class DingerCallbackApiView(APIView):
    """POST /api/billing/payments/callback/ — Dinger's server-to-server
    payment result callback."""

    permission_classes = [AllowAny]

    def post(self, request):
        payment_result = request.data.get("paymentResult")
        checksum = request.data.get("checksum")

        if not payment_result or not checksum:
            return Response({"success": False, "message": "Missing callback data"}, status=400)

        try:
            payload = payments.process_callback(payment_result, checksum)
            return Response({
                "success": True,
                "transactionStatus": payload.get("transactionStatus"),
            })
        except ValueError as e:
            return Response({"success": False, "message": str(e)}, status=400)
        except Exception:
            return Response(
                {"success": False, "message": "Unable to process payment callback."}, status=500
            )


class PaymentTransactionListApiView(APIView):
    """GET /api/billing/payment-transactions/ — read-only list for admins.
    Transactions are a system-generated audit trail; there's no create/edit/
    delete here, only viewing."""

    permission_classes = [permissions.CanViewPaymentTransactions]

    def get(self, request):
        transactions = (
            models.PaymentTransaction.objects
            .select_related("payer", "user", "plan__course")
            .order_by("-created_at")
        )
        serializer = serializers.PaymentTransactionSerializer(transactions, many=True)
        return Response(serializer.data)
