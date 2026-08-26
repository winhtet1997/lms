from django.shortcuts import get_object_or_404
from drf_spectacular.utils import extend_schema
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.course.models import Chapter, Course

from . import mathai_client, serializers
from .access import has_course_chat_access
from .models import ChapterMathAIMapping, ChatThread, CourseMathAIMapping
from .permissions import CanManageMathAIMapping


class SubjectListView(APIView):
    """GET /api/ai-chat/subjects/ — proxy Math AI's own subject list.

    Used by the frontend's optional "Branches Of Math" subject picker. No
    enrollment gating — it's just curriculum metadata, not a chat.
    """

    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            result = mathai_client.list_subjects()
        except mathai_client.MathAIError as exc:
            return Response({"detail": str(exc)}, status=exc.status_code or 502)
        return Response(result or {"data": []})


class SubjectDetailView(APIView):
    """GET /api/ai-chat/subjects/<subject_id>/ — proxy Math AI's subject
    detail, which carries that subject's lessons array. Used by the
    mapping dashboard to populate a chapter's lesson picker. Response
    shape beyond `data` isn't documented anywhere, so callers should read
    `data.get("lessons")` defensively.
    """

    permission_classes = [IsAuthenticated]

    def get(self, request, subject_id):
        try:
            result = mathai_client.get_subject(subject_id)
        except mathai_client.MathAIError as exc:
            return Response({"detail": str(exc)}, status=exc.status_code or 502)
        return Response(result or {"data": {}})


class AccessCheckView(APIView):
    """Check access WITHOUT creating a thread or calling Math AI.

    GET /ai-chat/access/?chapter_id=<int>  (chapter-scoped check)
    GET /ai-chat/access/?course_id=<int>   (course-scoped check)
    GET /ai-chat/access/                   (global — always allowed)

    Used by the "Ask AI" button so it can show a locked message right on
    the current page instead of routing into the chat UI and failing there.
    """

    permission_classes = [IsAuthenticated]

    def get(self, request):
        chapter_id = request.query_params.get("chapter_id")
        course_id = request.query_params.get("course_id")

        if chapter_id:
            chapter = get_object_or_404(Chapter, pk=chapter_id)
            course = chapter.course
            if not has_course_chat_access(request.user, course):
                return Response(
                    {
                        "allowed": False,
                        "detail": (
                            "Ask AI is a premium feature. An active paid "
                            "enrollment in this course is required."
                        ),
                        "course_id": course.id,
                    },
                    status=403,
                )
            if not ChapterMathAIMapping.objects.filter(
                chapter=chapter, mathai_lesson_id__gt=""
            ).exists():
                return Response(
                    {
                        "allowed": False,
                        "detail": (
                            "This chapter is not yet linked to Math AI. An "
                            "admin needs to add a ChapterMathAIMapping for it."
                        ),
                        "course_id": course.id,
                    },
                    status=400,
                )
            return Response({"allowed": True, "can_send": True, "course_id": course.id})

        if course_id:
            course = get_object_or_404(Course, pk=course_id)
            if not has_course_chat_access(request.user, course):
                return Response(
                    {
                        "allowed": False,
                        "detail": (
                            "Ask AI is a premium feature. An active paid "
                            "enrollment is required."
                        ),
                        "course_id": course.id,
                    },
                    status=403,
                )
            if not CourseMathAIMapping.objects.filter(course=course).exists():
                return Response(
                    {
                        "allowed": False,
                        "detail": (
                            "This course is not yet linked to Math AI. An "
                            "admin needs to add a CourseMathAIMapping for it."
                        ),
                        "course_id": course.id,
                    },
                    status=400,
                )
            return Response({"allowed": True, "can_send": True, "course_id": course.id})

        return Response({"allowed": True, "can_send": True, "course_id": None})


class StartThreadView(APIView):
    """Create a new chat thread, or resume the most recent one for this
    scope.

    POST body: {"chapter_id"?, "course_id"?, "subject_id"?, "new_chat"?}

    - chapter_id present -> chapter scope, wins over course_id/subject_id.
    - course_id present (no chapter_id) -> course scope.
    - neither -> global scope, always allowed.
    - new_chat=true -> always creates a brand-new thread for this scope,
      even if older ones exist. Default: resumes the most recently updated
      existing thread for this scope, else creates the first one.

    Math AI only creates a chat once a message is actually sent (see
    ThreadMessageView.post) — this just creates/resumes our own local row;
    mathai_chat_id stays null until then.
    """

    permission_classes = [IsAuthenticated]

    @extend_schema(
        request=serializers.StartThreadRequestSerializer,
        responses={200: serializers.ChatThreadSerializer},
    )
    def post(self, request):
        req = serializers.StartThreadRequestSerializer(data=request.data)
        req.is_valid(raise_exception=True)
        chapter_id = req.validated_data.get("chapter_id")
        course_id = req.validated_data.get("course_id")
        subject_id = req.validated_data.get("subject_id")
        new_chat = req.validated_data.get("new_chat", False)

        if chapter_id:
            chapter = get_object_or_404(Chapter, pk=chapter_id)
            course = chapter.course
            if not has_course_chat_access(request.user, course):
                return Response(
                    {
                        "detail": (
                            "Ask AI is a premium feature. An active paid "
                            "enrollment in this course is required."
                        ),
                        "course_id": course.id,
                    },
                    status=403,
                )
            mapping = ChapterMathAIMapping.objects.filter(chapter=chapter).first()
            if not mapping or not mapping.mathai_lesson_id:
                return Response(
                    {
                        "detail": (
                            "This chapter is not yet linked to Math AI. An "
                            "admin needs to add a ChapterMathAIMapping for it."
                        ),
                        "course_id": course.id,
                    },
                    status=400,
                )
            course_mapping = CourseMathAIMapping.objects.filter(course=course).first()
            lookup = dict(user=request.user, scope="lesson", chapter=chapter, is_archived=False)
            existing = (
                None
                if new_chat
                else ChatThread.objects.filter(**lookup).order_by("-updated_at").first()
            )
            thread = existing or ChatThread.objects.create(
                **lookup,
                course=course,
                mathai_subject_id=course_mapping.mathai_subject_id if course_mapping else None,
                mathai_lesson_id=mapping.mathai_lesson_id,
                title=str(chapter),
            )
            status_code = 200 if existing else 201
            return Response(serializers.ChatThreadSerializer(thread).data, status=status_code)

        if course_id:
            course = get_object_or_404(Course, pk=course_id)
            if not has_course_chat_access(request.user, course):
                return Response(
                    {
                        "detail": (
                            "Ask AI is a premium feature. An active paid "
                            "enrollment is required."
                        ),
                        "course_id": course.id,
                    },
                    status=403,
                )
            if not subject_id:
                course_mapping = CourseMathAIMapping.objects.filter(course=course).first()
                if not course_mapping:
                    return Response(
                        {
                            "detail": (
                                "This course is not yet linked to Math AI. An "
                                "admin needs to add a CourseMathAIMapping for it."
                            ),
                            "course_id": course.id,
                        },
                        status=400,
                    )
                subject_id = course_mapping.mathai_subject_id
            lookup = dict(
                user=request.user,
                scope="course",
                course=course,
                is_archived=False,
            )
            existing = (
                None
                if new_chat
                else ChatThread.objects.filter(**lookup).order_by("-updated_at").first()
            )
            thread = existing or ChatThread.objects.create(
                **lookup, mathai_subject_id=subject_id, title=str(course)
            )
            status_code = 200 if existing else 201
            return Response(serializers.ChatThreadSerializer(thread).data, status=status_code)

        lookup = dict(user=request.user, scope="global", is_archived=False)
        existing = (
            None
            if new_chat
            else ChatThread.objects.filter(**lookup).order_by("-updated_at").first()
        )
        thread = existing or ChatThread.objects.create(
            **lookup, mathai_subject_id=subject_id, title="General"
        )
        status_code = 200 if existing else 201
        return Response(serializers.ChatThreadSerializer(thread).data, status=status_code)


class ThreadListView(APIView):
    """GET /ai-chat/threads/?chapter_id=&course_id=&subject_id=

    Lists the current user's own, non-archived threads that have actually
    sent a message, most recently active first. No filter -> global scope
    only (not every scope mixed together).
    """

    permission_classes = [IsAuthenticated]

    @extend_schema(responses={200: serializers.ChatThreadSerializer(many=True)})
    def get(self, request):
        threads = ChatThread.objects.filter(
            user=request.user, is_archived=False, mathai_chat_id__isnull=False
        )

        chapter_id = request.query_params.get("chapter_id")
        course_id = request.query_params.get("course_id")
        subject_id = request.query_params.get("subject_id")
        if chapter_id:
            threads = threads.filter(scope="lesson", chapter_id=chapter_id)
        elif course_id:
            threads = threads.filter(scope="course", course_id=course_id)
            if subject_id:
                threads = threads.filter(mathai_subject_id=subject_id)
        else:
            threads = threads.filter(scope="global")

        threads = threads.order_by("-updated_at")
        return Response(serializers.ChatThreadSerializer(threads, many=True).data)


class ThreadDetailView(APIView):
    """DELETE /ai-chat/threads/<thread_id>/ — soft-delete a thread.

    Just flips is_archived — the row (and the conversation on Math AI's
    side) isn't destroyed, it just stops appearing in the sidebar.
    """

    permission_classes = [IsAuthenticated]

    def delete(self, request, thread_id):
        thread = get_object_or_404(ChatThread, pk=thread_id, user=request.user)
        thread.is_archived = True
        thread.save(update_fields=["is_archived", "updated_at"])
        return Response(status=204)


class ThreadMessageView(APIView):
    """GET the thread's message history; POST a new message into it."""

    permission_classes = [IsAuthenticated]

    def get_thread(self, request, thread_id):
        return get_object_or_404(ChatThread, pk=thread_id, user=request.user)

    def _check_access(self, user, thread):
        if thread.scope == "global":
            return None
        if not thread.course or not has_course_chat_access(user, thread.course):
            return Response(
                {
                    "detail": (
                        "Ask AI is a premium feature. An active paid "
                        "enrollment is required."
                    ),
                    "course_id": thread.course_id,
                },
                status=403,
            )
        return None

    @extend_schema(responses={200: serializers.ChatMessageSerializer(many=True)})
    def get(self, request, thread_id):
        thread = self.get_thread(request, thread_id)
        error_response = self._check_access(request.user, thread)
        if error_response:
            return error_response
        if not thread.mathai_chat_id:
            return Response([])
        try:
            result = mathai_client.get_chat_detail(thread.mathai_chat_id)
        except mathai_client.MathAIError as exc:
            return Response({"detail": str(exc)}, status=exc.status_code or 502)
        messages = ((result or {}).get("data") or {}).get("messages") or []
        return Response(messages)

    @extend_schema(
        request=serializers.SendMessageRequestSerializer,
        responses={200: serializers.SendMessageResponseSerializer},
    )
    def post(self, request, thread_id):
        thread = self.get_thread(request, thread_id)
        error_response = self._check_access(request.user, thread)
        if error_response:
            return error_response

        req = serializers.SendMessageRequestSerializer(data=request.data)
        req.is_valid(raise_exception=True)
        message = req.validated_data["message"]
        language = req.validated_data.get("language") or "en"

        try:
            if not thread.mathai_chat_id:
                result = mathai_client.create_chat(
                    message=message,
                    external_user_id=str(request.user.id),
                    language=language,
                    subject_id=thread.mathai_subject_id,
                    lesson_id=thread.mathai_lesson_id,
                )
                chat_id = mathai_client.extract_chat_id(result)
                if not chat_id:
                    return Response({"detail": "Math AI did not return a chat_id."}, status=502)
                thread.mathai_chat_id = chat_id
                thread.save(update_fields=["mathai_chat_id", "updated_at"])
            else:
                mathai_client.send_message(thread.mathai_chat_id, message, language=language)
                thread.save(update_fields=["updated_at"])

            history = mathai_client.get_chat_detail(thread.mathai_chat_id)
        except mathai_client.MathAIError as exc:
            return Response({"detail": str(exc)}, status=exc.status_code or 502)

        reply = mathai_client.get_last_assistant_reply(history)
        if reply is None:
            return Response({"detail": "Could not parse Math AI's reply."}, status=502)

        return Response({"reply": reply})


class CourseMappingListView(APIView):
    """GET /api/ai-chat/course-mappings/ — every course with its current
    Math AI subject mapping (null if unmapped). Powers the admin dashboard's
    course-mapping table.
    """

    permission_classes = [CanManageMathAIMapping]

    def get(self, request):
        courses = Course.objects.select_related("mathai_mapping").order_by(
            "grade_level", "id"
        )
        data = [
            {
                "course_id": course.id,
                "course_title": str(course),
                "grade_level": course.grade_level,
                "mathai_subject_id": (
                    mapping.mathai_subject_id
                    if (mapping := getattr(course, "mathai_mapping", None))
                    else None
                ),
            }
            for course in courses
        ]
        return Response(data)


class CourseMappingDetailView(APIView):
    """PATCH sets/overwrites a course's Math AI subject mapping;
    DELETE clears it."""

    permission_classes = [CanManageMathAIMapping]

    def patch(self, request, course_id):
        course = get_object_or_404(Course, pk=course_id)
        subject_id = (request.data.get("mathai_subject_id") or "").strip()
        if not subject_id:
            return Response({"detail": "mathai_subject_id is required."}, status=400)
        mapping, _ = CourseMathAIMapping.objects.update_or_create(
            course=course, defaults={"mathai_subject_id": subject_id}
        )
        return Response(
            {"course_id": course.id, "mathai_subject_id": mapping.mathai_subject_id}
        )

    def delete(self, request, course_id):
        CourseMathAIMapping.objects.filter(course_id=course_id).delete()
        return Response(status=204)


class ChapterMappingListView(APIView):
    """GET /api/ai-chat/chapter-mappings/?course_id=<id> — a course's
    chapters with their current Math AI lesson mapping. `mathai_subject_id`
    at the top level is null when the course itself isn't mapped yet, which
    the frontend uses to block chapter mapping until that's done first
    (mirrors StartThreadView's own hard block for unmapped chapters).
    """

    permission_classes = [CanManageMathAIMapping]

    def get(self, request):
        course_id = request.query_params.get("course_id")
        if not course_id:
            return Response({"detail": "course_id is required."}, status=400)
        course = get_object_or_404(
            Course.objects.select_related("mathai_mapping"), pk=course_id
        )
        course_mapping = getattr(course, "mathai_mapping", None)
        chapters = Chapter.objects.filter(course=course).select_related(
            "mathai_mapping"
        ).order_by("priority_index")
        return Response(
            {
                "course_id": course.id,
                "course_title": str(course),
                "mathai_subject_id": (
                    course_mapping.mathai_subject_id if course_mapping else None
                ),
                "chapters": [
                    {
                        "chapter_id": chapter.id,
                        "chapter_title": str(chapter),
                        "mathai_lesson_id": (
                            mapping.mathai_lesson_id
                            if (mapping := getattr(chapter, "mathai_mapping", None))
                            else ""
                        ),
                    }
                    for chapter in chapters
                ],
            }
        )


class ChapterMappingDetailView(APIView):
    """PATCH sets/overwrites a chapter's Math AI lesson mapping;
    DELETE clears it."""

    permission_classes = [CanManageMathAIMapping]

    def patch(self, request, chapter_id):
        chapter = get_object_or_404(Chapter, pk=chapter_id)
        lesson_id = (request.data.get("mathai_lesson_id") or "").strip()
        mapping, _ = ChapterMathAIMapping.objects.update_or_create(
            chapter=chapter, defaults={"mathai_lesson_id": lesson_id}
        )
        return Response(
            {"chapter_id": chapter.id, "mathai_lesson_id": mapping.mathai_lesson_id}
        )

    def delete(self, request, chapter_id):
        ChapterMathAIMapping.objects.filter(chapter_id=chapter_id).delete()
        return Response(status=204)
