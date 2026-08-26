"use client";
import React, { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Calendar, Bot, BookOpen, Lock } from "lucide-react";
import dynamic from "next/dynamic";
import { useCourseStore } from "@/store/useCourseStore";
import { useAuthStore } from "@/store/useAuthStore";
import { courseService } from "@/service/courseService";
import { useParams, useRouter } from "next/navigation";
import ActivityViewer from "@/components/layout/ActivityViewer";
import StudentSubNavbar from "@/components/layout/StudentSubNavbar";
import QuizViewer from "./QuizViewer";
import { useTranslations } from "next-intl";
import Breadcrumb from "@/components/layout/Breadcrumb";
import Link from "next/link";

const LearningPathCarousel = dynamic(() => import("./learningPath"), {
  ssr: false,
});

const PDFViewer = dynamic(() => import("@/components/ui/PDFViewer"), {
  ssr: false,
});

const NEAR_END_THRESHOLD = 20;
const AUTOPLAY_DELAY = 5;
const RESET_STATE = {
  contentVisible: false,
  nearEnd: false,
  ended: false,
  countdown: AUTOPLAY_DELAY,
};

const ItemDetailPage = () => {
  const { id, chapterId, itemId } = useParams();
  const router = useRouter();

  const { item, chapter, course, fetchItem, loading, setLastViewedItem } = useCourseStore();
  const { isAuthenticated } = useAuthStore();
  const t = useTranslations("ItemDetailPage");
  const tNav = useTranslations("Navbar");
  const tChapter = useTranslations("ChapterDetailsPage");

  useEffect(() => {
    if (itemId) fetchItem(Number(itemId));
  }, [itemId, fetchItem]);

  useEffect(() => {
    if (item) {
      setLastViewedItem({
        id: item.id,
        title: item.title,
        type: item.type,
        duration: item.duration,
        chapterId,
        courseId: id,
      });
    }
  }, [item, chapterId, id, setLastViewedItem]);

  const currentChapterTitle =
    chapter?.title ||
    item?.learning_path?.chapters?.find((c) => c.id === Number(chapterId))
      ?.title;

  const breadcrumbItems = [
    { label: tNav("courses"), href: "/courses" },
    { label: course?.title || tChapter("currentCourse"), href: `/courses/${id}` },
    currentChapterTitle
      ? {
          label: currentChapterTitle,
          href: `/courses/${id}/chapter-details/${chapterId}`,
        }
      : null,
    item?.title ? { label: item.title } : null,
  ].filter(Boolean);

  const [prevItemId, setPrevItemId] = useState(itemId);
  const [viewState, setViewState] = useState(RESET_STATE);
  const { contentVisible, nearEnd, ended, countdown } = viewState;

  // React "setState during render" pattern: reset synchronously without an effect
  if (prevItemId !== itemId) {
    setPrevItemId(itemId);
    setViewState(RESET_STATE);
  }

  // Only the async fade-in timer — no synchronous setState inside
  useEffect(() => {
    const timer = setTimeout(
      () => setViewState((s) => ({ ...s, contentVisible: true })),
      30,
    );
    return () => clearTimeout(timer);
  }, [itemId]);

  // Flatten all items from the learning path to find prev/next
  const allItems =
    item?.learning_path?.chapters?.flatMap(
      (chapter) => chapter.lessons?.flatMap((lesson) => lesson.items) ?? [],
    ) ?? [];
  const currentIndex = allItems.findIndex((i) => i.id === Number(itemId));
  const nextItem =
    currentIndex >= 0 && currentIndex < allItems.length - 1
      ? allItems[currentIndex + 1]
      : null;
  const prevItem = currentIndex > 0 ? allItems[currentIndex - 1] : null;
  const nextItemLocked = nextItem?.locked === true;

  const navigateToItem = (targetId) => {
    const parts = window.location.pathname.split("/");
    parts[parts.length - 1] = String(targetId);
    router.push(parts.join("/"));
  };

  const navigateToChapter = () => {
    const parts = window.location.pathname.split("/");
    router.push(parts.slice(0, -1).join("/"));
  };

  // Countdown auto-advance after video ends
  useEffect(() => {
    if (!ended || !nextItem || nextItemLocked) return;
    if (countdown <= 0) {
      const parts = window.location.pathname.split("/");
      parts[parts.length - 1] = String(nextItem.id);
      router.push(parts.join("/"));
      return;
    }
    const timer = setTimeout(
      () => setViewState((s) => ({ ...s, countdown: s.countdown - 1 })),
      1000,
    );
    return () => clearTimeout(timer);
  }, [ended, countdown, nextItem, nextItemLocked, router]);

  const videoUrl = item?.file ?? null;
  const videoRef = useRef(null);
  const lastSavedTimeRef = useRef(0);
  const [savedProgress, setSavedProgress] = useState(0);

  useEffect(() => {
    if (!isAuthenticated || !itemId) return;
    courseService
      .getItemProgress(Number(itemId))
      .then((saved) => {
        if (saved?.progress > 0 && saved.status !== "completed") {
          setSavedProgress(saved.progress);
          const video = videoRef.current;
          if (video) {
            const seek = () => {
              video.currentTime = (saved.progress / 100) * video.duration;
            };
            if (video.readyState >= 1) seek();
            else video.addEventListener("loadedmetadata", seek, { once: true });
          }
        }
      })
      .catch(() => {});
  }, [isAuthenticated, itemId, videoUrl]);

  const handlePDFPageChange = (page, total) => {
    if (!isAuthenticated || !total) return;
    const progress = page >= total ? 100 : Math.floor((page / total) * 100);itemId
    const status = page >= total ? "completed" : "in_progress";
    courseService
      .saveItemProgress(Number(itemId), progress, status)
      .catch(() => {});
  };

  useEffect(() => {
    if (!isAuthenticated || !itemId || !item) return;
    if (item.id !== Number(itemId)) return;
    if (item?.type?.toLowerCase() === "activity") {
      courseService
        .saveItemProgress(Number(itemId), 100, "completed")
        .catch(() => {});
    }
  }, [isAuthenticated, itemId, item]);

  const saveCurrentProgress = (status = "in_progress") => {
    if (!isAuthenticated) return;
    const video = videoRef.current;
    if (!video?.duration) return;
    const progress =
      status === "completed"
        ? 100
        : Math.floor((video.currentTime / video.duration) * 100);
    courseService
      .saveItemProgress(Number(itemId), progress, status)
      .catch(() => {});
  };

  const handleTimeUpdate = () => {
    const video = videoRef.current;
    if (!video?.duration) return;

    const remaining = video.duration - video.currentTime;
    if (remaining <= NEAR_END_THRESHOLD && !nearEnd)
      setViewState((s) => ({ ...s, nearEnd: true }));
    else if (remaining > NEAR_END_THRESHOLD && nearEnd)
      setViewState((s) => ({ ...s, nearEnd: false }));

    if (isAuthenticated && video.currentTime - lastSavedTimeRef.current >= 10) {
      lastSavedTimeRef.current = video.currentTime;
      saveCurrentProgress("in_progress");
    }
  };

  const handlePause = () => saveCurrentProgress("in_progress");

  const handleEnded = () => {
    saveCurrentProgress("completed");
    if (nextItem) setViewState((s) => ({ ...s, ended: true }));
  };

  const handlePlayAgain = () => {
    const video = videoRef.current;
    if (video) {
      video.currentTime = 0;
      video.play();
    }
    setViewState((s) => ({
      ...s,
      ended: false,
      nearEnd: false,
      countdown: AUTOPLAY_DELAY,
    }));
  };

  if (loading && !item) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-2">
          <span className="loading loading-spinner loading-lg text-blue-600"></span>
          <p className="text-slate-500 animate-pulse">{t("loadingItem")}</p>
        </div>
      </div>
    );
  }

  if (!item && !loading)
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>
          {t("itemNotFound")}{" "}
          <button
            onClick={navigateToChapter}
            className="text-blue-500 underline"
          >
            {t("goBackLink")}
          </button>
        </p>
      </div>
    );

  const itemType = item?.type?.toLowerCase();
  const circumference = 2 * Math.PI * 28;

  const renderContent = () => {
    if (item?.is_locked) {
      return (
        <div className="flex flex-col items-center justify-center gap-3 aspect-video bg-slate-900 rounded-2xl mb-4 px-6 text-center">
          <Lock className="w-8 h-8 text-white/70" />
          <p className="text-white font-bold">
            {isAuthenticated ? t("enrollmentRequiredTitle") : t("loginRequiredTitle")}
          </p>
          <p className="text-white/60 text-sm max-w-md">
            {isAuthenticated ? t("enrollmentRequiredMessage") : t("loginRequiredMessage")}
          </p>
          <Link
            href={isAuthenticated ? `/courses/${id}/subscribe` : "/login/student"}
            className="btn btn-sm bg-white text-black hover:bg-white/90 border-none mt-2"
          >
            {isAuthenticated ? t("viewPlansButton") : t("loginButton")}
          </Link>
        </div>
      );
    }

    switch (itemType) {
      case "video":
        return (
          <div className="relative aspect-video bg-black rounded-2xl overflow-hidden mb-4 flex items-center justify-center">
            {videoUrl && (
              <video
                ref={videoRef}
                key={videoUrl}
                controls
                autoPlay
                width="100%"
                className="w-full h-full"
                onTimeUpdate={handleTimeUpdate}
                onPause={handlePause}
                onEnded={handleEnded}
                onError={() => fetchItem(Number(itemId))}
              >
                <source src={videoUrl} type="video/mp4" />
                {t("videoBrowserNotSupported")}
              </video>
            )}

            {/* Near-end pill — fades in during the last 20 seconds */}
            {nearEnd && !ended && nextItem && !nextItemLocked && (
              <button
                onClick={() => navigateToItem(nextItem.id)}
                className="absolute top-3 right-3 z-10 flex items-center gap-1.5 bg-black/70 hover:bg-black/90 text-white text-xs font-semibold px-3 py-2 rounded-full transition-all backdrop-blur-sm border border-white/20 animate-in fade-in duration-500"
              >
                <span className="max-w-35 truncate">{nextItem.title}</span>
                <ChevronRight className="w-3.5 h-3.5 shrink-0" />
              </button>
            )}

            {/* End-screen overlay with countdown */}
            {ended && nextItem && !nextItemLocked && (
              <div className="absolute inset-0 bg-black/85 flex flex-col items-center justify-center z-20 rounded-2xl px-4">
                <p className="text-white/50 text-[10px] sm:text-xs font-semibold uppercase tracking-widest mb-2 sm:mb-3">
                  {t("upNext")}
                </p>
                <p className="text-white text-sm sm:text-lg font-bold text-center px-2 sm:px-10 mb-5 sm:mb-8 line-clamp-2 max-w-xs sm:max-w-md">
                  {nextItem.title}
                </p>

                {/* SVG countdown ring */}
                <div className="relative w-10 h-10 sm:w-16 sm:h-16 mb-5 sm:mb-7">
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 64 64">
                    <circle
                      cx="32"
                      cy="32"
                      r="28"
                      fill="none"
                      stroke="white"
                      strokeOpacity="0.15"
                      strokeWidth="4"
                    />
                    <circle
                      cx="32"
                      cy="32"
                      r="28"
                      fill="none"
                      stroke="white"
                      strokeWidth="4"
                      strokeLinecap="round"
                      strokeDasharray={circumference}
                      strokeDashoffset={
                        circumference * (1 - countdown / AUTOPLAY_DELAY)
                      }
                      className="transition-all duration-1000 ease-linear"
                    />
                  </svg>
                  <span className="absolute inset-0 flex items-center justify-center text-white text-sm sm:text-lg font-bold">
                    {countdown}
                  </span>
                </div>

                <div className="flex gap-2 sm:gap-3">
                  <button
                    onClick={handlePlayAgain}
                    className="px-3 py-2 sm:px-5 sm:py-2.5 rounded-full text-xs sm:text-sm font-semibold bg-white/10 hover:bg-white/20 text-white border border-white/25 transition-all"
                  >
                    {t("playAgain")}
                  </button>
                  <button
                    onClick={() => navigateToItem(nextItem.id)}
                    className="px-3 py-2 sm:px-5 sm:py-2.5 rounded-full text-xs sm:text-sm font-semibold bg-white text-black hover:bg-white/90 transition-all flex items-center gap-1 sm:gap-1.5"
                  >
                    {t("next")}{" "}
                    <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4" />
                  </button>
                </div>
              </div>
            )}

            {ended && nextItemLocked && (
              <div className="absolute inset-0 bg-black/85 flex flex-col items-center justify-center z-20 rounded-2xl px-4 text-center">
                <Lock className="w-8 h-8 text-white/70 mb-3" />
                <p className="text-white text-sm sm:text-lg font-bold mb-2">
                  {t("previewEndedTitle")}
                </p>
                <p className="text-white/60 text-xs sm:text-sm mb-6 max-w-xs sm:max-w-md">
                  {t("previewEndedMessage")}
                </p>
                <div className="flex gap-2 sm:gap-3">
                  <button
                    onClick={handlePlayAgain}
                    className="px-3 py-2 sm:px-5 sm:py-2.5 rounded-full text-xs sm:text-sm font-semibold bg-white/10 hover:bg-white/20 text-white border border-white/25 transition-all"
                  >
                    {t("playAgain")}
                  </button>
                  <Link
                    href={`/courses/${id}/subscribe`}
                    className="px-3 py-2 sm:px-5 sm:py-2.5 rounded-full text-xs sm:text-sm font-semibold bg-white text-black hover:bg-white/90 transition-all"
                  >
                    {t("viewPlansButton")}
                  </Link>
                </div>
              </div>
            )}
          </div>
        );
      case "document":
        return (
          <PDFViewer
            item={item}
            showHeader={true}
            initialProgress={savedProgress}
            onPageChange={handlePDFPageChange}
          />
        );
      case "activity":
        return <ActivityViewer item={item} showHeader={false} />;
      case "quiz":
        return (
          <QuizViewer
            item={item}
            isAuthenticated={isAuthenticated}
            onComplete={() =>
              courseService
                .saveItemProgress(Number(itemId), 100, "completed")
                .catch(() => {})
            }
          />
        );
      default:
        return (
          <div className="flex items-center justify-center h-64 bg-white rounded-2xl border border-slate-200 mb-12">
            <p className="text-slate-400">{t("previewNotAvailable")}</p>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      <StudentSubNavbar />
      <div className="max-w-6xl mx-auto py-16 px-4">
        <Breadcrumb items={breadcrumbItems} />
        <div
          className={`transition-opacity duration-500 ease-in ${contentVisible ? "opacity-100" : "opacity-0"}`}
        >
          {renderContent()}
        </div>

        {/* Prev / Next buttons below content */}
        {(prevItem || nextItem) && (itemType !== "video" || (!nearEnd && !ended)) && (
          <div className="flex flex-wrap gap-1 justify-between mt-4 mb-8">
            {prevItem ? (
              <button
                onClick={() => navigateToItem(prevItem.id)}
                className="btn btn-md bg-white border-slate-400 shadow-lg flex items-center normal-case"
              >
                <ChevronLeft className="w-4 h-4" />
                <span className="max-w-55 truncate">Previous Item</span>
              </button>
            ) : <div />}
            {nextItem && (
              <button
                onClick={() => navigateToItem(nextItem.id)}
                className="btn btn-md bg-white border-slate-400 shadow-lg flex items-center gap-2 normal-case"
              >
                <span className="max-w-55 truncate">Next Item</span>
                {nextItemLocked ? (
                  <Lock className="w-4 h-4 shrink-0" />
                ) : (
                  <ChevronRight className="w-4 h-4 shrink-0" />
                )}
              </button>
            )}
          </div>
        )}

        <LearningPathCarousel />
      </div>
    </div>
  );
};

export default ItemDetailPage;
