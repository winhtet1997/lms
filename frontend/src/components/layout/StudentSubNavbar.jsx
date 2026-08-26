"use client";
import { BookOpen, Bot, Calendar, Trophy } from "lucide-react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { useAuthStore } from "@/store/useAuthStore";
import { useCourseStore } from "@/store/useCourseStore";
import { usePathname, useSearchParams } from "next/navigation";

const ROUTE_CONTENT = [
  { match: /\/student\/home/,                                  titleKey: "welcomeTitle",        subtitleKey: "welcomeSubtitle" },
  { match: /\/student\/leaderboard/,                           titleKey: "leaderboardTitle",    subtitleKey: "leaderboardSubtitle" },
  { match: /\/student\/sessions\/[^/]+/,                       titleKey: "sessionDetailsTitle", subtitleKey: "sessionDetailsSubtitle" },
  { match: /\/student\/sessions/,                              titleKey: "mySessionsTitle",     subtitleKey: "mySessionsSubtitle" },
  { match: /\/student\/book-tutor/,                            titleKey: "bookTutorTitle",      subtitleKey: "bookTutorSubtitle" },
  { match: /\/courses\/[^/]+\/chapter-details\/[^/]+\/[^/]+/, titleKey: undefined,             subtitleKey: "defaultSubtitle" },
  { match: /\/courses\/[^/]+\/chapter-details\/[^/]+/,        titleKey: undefined,             subtitleKey: "defaultSubtitle" },
  { match: /\/courses\/[^/]+/,                                 titleKey: undefined,             subtitleKey: "defaultSubtitle" },
];

const StudentSubNavbar = () => {
  const t = useTranslations("StudentSubNavbar");
  const locale = useLocale();
  const { user } = useAuthStore();
  const { course, chapter, item } = useCourseStore();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  if (user?.role !== "Student") return null;

  const matched = ROUTE_CONTENT.find(({ match }) => match.test(pathname));
  const chapterIdFromPath = pathname.match(
    /\/courses\/[^/]+\/chapter-details\/([^/?]+)/
  )?.[1];
  const courseIdFromPath = pathname.match(/\/courses\/([^/?]+)/)?.[1];
  const isChapterPage = Boolean(chapterIdFromPath);
  const isItemPage = /\/courses\/[^/]+\/chapter-details\/[^/]+\/[^/?]+/.test(pathname);
  const isCoursePage = /\/courses\/[^/]+/.test(pathname);
  const isAiChatPage = /\/student\/ai-chat/.test(pathname);
  const gradeTitle = t("gradeMathTitle", { grade: user?.grade_level });

  // The chat's own scope, not "where the store's course/chapter happens to
  // be" — only trust the store when it actually matches the id the chat is
  // scoped to, since that store is shared/stale across unrelated pages.
  const aiChatChapterId = isAiChatPage ? searchParams.get("chapter_id") : null;
  const aiChatCourseId = isAiChatPage ? searchParams.get("course_id") : null;
  const aiChatTitle =
    aiChatChapterId && String(chapter?.id) === aiChatChapterId
      ? chapter.title
      : aiChatCourseId && String(course?.id) === aiChatCourseId
      ? course.title
      : t("askAiButton");

  const title = isAiChatPage
    ? aiChatTitle
    : isItemPage && item?.title
    ? item.title
    : isChapterPage && chapter?.title
    ? chapter.title
    : isCoursePage && course?.title
    ? course.title
    : (matched?.titleKey ? t(matched.titleKey) : gradeTitle);
  const subtitle = isAiChatPage
    ? t("askAiSubtitle")
    : matched?.subtitleKey
    ? t(matched.subtitleKey)
    : t("defaultSubtitle");
  const aiChatHref =
    isChapterPage && chapterIdFromPath
      ? `/${locale}/student/ai-chat?chapter_id=${chapterIdFromPath}`
      : isCoursePage && courseIdFromPath
      ? `/${locale}/student/ai-chat?course_id=${courseIdFromPath}`
      : `/${locale}/student/ai-chat`;

  return (
    <div className="border-y border-gray-200 bg-white/80 backdrop-blur-md relative top-16 z-20 mb-5">
      <div className="md:flex items-center justify-between py-3 container mx-auto px-4">
        <div>
          <h1 className="text-base md:text-lg font-bold">{title}</h1>
          <p className="text-[10px] md:text-[12px] opacity-60">{subtitle}</p>
        </div>

        <div className="space-x-2 flex flex-wrap gap-2">
          <Link
            href={`/${locale}/student/leaderboard`}
            className="btn btn-sm btn-outline border-gray-200 gap-2"
          >
            <Trophy size={14} /> {t("leaderboardButton")}
          </Link>
          <Link
            href={`/${locale}/student/sessions`}
            className="btn btn-sm btn-outline border-gray-200 gap-2"
          >
            <Calendar size={14} /> {t("sessionsButton")}
          </Link>
          <Link
            href={aiChatHref}
            className="btn btn-sm btn-outline border-gray-200 gap-2"
          >
            <Bot size={14} /> {t("askAiButton")}
          </Link>
          {/* 
          <button className="btn btn-sm btn-outline border-gray-200 gap-2">
            <BookOpen size={14} /> {t("myNotesButton")}
          </button> */}
        </div>
      </div>
    </div>
  );
};

export default StudentSubNavbar;