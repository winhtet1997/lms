"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import Breadcrumb from "@/components/layout/Breadcrumb";
import { useAuthStore } from "@/store/useAuthStore";
import { useNavigationHistoryStore } from "@/store/useNavigationHistoryStore";
import { courseService } from "@/service/courseService";

const HOME_PATH_BY_ROLE = {
  Student: "/student/home",
  Parent: "/parents/home",
  Tutor: "/tutor/home",
  Admin: "/dashboard/home",
  Superadmin: "/dashboard/home",
};

const SESSIONS_PATH_BY_ROLE = {
  Student: "/student/sessions",
  Tutor: "/dashboard/session-management",
  Admin: "/dashboard/session-management",
  Superadmin: "/dashboard/session-management",
};

export default function LeaderboardBreadcrumb() {
  const t = useTranslations("StudentSubNavbar");
  const tChapter = useTranslations("ChapterDetailsPage");
  const tChapterLabel = useTranslations("Chapter");
  const tNav = useTranslations("Navbar");
  const { user } = useAuthStore();
  const previousPath = useNavigationHistoryStore((s) => s.previousPath);
  const [courseTitle, setCourseTitle] = useState(null);
  const [chapterTitle, setChapterTitle] = useState(null);
  const [itemTitle, setItemTitle] = useState(null);

  const courseMatch = previousPath?.match(
    /\/courses\/([^/]+)(?:\/chapter-details\/([^/]+)(?:\/([^/]+))?)?/
  );
  const courseId = courseMatch?.[1];
  const chapterId = courseMatch?.[2];
  const itemId = courseMatch?.[3];

  useEffect(() => {
    if (!courseId) return;
    courseService
      .getCourseByIdBasic(courseId)
      .then((data) => setCourseTitle(data?.title ?? null))
      .catch(() => setCourseTitle(null));
  }, [courseId]);

  useEffect(() => {
    if (!chapterId) return;
    courseService
      .getChapter(chapterId)
      .then((data) => setChapterTitle(data?.title ?? null))
      .catch(() => setChapterTitle(null));
  }, [chapterId]);

  useEffect(() => {
    if (!itemId) return;
    courseService
      .getItem(itemId)
      .then((data) => setItemTitle(data?.title ?? null))
      .catch(() => setItemTitle(null));
  }, [itemId]);

  const home = { label: tNav("home"), href: HOME_PATH_BY_ROLE[user?.role] ?? "/" };
  const leaderboardCrumb = { label: t("leaderboardTitle") };

  let items;
  if (courseId) {
    items = [
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
      ...(itemId && itemTitle
        ? [
            {
              label: itemTitle,
              href: `/courses/${courseId}/chapter-details/${chapterId}/${itemId}`,
            },
          ]
        : []),
      leaderboardCrumb,
    ];
  } else if (previousPath && /\/courses$/.test(previousPath)) {
    items = [home, { label: tNav("courses"), href: "/courses" }, leaderboardCrumb];
  } else if (
    previousPath &&
    (/\/sessions/.test(previousPath) || /\/session-management/.test(previousPath))
  ) {
    items = [
      home,
      { label: tNav("mySessionsLink"), href: SESSIONS_PATH_BY_ROLE[user?.role] ?? previousPath },
      leaderboardCrumb,
    ];
  } else {
    items = [home, leaderboardCrumb];
  }

  return <Breadcrumb items={items} />;
}
