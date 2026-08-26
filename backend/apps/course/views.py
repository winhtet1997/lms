import re
import random
import logging

logger = logging.getLogger(__name__)
from django.utils import timezone
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from drf_spectacular.utils import extend_schema, OpenApiParameter
from botocore.exceptions import ClientError
from . import serializers, models, permissions
from django.conf import settings
from .s3 import get_s3_client
from apps.billing.access import has_chapter_access
from apps.billing.models import Enrollment, SubscriptionPlan

_POSITIONAL_TAG = re.compile(r"^(grade|chapter|lesson)-\d+$")


class ApplyCourseTagsAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, course_id):
        try:
            course = models.Course.objects.get(id=course_id)
        except models.Course.DoesNotExist:
            return Response({"error": "Course not found."}, status=404)

        if not course.grade_level:
            return Response(
                {"message": "Course has no grade level; no tags applied."},
                status=200,
            )

        """
            Step 1: strip all stale positional tags from every item in this
             course
        """
        course_items = (
            models.Item.objects.filter(lesson__chapter__course=course)
            .distinct()
            .prefetch_related("tags")
        )
        for item in course_items:
            stale = [t.name for t in item.tags.all() if _POSITIONAL_TAG.match(t.name)]
            if stale:
                item.tags.remove(*stale)

        # Step 2: re-apply correct tags based on current chapter/lesson order
        for chapter_order, chapter in enumerate(
            course.chapters.order_by("priority_index"), start=1
        ):
            for lesson_order, lesson in enumerate(
                chapter.lessons.order_by("priority_index"), start=1
            ):
                tags = [
                    f"grade-{course.grade_level}",
                    f"chapter-{chapter_order}",
                    f"lesson-{lesson_order}",
                ]
                for item in lesson.items.all():
                    item.tags.add(*tags)

        return Response({"message": "Tags applied successfully."}, status=200)


class SubjectListApiView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        subjects = models.Subject.objects.all()
        data = serializers.SubjectSerializer(subjects, many=True).data
        return Response(data)


class CourseListApiView(APIView):
    # Do not change the serializer_class
    serializer_class = serializers.CourseBasicDetailSerializer

    def get_permissions(self):
        if self.request.method == "GET":
            return [AllowAny()]
        if self.request.method == "POST":
            return [permissions.CanCreateCourse()]

    @extend_schema(
        request=serializers.CourseBasicDetailSerializer,
        parameters=[
            OpenApiParameter(
                name="Accept-Language",
                description="Language code (en, bn, my, no)",
                required=False,
                type=str,
                location=OpenApiParameter.HEADER,
            ),
            OpenApiParameter(
                name="search",
                description="Search by title",
                required=False,
                type=str,
                location=OpenApiParameter.QUERY,
            ),
            OpenApiParameter(
                name="grade",
                description="Grade level filter (e.g., '6', '7')",
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
                description="Items per page (default: 9, max: 100)",
                required=False,
                type=int,
                location=OpenApiParameter.QUERY,
            ),
        ],
        operation_id="list_courses",
        responses={
            200: serializers.CourseMessageSerializer,
            400: serializers.CourseDetailSerializer,
        },
    )
    def get(self, request):
        search = request.query_params.get("search", "").strip()
        grade = request.query_params.get("grade", "").strip()
        ordering = request.query_params.get("ordering", "newest").strip()

        try:
            page = max(1, int(request.query_params.get("page", 1)))
            page_size = max(1, min(100, int(request.query_params.get("page_size", 9))))
        except (ValueError, TypeError):
            page, page_size = 1, 9

        courses = models.Course.objects.all()
        if search:
            courses = courses.filter(translations__title__icontains=search).distinct()
        if grade:
            courses = courses.filter(grade_level=grade)

        if ordering == "oldest":
            courses = courses.order_by("created_at")
        else:
            courses = courses.order_by("-created_at")

        total_count = courses.count()
        total_pages = max(1, (total_count + page_size - 1) // page_size)
        page = min(page, total_pages)

        start = (page - 1) * page_size
        courses_page = courses[start : start + page_size]

        serializer = self.serializer_class(
            courses_page, many=True, context={"request": request}
        )
        return Response(
            {
                "total_courses": courses.count(),
                "total_chapters": models.Chapter.objects.count(),
                "total_items": models.Item.objects.all().count(),
                "total_count": total_count,
                "total_pages": total_pages,
                "page": page,
                "page_size": page_size,
                "courses": serializer.data,
            }
        )

    def post(self, request):
        serializer = self.serializer_class(data=request.data)
        if serializer.is_valid():
            course = serializer.save()
            return Response(
                self.serializer_class(course, context={"request": request}).data,
                status=201,
            )
        return Response(serializer.errors, status=400)


class CourseDetailApiView(APIView):
    serializer_class = serializers.CourseDetailSerializer

    def get_permissions(self):
        if self.request.method == "GET":
            return [AllowAny()]
        if self.request.method == "DELETE":
            return [permissions.CanDeleteCourse()]
        return [permissions.CanEditCourse()]

    @extend_schema(
        request=serializers.CourseDetailSerializer,
        parameters=[
            OpenApiParameter(
                name="Accept-Language",
                description="Language code (en, bn, my, no)",
                required=False,
                type=str,
                location=OpenApiParameter.HEADER,
            )
        ],
        operation_id="retrieve_course",
        responses={
            200: serializers.CourseMessageSerializer,
            400: serializers.CourseDetailSerializer,
        },
    )
    def get(self, request, pk):
        try:
            course = models.Course.objects.prefetch_related(
                "chapters__lessons__items"
            ).get(pk=pk)
            if (
                request.user.is_authenticated
                and "lms_auth.view_dashboard" not in request.user.get_all_permissions()
            ):
                Enrollment.objects.get_or_create(user=request.user, course=course)
            if request.query_params.get("basic_chapters") == "1":
                serializer = serializers.CourseBasicDetailSerializer(
                    course, context={"request": request}
                )
            else:
                serializer = self.serializer_class(course, context={"request": request})
            return Response(serializer.data)
        except models.Course.DoesNotExist:
            return Response({"message": "Course not found"}, status=404)

    def patch(self, request, pk):
        print("Request data:", request.data)  # Debugging line
        if (
            "publication_status" in request.data
            and "lms_course.can_change_course_status"
            not in request.user.get_all_permissions()
        ):
            return Response(
                {
                    "message": "You do not have permission to change the course publication status."
                },
                status=403,
            )
        try:
            course = models.Course.objects.get(pk=pk)
            serializer = serializers.CourseSerializer(
                course, data=request.data, partial=True
            )
            if serializer.is_valid():
                course = serializer.save()
                return Response(
                    self.serializer_class(course, context={"request": request}).data
                )
            return Response(serializer.errors, status=400)
        except models.Course.DoesNotExist:
            return Response({"message": "Course not found"}, status=404)

    def delete(self, request, pk):
        try:
            course = models.Course.objects.get(pk=pk)
            course.delete()
            return Response({"message": "Course deleted successfully"}, status=204)
        except models.Course.DoesNotExist:
            return Response({"message": "Course not found"}, status=404)


class ChapterListApiView(APIView):
    serializer_class = serializers.ChapterSerializer

    def get_permissions(self):
        if self.request.method == "GET":
            return [AllowAny()]
        if self.request.method == "POST":
            return [permissions.CanCreateCourse()]

    @extend_schema(
        request=serializers.ChapterDetailSerializer,
        parameters=[
            OpenApiParameter(
                name="Accept-Language",
                description="Language code (en, bn, my, no)",
                required=False,
                type=str,
                location=OpenApiParameter.HEADER,
            )
        ],
        operation_id="retrieve_chapters",
        responses={
            200: serializers.ChapterDetailSerializer,
            400: serializers.ChapterDetailSerializer,
        },
    )
    def get(self, request):
        chapters = models.Chapter.objects.all()
        serializer = self.serializer_class(
            chapters, many=True, context={"request": request}
        )
        return Response(serializer.data)

    def post(self, request):
        serializer = self.serializer_class(data=request.data)
        if serializer.is_valid():
            chapter = serializer.save()
            return Response(
                self.serializer_class(chapter, context={"request": request}).data,
                status=201,
            )
        return Response(serializer.errors, status=400)


class ChapterDetailApiView(APIView):
    serializer_class = serializers.ChapterDetailSerializer

    def get_permissions(self):
        if self.request.method == "GET":
            return [AllowAny()]
        if self.request.method == "PATCH":
            return [permissions.CanEditCourse()]
        return [permissions.CanDeleteCourse()]

    @extend_schema(
        request=serializers.ChapterDetailSerializer,
        parameters=[
            OpenApiParameter(
                name="Accept-Language",
                description="Language code (en, bn, my, no)",
                required=False,
                type=str,
                location=OpenApiParameter.HEADER,
            )
        ],
        operation_id="retrieve_chapter",
        responses={
            200: serializers.ChapterDetailSerializer,
            400: serializers.ChapterDetailSerializer,
        },
    )
    def get(self, request, pk):
        chapter = models.Chapter.objects.get(pk=pk)
        if not has_chapter_access(request.user, chapter):
            preview = serializers.ChapterPreviewSerializer(
                chapter, context={"request": request}
            ).data
            return Response(
                {"is_locked": True, "course_id": chapter.course_id, **preview}
            )
        serializer = self.serializer_class(chapter, context={"request": request})
        return Response(serializer.data)

    def patch(self, request, pk):
        try:
            chapter = models.Chapter.objects.get(pk=pk)
            serializer = serializers.ChapterSerializer(
                chapter, data=request.data, partial=True
            )
            if serializer.is_valid():
                chapter = serializer.save()
                return Response(
                    self.serializer_class(chapter, context={"request": request}).data
                )
            return Response(serializer.errors, status=400)
        except models.Chapter.DoesNotExist:
            return Response({"message": "Chapter not found"}, status=404)

    def delete(self, request, pk):
        try:
            chapter = models.Chapter.objects.get(pk=pk)
            chapter.delete()
            return Response({"message": "Chapter deleted successfully"}, status=204)
        except models.Chapter.DoesNotExist:
            return Response({"message": "Chapter not found"}, status=404)


class LessonListApiView(APIView):
    serializer_class = serializers.LessonSerializer

    def get_permissions(self):
        if self.request.method == "GET":
            return [AllowAny()]
        if self.request.method == "POST":
            return [permissions.CanCreateCourse()]

    @extend_schema(
        request=serializers.LessonSerializer,
        parameters=[
            OpenApiParameter(
                name="Accept-Language",
                description="Language code (en, bn, my, no)",
                required=False,
                type=str,
                location=OpenApiParameter.HEADER,
            )
        ],
        operation_id="retrieve_lessons",
        responses={
            200: serializers.LessonSerializer,
            400: serializers.LessonSerializer,
        },
    )
    def get(self, request):
        lessons = models.Lesson.objects.all()
        serializer = self.serializer_class(lessons, many=True)
        return Response(serializer.data)

    def post(self, request):
        serializer = self.serializer_class(data=request.data)
        if serializer.is_valid():
            lesson = serializer.save()
            return Response(self.serializer_class(lesson).data, status=201)
        return Response(serializer.errors, status=400)


class LessonDetailApiView(APIView):
    serializer_class = serializers.LessonDetailSerializer

    def get_permissions(self):
        if self.request.method == "GET":
            return [AllowAny()]
        if self.request.method == "PATCH":
            return [permissions.CanEditCourse()]
        return [permissions.CanDeleteCourse()]

    @extend_schema(
        request=serializers.LessonDetailSerializer,
        parameters=[
            OpenApiParameter(
                name="Accept-Language",
                description="Language code (en, bn, my, no)",
                required=False,
                type=str,
                location=OpenApiParameter.HEADER,
            )
        ],
        operation_id="retrieve_lesson",
        responses={
            200: serializers.LessonDetailSerializer,
            400: serializers.LessonDetailSerializer,
        },
    )
    def get(self, request, pk):
        lesson = models.Lesson.objects.select_related("chapter").get(pk=pk)
        if not has_chapter_access(request.user, lesson.chapter):
            basic = serializers.LessonBasicSerializer(lesson).data
            return Response(
                {"locked": True, "course_id": lesson.chapter.course_id, **basic}
            )
        serializer = self.serializer_class(lesson)
        return Response(serializer.data)

    def patch(self, request, pk):
        lesson = models.Lesson.objects.get(pk=pk)
        update_serializer = serializers.LessonSerializer(
            lesson, data=request.data, partial=True
        )
        if update_serializer.is_valid():
            lesson = update_serializer.save()
            return Response(
                self.serializer_class(lesson, context={"request": request}).data
            )
        return Response(update_serializer.errors, status=400)

    def delete(self, request, pk):
        try:
            lesson = models.Lesson.objects.get(pk=pk)
            lesson.delete()
            return Response({"message": "Lesson deleted successfully"}, status=204)
        except models.Lesson.DoesNotExist:
            return Response({"message": "Lesson not found"}, status=404)


class ChapterReorderApiView(APIView):

    def post(self, request):
        items = request.data
        if not isinstance(items, list):
            return Response({"error": "Expected a list"}, status=400)
        for item in items:
            models.Chapter.objects.filter(id=item["id"]).update(
                priority_index=item["priority_index"]
            )
        return Response({"message": "Chapters reordered"})


class LessonReorderApiView(APIView):

    def post(self, request):
        items = request.data
        if not isinstance(items, list):
            return Response({"error": "Expected a list"}, status=400)
        for item in items:
            models.Lesson.objects.filter(id=item["id"]).update(
                priority_index=item["priority_index"]
            )
        return Response({"message": "Lessons reordered"})


class ItemReorderApiView(APIView):

    def post(self, request):
        items = request.data
        if not isinstance(items, list):
            return Response({"error": "Expected a list"}, status=400)
        for item in items:
            models.Item.objects.filter(id=item["id"]).update(
                priority_index=item["priority_index"]
            )
        return Response({"message": "Items reordered"})


class ItemListApiView(APIView):
    serializer_class = serializers.ItemSerializer

    def get_permissions(self):
        if self.request.method == "GET":
            return [permissions.CanViewItem()]
        if self.request.method == "POST":
            return [permissions.CanCreateItem()]

    @extend_schema(
        request=serializers.ItemSerializer,
        parameters=[
            OpenApiParameter(
                name="Accept-Language",
                description="Language code (en, bn, my, no)",
                required=False,
                type=str,
                location=OpenApiParameter.HEADER,
            ),
            OpenApiParameter(
                name="search",
                description="Search by title",
                required=False,
                type=str,
                location=OpenApiParameter.QUERY,
            ),
            OpenApiParameter(
                name="type",
                description="Item type filter (e.g., 'video', 'document')",
                required=False,
                type=str,
                location=OpenApiParameter.QUERY,
            ),
            OpenApiParameter(
                name="grade",
                description="Grade level filter (e.g., '6', '7')",
                required=False,
                type=str,
                location=OpenApiParameter.QUERY,
            ),
            OpenApiParameter(
                name="publication_status",
                description="Publication status filter (e.g., 'true', 'false')",
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
                description="Items per page (default: 9, max: 100)",
                required=False,
                type=int,
                location=OpenApiParameter.QUERY,
            ),
        ],
        operation_id="retrieve_items",
        responses={200: serializers.ItemSerializer, 400: serializers.ItemSerializer},
    )
    def get(self, request):
        search = request.query_params.get("search", "").strip()
        type_filter = request.query_params.get("type", "").strip()
        grade = request.query_params.get("grade", "").strip()
        publication_status = request.query_params.get("publication_status", "").strip()
        ordering = request.query_params.get("ordering", "newest").strip()

        try:
            page = max(1, int(request.query_params.get("page", 1)))
            page_size = max(1, min(100, int(request.query_params.get("page_size", 9))))
        except (ValueError, TypeError):
            page, page_size = 1, 9

        all_items = models.Item.objects.all()

        items = models.Item.objects.prefetch_related("tags")
        if search:
            items = items.filter(translations__title__icontains=search).distinct()
        if type_filter:
            items = items.filter(type=type_filter)
        if grade:
            items = items.filter(grade_level=grade)
        if publication_status:
            items = items.filter(publication_status=publication_status == "true")

        if ordering == "oldest":
            items = items.order_by("created_at")
        else:
            items = items.order_by("-created_at")

        total_count = items.count()
        total_pages = max(1, (total_count + page_size - 1) // page_size)
        page = min(page, total_pages)

        start = (page - 1) * page_size
        items_page = items[start : start + page_size]

        items_data = []
        for item in items_page:
            lesson = (
                models.Lesson.objects.filter(items=item)
                .select_related("chapter")
                .first()
            )
            if lesson and not has_chapter_access(request.user, lesson.chapter):
                items_data.append(serializers.ItemBasicSerializer(item).data)
            else:
                items_data.append(
                    self.serializer_class(item, context={"request": request}).data
                )

        return Response(
            {
                "total_items": all_items.count(),
                "total_videos": all_items.filter(type="video").count(),
                "total_documents": all_items.filter(type="document").count(),
                "total_scorm": all_items.filter(type="scorm").count(),
                "total_activity": all_items.filter(type="activity").count(),
                "total_quizzes": all_items.filter(type="quiz").count(),
                "total_count": total_count,
                "total_pages": total_pages,
                "page": page,
                "page_size": page_size,
                "items": items_data,
            }
        )

    def post(self, request):
        serializer = self.serializer_class(
            data=request.data, context={"request": request}
        )
        if serializer.is_valid():
            item = serializer.save()
            return Response(
                self.serializer_class(item, context={"request": request}).data,
                status=201,
            )
        return Response(serializer.errors, status=400)


class ItemGroupedApiView(APIView):
    permission_classes = [AllowAny]

    @extend_schema(
        parameters=[
            OpenApiParameter(
                name="type",
                description="Item type filter (e.g., 'video', 'document')",
                required=False,
                type=str,
                location=OpenApiParameter.QUERY,
            ),
            OpenApiParameter(
                name="publication_status",
                description="Publication status filter ('true' or 'false')",
                required=False,
                type=str,
                location=OpenApiParameter.QUERY,
            ),
        ],
        operation_id="retrieve_items_grouped",
        responses={200: {}},
    )
    def get(self, request):
        type_filter = request.query_params.get("type", "").strip()
        publication_status = request.query_params.get("publication_status", "").strip()

        items = models.Item.objects.prefetch_related("tags").only("id", "grade_level")

        if type_filter:
            items = items.filter(type=type_filter)
        if publication_status:
            items = items.filter(publication_status=publication_status == "true")

        grouped = {}
        for item in items:
            grade_key = f"Grade-{item.grade_level}"
            if grade_key not in grouped:
                grouped[grade_key] = {"total": 0, "tags": {}}
            grouped[grade_key]["total"] += 1
            for tag in item.tags.all():
                grouped[grade_key]["tags"][tag.name] = (
                    grouped[grade_key]["tags"].get(tag.name, 0) + 1
                )

        return Response(grouped)


class ItemDetailApiView(APIView):
    serializer_class = serializers.ItemDetailSerializer

    def get_permissions(self):
        if self.request.method == "GET":
            return [AllowAny()]
        if self.request.method == "DELETE":
            return [permissions.CanDeleteItem()]
        return [permissions.CanEditItem()]

    @extend_schema(
        request=serializers.ItemDetailSerializer,
        parameters=[
            OpenApiParameter(
                name="Accept-Language",
                description="Language code (en, bn, my, no)",
                required=False,
                type=str,
                location=OpenApiParameter.HEADER,
            )
        ],
        operation_id="retrieve_item",
        responses={
            200: serializers.ItemDetailSerializer,
            400: serializers.ItemDetailSerializer,
        },
    )
    def get(self, request, pk):
        item = models.Item.objects.get(pk=pk)
        lesson = (
            models.Lesson.objects.filter(items=item).select_related("chapter").first()
        )
        if lesson and not has_chapter_access(request.user, lesson.chapter):
            basic = serializers.ItemBasicSerializer(item).data
            return Response(
                {"locked": True, "course_id": lesson.chapter.course_id, **basic}
            )
        serializer = self.serializer_class(item, context={"request": request})
        return Response(serializer.data)

    @extend_schema(
        request=serializers.ItemDetailSerializer,
        parameters=[
            OpenApiParameter(
                name="Accept-Language",
                description="Language code (en, bn, my, no)",
                required=False,
                type=str,
                location=OpenApiParameter.HEADER,
            )
        ],
        operation_id="update_item",
        responses={
            200: serializers.ItemDetailSerializer,
            404: {"description": "Item not found"},
            400: serializers.ItemDetailSerializer,
        },
    )
    def patch(self, request, pk):
        if (
            "publication_status" in request.data
            and "lms_course.can_change_item_status"
            not in request.user.get_all_permissions()
        ):
            return Response(
                {"message": "You do not have permission to change publication status."},
                status=403,
            )
        try:
            item = models.Item.objects.get(pk=pk)
            serializer = serializers.ItemDetailSerializer(
                item, data=request.data, partial=True
            )
            if serializer.is_valid():
                item = serializer.save()
                return Response(
                    self.serializer_class(item, context={"request": request}).data
                )
            return Response(serializer.errors, status=400)
        except models.Item.DoesNotExist:
            return Response({"message": "Item not found"}, status=404)

    @extend_schema(
        operation_id="delete_item",
        responses={
            204: {"description": "Item deleted successfully"},
            404: {"description": "Item not found"},
        },
    )
    def delete(self, request, pk):
        try:
            item = models.Item.objects.get(pk=pk)
            if item.file and item.file.name:
                s3 = get_s3_client()
                try:
                    s3.delete_object(
                        Bucket=settings.AWS_S3_BUCKET_NAME,
                        Key=item.file.name,
                    )
                except ClientError as e:
                    logger.error(
                        "Failed to delete S3 file %s for item %s: %s",
                        item.file.name,
                        pk,
                        e,
                    )
            item.delete()
            return Response({"message": "Item deleted successfully"}, status=204)
        except models.Item.DoesNotExist:
            return Response({"message": "Item not found"}, status=404)


class InitiateMultipartUploadView(APIView):
    """
    Step 1: Client tells us the filename and how many chunks.
    We create a multipart upload on S3 and return presigned URLs
    for each part so the client can upload directly to S3.
    """

    def get_permissions(self):
        return [permissions.CanEditItem()]

    def post(self, request):
        filename = request.data.get("filename")
        total_chunks = request.data.get("totalChunks")
        content_type = request.data.get("contentType", "application/octet-stream")
        item_type = request.data.get("itemType")
        item_id = request.data.get("itemId")

        if not filename or not total_chunks:
            return Response(
                {"error": "filename and totalChunks are required"},
                status=400,
            )
        if not item_type or not item_id:
            return Response(
                {"error": "itemType and itemId are required"},
                status=400,
            )

        total_chunks = int(total_chunks)
        s3_key = f"uploads/media/{item_type}/{item_id}/{filename}"
        s3 = get_s3_client()

        try:
            response = s3.create_multipart_upload(
                Bucket=settings.AWS_S3_BUCKET_NAME,
                Key=s3_key,
                ContentType=content_type,
            )
            upload_id = response["UploadId"]

            presigned_urls = []
            for part_number in range(1, total_chunks + 1):
                url = s3.generate_presigned_url(
                    "upload_part",
                    Params={
                        "Bucket": settings.AWS_S3_BUCKET_NAME,
                        "Key": s3_key,
                        "UploadId": upload_id,
                        "PartNumber": part_number,
                    },
                    ExpiresIn=3600,
                )
                presigned_urls.append(url)

        except ClientError as e:
            return Response({"error": str(e)}, status=500)

        return Response(
            {
                "uploadId": upload_id,
                "key": s3_key,
                "presignedUrls": presigned_urls,
            },
            status=200,
        )


class CompleteMultipartUploadView(APIView):
    def get_permissions(self):
        return [permissions.CanEditItem()]

    def post(self, request):
        upload_id = request.data.get("uploadId")
        s3_key = request.data.get("key")
        parts = request.data.get("parts")
        item_id = request.data.get("itemId")

        if not all([upload_id, s3_key, parts, item_id]):
            return Response(
                {"error": "uploadId, key, parts, and itemId are required"},
                status=400,
            )

        s3 = get_s3_client()

        try:
            s3.complete_multipart_upload(
                Bucket=settings.AWS_S3_BUCKET_NAME,
                Key=s3_key,
                UploadId=upload_id,
                MultipartUpload={"Parts": parts},
            )
            file_size = s3.head_object(
                Bucket=settings.AWS_S3_BUCKET_NAME,
                Key=s3_key,
            )["ContentLength"]
        except ClientError as e:
            return Response({"error": str(e)}, status=500)

        try:
            item = models.Item.objects.get(id=item_id)
            item.file.name = s3_key
            item.file_size = file_size
            item.save()
        except models.Item.DoesNotExist:
            return Response({"error": "Item not found"}, status=404)

        file_url = (
            f"https://{settings.AWS_S3_BUCKET_NAME}"
            f".s3.{settings.AWS_S3_REGION}.amazonaws.com/{s3_key}"
        )
        return Response({"fileUrl": file_url}, status=200)


class AbortMultipartUploadView(APIView):
    def get_permissions(self):
        return [permissions.CanEditItem()]

    def post(self, request):
        upload_id = request.data.get("uploadId")
        s3_key = request.data.get("key")

        if not all([upload_id, s3_key]):
            return Response(
                {"error": "uploadId and key are required"},
                status=400,
            )

        s3 = get_s3_client()

        try:
            s3.abort_multipart_upload(
                Bucket=settings.AWS_S3_BUCKET_NAME,
                Key=s3_key,
                UploadId=upload_id,
            )
        except ClientError as e:
            return Response({"error": str(e)}, status=500)

        return Response({"status": "upload aborted"}, status=200)


class ItemProgressApiView(APIView):
    """
    POST /courses/items/<item_id>/progress/
    Body: { progress: 0-100, status: "in_progress" | "completed" }
    Creates or updates the authenticated user's progress for an item.
    """

    permission_classes = [IsAuthenticated]

    def post(self, request, item_id):
        try:
            item = models.Item.objects.get(pk=item_id)
        except models.Item.DoesNotExist:
            return Response({"error": "Item not found"}, status=404)

        lesson = (
            models.Lesson.objects.filter(items=item).select_related("chapter").first()
        )
        if lesson and not has_chapter_access(request.user, lesson.chapter):
            return Response(
                {"error": "enrollment_required", "course_id": lesson.chapter.course_id},
                status=403,
            )

        progress_value = request.data.get("progress")
        status_value = request.data.get("status", "in_progress")

        if progress_value is None:
            return Response({"error": "progress is required"}, status=400)

        existing = models.UserItemProgress.objects.filter(
            user=request.user, item=item
        ).first()
        if existing and existing.status == "completed":
            existing.save()
            serializer = serializers.UserItemProgressSerializer(existing)
            return Response(serializer.data, status=200)

        if existing:
            existing.progress = progress_value
            existing.status = status_value
            existing.save()
            obj = existing
        else:
            obj = models.UserItemProgress.objects.create(
                user=request.user,
                item=item,
                progress=progress_value,
                status=status_value,
            )

        serializer = serializers.UserItemProgressSerializer(obj)
        return Response(serializer.data, status=200)

    def get(self, request, item_id):
        try:
            obj = models.UserItemProgress.objects.get(
                user=request.user, item_id=item_id
            )
            serializer = serializers.UserItemProgressSerializer(obj)
            return Response(serializer.data)
        except models.UserItemProgress.DoesNotExist:
            return Response({"progress": 0, "status": None})


def _get_lesson_chapter_for_item(item):
    lesson = (
        models.Lesson.objects.filter(items=item)
        .select_related("chapter__course")
        .first()
    )
    if not lesson:
        return None, None
    chapter = lesson.chapter
    return lesson, chapter


def _course_latest_item_progress(user, course):
    latest_progress = (
        models.UserItemProgress.objects.filter(
            user=user, item__lesson__chapter__course=course
        )
        .order_by("-updated_at")
        .select_related("item")
        .first()
    )
    if latest_progress:
        return latest_progress
    return None


def _get_chapter_order(course, chapter):
    for ch_order, ch in enumerate(course.chapters.order_by("priority_index"), start=1):
        if ch.id == chapter.id:
            chapter_order = ch_order
            return chapter_order
    return 0


def _get_lesson_order(chapter, lesson):
    for le_order, le in enumerate(chapter.lessons.order_by("priority_index"), start=1):
        if le.id == lesson.id:
            lesson_order = le_order
            return lesson_order
    return 0


def _other_enrolled_courses(user, enrolled_courses):
    courses = []
    for id in enrolled_courses:
        course = models.Course.objects.filter(id=id)
        if course.exists():
            course = course.first()
            lesson = None
            chapter = None
            latest_progress = _course_latest_item_progress(user, course)
            if latest_progress:
                item = latest_progress.item
                lesson, chapter = _get_lesson_chapter_for_item(item)
            courses.append(
                {
                    "id": course.id,
                    "title": course.safe_translation_getter("title", any_language=True),
                    "latest_progress": (
                        serializers.UserItemProgressSerializer(latest_progress).data
                        if latest_progress
                        else None
                    ),
                    "chapter": (
                        {
                            "id": chapter.id,
                            "title": chapter.safe_translation_getter(
                                "title", any_language=True
                            ),
                            "chapter_order": _get_chapter_order(course, chapter),
                        }
                        if chapter
                        else None
                    ),
                    "lesson": (
                        {
                            "id": lesson.id,
                            "title": lesson.safe_translation_getter(
                                "title", any_language=True
                            ),
                            "lesson_order": _get_lesson_order(chapter, lesson),
                        }
                        if lesson
                        else None
                    ),
                }
            )
    return courses


class UserLatestItemProgress(APIView):

    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        latest_progress = (
            models.UserItemProgress.objects.filter(user=user)
            .order_by("-updated_at")
            .select_related("item")
            .first()
        )
        if not latest_progress:
            return Response({"message": "No progress found for the user."}, status=404)

        item = latest_progress.item
        lesson = (
            models.Lesson.objects.filter(items=item)
            .select_related("chapter__course")
            .first()
        )
        if not lesson:
            return Response(
                {"message": "Item is not attached to a lesson."}, status=404
            )

        chapter = lesson.chapter
        course = chapter.course
        enrolled_courses = []
        chapter_order = 0
        lesson_order = 0
        enrollments = Enrollment.objects.filter(user=user, plan__isnull=False)
        for enrollment in enrollments:
            if course.id != enrollment.course.id:
                enrolled_courses.append(enrollment.course.id)
        other_enrolled_courses = _other_enrolled_courses(user, enrolled_courses)
        chapter_order = _get_chapter_order(course, chapter)
        lesson_order = _get_lesson_order(chapter, lesson)

        return Response(
            {
                "item": latest_progress.item.title,
                "progress": serializers.UserItemProgressSerializer(
                    latest_progress
                ).data,
                "course": {
                    "id": course.id,
                    "title": course.safe_translation_getter("title", any_language=True),
                },
                "chapter": {
                    "id": chapter.id,
                    "title": chapter.safe_translation_getter(
                        "title", any_language=True
                    ),
                    "chapter_order": chapter_order,
                },
                "lesson": {
                    "id": lesson.id,
                    "title": lesson.safe_translation_getter("title", any_language=True),
                    "lesson_order": lesson_order,
                },
                "other_enrolled_courses": other_enrolled_courses,
            }
        )


class DailyQuizStatusView(APIView):
    """GET /courses/daily-quiz/ — returns today's quiz state for the user."""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        today = timezone.localdate()
        course_id = request.query_params.get("course_id")

        qs = models.DailyQuiz.objects.filter(user=request.user, date=today)
        if course_id:
            qs = qs.filter(course_id=course_id)
        quiz = qs.first()

        if not quiz:
            available = models.DailyQuizQuestion.objects.all()
            if course_id:
                available = available.filter(course_id=course_id)
            return Response(
                {
                    "exists": False,
                    "date": today,
                    "available_questions": min(available.count(), 5),
                }
            )

        serializer = serializers.DailyQuizDetailSerializer(
            quiz, context={"request": request}
        )
        return Response({"exists": True, **serializer.data})


class StartDailyQuizView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        today = timezone.localdate()

        course_id = request.data.get("course_id")
        questions_qs = models.DailyQuizQuestion.objects.all()
        course = None
        if course_id:
            try:
                course = models.Course.objects.get(pk=course_id)
                questions_qs = questions_qs.filter(course=course)
            except models.Course.DoesNotExist:
                return Response({"error": "Course not found."}, status=404)

        existing = models.DailyQuiz.objects.filter(
            user=request.user, date=today, course=course
        ).first()
        if existing:
            serializer = serializers.DailyQuizDetailSerializer(
                existing, context={"request": request}
            )
            return Response(serializer.data, status=200)

        question_ids = list(questions_qs.values_list("id", flat=True))
        if not question_ids:
            return Response(
                {"error": "No questions available for this course."},
                status=400,
            )

        selected_ids = random.sample(question_ids, min(5, len(question_ids)))
        quiz = models.DailyQuiz.objects.create(
            user=request.user,
            course=course,
            date=today,
            status="in_progress",
        )
        quiz.questions.set(selected_ids)

        serializer = serializers.DailyQuizDetailSerializer(
            quiz, context={"request": request}
        )
        return Response(serializer.data, status=201)


class SubmitDailyQuizAnswerView(APIView):
    """
    POST /courses/daily-quiz/<quiz_id>/answer/
    Body: { "daily_quiz_question_id": <id>, "selected_choice": "A" }

    Creates or updates the user's answer for one question in the quiz.
    Re-submitting the same question overwrites the previous answer.
    """

    permission_classes = [IsAuthenticated]

    def post(self, request, quiz_id):
        try:
            quiz = models.DailyQuiz.objects.get(pk=quiz_id, user=request.user)
        except models.DailyQuiz.DoesNotExist:
            return Response({"error": "Quiz not found."}, status=404)

        if quiz.status == "completed":
            return Response({"error": "This quiz is already completed."}, status=400)

        question_id = request.data.get("daily_quiz_question_id")
        selected_choice = (request.data.get("selected_choice") or "").upper()

        if not question_id or not selected_choice:
            return Response(
                {"error": "daily_quiz_question_id and selected_choice are required."},
                status=400,
            )

        valid = [c[0] for c in models.CORRECT_CHOICES]
        if selected_choice not in valid:
            return Response(
                {"error": f"selected_choice must be one of {valid}."},
                status=400,
            )

        try:
            question = quiz.questions.get(pk=question_id)
        except models.DailyQuizQuestion.DoesNotExist:
            return Response({"error": "Question not found in this quiz."}, status=404)

        answer, created = models.DailyQuizAnswer.objects.get_or_create(
            quiz=quiz,
            question=question,
            defaults={"selected_answer": selected_choice},
        )
        if not created:
            answer.selected_answer = selected_choice
            answer.save()

        return Response(
            {
                "is_correct": answer.is_correct,
                "selected_choice": selected_choice,
            }
        )


class DailyQuizQuestionListView(APIView):
    """
    GET  /courses/daily-quiz/questions/?grade_level=7&search=pi&page=1&page_size=10
    POST /courses/daily-quiz/questions/
    """

    # permission_classes = [IsAuthenticated]

    def get_permissions(self):
        if self.request.method == "POST":
            return [permissions.CanCreateDailyQuiz()]
        return [permissions.CanViewDailyQuiz()]

    @extend_schema(
        parameters=[
            OpenApiParameter(
                name="course",
                description="Filter by course ID",
                required=False,
                type=int,
                location=OpenApiParameter.QUERY,
            ),
            OpenApiParameter(
                name="search",
                description="Search by question text",
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
                description="Items per page (default: 10, max: 100)",
                required=False,
                type=int,
                location=OpenApiParameter.QUERY,
            ),
        ],
        operation_id="list_daily_quiz_questions",
        responses={200: serializers.DailyQuizQuestionAdminSerializer},
    )
    def get(self, request):
        course_id = request.query_params.get("course")
        search = request.query_params.get("search", "").strip()
        ordering = request.query_params.get("ordering", "newest").strip()

        try:
            page = max(1, int(request.query_params.get("page", 1)))
            page_size = max(1, min(100, int(request.query_params.get("page_size", 10))))
        except (ValueError, TypeError):
            page, page_size = 1, 10

        qs = models.DailyQuizQuestion.objects.all()
        if course_id:
            qs = qs.filter(course_id=course_id)
        if search:
            qs = qs.filter(translations__question_text__icontains=search).distinct()

        qs = (
            qs.order_by("created_at")
            if ordering == "oldest"
            else qs.order_by("-created_at")
        )

        total_count = qs.count()
        total_pages = max(1, (total_count + page_size - 1) // page_size)
        page = min(page, total_pages)

        start = (page - 1) * page_size
        qs_page = qs[start : start + page_size]

        serializer = serializers.DailyQuizQuestionAdminSerializer(qs_page, many=True)
        return Response(
            {
                "total_count": total_count,
                "total_pages": total_pages,
                "page": page,
                "page_size": page_size,
                "results": serializer.data,
            }
        )

    def post(self, request):
        serializer = serializers.DailyQuizQuestionAdminSerializer(data=request.data)
        if serializer.is_valid():
            question = serializer.save()
            return Response(
                serializers.DailyQuizQuestionAdminSerializer(question).data,
                status=201,
            )
        return Response(serializer.errors, status=400)


class DailyQuizQuestionDetailView(APIView):
    """
    PATCH  /courses/daily-quiz/questions/<question_id>/
    DELETE /courses/daily-quiz/questions/<question_id>/
    """

    permission_classes = [IsAuthenticated]

    def _get_question(self, question_id):
        try:
            return models.DailyQuizQuestion.objects.get(pk=question_id)
        except models.DailyQuizQuestion.DoesNotExist:
            return None

    def patch(self, request, question_id):
        question = self._get_question(question_id)
        if not question:
            return Response({"error": "Question not found."}, status=404)
        serializer = serializers.DailyQuizQuestionAdminSerializer(
            question, data=request.data, partial=True
        )
        if serializer.is_valid():
            question = serializer.save()
            return Response(serializers.DailyQuizQuestionAdminSerializer(question).data)
        return Response(serializer.errors, status=400)

    def delete(self, request, question_id):
        question = self._get_question(question_id)
        if not question:
            return Response({"error": "Question not found."}, status=404)
        question.delete()
        return Response(status=204)


class DailyQuizQuestionUploadView(APIView):
    """
    POST /courses/daily-quiz/questions/upload/

    Accepts either:
      - Multipart with fields "course_id" and "file" (.xlsx or .json)
      - Raw JSON body: { "course_id": "1", "questions": [...] }

    Excel columns (case-sensitive):
      Question | Option A | Option B | Option C | Option D | Correct Answer

    JSON format:
      [{"question_text":"...","choice_a":"...","choice_b":"...","choice_c":"...","choice_d":"...","correct_answer":"A"}, ...]
    """

    def get_permissions(self):
        return [permissions.CanCreateDailyQuiz()]

    REQUIRED_COLUMNS = {
        "Question",
        "Option A",
        "Option B",
        "Option C",
        "Option D",
        "Correct Answer",
    }
    REQUIRED_JSON_KEYS = {
        "question_text",
        "choice_a",
        "choice_b",
        "choice_c",
        "choice_d",
        "correct_answer",
    }

    def _rows_from_excel(self, file):
        import openpyxl

        wb = openpyxl.load_workbook(file, read_only=True, data_only=True)
        ws = wb.active
        rows = list(ws.iter_rows(values_only=True))
        if not rows:
            return None, []
        headers = [str(h).strip() if h is not None else "" for h in rows[0]]
        data = []
        for raw in rows[1:]:
            data.append(
                {
                    headers[i]: (str(v).strip() if v is not None else "")
                    for i, v in enumerate(raw)
                }
            )
        return headers, data

    def _process_rows(self, rows, course, source="Row"):
        created, row_errors = 0, []
        for i, row in enumerate(rows, start=2 if source == "Row" else 1):
            question_text = str(
                row.get("question_text") or row.get("Question") or ""
            ).strip()
            choice_a = str(row.get("choice_a") or row.get("Option A") or "").strip()
            choice_b = str(row.get("choice_b") or row.get("Option B") or "").strip()
            choice_c = str(row.get("choice_c") or row.get("Option C") or "").strip()
            choice_d = str(row.get("choice_d") or row.get("Option D") or "").strip()
            correct = (
                str(row.get("correct_answer") or row.get("Correct Answer") or "")
                .strip()
                .upper()
            )

            if not all([question_text, choice_a, choice_b, choice_c, choice_d]):
                row_errors.append(f"{source} {i}: all fields are required.")
                continue
            if correct not in ("A", "B", "C", "D"):
                row_errors.append(
                    f"{source} {i}: correct_answer must be A, B, C, or D (got '{correct}')."
                )
                continue

            models.DailyQuizQuestion.objects.create(
                question_text=question_text,
                choice_a=choice_a,
                choice_b=choice_b,
                choice_c=choice_c,
                choice_d=choice_d,
                correct_answer=correct,
                course=course,
            )
            created += 1

        return created, row_errors

    def post(self, request):
        file = request.FILES.get("file")
        course_id = str(request.data.get("course_id", "")).strip()

        if not course_id:
            return Response({"error": "course_id is required."}, status=400)

        try:
            course = models.Course.objects.get(pk=course_id)
        except models.Course.DoesNotExist:
            return Response({"error": "Course not found."}, status=404)

        # --- JSON body (no file) ---
        if not file:
            rows = request.data.get("questions")
            if not isinstance(rows, list):
                return Response(
                    {
                        "error": "Provide a file (.xlsx or .json) or a JSON array under 'questions'."
                    },
                    status=400,
                )
            created, row_errors = self._process_rows(rows, course, source="Item")
            return Response(
                {"created": created, "errors": row_errors},
                status=201 if created else 400,
            )

        filename = file.name.lower()

        # --- JSON file ---
        if filename.endswith(".json"):
            try:
                import json

                rows = json.load(file)
            except Exception:
                return Response({"error": "Could not parse the JSON file."}, status=400)
            if not isinstance(rows, list):
                return Response(
                    {"error": "JSON file must contain a list of questions."}, status=400
                )
            missing_keys = (
                self.REQUIRED_JSON_KEYS - set(rows[0].keys()) if rows else set()
            )
            if missing_keys:
                return Response(
                    {"error": f"Missing keys: {', '.join(sorted(missing_keys))}"},
                    status=400,
                )
            created, row_errors = self._process_rows(rows, course, source="Item")
            return Response(
                {"created": created, "errors": row_errors},
                status=201 if created else 400,
            )

        # --- Excel file ---
        if not filename.endswith((".xlsx", ".xls")):
            return Response(
                {"error": "Only .xlsx or .json files are supported."}, status=400
            )

        try:
            headers, rows = self._rows_from_excel(file)
        except Exception:
            return Response(
                {
                    "error": "Could not read the Excel file. Ensure it is a valid .xlsx file."
                },
                status=400,
            )

        if headers is None:
            return Response({"error": "The file is empty."}, status=400)

        missing = self.REQUIRED_COLUMNS - set(headers)
        if missing:
            return Response(
                {"error": f"Missing columns: {', '.join(sorted(missing))}"},
                status=400,
            )

        created, row_errors = self._process_rows(rows, course, source="Row")

        return Response(
            {"created": created, "errors": row_errors}, status=201 if created else 400
        )


class DailyQuizGradeSummaryView(APIView):
    """GET /courses/daily-quiz/questions/grades/ — question counts per grade."""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        from django.db.models import Count

        qs = models.Course.objects.annotate(count=Count("quiz_questions"))
        return Response(
            [
                {
                    "course_id": course.id,
                    "name": course.safe_translation_getter("title", any_language=True),
                    "grade_level": course.grade_level,
                    "count": course.count,
                }
                for course in qs
            ]
        )


class DailyQuizResultsView(APIView):
    """
    GET /courses/daily-quiz/<quiz_id>/results/

    Returns the full quiz with correct answers revealed and the user's score.
    Marks the quiz as completed on first call.
    """

    permission_classes = [IsAuthenticated]

    def get(self, request, quiz_id):
        try:
            quiz = models.DailyQuiz.objects.get(pk=quiz_id, user=request.user)
        except models.DailyQuiz.DoesNotExist:
            return Response({"error": "Quiz not found."}, status=404)

        if quiz.status != "completed":
            quiz.score = quiz.answers.filter(is_correct=True).count()
            quiz.status = "completed"
            quiz.completed_at = timezone.now()
            quiz.save(update_fields=["score", "status", "completed_at"])

        serializer = serializers.DailyQuizResultSerializer(
            quiz, context={"request": request}
        )
        return Response(serializer.data)


# ---------------------------------------------------------------------------
# Quiz Item views
# ---------------------------------------------------------------------------


class QuizItemView(APIView):
    """
    GET    /courses/items/<item_id>/quiz/  — fetch quiz config (admin)
    POST   /courses/items/<item_id>/quiz/  — create quiz for an item (admin)
    PATCH  /courses/items/<item_id>/quiz/  — update quiz config (admin)
    DELETE /courses/items/<item_id>/quiz/  — delete quiz (admin)
    """

    permission_classes = [IsAuthenticated]

    def _get_item(self, item_id):
        try:
            return models.Item.objects.get(pk=item_id)
        except models.Item.DoesNotExist:
            return None

    def _get_quiz(self, item):
        try:
            return item.quiz
        except models.Quiz.DoesNotExist:
            return None

    def get(self, request, item_id):
        item = self._get_item(item_id)
        if not item:
            return Response({"error": "Item not found."}, status=404)
        quiz = self._get_quiz(item)
        if not quiz:
            return Response({"error": "This item has no quiz."}, status=404)
        return Response(serializers.QuizAdminSerializer(quiz).data)

    def post(self, request, item_id):
        item = self._get_item(item_id)
        if not item:
            return Response({"error": "Item not found."}, status=404)
        if item.type != "quiz":
            return Response({"error": "Item type must be 'quiz'."}, status=400)
        if self._get_quiz(item):
            return Response({"error": "This item already has a quiz."}, status=400)
        data = {**request.data, "item": item.id}
        serializer = serializers.QuizAdminSerializer(data=data)
        if serializer.is_valid():
            quiz = serializer.save()
            return Response(serializers.QuizAdminSerializer(quiz).data, status=201)
        return Response(serializer.errors, status=400)

    def patch(self, request, item_id):
        item = self._get_item(item_id)
        if not item:
            return Response({"error": "Item not found."}, status=404)
        quiz = self._get_quiz(item)
        if not quiz:
            return Response({"error": "This item has no quiz."}, status=404)
        serializer = serializers.QuizAdminSerializer(
            quiz, data=request.data, partial=True
        )
        if serializer.is_valid():
            quiz = serializer.save()
            return Response(serializers.QuizAdminSerializer(quiz).data)
        return Response(serializer.errors, status=400)

    def delete(self, request, item_id):
        item = self._get_item(item_id)
        if not item:
            return Response({"error": "Item not found."}, status=404)
        quiz = self._get_quiz(item)
        if not quiz:
            return Response({"error": "This item has no quiz."}, status=404)
        quiz.delete()
        return Response(status=204)


class QuizQuestionUploadView(APIView):
    """
    POST /courses/items/<item_id>/quiz/questions/upload/

    Accepts either:
      - Multipart with field "file" (.xlsx or .json)
      - Raw JSON body: list of question objects

    Excel columns (case-sensitive):
      Question | Option A | Option B | Option C | Option D | Correct Answer

    JSON format:
      [{"question_text":"...","choice_a":"...","choice_b":"...","choice_c":"...","choice_d":"...","correct_answer":"A"}, ...]
    """

    permission_classes = [IsAuthenticated]

    REQUIRED_COLUMNS = {
        "Question",
        "Option A",
        "Option B",
        "Option C",
        "Option D",
        "Correct Answer",
    }
    REQUIRED_JSON_KEYS = {
        "question_text",
        "choice_a",
        "choice_b",
        "choice_c",
        "choice_d",
        "correct_answer",
    }

    def _get_quiz(self, item_id):
        try:
            return models.Item.objects.get(pk=item_id).quiz
        except (models.Item.DoesNotExist, models.Quiz.DoesNotExist):
            return None

    def _rows_from_excel(self, file):
        import openpyxl

        wb = openpyxl.load_workbook(file, read_only=True, data_only=True)
        ws = wb.active
        rows = list(ws.iter_rows(values_only=True))
        if not rows:
            return None, []
        headers = [str(h).strip() if h is not None else "" for h in rows[0]]
        data = [
            {
                headers[i]: (str(v).strip() if v is not None else "")
                for i, v in enumerate(raw)
            }
            for raw in rows[1:]
        ]
        return headers, data

    def _process_rows(self, rows, source="Row"):
        """Validate and create QuizQuestion objects; return (created_list, errors)."""
        created, errors = [], []
        for i, row in enumerate(rows, start=2 if source == "Row" else 1):
            question_text = str(
                row.get("question_text") or row.get("Question") or ""
            ).strip()
            choice_a = str(row.get("choice_a") or row.get("Option A") or "").strip()
            choice_b = str(row.get("choice_b") or row.get("Option B") or "").strip()
            choice_c = str(row.get("choice_c") or row.get("Option C") or "").strip()
            choice_d = str(row.get("choice_d") or row.get("Option D") or "").strip()
            correct = (
                str(row.get("correct_answer") or row.get("Correct Answer") or "")
                .strip()
                .upper()
            )
            explanation = (
                str(row.get("explanation") or row.get("Explanation") or "").strip()
                or None
            )

            if not all([question_text, choice_a, choice_b, choice_c, choice_d]):
                errors.append(f"{source} {i}: all fields are required.")
                continue
            if correct not in ("A", "B", "C", "D"):
                errors.append(
                    f"{source} {i}: correct_answer must be A, B, C, or D (got '{correct}')."
                )
                continue

            q = models.QuizQuestion.objects.create(
                question_text=question_text,
                choice_a=choice_a,
                choice_b=choice_b,
                choice_c=choice_c,
                choice_d=choice_d,
                correct_answer=correct,
                explanation=explanation,
            )
            created.append(q)
        return created, errors

    def post(self, request, item_id):
        quiz = self._get_quiz(item_id)
        if not quiz:
            return Response({"error": "Quiz not found."}, status=404)

        file = request.FILES.get("file")

        # --- JSON body (no file) ---
        if not file:
            rows = request.data if isinstance(request.data, list) else None
            if rows is None:
                return Response(
                    {"error": "Provide a file (.xlsx or .json) or a JSON array body."},
                    status=400,
                )
            created, errors = self._process_rows(rows, source="Item")
            quiz.questions.add(*created)
            return Response(
                {"created": len(created), "errors": errors},
                status=201 if created else 400,
            )

        filename = file.name.lower()

        # --- JSON file ---
        if filename.endswith(".json"):
            try:
                import json

                rows = json.load(file)
            except Exception:
                return Response({"error": "Could not parse the JSON file."}, status=400)
            if not isinstance(rows, list):
                return Response(
                    {"error": "JSON file must contain a list of questions."}, status=400
                )
            missing_keys = (
                self.REQUIRED_JSON_KEYS - set(rows[0].keys()) if rows else set()
            )
            if missing_keys:
                return Response(
                    {"error": f"Missing keys: {', '.join(sorted(missing_keys))}"},
                    status=400,
                )
            created, errors = self._process_rows(rows, source="Item")
            quiz.questions.add(*created)
            return Response(
                {"created": len(created), "errors": errors},
                status=201 if created else 400,
            )

        # --- Excel file ---
        if not filename.endswith((".xlsx", ".xls")):
            return Response(
                {"error": "Only .xlsx or .json files are supported."}, status=400
            )

        try:
            headers, rows = self._rows_from_excel(file)
        except Exception:
            return Response({"error": "Could not read the Excel file."}, status=400)

        if headers is None:
            return Response({"error": "The file is empty."}, status=400)

        missing = self.REQUIRED_COLUMNS - set(headers)
        if missing:
            return Response(
                {"error": f"Missing columns: {', '.join(sorted(missing))}"},
                status=400,
            )

        created, errors = self._process_rows(rows, source="Row")
        quiz.questions.add(*created)
        return Response(
            {"created": len(created), "errors": errors},
            status=201 if created else 400,
        )


class QuizQuestionListView(APIView):
    """
    GET  /courses/items/<item_id>/quiz/questions/  — list questions for this quiz
    POST /courses/items/<item_id>/quiz/questions/  — create a question and add it to this quiz
    """

    permission_classes = [IsAuthenticated]

    def _get_quiz(self, item_id):
        try:
            item = models.Item.objects.get(pk=item_id)
            return item.quiz
        except (models.Item.DoesNotExist, models.Quiz.DoesNotExist):
            return None

    def get(self, request, item_id):
        quiz = self._get_quiz(item_id)
        if not quiz:
            return Response({"error": "Quiz not found."}, status=404)
        serializer = serializers.QuizQuestionAdminSerializer(
            quiz.questions.all(), many=True, context={"request": request}
        )
        return Response(serializer.data)

    def post(self, request, item_id):
        quiz = self._get_quiz(item_id)
        if not quiz:
            return Response({"error": "Quiz not found."}, status=404)
        serializer = serializers.QuizQuestionAdminSerializer(
            data=request.data, context={"request": request}
        )
        if serializer.is_valid():
            question = serializer.save()
            quiz.questions.add(question)
            return Response(
                serializers.QuizQuestionAdminSerializer(
                    question, context={"request": request}
                ).data,
                status=201,
            )
        return Response(serializer.errors, status=400)


class QuizQuestionDetailView(APIView):
    """
    PATCH  /courses/items/<item_id>/quiz/questions/<question_id>/
    DELETE /courses/items/<item_id>/quiz/questions/<question_id>/
    """

    permission_classes = [IsAuthenticated]

    def _get_question(self, item_id, question_id):
        try:
            item = models.Item.objects.get(pk=item_id)
            return item.quiz.questions.get(pk=question_id)
        except (
            models.Item.DoesNotExist,
            models.Quiz.DoesNotExist,
            models.QuizQuestion.DoesNotExist,
        ):
            return None

    def patch(self, request, item_id, question_id):
        question = self._get_question(item_id, question_id)
        if not question:
            return Response({"error": "Question not found."}, status=404)
        serializer = serializers.QuizQuestionAdminSerializer(
            question, data=request.data, partial=True, context={"request": request}
        )
        if serializer.is_valid():
            question = serializer.save()
            return Response(
                serializers.QuizQuestionAdminSerializer(
                    question, context={"request": request}
                ).data
            )
        return Response(serializer.errors, status=400)

    def delete(self, request, item_id, question_id):
        question = self._get_question(item_id, question_id)
        if not question:
            return Response({"error": "Question not found."}, status=404)
        question.delete()
        return Response(status=204)


class StartQuizAttemptView(APIView):
    """GET latest attempt · POST new attempt for /courses/items/<item_id>/quiz/start/"""

    permission_classes = [IsAuthenticated]

    def get(self, request, item_id):
        try:
            item = models.Item.objects.get(pk=item_id)
            quiz = item.quiz
        except (models.Item.DoesNotExist, models.Quiz.DoesNotExist):
            return Response({"error": "Quiz not found."}, status=404)

        attempt = (
            models.QuizAttempt.objects.filter(user=request.user, quiz=quiz)
            .order_by("-created_at")
            .first()
        )
        if not attempt:
            return Response({"error": "No attempt found."}, status=404)

        if attempt.status == "completed":
            return Response(serializers.QuizAttemptResultSerializer(attempt).data)
        return Response(serializers.QuizAttemptDetailSerializer(attempt).data)

    def post(self, request, item_id):
        try:
            item = models.Item.objects.get(pk=item_id)
        except models.Item.DoesNotExist:
            return Response({"error": "Item not found."}, status=404)

        try:
            quiz = item.quiz
        except models.Quiz.DoesNotExist:
            return Response({"error": "This item has no quiz."}, status=404)

        if not quiz.questions.exists():
            return Response({"error": "This quiz has no questions."}, status=400)

        attempt = models.QuizAttempt.objects.create(
            user=request.user,
            quiz=quiz,
            status="in_progress",
        )
        return Response(
            serializers.QuizAttemptDetailSerializer(attempt).data, status=201
        )


class SubmitQuizAnswerView(APIView):
    """POST /courses/quiz-attempts/<attempt_id>/answer/"""

    permission_classes = [IsAuthenticated]

    def post(self, request, attempt_id):
        try:
            attempt = models.QuizAttempt.objects.get(pk=attempt_id, user=request.user)
        except models.QuizAttempt.DoesNotExist:
            return Response({"error": "Attempt not found."}, status=404)

        if attempt.status == "completed":
            return Response({"error": "This attempt is already completed."}, status=400)

        question_id = request.data.get("question_id")
        selected_choice = (request.data.get("selected_choice") or "").upper()

        if not question_id or not selected_choice:
            return Response(
                {"error": "question_id and selected_choice are required."},
                status=400,
            )

        valid = [c[0] for c in models.CORRECT_CHOICES]
        if selected_choice not in valid:
            return Response(
                {"error": f"selected_choice must be one of {valid}."},
                status=400,
            )

        try:
            question = attempt.quiz.questions.get(pk=question_id)
        except models.QuizQuestion.DoesNotExist:
            return Response({"error": "Question not found in this quiz."}, status=404)

        answer, created = models.QuizAnswer.objects.get_or_create(
            attempt=attempt,
            question=question,
            defaults={"selected_answer": selected_choice},
        )
        if not created:
            answer.selected_answer = selected_choice
            answer.save()

        explanation = question.safe_translation_getter("explanation", any_language=True)
        return Response(
            {
                "is_correct": answer.is_correct,
                "selected_choice": selected_choice,
                "correct_answer": question.correct_answer,
                "explanation": explanation or None,
            }
        )


class QuizResultsView(APIView):
    """
    GET /courses/quiz-attempts/<attempt_id>/results/

    Reveals correct answers, computes score, marks completed, and updates
    the item's UserItemProgress to completed.
    """

    permission_classes = [IsAuthenticated]

    def get(self, request, attempt_id):
        try:
            attempt = models.QuizAttempt.objects.get(pk=attempt_id, user=request.user)
        except models.QuizAttempt.DoesNotExist:
            return Response({"error": "Attempt not found."}, status=404)

        if attempt.status != "completed":
            total = attempt.quiz.questions.count()
            correct = attempt.answers.filter(is_correct=True).count()
            attempt.score = round((correct / total) * 100) if total else 0
            attempt.status = "completed"
            attempt.completed_at = timezone.now()
            attempt.save(update_fields=["score", "status", "completed_at"])

            models.UserItemProgress.objects.update_or_create(
                user=request.user,
                item=attempt.quiz.item,
                defaults={"progress": 100, "status": "completed"},
            )

        return Response(serializers.QuizAttemptResultSerializer(attempt).data)
