import logging
import re

from django.utils import timezone
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from datetime import timedelta
from django.template import loader
from django.contrib.auth import authenticate
from rest_framework.exceptions import AuthenticationFailed
from django.template.defaultfilters import striptags
from django.utils.translation import gettext_lazy as _
from apps.common.utils import message

from . import tasks
from .models import User, UserOTP, USER_ROLES, CustomGroup, CustomGroupMembership

logger = logging.getLogger(__name__)


def _send_verification_mail(user, otp):
    content = loader.render_to_string(
        "auth/verification_mail.txt",
        {
            "user": user,
            "otp": otp,
        },
    )
    message.send_message(
        subject=_("Please Verify your Email Address"),
        to_email=user.email,
        text_content=striptags(content),
        mail_content=content,
    )


def _mask_email(email):
    if not email or "@" not in email:
        return None
    local, domain = email.split("@", 1)
    if len(local) <= 2:
        masked_local = (local[0] if local else "") + "*"
    else:
        masked_local = local[0] + "*" * (len(local) - 2) + local[-1]
    return f"{masked_local}@{domain}"


def _mask_phone(phone):
    if not phone:
        return None
    if len(phone) <= 4:
        return "*" * len(phone)
    return "*" * (len(phone) - 4) + phone[-4:]


def _send_password_reset_mail(user, otp):
    content = loader.render_to_string(
        "auth/password_reset_mail.txt",
        {
            "user": user,
            "otp": otp,
        },
    )
    message.send_message(
        subject=_("Please Verify your Email Address"),
        to_email=user.email,
        text_content=striptags(content),
        mail_content=content,
    )


def _send_verification_sms(user, otp):
    tasks.send_otp_sms_task.delay(user.phone, otp, purpose="verification")


def _send_password_reset_sms(user, otp):
    tasks.send_otp_sms_task.delay(user.phone, otp, purpose="password reset")


def _validate_user(attrs):
    email = attrs.get("email")
    phone = attrs.get("phone")
    username = attrs.get("username")
    password = attrs.get("password")
    confirm_password = attrs.get("confirm_password")

    if not email and not phone:
        raise serializers.ValidationError(_("Email or Phone is required."))

    if not username:
        raise serializers.ValidationError({"username": _("Username is required")})

    if not re.match(r"^[\w.@+-]+$", username):
        raise serializers.ValidationError(
            _("Username can only contain letters, digits " "and @/./+/-/_ characters.")
        )

    if User.objects.filter(username=username).exists():
        raise serializers.ValidationError({"username": _("This Username " "is taken")})

    if email:
        if User.objects.filter(email=email).exists():
            raise serializers.ValidationError(
                {"email": ("User with this email already exists.")}
            )
    if phone:
        if User.objects.filter(phone=phone).exists():
            raise serializers.ValidationError(
                {"phone": ("User with this phone already exists.")}
            )

    if password != confirm_password:
        raise serializers.ValidationError(
            {"confirm_password": _("Passwords do not match.")}
        )

    return attrs


def _create_user(self, validated_data, role=1):
    password = validated_data.pop("password")
    validated_data.pop("confirm_password")
    full_name = validated_data.pop("full_name")
    user = User(**validated_data, role=role, is_active=True, is_verified=False)
    user.set_password(password)
    user.full_name = full_name
    user.save()

    otp_code = UserOTP.generate_otp()
    expires_at = timezone.now() + timedelta(hours=12)

    UserOTP.objects.create(user=user, code=otp_code, expires_at=expires_at, type=1)

    if user.email:
        _send_verification_mail(user, otp_code)
    if user.phone:
        _send_verification_sms(user, otp_code)

    return user


class AuthMessageSerializer(serializers.Serializer):
    message = serializers.CharField()


class ForgotPasswordChannelsSerializer(serializers.Serializer):
    """Step 1 of forgot-password: given a username, tell the frontend which
    masked contact options exist, without sending anything yet. This is what
    lets the user choose email vs phone — and, critically, it means an
    attacker needs to already know a real *username* to even discover which
    channels exist, instead of being able to blast an OTP at any email/phone
    they happen to know."""

    username = serializers.CharField(required=True)

    def validate(self, attrs):
        username = attrs.get("username")
        attrs["user"] = User.objects.filter(username=username).first()
        return attrs

    @staticmethod
    def get_channels(user):
        channels = []
        if user and user.is_verified:
            if user.email:
                channels.append({"type": "email", "masked": _mask_email(user.email)})
            if user.phone:
                channels.append({"type": "phone", "masked": _mask_phone(user.phone)})
        return channels


class ForgotPasswordSerializer(serializers.Serializer):
    username = serializers.CharField(required=True)
    channel = serializers.ChoiceField(
        choices=[("email", "email"), ("phone", "phone")], required=True
    )

    def validate(self, attrs):
        username = attrs.get("username")
        channel = attrs.get("channel")

        user = User.objects.filter(username=username).first()
        if not user:
            raise serializers.ValidationError(
                _("Unable to send code. Please check your username.")
            )
        if not user.is_verified:
            raise serializers.ValidationError(
                _("User is not verified. Please verify your account first.")
            )
        if channel == "email" and not user.email:
            raise serializers.ValidationError(_("This account has no email on file."))
        if channel == "phone" and not user.phone:
            raise serializers.ValidationError(
                _("This account has no phone number on file.")
            )

        attrs["user"] = user
        return attrs

    def create(self, validated_data):
        user = validated_data["user"]
        channel = validated_data["channel"]
        now = timezone.now()
        last_24h = now - timedelta(hours=24)
        otp_count = UserOTP.objects.filter(user=user, created_at__gte=last_24h).count()
        if otp_count >= 5:
            raise serializers.ValidationError(
                _("OTP request limit exceeded. Try again later.")
            )
        for otp in UserOTP.objects.filter(user=user, is_valid=True):
            otp.is_valid = False
            otp.save()
        otp_code = UserOTP.generate_otp()
        expires_at = now + timedelta(minutes=10)
        UserOTP.objects.create(user=user, code=otp_code, expires_at=expires_at, type=0)

        if channel == "email":
            _send_password_reset_mail(user, otp_code)
            masked = _mask_email(user.email)
        else:
            _send_password_reset_sms(user, otp_code)
            masked = _mask_phone(user.phone)

        return {"message": _("OTP sent successfully."), "masked_contact": masked}


class PasswordResetSerializer(serializers.Serializer):
    password = serializers.CharField(write_only=True, min_length=6)
    confirm_password = serializers.CharField(write_only=True, min_length=6)
    otp = serializers.CharField(required=True)
    username = serializers.CharField(required=False)
    email = serializers.EmailField(required=False)
    phone = serializers.CharField(required=False)

    def validate(self, attrs):
        password = attrs.get("password")
        confirm_password = attrs.get("confirm_password")
        otp = attrs.get("otp")
        username = attrs.get("username")
        email = attrs.get("email")
        phone = attrs.get("phone")

        if not username and not email and not phone:
            raise serializers.ValidationError(
                _("Username, email, or phone is required.")
            )

        user = None
        if username:
            user = User.objects.filter(username=username).first()
        elif email:
            user = User.objects.filter(email=email).first()
        elif phone:
            user = User.objects.filter(phone=phone).first()

        otp_record = None
        if user:
            otp_record = UserOTP.objects.filter(
                user=user, code=otp, is_valid=True, type=0
            ).first()

        if not otp_record or otp_record.is_expired():
            raise serializers.ValidationError({"otp": _("Invalid or expired OTP.")})

        attrs["user"] = user
        if password != confirm_password:
            raise serializers.ValidationError(
                {"confirm_password": _("Passwords do not match.")}
            )
        otp_record.delete()
        return attrs

    def create(self, validated_data):
        user = validated_data["user"]
        password = validated_data["password"]
        user.set_password(password)
        user.save()
        UserOTP.objects.filter(user=user).delete()
        return {"message": _("Password reset successfully.")}


class VerifyOtpSerializer(serializers.Serializer):
    otp = serializers.CharField(required=True)
    username = serializers.CharField(required=False)
    email = serializers.EmailField(required=False)
    phone = serializers.CharField(required=False)

    def validate(self, attrs):
        username = attrs.get("username")
        email = attrs.get("email")
        phone = attrs.get("phone")
        otp = attrs.get("otp")

        if not username and not email and not phone:
            raise serializers.ValidationError(
                _("Username, email, or phone is required.")
            )

        user = None
        if username:
            user = User.objects.filter(username=username).first()
        elif email:
            user = User.objects.filter(email=email).first()
        elif phone:
            user = User.objects.filter(phone=phone).first()

        otp_record = None
        if user:
            otp_record = UserOTP.objects.filter(
                user=user, code=otp, is_valid=True
            ).first()

        if not otp_record or otp_record.is_expired():
            raise serializers.ValidationError({"otp": _("Invalid or expired OTP.")})

        if otp_record.type == 1:
            user.is_verified = True
            user.save()
            attrs["user"] = user
            otp_record.delete()

        return attrs


def _resolve_login_identifier(identifier):
    """Allow logging in with either a username or an email address."""
    if identifier and "@" in identifier:
        user = User.objects.filter(email__iexact=identifier).first()
        if user:
            return user.username
    return identifier


def _check_suspended(username, password):
    try:
        user = User.objects.get(username=username)
        if not user.is_active and user.check_password(password):
            raise AuthenticationFailed({"detail": _("Account is suspended.")})
    except User.DoesNotExist:
        pass


class SuperadminTokenSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        username = _resolve_login_identifier(attrs.get("username"))
        password = attrs.get("password")
        attrs["username"] = username

        user = authenticate(
            request=self.context.get("request"),
            username=username,
            password=password,
        )

        if not user:
            _check_suspended(username, password)
            raise AuthenticationFailed(
                {"detail": _("Username or password did " "not match.")}
            )
        # has_perm() routes through Django's ModelBackend which bypasses our
        # CustomGroup override, so we call get_all_permissions() directly.
        # Superusers are short-circuited here since the superuser bypass only
        # lives in has_perm(), not in get_all_permissions().
        if (
            not user.is_superuser
            and "lms_auth.view_dashboard" not in user.get_all_permissions()
        ):
            raise AuthenticationFailed(
                {
                    "detail": _(
                        "You do not have permission to " "access the admin portal."
                    )
                }
            )

        data = super().validate(attrs)
        return data


class StudentTokenSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        username = _resolve_login_identifier(attrs.get("username"))
        password = attrs.get("password")
        attrs["username"] = username

        user = authenticate(
            request=self.context.get("request"),
            username=username,
            password=password,
        )

        if not user:
            _check_suspended(username, password)
            raise AuthenticationFailed(
                {"detail": _("Username or password did " "not match.")}
            )

        if not user.is_verified:
            detail_data = {
                "detail": _("User is not verified."),
                "is_verified": False,
            }
            if user.email:
                detail_data["email"] = user.email
            if user.phone:
                detail_data["phone"] = user.phone
            raise AuthenticationFailed(detail_data)

        if user.role != 1:
            raise serializers.ValidationError({"detail": _("User is not a student.")})

        data = super().validate(attrs)
        return data


class ParentTokenSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        username = _resolve_login_identifier(attrs.get("username"))
        password = attrs.get("password")
        attrs["username"] = username

        user = authenticate(
            request=self.context.get("request"),
            username=username,
            password=password,
        )

        if not user:
            _check_suspended(username, password)
            raise AuthenticationFailed(
                {"detail": _("Username or password did " "not match.")}
            )
        if not user.is_verified:
            detail_data = {
                "detail": _("User is not verified."),
                "is_verified": False,
            }
            if user.email:
                detail_data["email"] = user.email
            if user.phone:
                detail_data["phone"] = user.phone
            raise AuthenticationFailed(detail_data)

        if user.role != 2:
            raise serializers.ValidationError({"detail": _("User is not a parent.")})

        data = super().validate(attrs)
        return data


class TutorTokenSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        username = _resolve_login_identifier(attrs.get("username"))
        password = attrs.get("password")
        attrs["username"] = username

        user = authenticate(
            request=self.context.get("request"),
            username=username,
            password=password,
        )

        if not user:
            _check_suspended(username, password)
            raise AuthenticationFailed(
                {"detail": _("Username or password did " "not match.")}
            )
        if not user.is_verified:
            raise AuthenticationFailed(
                {"detail": _("User is not verified."), "is_verified": False}
            )
        if user.role != 3:
            raise serializers.ValidationError({"detail": _("User is not a tutor.")})

        data = super().validate(attrs)
        return data


class RegisterStudentSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=6)
    confirm_password = serializers.CharField(write_only=True, min_length=6)
    full_name = serializers.CharField(max_length=127, required=True)
    grade_level = serializers.CharField(max_length=15, required=True)
    email = serializers.EmailField(required=False, allow_null=True, allow_blank=True)
    phone = serializers.CharField(required=False, allow_null=True, allow_blank=True)

    class Meta:
        model = User
        fields = (
            "username",
            "full_name",
            "email",
            "phone",
            "password",
            "confirm_password",
            "grade_level",
        )
        extra_kwargs = {
            "username": {"validators": []},
        }

    def validate(self, attrs):
        return _validate_user(attrs)

    def create(self, validated_data):
        user = _create_user(self, validated_data, role=1)
        return user


class RegisterParentSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=6)
    confirm_password = serializers.CharField(write_only=True, min_length=6)
    full_name = serializers.CharField(max_length=127, required=True)
    email = serializers.EmailField(required=False, allow_null=True, allow_blank=True)
    phone = serializers.CharField(required=False, allow_null=True, allow_blank=True)

    class Meta:
        model = User
        fields = (
            "username",
            "full_name",
            "email",
            "phone",
            "password",
            "confirm_password",
        )
        extra_kwargs = {
            "username": {"validators": []},
        }

    def validate(self, attrs):
        return _validate_user(attrs)

    def create(self, validated_data):
        user = _create_user(self, validated_data, role=2)
        return user


class RegisterTutorSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=6)
    confirm_password = serializers.CharField(write_only=True, min_length=6)
    full_name = serializers.CharField(max_length=127, required=True)
    email = serializers.EmailField(required=False, allow_null=True, allow_blank=True)
    phone = serializers.CharField(required=False, allow_null=True, allow_blank=True)

    class Meta:
        model = User
        fields = (
            "username",
            "full_name",
            "email",
            "phone",
            "password",
            "confirm_password",
        )
        extra_kwargs = {
            "username": {"validators": []},
        }

    def validate(self, attrs):
        return _validate_user(attrs)

    def create(self, validated_data):
        user = _create_user(self, validated_data, role=3)
        return user


class ResendOtpSerializer(serializers.Serializer):
    username = serializers.CharField(required=False)
    email = serializers.EmailField(required=False)
    phone = serializers.CharField(required=False)
    channel = serializers.ChoiceField(
        choices=[("email", "email"), ("phone", "phone")], required=False
    )
    otp_type = serializers.ChoiceField(
        choices=[("reset", "reset"), ("verify", "verify")], required=True
    )

    def validate(self, attrs):
        username = attrs.get("username")
        email = attrs.get("email")
        phone = attrs.get("phone")
        if not username and not email and not phone:
            raise serializers.ValidationError(
                _("Username, email, or phone is required.")
            )
        user = None
        if username:
            user = User.objects.filter(username=username).first()
        elif email:
            user = User.objects.filter(email=email).first()
        elif phone:
            user = User.objects.filter(phone=phone).first()
        if not user:
            raise serializers.ValidationError(
                _("User not found with the provided information.")
            )
        if attrs["otp_type"] == "verify" and user.is_verified:
            raise serializers.ValidationError(_("User is already verified."))
        attrs["user"] = user
        return attrs

    def create(self, validated_data):
        user = validated_data["user"]
        otp_type = validated_data["otp_type"]
        channel = validated_data.get("channel")
        now = timezone.now()
        last_24h = now - timedelta(hours=24)
        otp_count = UserOTP.objects.filter(user=user, created_at__gte=last_24h).count()
        if otp_count >= 5:
            raise serializers.ValidationError(
                _("OTP request limit exceeded. Try again later.")
            )
        for otp in UserOTP.objects.filter(user=user, is_valid=True):
            otp.is_valid = False
            otp.save()
        otp_code = UserOTP.generate_otp()
        if otp_type == "reset":
            expires_at = now + timedelta(minutes=10)
            UserOTP.objects.create(
                user=user, code=otp_code, expires_at=expires_at, type=0
            )
            if channel == "phone":
                _send_password_reset_sms(user, otp_code)
            elif channel == "email":
                _send_password_reset_mail(user, otp_code)
            else:
                if user.email:
                    _send_password_reset_mail(user, otp_code)
                if user.phone:
                    _send_password_reset_sms(user, otp_code)
        else:
            expires_at = now + timedelta(hours=12)
            UserOTP.objects.create(
                user=user, code=otp_code, expires_at=expires_at, type=1
            )
            if user.email:
                _send_verification_mail(user, otp_code)
            if user.phone:
                _send_verification_sms(user, otp_code)
        return {"message": _("OTP sent successfully.")}


class ChildSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = (
            "id",
            "username",
            "full_name",
            "email",
            "phone",
            "grade_level",
            "is_active",
            "avatar",
        )
        read_only_fields = fields


class CreateChildSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=6)
    confirm_password = serializers.CharField(write_only=True, min_length=6)

    class Meta:
        model = User
        fields = (
            "username",
            "full_name",
            "email",
            "phone",
            "password",
            "confirm_password",
            "grade_level",
        )
        extra_kwargs = {
            "username": {"validators": []},
            "email": {"validators": []},
            "phone": {"validators": []},
        }

    def validate(self, attrs):
        return _validate_user(attrs)

    def create(self, validated_data):
        validated_data.pop("confirm_password")
        password = validated_data.pop("password")
        full_name = validated_data.pop("full_name")
        user = User(
            **validated_data,
            role=1,
            parent=self.context["request"].user,
            is_active=False,
            is_verified=True,
        )
        user.full_name = full_name
        user.set_password(password)
        user.save()
        return user


class LinkChildSerializer(serializers.Serializer):
    username = serializers.CharField()

    def validate_username(self, value):
        try:
            user = User.objects.get(username=value)
        except User.DoesNotExist:
            raise serializers.ValidationError(_("User not found."))
        if user.role != 1:
            raise serializers.ValidationError(
                _("Only student accounts can be linked as children.")
            )
        if user.parent_id:
            raise serializers.ValidationError(
                _("This user is already linked to a parent.")
            )
        return value

    def save(self):
        user = User.objects.get(username=self.validated_data["username"])
        user.parent = self.context["request"].user
        user.save(update_fields=["parent"])
        return user


class AdminCreateUserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)

    class Meta:
        model = User
        fields = (
            "full_name",
            "username",
            "email",
            "password",
            "role",
            "is_active",
            "grade_level",
        )
        extra_kwargs = {
            "username": {"validators": []},
            "email": {"validators": []},
        }

    def validate_username(self, value):
        if not re.match(r"^[\w.@+-]+$", value):
            raise serializers.ValidationError(
                _("Username may only contain letters, digits and @/./+/-/_")
            )
        if User.objects.filter(username=value).exists():
            raise serializers.ValidationError(_("This username is already taken."))
        return value

    def validate_email(self, value):
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError(_("User with this email already exists."))
        return value

    def validate_role(self, value):
        valid_roles = [r[0] for r in USER_ROLES]
        if value not in valid_roles:
            raise serializers.ValidationError(_("Invalid role."))
        requesting_user = self.context["request"].user
        if value == 999 and requesting_user.role != 999:
            raise serializers.ValidationError(
                _("You do not have permission to assign the Superadmin role.")
            )
        return value

    def create(self, validated_data):
        password = validated_data.pop("password")
        user = User(is_verified=True, **validated_data)
        user.set_password(password)
        user.save()
        return user


class GoogleAuthSerializer(serializers.Serializer):
    id_token = serializers.CharField()
    role = serializers.IntegerField()

    def validate_role(self, value):
        valid = [r[0] for r in USER_ROLES if r[0] not in (0, 999)]
        if value not in valid:
            raise serializers.ValidationError(_("Invalid role."))
        return value


class GoogleCompleteSetupSerializer(serializers.Serializer):
    temp_token = serializers.CharField()
    username = serializers.CharField(min_length=3, max_length=30)
    password = serializers.CharField(write_only=True, min_length=6)
    confirm_password = serializers.CharField(write_only=True, min_length=6)
    full_name = serializers.CharField(max_length=127, required=True)
    grade_level = serializers.CharField(max_length=15, required=False)

    def validate_username(self, value):
        if not re.match(r"^[\w.@+-]+$", value):
            raise serializers.ValidationError(
                _(
                    "Username can only contain letters, digits "
                    "and @/./+/-/_ characters."
                )
            )
        if User.objects.filter(username=value).exists():
            raise serializers.ValidationError(_("This username is taken."))
        return value

    def validate(self, attrs):
        if attrs["password"] != attrs["confirm_password"]:
            raise serializers.ValidationError(
                {"confirm_password": _("Passwords do not match.")}
            )
        return attrs


class UpdateMeSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["full_name", "username", "email", "phone", "grade_level", "avatar", "dob", "gender"]
        extra_kwargs = {
            "username": {"validators": []},
            "email": {"validators": [], "required": False},
        }

    def validate_username(self, value):
        if not re.match(r"^[\w.@+-]+$", value):
            raise serializers.ValidationError(
                _(
                    "Username can only contain letters, digits "
                    "and @/./+/-/_ characters."
                )
            )
        if User.objects.filter(username=value).exclude(pk=self.instance.pk).exists():
            raise serializers.ValidationError(_("This username is already taken."))
        return value

    def validate_email(self, value):
        if User.objects.filter(email=value).exclude(pk=self.instance.pk).exists():
            raise serializers.ValidationError(
                _("A user with this email already exists.")
            )
        return value


class UserSerializer(serializers.ModelSerializer):
    role = serializers.SerializerMethodField()
    date_joined = serializers.SerializerMethodField()
    last_active = serializers.SerializerMethodField()
    permissions = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            "id",
            "username",
            "full_name",
            "email",
            "role",
            "phone",
            "is_verified",
            "is_active",
            "date_joined",
            "last_active",
            "permissions",
            "grade_level",
            "avatar",
            "dob",
            "gender",
        ]

    def get_permissions(self, obj):
        return list(obj.get_all_permissions())

    def get_role(self, obj) -> str:
        return obj.get_role_display()

    def get_date_joined(self, obj) -> str:
        return obj.date_joined.strftime("%Y-%m-%d")

    def get_last_active(self, obj) -> str | None:
        if not obj.last_login:
            return None
        delta = timezone.now() - obj.last_login
        seconds = int(delta.total_seconds())
        if seconds < 60:
            return f"{seconds} seconds ago"
        elif seconds < 3600:
            return f"{seconds // 60} minutes ago"
        elif seconds < 86400:
            return f"{seconds // 3600} hours ago"
        else:
            return f"{seconds // 86400} days ago"


# ---------------------------------------------------------------------------
# Custom Group serializers
# ---------------------------------------------------------------------------


class PermissionSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    name = serializers.CharField()
    codename = serializers.CharField()
    app_label = serializers.SerializerMethodField()

    def get_app_label(self, obj):
        return obj.content_type.app_label


class CustomGroupListSerializer(serializers.ModelSerializer):
    user_count = serializers.SerializerMethodField()
    permission_count = serializers.SerializerMethodField()

    class Meta:
        model = CustomGroup
        fields = [
            "id",
            "name",
            "description",
            "user_count",
            "permission_count",
            "created_at",
            "updated_at",
        ]

    def get_user_count(self, obj):
        return obj.memberships.count()

    def get_permission_count(self, obj):
        return obj.permissions.count()


class CustomGroupDetailSerializer(serializers.ModelSerializer):
    permissions = PermissionSerializer(many=True, read_only=True)
    users = serializers.SerializerMethodField()
    user_count = serializers.SerializerMethodField()
    permission_count = serializers.SerializerMethodField()

    class Meta:
        model = CustomGroup
        fields = [
            "id",
            "name",
            "description",
            "permissions",
            "users",
            "user_count",
            "permission_count",
            "created_at",
            "updated_at",
        ]

    def get_users(self, obj):
        return [
            {
                "id": m.user.id,
                "username": m.user.username,
                "full_name": m.user.full_name,
                "email": m.user.email,
                "role": m.user.get_role_display(),
            }
            for m in obj.memberships.select_related("user").all()
        ]

    def get_user_count(self, obj):
        return obj.memberships.count()

    def get_permission_count(self, obj):
        return obj.permissions.count()


class CustomGroupWriteSerializer(serializers.ModelSerializer):
    permission_ids = serializers.ListField(
        child=serializers.IntegerField(), write_only=True, required=False, default=list
    )
    user_ids = serializers.ListField(
        child=serializers.IntegerField(), write_only=True, required=False, default=list
    )

    class Meta:
        model = CustomGroup
        fields = ["name", "description", "permission_ids", "user_ids"]

    def create(self, validated_data):
        from django.contrib.auth.models import Permission

        permission_ids = validated_data.pop("permission_ids", [])
        user_ids = validated_data.pop("user_ids", [])
        group = CustomGroup.objects.create(**validated_data)
        if permission_ids:
            group.permissions.set(Permission.objects.filter(id__in=permission_ids))
        for uid in user_ids:
            try:
                user = User.objects.get(pk=uid)
                CustomGroupMembership.objects.get_or_create(user=user, group=group)
            except User.DoesNotExist:
                pass
        return group

    def update(self, instance, validated_data):
        from django.contrib.auth.models import Permission

        permission_ids = validated_data.pop("permission_ids", None)
        user_ids = validated_data.pop("user_ids", None)
        instance.name = validated_data.get("name", instance.name)
        instance.description = validated_data.get("description", instance.description)
        instance.save()
        if permission_ids is not None:
            instance.permissions.set(Permission.objects.filter(id__in=permission_ids))
        if user_ids is not None:
            instance.memberships.all().delete()
            for uid in user_ids:
                try:
                    user = User.objects.get(pk=uid)
                    CustomGroupMembership.objects.create(user=user, group=instance)
                except User.DoesNotExist:
                    pass
        return instance
