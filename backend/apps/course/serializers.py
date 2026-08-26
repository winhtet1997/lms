from django.db.models import Sum, Prefetch
from rest_framework import serializers
from rest_framework.validators import UniqueTogetherValidator
from taggit.serializers import TagListSerializerField, TaggitSerializer
from . import models
from .s3 import generate_presigned_get_url
from apps.billing.access import has_chapter_access, has_item_access


class CourseMessageSerializer(serializers.Serializer):
    message = serializers.CharField()


class SubjectSerializer(serializers.ModelSerializer):
    name = serializers.CharField()

    class Meta:
        model = models.Subject
        fields = ["id", "name"]


class ItemSerializer(TaggitSerializer, serializers.ModelSerializer):
    id = serializers.IntegerField(read_only=True)
    tags = TagListSerializerField()
    title = serializers.CharField()
    description = serializers.CharField(required=False, allow_blank=True)
    file = serializers.SerializerMethodField()
    filename = serializers.SerializerMethodField()
    item_size = serializers.SerializerMethodField()
    completion_status = serializers.SerializerMethodField()
    publication_status = serializers.BooleanField(required=False,
                                                  default=False)
    item_questions = serializers.SerializerMethodField(required=False)
    item_view = serializers.SerializerMethodField(required=False)
    is_locked = serializers.SerializerMethodField()

    class Meta:
        model = models.Item
        fields = "__all__"
        extra_kwargs = {
            "file": {"read_only": True},
            "file_size": {"read_only": True},
        }

    def create(self, validated_data):
        tags = validated_data.pop("tags", [])
        item = models.Item.objects.create(**validated_data)

        if tags:
            item.tags.set(tags)

        return item

    def get_file(self, obj) -> str:
        if obj.file and obj.file.name:
            return generate_presigned_get_url(obj.file.name)
        return None

    def get_filename(self, obj) -> str:
        import os
        if obj.file and obj.file.name:
            return os.path.basename(obj.file.name)
        return None

    def get_completion_status(self, obj) -> str:
        user = self.context.get("request").user
        if user.is_anonymous:
            return None

        progress = models.UserItemProgress.objects.filter(
            user=user, item=obj).first()
        return progress.status if progress else None

    def get_item_questions(self, obj) -> str:
        return obj.get_questions_length()

    def get_item_view(self, obj) -> str:
        return models.UserItemProgress.objects.filter(item=obj).count()

    def get_item_size(self, obj) -> str:
        if not obj.file_size:
            return None
        size = float(obj.file_size)
        for unit in ["B", "KB", "MB", "GB"]:
            if size < 1024:
                return f"{size:.1f} {unit}"
            size /= 1024
        return f"{size:.1f} TB"

    def get_is_locked(self, obj) -> bool:
        request = self.context.get("request")
        user = request.user if request else None
        lesson = models.Lesson.objects.filter(items=obj).select_related("chapter").first()
        if not lesson:
            return False
        return not has_item_access(user, lesson.chapter)


class ItemBasicSerializer(serializers.ModelSerializer):
    """Lightweight item info — no file URL or activity code. Returned instead
    of the full item detail when the requesting user does not have access to
    the item's chapter."""
    id = serializers.IntegerField(read_only=True)
    title = serializers.CharField()
    description = serializers.CharField(required=False, allow_blank=True)
    is_locked = serializers.SerializerMethodField()

    class Meta:
        model = models.Item
        fields = ["id", "title", "description", "type", "duration", "grade_level", "priority_index", "is_locked"]

    def get_is_locked(self, obj) -> bool:
        # This serializer is only ever used to represent an item the
        # requesting user does not have access to.
        return True


class LearningPathItemSerializer(serializers.ModelSerializer):
    completion_status = serializers.SerializerMethodField()
    file = serializers.SerializerMethodField()
    locked = serializers.SerializerMethodField()

    class Meta:
        model = models.Item
        fields = ["id", "title", "type", "file", "duration", "completion_status", "locked"]

    def get_completion_status(self, obj) -> str:
        completed_ids = self.context.get("completed_item_ids", set())
        return "completed" if obj.id in completed_ids else "not_started"

    def get_locked(self, obj) -> bool:
        return obj.id in self.context.get("locked_item_ids", set())

    def get_file(self, obj) -> str:
        if obj.id in self.context.get("locked_item_ids", set()):
            return None
        if obj.file and obj.file.name:
            return generate_presigned_get_url(obj.file.name)
        return None


class LearningPathLessonSerializer(serializers.ModelSerializer):
    items = LearningPathItemSerializer(many=True, read_only=True)

    class Meta:
        model = models.Lesson
        fields = ["id", "title", "items"]


class LearningPathChapterSerializer(serializers.ModelSerializer):
    lessons = LearningPathLessonSerializer(many=True, read_only=True)

    class Meta:
        model = models.Chapter
        fields = ["id", "title", "lessons"]


class ItemDetailSerializer(ItemSerializer):
    duration = serializers.FloatField(required=False, default=0.0)
    file = serializers.SerializerMethodField()
    learning_path = serializers.SerializerMethodField()

    def get_file(self, obj) -> str:
        if obj.file and obj.file.name:
            return generate_presigned_get_url(obj.file.name)
        return None

    def get_learning_path(self, obj) -> dict:
        lesson = (
            models.Lesson.objects.filter(items=obj)
            .select_related("chapter__course")
            .first()
        )
        if not lesson:
            return {}

        course = lesson.chapter.course
        chapters = (
            models.Chapter.objects.filter(course=course)
            .order_by("priority_index")
            .prefetch_related(
                Prefetch(
                    "lessons__items",
                    queryset=models.Item.objects.filter(publication_status=True).order_by("priority_index"),
                )
            )
        )

        user = self.context.get("request").user
        if not user.is_anonymous:
            completed_ids = set(
                models.UserItemProgress.objects.filter(
                    user=user,
                    item__lesson__chapter__course=course,
                    status="completed",
                ).values_list("item_id", flat=True)
            )
        else:
            completed_ids = set()

        locked_item_ids = set()
        for chapter in chapters:
            if has_item_access(user, chapter):
                continue
            for lsn in chapter.lessons.all():
                locked_item_ids.update(item.id for item in lsn.items.all())

        ctx = {
            **self.context,
            "completed_item_ids": completed_ids,
            "locked_item_ids": locked_item_ids,
        }
        return {
            "current_item_id": obj.id,
            "chapters": LearningPathChapterSerializer(chapters, many=True, context=ctx).data,
        }


class LessonSerializer(serializers.ModelSerializer):
    id = serializers.IntegerField(read_only=True)
    title = serializers.CharField(max_length=255)
    description = serializers.CharField()
    chapter_id = serializers.IntegerField()
    items = serializers.PrimaryKeyRelatedField(
        queryset=models.Item.objects.all(),
        many=True,
        required=False
    )

    class Meta:
        model = models.Lesson
        fields = [
            "id",
            "title",
            "description",
            "chapter_id",
            "items",
            "priority_index",
        ]

    def create(self, validated_data):
        items = validated_data.pop("items", None)
        chapter_id = validated_data.pop("chapter_id", None)

        if chapter_id is None:
            raise serializers.ValidationError(
                {"chapter_id": "This field is required."})

        try:
            chapter = models.Chapter.objects.get(id=chapter_id)
        except models.Chapter.DoesNotExist:
            raise serializers.ValidationError(
                {"chapter_id": "Chapter not found."})

        lesson = models.Lesson.objects.create(chapter=chapter,
                                              **validated_data)

        if items is not None:
            lesson.items.set(items)

        return lesson

    def update(self, instance, validated_data):
        items = validated_data.pop("items", None)
        chapter_id = validated_data.pop("chapter_id", None)

        if chapter_id is not None:
            try:
                chapter = models.Chapter.objects.get(id=chapter_id)
            except models.Chapter.DoesNotExist:
                raise serializers.ValidationError(
                    {"chapter_id": "Chapter not found."})
            instance.chapter = chapter

        instance.title = validated_data.get("title", instance.title)
        instance.description = validated_data.get("description",
                                                  instance.description)

        instance.save()

        if items is not None:
            instance.items.set(items)

        return instance


class LessonDetailSerializer(serializers.ModelSerializer):
    id = serializers.IntegerField(read_only=True)
    title = serializers.CharField(max_length=255)
    description = serializers.CharField()
    items = serializers.SerializerMethodField()

    class Meta:
        model = models.Lesson
        fields = [
            "id",
            "title",
            "description",
            "items",
        ]

    def get_items(self, obj):
        ordered = obj.items.order_by("priority_index")
        return ItemSerializer(ordered, many=True, context=self.context).data


class LessonBasicSerializer(serializers.ModelSerializer):
    """Lightweight lesson info — items are rendered via ItemBasicSerializer
    (no file/activity_code). Used in locked/preview chapter responses."""
    id = serializers.IntegerField(read_only=True)
    title = serializers.CharField(max_length=255)
    description = serializers.CharField()
    items = serializers.SerializerMethodField()

    class Meta:
        model = models.Lesson
        fields = ["id", "title", "description", "items"]

    def get_items(self, obj):
        ordered = obj.items.order_by("priority_index")
        return ItemBasicSerializer(ordered, many=True).data


class ChapterBasicSerializer(serializers.ModelSerializer):
    """Lightweight chapter info — no computed queries. Used for the fast initial course page load."""
    id = serializers.IntegerField(read_only=True)
    title = serializers.CharField(max_length=255)
    description = serializers.CharField()
    icon = serializers.FileField(required=False, allow_null=True)

    class Meta:
        model = models.Chapter
        fields = ["id", "title", "description", "icon", "priority_index", "is_free_preview"]


class ChapterPreviewSerializer(serializers.ModelSerializer):
    """Chapter info shown to users without access to the chapter — titles and
    descriptions for chapter/lessons/items, but no file or activity_code."""
    id = serializers.IntegerField(read_only=True)
    title = serializers.CharField(max_length=255)
    description = serializers.CharField()
    icon = serializers.FileField(required=False, allow_null=True)
    lessons = LessonBasicSerializer(many=True, read_only=True)

    class Meta:
        model = models.Chapter
        fields = ["id", "title", "description", "icon", "priority_index", "is_free_preview", "lessons"]


class ChapterSerializer(serializers.ModelSerializer):
    id = serializers.IntegerField(read_only=True)
    icon = serializers.FileField(required=False, allow_null=True)
    title = serializers.CharField(max_length=255)
    description = serializers.CharField()
    course_id = serializers.IntegerField()
    chapter_completion_status = serializers.SerializerMethodField()
    total_video_items = serializers.SerializerMethodField()
    total_completed_video_items = serializers.SerializerMethodField()
    total_document_items = serializers.SerializerMethodField()
    total_completed_document_items = serializers.SerializerMethodField()
    total_activity_items = serializers.SerializerMethodField()
    total_completed_activity_items = serializers.SerializerMethodField()
    total_scorm_items = serializers.SerializerMethodField()
    total_completed_scorm_items = serializers.SerializerMethodField()
    total_quiz_items = serializers.SerializerMethodField()
    total_completed_quiz_items = serializers.SerializerMethodField()
    total_assessment_items = serializers.SerializerMethodField()
    total_completed_assessment_items = serializers.SerializerMethodField()
    total_time = serializers.SerializerMethodField()
    is_locked = serializers.SerializerMethodField()

    class Meta:
        model = models.Chapter
        fields = [
            "id",
            "title",
            "description",
            "course_id",
            "icon",
            "priority_index",
            "is_free_preview",
            "chapter_completion_status",
            "total_video_items",
            "total_completed_video_items",
            "total_document_items",
            "total_completed_document_items",
            "total_activity_items",
            "total_completed_activity_items",
            "total_scorm_items",
            "total_completed_scorm_items",
            "total_quiz_items",
            "total_completed_quiz_items",
            "total_assessment_items",
            "total_completed_assessment_items",
            "total_time",
            "is_locked",
        ]

    def create(self, validated_data):
        course_id = validated_data.pop("course_id")
        try:
            course = models.Course.objects.get(id=course_id)
        except models.Course.DoesNotExist:
            raise serializers.ValidationError("Course not found")
        chapter = models.Chapter.objects.create(course=course,
                                                **validated_data)
        return chapter

    def get_chapter_completion_status(self, obj) -> str:
        user = self.context.get("request").user
        return obj.get_chapter_progress(user)

    def _completed_count(self, obj, item_type, user):
        return models.UserItemProgress.objects.filter(
            user=user, item__lesson__chapter=obj,
            item__type=item_type, status="completed"
        ).count()

    def get_total_video_items(self, obj) -> int:
        return models.Item.objects.filter(lesson__chapter=obj, type="video").count()

    def get_total_completed_video_items(self, obj) -> int:
        user = self.context.get("request").user
        return 0 if user.is_anonymous else self._completed_count(obj, "video", user)

    def get_total_document_items(self, obj) -> int:
        return models.Item.objects.filter(lesson__chapter=obj, type="document").count()

    def get_total_completed_document_items(self, obj) -> int:
        user = self.context.get("request").user
        return 0 if user.is_anonymous else self._completed_count(obj, "document", user)

    def get_total_activity_items(self, obj) -> int:
        return models.Item.objects.filter(lesson__chapter=obj, type="activity").count()

    def get_total_completed_activity_items(self, obj) -> int:
        user = self.context.get("request").user
        return 0 if user.is_anonymous else self._completed_count(obj, "activity", user)

    def get_total_scorm_items(self, obj) -> int:
        return models.Item.objects.filter(lesson__chapter=obj, type="scorm").count()

    def get_total_completed_scorm_items(self, obj) -> int:
        user = self.context.get("request").user
        return 0 if user.is_anonymous else self._completed_count(obj, "scorm", user)

    def get_total_quiz_items(self, obj) -> int:
        return models.Item.objects.filter(lesson__chapter=obj, type="quiz").count()

    def get_total_completed_quiz_items(self, obj) -> int:
        user = self.context.get("request").user
        return 0 if user.is_anonymous else self._completed_count(obj, "quiz", user)

    def get_total_assessment_items(self, obj) -> int:
        return models.Item.objects.filter(lesson__chapter=obj, type="assessment").count()

    def get_total_completed_assessment_items(self, obj) -> int:
        return 0

    def get_total_time(self, obj) -> int:
        return int(
            models.Item.objects.filter(lesson__chapter=obj)
            .aggregate(total=Sum("duration"))["total"] or 0
        )
    
    def get_is_locked(self, obj) -> bool:
        user = self.context.get("request").user
        return not has_chapter_access(user, obj)


class ChapterDetailSerializer(ChapterSerializer):
    id = serializers.IntegerField(read_only=True)
    title = serializers.CharField(max_length=255)
    description = serializers.CharField()
    lessons = serializers.SerializerMethodField()

    class Meta:
        model = models.Chapter
        fields = "__all__"

    def get_lessons(self, obj):
        ordered_lessons = obj.lessons.order_by("priority_index")
        user = self.context.get("request").user
        if has_chapter_access(user, obj):
            return LessonDetailSerializer(
                ordered_lessons, many=True, context=self.context
            ).data
        return LessonBasicSerializer(
            ordered_lessons, many=True, context=self.context
        ).data

    def update(self, instance, validated_data):
        instance.title = validated_data.get("title", instance.title)
        instance.description = validated_data.get(
            "description", instance.description)
        instance.save()
        return instance


class CourseUniqueTogetherValidator(UniqueTogetherValidator):
    """Skip uniqueness check when subject is absent or null."""
    def enforce_required_fields(self, attrs, serializer):
        pass

    def __call__(self, attrs, serializer):
        if not attrs.get("subject"):
            return
        super().__call__(attrs, serializer)


class CourseSerializer(serializers.ModelSerializer):
    title = serializers.CharField(max_length=255)
    description = serializers.CharField()
    subject = serializers.PrimaryKeyRelatedField(
        queryset=models.Subject.objects.all(),
        allow_null=True,
        required=False,
    )
    subject_name = serializers.SerializerMethodField()

    class Meta:
        model = models.Course
        fields = "__all__"
        validators = [
            CourseUniqueTogetherValidator(
                queryset=models.Course.objects.all(),
                fields=["subject", "grade_level"],
                message="A course for this subject and grade already exists.",
            )
        ]

    def get_subject_name(self, obj) -> str:
        if not obj.subject:
            return None
        return obj.subject.safe_translation_getter("name", any_language=True)

    def get_grade_level(self, obj) -> str:
        return obj.get_grade_level(obj)

    def create(self, validated_data):
        return models.Course.objects.create(**validated_data)

    def update(self, instance, validated_data):
        instance.title = validated_data.get("title", instance.title)
        instance.description = validated_data.get("description", instance.description)
        instance.grade_level = validated_data.get("grade_level", instance.grade_level)
        if "subject" in validated_data:
            instance.subject = validated_data["subject"]
        if "publication_status" in validated_data:
            instance.publication_status = validated_data["publication_status"]
        instance.save()
        return instance


class CourseDetailSerializer(CourseSerializer):
    # Do not change this to ChapterSerializer.
    chapters = ChapterDetailSerializer(many=True, read_only=True)
    total_items = serializers.SerializerMethodField()
    total_video_items = serializers.SerializerMethodField()
    total_completed_video_items = serializers.SerializerMethodField()
    total_document_items = serializers.SerializerMethodField()
    total_completed_document_items = serializers.SerializerMethodField()
    total_activity_items = serializers.SerializerMethodField()
    total_completed_activity_items = serializers.SerializerMethodField()
    total_quiz_items = serializers.SerializerMethodField()
    total_completed_quiz_items = serializers.SerializerMethodField()
    total_scorm_items = serializers.SerializerMethodField()
    total_completed_scorm_items = serializers.SerializerMethodField()
    total_assessment_items = serializers.SerializerMethodField()
    total_completed_assessment_items = serializers.SerializerMethodField()
    overall_progress = serializers.SerializerMethodField()
    total_chapters = serializers.SerializerMethodField()
    course_progress = serializers.SerializerMethodField()
    total_time = serializers.SerializerMethodField()

    def _course_completed_count(self, obj, item_type, user):
        return models.UserItemProgress.objects.filter(
            user=user, item__lesson__chapter__course=obj,
            item__type=item_type, status="completed"
        ).count()

    def get_total_items(self, obj) -> int:
        return models.Item.objects.filter(lesson__chapter__course=obj).count()

    def get_total_video_items(self, obj) -> int:
        return models.Item.objects.filter(lesson__chapter__course=obj, type="video").count()

    def get_total_completed_video_items(self, obj) -> int:
        user = self.context.get("request").user
        return 0 if user.is_anonymous else self._course_completed_count(obj, "video", user)

    def get_total_document_items(self, obj) -> int:
        return models.Item.objects.filter(lesson__chapter__course=obj, type="document").count()

    def get_total_completed_document_items(self, obj) -> int:
        user = self.context.get("request").user
        return 0 if user.is_anonymous else self._course_completed_count(obj, "document", user)

    def get_total_activity_items(self, obj) -> int:
        return models.Item.objects.filter(lesson__chapter__course=obj, type="activity").count()

    def get_total_completed_activity_items(self, obj) -> int:
        user = self.context.get("request").user
        return 0 if user.is_anonymous else self._course_completed_count(obj, "activity", user)

    def get_total_quiz_items(self, obj) -> int:
        return models.Item.objects.filter(lesson__chapter__course=obj, type="quiz").count()

    def get_total_completed_quiz_items(self, obj) -> int:
        user = self.context.get("request").user
        return 0 if user.is_anonymous else self._course_completed_count(obj, "quiz", user)

    def get_total_scorm_items(self, obj) -> int:
        return models.Item.objects.filter(lesson__chapter__course=obj, type="scorm").count()

    def get_total_completed_scorm_items(self, obj) -> int:
        user = self.context.get("request").user
        return 0 if user.is_anonymous else self._course_completed_count(obj, "scorm", user)

    def get_total_assessment_items(self, obj) -> int:
        return models.Item.objects.filter(lesson__chapter__course=obj, type="assessment").count()

    def get_total_completed_assessment_items(self, obj) -> int:
        return 0

    def get_overall_progress(self, obj) -> int:
        user = self.context.get("request").user
        if user.is_anonymous:
            return 0
        total = models.Item.objects.filter(lesson__chapter__course=obj).count()
        if total == 0:
            return 0
        completed = models.UserItemProgress.objects.filter(
            user=user, item__lesson__chapter__course=obj, status="completed"
        ).count()
        return round((completed / total) * 100)

    def get_total_chapters(self, obj) -> int:
        return obj.chapters.count()

    def get_course_progress(self, obj) -> int:
        user = self.context.get("request").user
        return obj.get_course_progress(user)

    def get_total_time(self, obj) -> int:
        return int(
            models.Item.objects.filter(lesson__chapter__course=obj)
            .aggregate(total=Sum("duration"))["total"] or 0
        )


class CourseBasicDetailSerializer(CourseDetailSerializer):
    """Same as CourseDetailSerializer but returns lightweight chapter info (no lessons).
    Used by the student course page for fast initial load."""
    chapters = ChapterBasicSerializer(many=True, read_only=True)


class UserItemProgressSerializer(serializers.ModelSerializer):
    class Meta:
        model = models.UserItemProgress
        fields = ["id", "item", "progress", "status", "updated_at"]
        read_only_fields = ["id", "updated_at"]


class DailyQuizQuestionAdminSerializer(serializers.ModelSerializer):
    """Full question serializer for admin CRUD — includes correct_answer."""
    question_text = serializers.CharField()
    choice_a = serializers.CharField()
    choice_b = serializers.CharField()
    choice_c = serializers.CharField()
    choice_d = serializers.CharField()

    class Meta:
        model = models.DailyQuizQuestion
        fields = [
            "id", "question_text", "choice_a", "choice_b", "choice_c", "choice_d",
            "correct_answer", "course", "created_at",
        ]
        read_only_fields = ["id", "created_at"]

    def create(self, validated_data):
        return models.DailyQuizQuestion.objects.create(**validated_data)

    def update(self, instance, validated_data):
        translated = ["question_text", "choice_a", "choice_b", "choice_c", "choice_d"]
        instance.set_current_language("en")
        for field in translated:
            if field in validated_data:
                setattr(instance, field, validated_data.pop(field))
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        return instance


class DailyQuizAnswerSerializer(serializers.ModelSerializer):
    selected_choice = serializers.CharField(source="selected_answer")

    class Meta:
        model = models.DailyQuizAnswer
        fields = ["selected_choice", "is_correct"]


class DailyQuizQuestionInnerSerializer(serializers.ModelSerializer):
    """Question fields shown during an active quiz — no correct_answer."""
    question_text = serializers.CharField()
    choice_a = serializers.CharField()
    choice_b = serializers.CharField()
    choice_c = serializers.CharField()
    choice_d = serializers.CharField()

    class Meta:
        model = models.DailyQuizQuestion
        fields = ["id", "question_text", "choice_a", "choice_b", "choice_c", "choice_d"]


class DailyQuizQuestionInnerResultSerializer(DailyQuizQuestionInnerSerializer):
    """Same as above but includes correct_answer for the results view."""

    class Meta(DailyQuizQuestionInnerSerializer.Meta):
        fields = DailyQuizQuestionInnerSerializer.Meta.fields + ["correct_answer"]


class DailyQuizDetailSerializer(serializers.ModelSerializer):
    """
    Quiz response used while the quiz is in progress.
    Each question entry: { id, question: {…}, user_answer: {…} | null }
    correct_answer is never included here.
    """
    is_completed = serializers.SerializerMethodField()
    questions = serializers.SerializerMethodField()

    class Meta:
        model = models.DailyQuiz
        fields = ["id", "date", "status", "score", "is_completed", "questions", "created_at"]

    def get_is_completed(self, obj) -> bool:
        return obj.status == "completed"

    def get_questions(self, obj) -> list:
        result = []
        for question in obj.questions.all():
            answer = models.DailyQuizAnswer.objects.filter(
                quiz=obj, question=question
            ).first()
            result.append({
                "id": question.id,
                "question": DailyQuizQuestionInnerSerializer(question).data,
                "user_answer": DailyQuizAnswerSerializer(answer).data if answer else None,
            })
        return result


class DailyQuizResultSerializer(serializers.ModelSerializer):
    """
    Quiz results response — correct_answer is revealed inside each question entry.
    """
    total_questions = serializers.SerializerMethodField()
    correct_count = serializers.SerializerMethodField()
    questions = serializers.SerializerMethodField()

    class Meta:
        model = models.DailyQuiz
        fields = ["id", "date", "score", "total_questions", "correct_count", "questions", "completed_at"]

    def get_total_questions(self, obj) -> int:
        return obj.questions.count()

    def get_correct_count(self, obj) -> int:
        return obj.answers.filter(is_correct=True).count()

    def get_questions(self, obj) -> list:
        result = []
        for question in obj.questions.all():
            answer = obj.answers.filter(question=question).first()
            result.append({
                "id": question.id,
                "question": DailyQuizQuestionInnerResultSerializer(question).data,
                "user_answer": DailyQuizAnswerSerializer(answer).data if answer else None,
            })
        return result


class QuizQuestionAdminSerializer(serializers.ModelSerializer):
    """Admin CRUD for QuizQuestion — includes correct_answer and explanation."""
    question_text = serializers.CharField()
    choice_a = serializers.CharField()
    choice_b = serializers.CharField()
    choice_c = serializers.CharField()
    choice_d = serializers.CharField()
    explanation = serializers.CharField(allow_blank=True, allow_null=True, required=False)

    class Meta:
        model = models.QuizQuestion
        fields = [
            "id", "question_text", "choice_a", "choice_b", "choice_c", "choice_d",
            "correct_answer", "explanation", "created_at",
        ]
        read_only_fields = ["id", "created_at"]

    def _get_language(self):
        request = self.context.get("request")
        if request:
            lang = request.headers.get("Accept-Language", "en").split(",")[0].split(";")[0].strip()
            return lang or "en"
        return "en"

    def create(self, validated_data):
        lang = self._get_language()
        translated_fields = ["question_text", "choice_a", "choice_b", "choice_c", "choice_d", "explanation"]
        trans_data = {k: validated_data.pop(k) for k in translated_fields if k in validated_data}
        instance = models.QuizQuestion(**validated_data)
        instance.set_current_language(lang)
        for field, value in trans_data.items():
            setattr(instance, field, value)
        instance.save()
        return instance

    def update(self, instance, validated_data):
        lang = self._get_language()
        translated = ["question_text", "choice_a", "choice_b", "choice_c", "choice_d", "explanation"]
        instance.set_current_language(lang)
        for field in translated:
            if field in validated_data:
                setattr(instance, field, validated_data.pop(field))
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        return instance


class QuizQuestionInnerSerializer(serializers.ModelSerializer):
    """Question fields during an active attempt — no correct_answer."""
    question_text = serializers.CharField()
    choice_a = serializers.CharField()
    choice_b = serializers.CharField()
    choice_c = serializers.CharField()
    choice_d = serializers.CharField()

    class Meta:
        model = models.QuizQuestion
        fields = ["id", "question_text", "choice_a", "choice_b", "choice_c", "choice_d"]


class QuizQuestionInnerResultSerializer(QuizQuestionInnerSerializer):
    """Same as above but includes correct_answer and explanation for the results view."""
    explanation = serializers.CharField(allow_null=True)

    class Meta(QuizQuestionInnerSerializer.Meta):
        fields = QuizQuestionInnerSerializer.Meta.fields + ["correct_answer", "explanation"]


class QuizAnswerSerializer(serializers.ModelSerializer):
    selected_choice = serializers.CharField(source="selected_answer")

    class Meta:
        model = models.QuizAnswer
        fields = ["selected_choice", "is_correct"]


class QuizAdminSerializer(serializers.ModelSerializer):
    """Admin serializer for creating/editing a Quiz attached to an Item."""

    class Meta:
        model = models.Quiz
        fields = ["id", "item", "passing_score", "time_limit_minutes"]
        read_only_fields = ["id"]


class QuizAttemptDetailSerializer(serializers.ModelSerializer):
    """Active attempt view — correct_answer is never exposed."""
    is_completed = serializers.SerializerMethodField()
    questions = serializers.SerializerMethodField()

    class Meta:
        model = models.QuizAttempt
        fields = ["id", "status", "score", "is_completed", "questions", "created_at"]

    def get_is_completed(self, obj) -> bool:
        return obj.status == "completed"

    def get_questions(self, obj) -> list:
        result = []
        for question in obj.quiz.questions.all():
            answer = models.QuizAnswer.objects.filter(
                attempt=obj, question=question
            ).first()
            result.append({
                "id": question.id,
                "question": QuizQuestionInnerSerializer(question).data,
                "user_answer": QuizAnswerSerializer(answer).data if answer else None,
            })
        return result


class QuizAttemptResultSerializer(serializers.ModelSerializer):
    """Results view — correct_answer is revealed."""
    total_questions = serializers.SerializerMethodField()
    correct_count = serializers.SerializerMethodField()
    passed = serializers.SerializerMethodField()
    questions = serializers.SerializerMethodField()

    class Meta:
        model = models.QuizAttempt
        fields = [
            "id", "score", "total_questions", "correct_count",
            "passed", "questions", "completed_at",
        ]

    def get_total_questions(self, obj) -> int:
        return obj.quiz.questions.count()

    def get_correct_count(self, obj) -> int:
        return obj.answers.filter(is_correct=True).count()

    def get_passed(self, obj) -> bool:
        return obj.score >= obj.quiz.passing_score

    def get_questions(self, obj) -> list:
        result = []
        for question in obj.quiz.questions.all():
            answer = obj.answers.filter(question=question).first()
            result.append({
                "id": question.id,
                "question": QuizQuestionInnerResultSerializer(question).data,
                "user_answer": QuizAnswerSerializer(answer).data if answer else None,
            })
        return result

