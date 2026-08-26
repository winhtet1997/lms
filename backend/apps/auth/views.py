from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.throttling import ScopedRateThrottle
from drf_spectacular.utils import extend_schema, OpenApiParameter
from django.utils.translation import gettext_lazy as _
from django.core import signing
from django.conf import settings
from rest_framework import status

from django.db.models import Q

from . import serializers, models

GOOGLE_SETUP_MAX_AGE = 900  # 15 minutes


class SuperadminLoginAPIView(TokenObtainPairView):
    serializer_class = serializers.SuperadminTokenSerializer


class StudentLoginAPIView(TokenObtainPairView):
    serializer_class = serializers.StudentTokenSerializer


class ParentLoginAPIView(TokenObtainPairView):
    serializer_class = serializers.ParentTokenSerializer


class TutorLoginAPIView(TokenObtainPairView):
    serializer_class = serializers.TutorTokenSerializer


class StudentRegisterAPIView(APIView):
    permission_classes = [AllowAny]

    @extend_schema(
        request=serializers.RegisterStudentSerializer,
        responses={
            201: serializers.AuthMessageSerializer,
            400: serializers.RegisterStudentSerializer,
        },
    )
    def post(self, request):
        serializer = serializers.RegisterStudentSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=400)

        serializer.save()
        return Response(
            {
                "message": _(
                    "An OTP has been sent to your " "email/phone for verification."
                )
            },
            status=200,
        )


class ParentRegisterAPIView(APIView):
    permission_classes = [AllowAny]

    @extend_schema(
        request=serializers.RegisterParentSerializer,
        responses={
            201: serializers.AuthMessageSerializer,
            400: serializers.RegisterParentSerializer,
        },
    )
    def post(self, request):
        serializer = serializers.RegisterParentSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=400)

        serializer.save()
        return Response(
            {
                "message": _(
                    "An OTP has been sent to your " "email/phone for verification."
                )
            },
            status=200,
        )


class TutorRegisterAPIView(APIView):
    permission_classes = [AllowAny]

    @extend_schema(
        request=serializers.RegisterTutorSerializer,
        responses={
            201: serializers.AuthMessageSerializer,
            400: serializers.RegisterTutorSerializer,
        },
    )
    def post(self, request):
        serializer = serializers.RegisterTutorSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=400)

        serializer.save()
        return Response(
            {
                "message": _(
                    "An OTP has been sent to your " "email/phone for verification."
                )
            },
            status=200,
        )


class ForgotPasswordChannelsAPIView(APIView):
    """Step 1 of forgot-password: given a username, returns which masked
    contact options (email/phone) are available, without sending anything.
    Deliberately requires the username (not email/phone) so a user can't
    trigger an OTP send to any contact they merely know — they have to
    also know the account's username."""

    permission_classes = [AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "otp_request"

    @extend_schema(
        request=serializers.ForgotPasswordChannelsSerializer,
        responses={200: serializers.ForgotPasswordChannelsSerializer},
    )
    def post(self, request):
        serializer = serializers.ForgotPasswordChannelsSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=400)
        user = serializer.validated_data.get("user")
        channels = serializers.ForgotPasswordChannelsSerializer.get_channels(user)
        return Response({"channels": channels}, status=200)


class ForgotPasswordOtpAPIView(APIView):
    permission_classes = [AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "otp_request"

    @extend_schema(
        request=serializers.ForgotPasswordSerializer,
        responses={
            201: serializers.AuthMessageSerializer,
            400: serializers.ForgotPasswordSerializer,
        },
    )
    def post(self, request):
        serializer = serializers.ForgotPasswordSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=400)
        result = serializer.save()
        return Response(result, status=200)


class ResetPasswordAPIView(APIView):
    permission_classes = [AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "otp_verify"

    @extend_schema(
        request=serializers.PasswordResetSerializer,
        responses={
            200: serializers.AuthMessageSerializer,
            400: serializers.PasswordResetSerializer,
        },
    )
    def post(self, request):
        serializer = serializers.PasswordResetSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=400)
        serializer.save()
        return Response({"message": "Password reset successfully."}, status=200)


class VerifyOtpAPIView(APIView):
    permission_classes = [AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "otp_verify"

    @extend_schema(
        request=serializers.VerifyOtpSerializer,
        responses={
            200: serializers.AuthMessageSerializer,
            400: serializers.VerifyOtpSerializer,
        },
    )
    def post(self, request):
        serializer = serializers.VerifyOtpSerializer(data=request.data)

        if not serializer.is_valid():
            return Response(serializer.errors, status=400)

        return Response({"message": _("Otp verified successfully.")}, status=200)


class ResendVerificationOtpAPIView(APIView):
    permission_classes = [AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "otp_request"

    @extend_schema(
        request=serializers.ResendOtpSerializer,
        responses={
            200: serializers.AuthMessageSerializer,
            400: serializers.ResendOtpSerializer,
        },
    )
    def post(self, request):
        serializer = serializers.ResendOtpSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=400)
        serializer.save()
        return Response({"message": _("OTP sent successfully.")}, status=200)


class GoogleAuthAPIView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = serializers.GoogleAuthSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=400)

        raw_token = serializer.validated_data["id_token"]
        role = serializer.validated_data["role"]

        try:
            from google.oauth2 import id_token as google_id_token
            from google.auth.transport import requests as google_requests

            idinfo = google_id_token.verify_oauth2_token(
                raw_token,
                google_requests.Request(),
                settings.GOOGLE_CLIENT_ID,
            )
        except ValueError as e:
            return Response({"detail": str(e)}, status=400)

        google_id = idinfo["sub"]
        email = idinfo.get("email")
        full_name = idinfo.get("name", "")

        PORTAL_MAP = {1: "student", 2: "parents", 3: "tutor"}

        # Case A: google_id already linked to an account
        user = models.User.objects.filter(google_id=google_id).first()
        if user:
            if user.role != role:
                return Response(
                    {
                        "wrong_portal": True,
                        "correct_portal": PORTAL_MAP.get(user.role),
                        "detail": _(
                            "This Google account belongs to a different portal."
                        ),
                    },
                    status=400,
                )
            refresh = RefreshToken.for_user(user)
            return Response(
                {
                    "access": str(refresh.access_token),
                    "refresh": str(refresh),
                    "user": {"id": user.id, "email": user.email, "role": user.role},
                }
            )

        # Case B: existing account with same email and role — link google_id
        if email:
            user = models.User.objects.filter(email=email, role=role).first()
            if user:
                user.google_id = google_id
                user.save()
                refresh = RefreshToken.for_user(user)
                return Response(
                    {
                        "access": str(refresh.access_token),
                        "refresh": str(refresh),
                        "user": {"id": user.id, "email": user.email, "role": user.role},
                    }
                )

            # Case B2: email exists but under a different role — wrong portal
            other_user = (
                models.User.objects.filter(email=email).exclude(role=role).first()
            )
            if other_user:
                return Response(
                    {
                        "wrong_portal": True,
                        "correct_portal": PORTAL_MAP.get(other_user.role),
                        "detail": _(
                            "This Google account belongs to a different portal."
                        ),
                    },
                    status=400,
                )

        # Case C: new user — return temp token for setup step
        temp_payload = {
            "google_id": google_id,
            "email": email,
            "full_name": full_name,
            "role": role,
        }
        temp_token = signing.dumps(temp_payload, salt="google-auth-setup")
        return Response(
            {
                "needs_setup": True,
                "temp_token": temp_token,
                "email": email,
                "full_name": full_name,
            }
        )


class GoogleCompleteSetupAPIView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = serializers.GoogleCompleteSetupSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=400)

        temp_token = serializer.validated_data["temp_token"]
        username = serializer.validated_data["username"]
        password = serializer.validated_data["password"]
        full_name = serializer.validated_data["full_name"]

        try:
            payload = signing.loads(
                temp_token,
                salt="google-auth-setup",
                max_age=GOOGLE_SETUP_MAX_AGE,
            )
        except signing.SignatureExpired:
            return Response(
                {
                    "detail": _(
                        "Setup session expired. Please sign in with Google again."
                    )
                },
                status=400,
            )
        except signing.BadSignature:
            return Response({"detail": _("Invalid token.")}, status=400)

        google_id = payload["google_id"]
        email = payload["email"]
        role = payload["role"]

        if models.User.objects.filter(google_id=google_id).exists():
            return Response({"detail": _("Account already exists.")}, status=400)

        user = models.User(
            username=username,
            email=email,
            full_name=full_name,
            role=role,
            is_active=True,
            is_verified=True,
            google_id=google_id,
        )
        user.set_password(password)
        if user.role == 1:
            grade_level = serializer.validated_data["grade_level"]
            user.grade_level = grade_level
        user.save()

        refresh = RefreshToken.for_user(user)
        return Response(
            {
                "access": str(refresh.access_token),
                "refresh": str(refresh),
                "user": {"id": user.id, "email": user.email, "role": user.role},
            }
        )


class MeApiView(APIView):
    permission_classes = [IsAuthenticated]
    serializer_class = serializers.UserSerializer

    def get(self, request):
        serializer = serializers.UserSerializer(request.user)
        return Response(serializer.data)

    def patch(self, request):
        serializer = serializers.UpdateMeSerializer(
            request.user, data=request.data, partial=True
        )
        if not serializer.is_valid():
            return Response(serializer.errors, status=400)
        serializer.save()
        return Response(serializers.UserSerializer(request.user).data, status=200)


class UserListApiView(APIView):
    permission_classes = [IsAuthenticated]
    serializer_class = serializers.UserSerializer

    @extend_schema(
        parameters=[
            OpenApiParameter(
                name="search",
                description="Search by username or email",
                required=False,
                type=str,
                location=OpenApiParameter.QUERY,
            ),
            OpenApiParameter(
                name="role",
                description="Filter by role (1=student, 2=parent, 3=tutor, 4=admin)",
                required=False,
                type=int,
                location=OpenApiParameter.QUERY,
            ),
            OpenApiParameter(
                name="is_active",
                description="Filter by active status (true/false)",
                required=False,
                type=str,
                location=OpenApiParameter.QUERY,
            ),
            OpenApiParameter(
                name="ordering",
                description="Sort order: 'newest' (default) or 'oldest'",
                required=False,
                type=str,
                location=OpenApiParameter.QUERY,
            ),
            OpenApiParameter(
                name="page",
                description="Page number (default: 1)",
                required=False,
                type=int,
                location=OpenApiParameter.QUERY,
            ),
            OpenApiParameter(
                name="page_size",
                description="Users per page (default: 10, max: 100)",
                required=False,
                type=int,
                location=OpenApiParameter.QUERY,
            ),
        ],
        responses={200: serializers.UserSerializer(many=True)},
        operation_id="list_users",
    )
    def get(self, request):
        if "lms_auth.view_user" not in request.user.get_all_permissions():
            return Response({"error": "You do not have permission"}, status=403)

        search = request.query_params.get("search", "").strip()
        role_filter = request.query_params.get("role", "").strip()
        is_active_filter = request.query_params.get("is_active", "").strip()
        ordering = request.query_params.get("ordering", "newest").strip()

        try:
            page = max(1, int(request.query_params.get("page", 1)))
            page_size = max(1, int(request.query_params.get("page_size", 9999)))
        except (ValueError, TypeError):
            page, page_size = 1, 9999

        all_users = models.User.objects.all()
        users = models.User.objects.all()

        if search:
            users = users.filter(
                Q(username__icontains=search) | Q(email__icontains=search)
            )
        if role_filter:
            users = users.filter(role=role_filter)
        if is_active_filter.lower() in ("true", "false"):
            users = users.filter(is_active=is_active_filter.lower() == "true")

        if ordering == "oldest":
            users = users.order_by("date_joined")
        else:
            users = users.order_by("-date_joined")

        total_count = users.count()
        total_pages = max(1, (total_count + page_size - 1) // page_size)
        page = min(page, total_pages)

        start = (page - 1) * page_size
        users_page = users[start : start + page_size]

        serializer = self.serializer_class(users_page, many=True)
        return Response(
            {
                "total_users": all_users.count(),
                "total_students": all_users.filter(role=1).count(),
                "total_tutors": all_users.filter(role=3).count(),
                "total_parents": all_users.filter(role=2).count(),
                "inactive_users": all_users.filter(is_active=False).count(),
                "total_count": total_count,
                "total_pages": total_pages,
                "page": page,
                "page_size": page_size,
                "users": serializer.data,
            }
        )

    def post(self, request):
        if "lms_auth.create_user" not in request.user.get_all_permissions():
            return Response({"error": "Permission denied"}, status=403)
        serializer = serializers.AdminCreateUserSerializer(
            data=request.data, context={"request": request}
        )
        if not serializer.is_valid():
            return Response(serializer.errors, status=400)
        user = serializer.save()
        return Response(self.serializer_class(user).data, status=201)


class UserDetailApiView(APIView):
    permission_classes = [IsAuthenticated]
    serializer_class = serializers.UserSerializer

    @extend_schema(
        request=serializers.UserSerializer,
        responses={
            200: serializers.AuthMessageSerializer,
            400: serializers.UserSerializer,
        },
        operation_id="retrieve_user",
    )
    def get(self, request, pk):
        user = models.User.objects.get(pk=pk)
        if "lms_auth.view_user" not in request.user.get_all_permissions() and request.user != user:
            return Response({"error": "Permission denied"}, status=403)
        serializer = self.serializer_class(user)
        return Response(serializer.data)

    @extend_schema(
        request=serializers.UserSerializer,
        responses={
            200: serializers.UserSerializer,
            400: serializers.UserSerializer,
        },
        operation_id="update_user",
    )
    def patch(self, request, pk):
        user = models.User.objects.get(pk=pk)
        if (
            request.user == user
            or "lms_auth.edit_user" in request.user.get_all_permissions()
        ):
            serializer = self.serializer_class(user, data=request.data, partial=True)
            if not serializer.is_valid():
                return Response(serializer.errors, status=400)
            serializer.save()
            return Response(serializer.data, status=200)
        return Response({"error": "Permission denied"}, status=403)

    def delete(self, request, pk):
        user = models.User.objects.get(pk=pk)

        if (
            request.user == user
            or request.user.role > user.role
            or "lms_auth.delete_user" in request.user.get_all_permissions()
        ):
            user.delete()
            return Response(
                {"message": "User deleted successfully."},
                status=status.HTTP_204_NO_CONTENT,
            )

        return Response({"error": "Permission denied"}, status=403)


class ChildrenListApiView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if request.user.role != 2:
            return Response({"error": "Only parent accounts have children."}, status=403)
        children = models.User.objects.filter(parent=request.user)
        return Response(serializers.ChildSerializer(children, many=True).data)

    def post(self, request):
        if request.user.role != 2:
            return Response({"error": "Only parent accounts can add children."}, status=403)
        serializer = serializers.CreateChildSerializer(
            data=request.data, context={"request": request}
        )
        if not serializer.is_valid():
            return Response(serializer.errors, status=400)
        child = serializer.save()
        return Response(serializers.ChildSerializer(child).data, status=201)

#.........Linking children to parent account and searching for children by parents....................................
class ChildSearchApiView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if request.user.role != 2:
            return Response({"error": "Only parent accounts can search for children."}, status=403)
        search = request.query_params.get("search", "").strip()
        if len(search) < 2:
            return Response([])
        students = models.User.objects.filter(
            Q(username__icontains=search) | Q(email__icontains=search),
            role=1, parent__isnull=True,
        ).order_by("username")[:10]
        return Response(serializers.ChildSerializer(students, many=True).data)


class LinkChildApiView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        if request.user.role != 2:
            return Response({"error": "Only parent accounts can link children."}, status=403)
        serializer = serializers.LinkChildSerializer(
            data=request.data, context={"request": request}
        )
        if not serializer.is_valid():
            return Response(serializer.errors, status=400)
        child = serializer.save()
        return Response(serializers.ChildSerializer(child).data, status=200)


class ChildUnlinkApiView(APIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request, pk):
        if request.user.role != 2:
            return Response({"error": "Only parent accounts can unlink children."}, status=403)
        try:
            child = models.User.objects.get(pk=pk, role=1)
        except models.User.DoesNotExist:
            return Response({"error": "Child not found."}, status=404)
        if child.parent_id != request.user.id:
            return Response({"error": "This child is not linked to your account."}, status=403)
        child.parent = None
        child.save(update_fields=["parent"])
        return Response(status=204)


# ---------------------------------------------------------------------------
# Custom Group views  (superadmin only)
# ---------------------------------------------------------------------------


class CustomGroupListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if request.user.role != 999:
            return Response({"error": "Permission denied"}, status=403)
        groups = models.CustomGroup.objects.prefetch_related(
            "memberships", "permissions"
        ).all()
        return Response(serializers.CustomGroupListSerializer(groups, many=True).data)

    def post(self, request):
        if request.user.role != 999:
            return Response({"error": "Permission denied"}, status=403)
        serializer = serializers.CustomGroupWriteSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=400)
        group = serializer.save()
        return Response(serializers.CustomGroupDetailSerializer(group).data, status=201)


class CustomGroupDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def _get_group(self, pk):
        try:
            return models.CustomGroup.objects.prefetch_related(
                "memberships__user", "permissions__content_type"
            ).get(pk=pk)
        except models.CustomGroup.DoesNotExist:
            return None

    def get(self, request, pk):
        if request.user.role != 999:
            return Response({"error": "Permission denied"}, status=403)
        group = self._get_group(pk)
        if group is None:
            return Response({"error": "Not found"}, status=404)
        return Response(serializers.CustomGroupDetailSerializer(group).data)

    def patch(self, request, pk):
        if request.user.role != 999:
            return Response({"error": "Permission denied"}, status=403)
        group = self._get_group(pk)
        if group is None:
            return Response({"error": "Not found"}, status=404)
        serializer = serializers.CustomGroupWriteSerializer(
            group, data=request.data, partial=True
        )
        if not serializer.is_valid():
            return Response(serializer.errors, status=400)
        group = serializer.save()
        return Response(serializers.CustomGroupDetailSerializer(group).data)

    def delete(self, request, pk):
        if request.user.role != 999:
            return Response({"error": "Permission denied"}, status=403)
        group = self._get_group(pk)
        if group is None:
            return Response({"error": "Not found"}, status=404)
        group.delete()
        return Response(status=204)


class AvailablePermissionsView(APIView):
    """Returns all Django permissions grouped by app label."""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        if request.user.role != 999:
            return Response({"error": "Permission denied"}, status=403)
        from django.contrib.auth.models import Permission

        perms = (
            Permission.objects.select_related("content_type")
            .filter(content_type__model__endswith="dashboard")
            .order_by("content_type__app_label", "codename")
        )
        grouped = {}
        for perm in perms:
            app = perm.content_type.app_label
            if app not in grouped:
                grouped[app] = []
            grouped[app].append(
                {
                    "id": perm.id,
                    "name": perm.name,
                    "codename": perm.codename,
                    "app_label": app,
                }
            )
        return Response(grouped)
