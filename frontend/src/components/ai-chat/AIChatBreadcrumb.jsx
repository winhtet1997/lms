"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import Breadcrumb from "@/components/layout/Breadcrumb";
import { courseService } from "@/service/courseService";

// The "Ask AI" button (StudentSubNavbar) always encodes chapter_id or
// course_id in the URL whenever there's course context, so the scope is
// read straight from the query string rather than guessed from history —
// it also means the breadcrumb survives a page reload for free.
export default function AIChatBreadcrumb() {
  const t = useTranslations("StudentSubNavbar");
  const tChapter = useTranslations("ChapterDetailsPage");
  const tChapterLabel = useTranslations("Chapter");
  const tNav = useTranslations("Navbar");
  const searchParams = useSearchParams();
  const chapterId = searchParams.get("chapter_id");
  const courseIdParam = searchParams.get("course_id");

  const [chapterTitle, setChapterTitle] = useState(null);
  const [chapterCourseId, setChapterCourseId] = useState(null);
  const [courseTitle, setCourseTitle] = useState(null);

  useEffect(() => {
    if (!chapterId) return;
    courseService
      .getChapter(chapterId)
      .then((data) => {
        setChapterTitle(data?.title ?? null);
        setChapterCourseId(data?.course_id ?? null);
      })
      .catch(() => {
        setChapterTitle(null);
        setChapterCourseId(null);
      });
  }, [chapterId]);

  const courseId = courseIdParam || chapterCourseId;

  useEffect(() => {
    if (!courseId) return;
    courseService
      .getCourseByIdBasic(courseId)
      .then((data) => setCourseTitle(data?.title ?? null))
      .catch(() => setCourseTitle(null));
  }, [courseId]);

  const home = { label: tNav("home"), href: "/student/home" };
  const askAiCrumb = { label: t("askAiButton") };

  const items = courseId
    ? [
        home,
        { label: tNav("courses"), href: "/courses" },
        { label: courseTitle || tChapter("currentCourse"), href: `/courses/${courseId}` },
        ...(chapterId
          ? [
              {
                label: chapterTitle || tChapterLabel("chapterLabel"),
                href: `/courses/${courseId}/chapter-details/${chapterId}`,
              },
            ]
          : []),
        askAiCrumb,
      ]
    : [home, askAiCrumb];

  return <Breadcrumb items={items} className="mb-3" />;
}
