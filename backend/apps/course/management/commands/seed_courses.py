from django.core.management.base import BaseCommand

from apps.course.models import Chapter, Course, Item, Lesson, Subject

SEED_DATA = [
    {
        "title": "Mathematics Grade 7",
        "description": "Core mathematics for grade 7 students.",
        "grade_level": "7",
        "chapters": [
            {
                "title": "Numbers and Operations",
                "description": "Understanding integers",
                "priority_index": 1,
                "lessons": [
                    {
                        "title": "Introduction to Integers",
                        "description": "Learn math",
                        "priority_index": 1,
                        "items": [
                            {
                                "title": "What is function?",
                                "description": "Function!!!",
                                "type": "video",
                                "duration": 10.0,
                                "grade_level": "7",
                                "priority_index": 1,
                                "file": "uploads/media/video/1",
                                "tags": ["math", "functions", "grade-7"],
                            },
                            {
                                "title": "Course Structure",
                                "description": "Course Structure",
                                "type": "document",
                                "grade_level": "7",
                                "priority_index": 2,
                                "file": "uploads/media/document/2",
                                "tags": ["math", "overview", "grade-7"],
                            },
                        ],
                    },
                    {
                        "title": "Sorting Number",
                        "description": "Play with number",
                        "priority_index": 2,
                        "items": [
                            {
                                "title": "Largest Number",
                                "description": "Play with number",
                                "type": "activity",
                                "grade_level": "7",
                                "priority_index": 1,
                                "activity_code": "<div>Hello World</div>",
                                "tags": ["math", "sorting", "activity",
                                         "grade-7"],
                            },
                        ],
                    },
                ],
            }
        ],
    }
]


class Command(BaseCommand):
    help = """Seed the database with sample courses, """
    """chapters, lessons, and items."""

    def add_arguments(self, parser):
        parser.add_argument(
            "--clear",
            action="store_true",
            help="Delete all existing courses before seeding.",
        )

    def handle(self, *args, **options):
        if options["clear"]:
            deleted, _ = Course.objects.all().delete()
            self.stdout.write(
                self.style.WARNING(f"""Deleted {deleted} """
                                   """existing course records.""")
            )
        Subject.objects.all().delete()
        subject = Subject()
        subject.set_current_language("en")
        subject.name = "Math"
        subject.save()

        for course_data in SEED_DATA:
            chapters_data = course_data.pop("chapters")
            course = Course()
            course.set_current_language("en")
            course.title = course_data["title"]
            course.description = course_data["description"]
            course.subject = subject
            course.grade_level = course_data["grade_level"]
            course.save()
            self.stdout.write(f"Course: {course_data['title']}")

            for chapter_data in chapters_data:
                lessons_data = chapter_data.pop("lessons")
                chapter = Chapter(
                    course=course,
                    priority_index=chapter_data["priority_index"],
                )
                chapter.set_current_language("en")
                chapter.title = chapter_data["title"]
                chapter.description = chapter_data["description"]
                chapter.save()
                self.stdout.write(f"    Chapter: {chapter_data['title']}")

                for lesson_data in lessons_data:
                    items_data = lesson_data.pop("items")
                    lesson = Lesson(
                        chapter=chapter,
                        priority_index=lesson_data["priority_index"],
                    )
                    lesson.set_current_language("en")
                    lesson.title = lesson_data["title"]
                    lesson.description = lesson_data["description"]
                    lesson.save()
                    self.stdout.write(f"      Lesson: {lesson_data['title']}")

                    for item_data in items_data:
                        item = Item(
                            type=item_data["type"],
                            duration=item_data.get("duration", 0.0),
                            grade_level=item_data["grade_level"],
                            priority_index=item_data["priority_index"]
                        )
                        item.set_current_language("en")
                        item.title = item_data["title"]
                        item.description = item_data["description"]
                        if item_data.get("file"):
                            item.file = item_data["file"]
                        if item_data.get("activity_code"):
                            item.activity_code = item_data["activity_code"]
                        item.publication_status = True
                        item.save()
                        if item_data.get("tags"):
                            item.tags.add(*item_data["tags"])
                        lesson.items.add(item)
                        self.stdout.write(f"        Item: {item_data['title']}")

        self.stdout.write(self.style.SUCCESS("Seeding complete."))
