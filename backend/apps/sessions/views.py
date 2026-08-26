import hashlib
import hmac

from django.conf import settings
from django.contrib.auth import get_user_model
from django.utils import timezone
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from drf_spectacular.utils import extend_schema, OpenApiParameter

from . import models, serializers, permissions, daily_client

User = get_user_model()


# ---------------------------------------------------------------------------
# Tutor discovery
# ---------------------------------------------------------------------------

class TutorListView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(responses=serializers.TutorBriefSerializer(many=True))
    def get(self, request):
        tutors = User.objects.filter(role=3, is_active=True)
        data = serializers.TutorBriefSerializer(tutors, many=True).data
        return Response(data)


class TutorAvailabilityView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(responses=serializers.TutorAvailabilitySerializer(many=True))
    def get(self, request, tutor_id):
        slots = models.TutorAvailability.objects.filter(
            tutor_id=tutor_id, is_active=True
        )
        data = serializers.TutorAvailabilitySerializer(slots, many=True).data
        return Response(data)


# ---------------------------------------------------------------------------
# Student: own availability slots (set/update)
# ---------------------------------------------------------------------------

class MyAvailabilityView(APIView):
    permission_classes = [IsAuthenticated, permissions.IsTutor]

    @extend_schema(responses=serializers.TutorAvailabilitySerializer(many=True))
    def get(self, request):
        slots = models.TutorAvailability.objects.filter(tutor=request.user)
        return Response(serializers.TutorAvailabilitySerializer(slots, many=True).data)

    @extend_schema(request=serializers.TutorAvailabilitySerializer)
    def post(self, request):
        serializer = serializers.TutorAvailabilitySerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(tutor=request.user)
        return Response(serializer.data, status=201)


class MyAvailabilityDetailView(APIView):
    permission_classes = [IsAuthenticated, permissions.IsTutor]

    def _get_slot(self, pk, tutor):
        try:
            return models.TutorAvailability.objects.get(pk=pk, tutor=tutor)
        except models.TutorAvailability.DoesNotExist:
            return None

    @extend_schema(request=serializers.TutorAvailabilitySerializer)
    def patch(self, request, pk):
        slot = self._get_slot(pk, request.user)
        if not slot:
            return Response({"error": "Not found."}, status=404)
        serializer = serializers.TutorAvailabilitySerializer(slot, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)

    def delete(self, request, pk):
        slot = self._get_slot(pk, request.user)
        if not slot:
            return Response({"error": "Not found."}, status=404)
        slot.delete()
        return Response(status=204)


# ---------------------------------------------------------------------------
# Session booking (student)
# ---------------------------------------------------------------------------

class SessionListView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(responses=serializers.SessionSerializer(many=True))
    def get(self, request):
        sessions = models.Session.objects.filter(
            host_student=request.user
        ).order_by("-scheduled_at")
        return Response(serializers.SessionSerializer(sessions, many=True).data)

    @extend_schema(request=serializers.BookSessionSerializer, responses=serializers.SessionSerializer)
    def post(self, request):
        serializer = serializers.BookSessionSerializer(
            data=request.data, context={"request": request}
        )
        serializer.is_valid(raise_exception=True)
        session = serializer.save()
        return Response(serializers.SessionSerializer(session).data, status=201)


class SessionDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def _get_session(self, pk):
        try:
            return models.Session.objects.get(pk=pk)
        except models.Session.DoesNotExist:
            return None

    @extend_schema(responses=serializers.SessionSerializer)
    def get(self, request, pk):
        session = self._get_session(pk)
        if not session:
            return Response({"error": "Not found."}, status=404)
        perm = permissions.IsSessionParticipant()
        if not perm.has_object_permission(request, self, session):
            return Response({"error": "Forbidden."}, status=403)
        return Response(serializers.SessionSerializer(session).data)

    def delete(self, request, pk):
        session = self._get_session(pk)
        if not session:
            return Response({"error": "Not found."}, status=404)
        if session.host_student != request.user:
            return Response({"error": "Forbidden."}, status=403)
        if session.status != "pending":
            return Response({"error": "Only pending sessions can be cancelled."}, status=400)
        session.status = "cancelled"
        session.save(update_fields=["status"])
        return Response(status=204)


# ---------------------------------------------------------------------------
# Tutor approval flow
# ---------------------------------------------------------------------------

class TutorPendingSessionsView(APIView):
    permission_classes = [IsAuthenticated, permissions.IsTutor]

    @extend_schema(responses=serializers.SessionSerializer(many=True))
    def get(self, request):
        sessions = models.Session.objects.filter(
            tutor=request.user, status="pending"
        ).order_by("scheduled_at")
        return Response(serializers.SessionSerializer(sessions, many=True).data)


class TutorSessionListView(APIView):
    """All sessions for the logged-in tutor, optionally filtered by status."""
    permission_classes = [IsAuthenticated, permissions.IsTutor]

    @extend_schema(
        parameters=[OpenApiParameter("status", str, description="Filter by status")],
        responses=serializers.SessionSerializer(many=True),
    )
    def get(self, request):
        qs = models.Session.objects.filter(tutor=request.user).order_by("-scheduled_at")
        status = request.query_params.get("status")
        if status:
            qs = qs.filter(status=status)
        return Response(serializers.SessionSerializer(qs, many=True).data)


class TutorSessionStatsView(APIView):
    """Session counts for the logged-in tutor."""
    permission_classes = [IsAuthenticated, permissions.IsTutor]

    def get(self, request):
        qs = models.Session.objects.filter(tutor=request.user)
        return Response({
            "total":     qs.count(),
            "pending":   qs.filter(status="pending").count(),
            "approved":  qs.filter(status="approved").count(),
            "live":      qs.filter(status="live").count(),
            "completed": qs.filter(status="completed").count(),
            "group":     qs.filter(session_type="group").count(),
            "private":   qs.filter(session_type="private").count(),
        })


class ApproveSessionView(APIView):
    permission_classes = [IsAuthenticated, permissions.IsTutor]

    def post(self, request, pk):
        try:
            session = models.Session.objects.get(pk=pk)
        except models.Session.DoesNotExist:
            return Response({"error": "Not found."}, status=404)

        if session.status != "pending":
            return Response({"error": "Only pending sessions can be approved."}, status=400)

        if timezone.now() >= session.scheduled_at:
            return Response({"error": "Cannot approve a session whose scheduled time has already passed."}, status=400)

        try:
            room_name, room_url = daily_client.create_room(session)
        except Exception as e:
            return Response({"error": f"Failed to create Daily room: {str(e)}"}, status=502)

        session.status = "approved"
        session.daily_room_name = room_name
        session.daily_room_url = room_url
        session.save(update_fields=["status", "daily_room_name", "daily_room_url"])

        return Response(serializers.SessionSerializer(session).data)


class RejectSessionView(APIView):
    permission_classes = [IsAuthenticated, permissions.IsTutor]

    def post(self, request, pk):
        try:
            session = models.Session.objects.get(pk=pk)
        except models.Session.DoesNotExist:
            return Response({"error": "Not found."}, status=404)

        if session.status != "pending":
            return Response({"error": "Only pending sessions can be rejected."}, status=400)

        session.status = "rejected"
        session.save(update_fields=["status"])
        return Response({"message": "Session rejected."})


# ---------------------------------------------------------------------------
# Live session
# ---------------------------------------------------------------------------

class JoinSessionView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(responses=serializers.JoinSessionResponseSerializer)
    def post(self, request, pk):
        try:
            session = models.Session.objects.get(pk=pk)
        except models.Session.DoesNotExist:
            return Response({"error": "Not found."}, status=404)

        perm = permissions.IsSessionParticipant()
        if not perm.has_object_permission(request, self, session):
            return Response({"error": "You are not a participant of this session."}, status=403)

        if session.status not in ("approved", "live"):
            return Response({"error": "Session is not ready to join."}, status=400)

        session_end = session.scheduled_at + timezone.timedelta(minutes=session.duration_minutes)
        if timezone.now() > session_end:
            return Response({"error": "This session has already ended."}, status=400)

        is_owner = (request.user == session.tutor)

        if session.status == "approved" and is_owner:
            session.status = "live"
            session.save(update_fields=["status"])

        exp = int(session.scheduled_at.timestamp()) + session.duration_minutes * 60 + 1800

        try:
            token = daily_client.create_meeting_token(
                session.daily_room_name, request.user, is_owner=is_owner, exp=exp
            )
        except Exception as e:
            return Response({"error": f"Failed to create meeting token: {str(e)}"}, status=502)

        return Response({
            "token": token,
            "room_url": session.daily_room_url,
            "room_name": session.daily_room_name,
            "is_owner": is_owner,
        })


class EndSessionView(APIView):
    permission_classes = [IsAuthenticated, permissions.IsTutor]

    def post(self, request, pk):
        try:
            session = models.Session.objects.get(pk=pk, tutor=request.user)
        except models.Session.DoesNotExist:
            return Response({"error": "Not found."}, status=404)

        if session.status != "live":
            return Response({"error": "Session is not live."}, status=400)

        if session.daily_room_name:
            daily_client.delete_room(session.daily_room_name)

        session.status = "completed"
        session.save(update_fields=["status"])
        return Response({"message": "Session ended."})


# ---------------------------------------------------------------------------
# Group sessions
# ---------------------------------------------------------------------------

class GroupSessionCreateView(APIView):
    permission_classes = [IsAuthenticated, permissions.IsTutor]

    @extend_schema(request=serializers.GroupSessionCreateSerializer, responses=serializers.SessionSerializer)
    def post(self, request):
        serializer = serializers.GroupSessionCreateSerializer(
            data=request.data, context={"request": request}
        )
        serializer.is_valid(raise_exception=True)
        session = serializer.save()
        return Response(serializers.SessionSerializer(session).data, status=201)


class RegisterGroupSessionView(APIView):
    permission_classes = [IsAuthenticated, permissions.IsStudent]

    def post(self, request, pk):
        try:
            session = models.Session.objects.get(pk=pk, session_type="group")
        except models.Session.DoesNotExist:
            return Response({"error": "Group session not found."}, status=404)

        if session.status not in ("pending", "approved"):
            return Response({"error": "Cannot register for this session."}, status=400)

        if session.participants.count() >= session.max_participants:
            return Response({"error": "Session is full."}, status=400)

        participant, created = models.SessionParticipant.objects.get_or_create(
            session=session, student=request.user
        )
        if not created:
            return Response({"error": "Already registered."}, status=400)

        return Response({"message": "Registered successfully."}, status=201)


# ---------------------------------------------------------------------------
# Session rating
# ---------------------------------------------------------------------------

class RateSessionView(APIView):
    permission_classes = [IsAuthenticated, permissions.IsStudent]

    @extend_schema(request=serializers.SessionRatingSerializer)
    def post(self, request, pk):
        try:
            session = models.Session.objects.get(pk=pk)
        except models.Session.DoesNotExist:
            return Response({"error": "Not found."}, status=404)

        if session.status != "completed":
            return Response({"error": "Can only rate completed sessions."}, status=400)

        perm = permissions.IsSessionParticipant()
        if not perm.has_object_permission(request, self, session):
            return Response({"error": "Forbidden."}, status=403)

        if hasattr(session, "rating"):
            return Response({"error": "Session already rated."}, status=400)

        serializer = serializers.SessionRatingSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(session=session, student=request.user)
        return Response(serializer.data, status=201)


# ---------------------------------------------------------------------------
# Admin
# ---------------------------------------------------------------------------

class AdminSessionListView(APIView):
    permission_classes = [IsAuthenticated, permissions.IsAdmin]

    @extend_schema(
        parameters=[
            OpenApiParameter("type", str, description="Filter by session_type (private/group)"),
            OpenApiParameter("status", str, description="Filter by status"),
        ],
        responses=serializers.AdminSessionSerializer(many=True),
    )
    def get(self, request):
        qs = models.Session.objects.select_related("tutor", "host_student").order_by("-created_at")
        session_type = request.query_params.get("type")
        status = request.query_params.get("status")
        if session_type:
            qs = qs.filter(session_type=session_type)
        if status:
            qs = qs.filter(status=status)
        return Response(serializers.AdminSessionSerializer(qs, many=True).data)


class AdminSessionStatsView(APIView):
    permission_classes = [IsAuthenticated, permissions.IsAdmin]

    def get(self, request):
        total = models.Session.objects.count()
        group = models.Session.objects.filter(session_type="group").count()
        private = models.Session.objects.filter(session_type="private").count()
        pending = models.Session.objects.filter(status="pending").count()
        live = models.Session.objects.filter(status="live").count()
        completed = models.Session.objects.filter(status="completed").count()
        return Response({
            "total": total,
            "group": group,
            "private": private,
            "pending": pending,
            "live": live,
            "completed": completed,
        })


# ---------------------------------------------------------------------------
# Daily.co webhook
# ---------------------------------------------------------------------------

class DailyWebhookView(APIView):
    permission_classes = []  # Daily.co calls this unauthenticated

    def _verify_signature(self, request):
        secret = settings.DAILY_WEBHOOK_SECRET
        if not secret:
            return True  # skip verification if not configured
        signature = request.headers.get("x-daily-signature", "")
        body = request.body
        digest = hmac.new(secret.encode(), body, hashlib.sha256).hexdigest()
        expected = f"sha256={digest}"
        return hmac.compare_digest(expected, signature)

    def post(self, request):
        if not self._verify_signature(request):
            return Response(status=403)

        event_type = request.data.get("action")
        room_name = request.data.get("room", {}).get("name", "")

        if not room_name:
            return Response(status=200)

        try:
            session = models.Session.objects.get(daily_room_name=room_name)
        except models.Session.DoesNotExist:
            return Response(status=200)

        if event_type == "meeting-ended":
            if session.status == "live":
                if session.daily_room_name:
                    daily_client.delete_room(session.daily_room_name)
                session.status = "completed"
                session.save(update_fields=["status"])

        elif event_type == "recording-started":
            session.recording_status = "recording"
            session.save(update_fields=["recording_status"])

        elif event_type == "recording-stopped":
            session.recording_status = "processing"
            session.save(update_fields=["recording_status"])

        elif event_type == "recording-ready":
            recording_id = request.data.get("recordingId", "")
            recording_url = request.data.get("s3Key", "")
            session.recording_id = recording_id
            session.recording_url = recording_url
            session.recording_status = "finished"
            session.save(update_fields=["recording_id", "recording_url", "recording_status"])

        return Response(status=200)
