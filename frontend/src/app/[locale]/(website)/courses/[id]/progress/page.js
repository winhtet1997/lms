"use client";
import {
  ArrowLeft,
  BookOpen,
  FileQuestionMark,
  FileText,
  Gamepad2Icon,
  Package,
  Video,
} from "lucide-react";
import CourseStatsGrid from "../../../../../../components/layout/CourseStatsGrid";
import Pagination from "@/components/layout/Pagination";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import React, { useEffect, useState, useMemo } from "react";
import { useTranslations } from "next-intl";
import { useAuthStore } from "@/store/useAuthStore";
import { useCourseStore } from "@/store/useCourseStore";

const OverallProgress = () => {
  const { id: courseId } = useParams();
  const router = useRouter();
  const t = useTranslations("OverallProgress");
  const { isAuthenticated } = useAuthStore();
  const [mounted, setMounted] = useState(false);
  const [filter, setFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 5;

  const handleFilterChange = (value) => {
    setFilter(value);
    setCurrentPage(1);
  };
  const { course, fetchCourseById } = useCourseStore();

  useEffect(() => {
    const raf = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(raf);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    if (!isAuthenticated) {
      router.push("/login/student");
      return;
    }
    if (courseId) fetchCourseById(courseId);
  }, [mounted, isAuthenticated, router, courseId, fetchCourseById]);

  const chapters = course?.chapters ?? [];

  const filteredChapters = useMemo(
    () =>
      chapters.filter((ch) => {
        const s = ch.chapter_completion_status ?? 0;
        if (filter === "completed") return s === 100;
        if (filter === "in-progress") return s > 0 && s < 100;
        if (filter === "not-started") return s === 0;
        return true;
      }),
    [chapters, filter],
  );

  if (!mounted || !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <span className="loading loading-spinner loading-lg text-blue-500"></span>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <span className="loading loading-spinner loading-lg text-blue-500"></span>
      </div>
    );
  }

  const totalPages = Math.ceil(filteredChapters.length / ITEMS_PER_PAGE);
  const paginatedChapters = filteredChapters.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE,
  );

  const completedCount = chapters.filter(
    (ch) => (ch.chapter_completion_status ?? 0) === 100,
  ).length;
  const inProgressCount = chapters.filter((ch) => {
    const s = ch.chapter_completion_status ?? 0;
    return s > 0 && s < 100;
  }).length;
  const notStartedCount = chapters.filter(
    (ch) => (ch.chapter_completion_status ?? 0) === 0,
  ).length;

  return (
    <div className="py-20  bg-linear-to-br from-blue-50 via-white to-purple-50 px-3">
      <div className="max-w-6xl mx-auto space-y-6">
        <header className="flex items-center gap-4 ">
          <Link href={`/courses/${courseId}`}>
            <button className="btn btn-ghost btn-sm">
              <ArrowLeft size={18} />
            </button>
          </Link>
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight">
              {t("pageTitle")}
            </h1>
            <p className="text-slate-500 font-medium text-sm">{course.title}</p>
          </div>
        </header>
        <div className="progress-container">
          <div
            className={`border border-slate-200 bg-white rounded-xl p-6 ga-4 flex items-center my-2 shadow`}
          >
            <div className="grow">
              <div>
                <div className="flex justify-between">
                  <h5>{t("overallProgressLabel")}</h5>
                  <p className="text-info text-lg font-bold">
                    {course.course_progress}%
                  </p>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2 mb-2 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      course.course_progress ? "bg-info" : "bg-info"
                    }`}
                    style={{ width: `${course.course_progress}%` }}
                  ></div>
                </div>
                <span className="text-slate-500 text-sm">
                  {t("chaptersCompleted")}
                </span>
              </div>
            </div>
          </div>
        </div>

        <CourseStatsGrid course={course} />

        <div className="flex flex-wrap gap-2 bg-white shadow-sm md:w-1/2 rounded-lg p-1 ">
          <button
            onClick={() => handleFilterChange("all")}
            className={`btn btn-sm btn-ghost rounded-lg font-bold text-xs ${
              filter === "all"
                ? "bg-slate-100 text-slate-700"
                : "text-slate-500"
            }`}
          >
            {t("filterAll")} ({chapters.length})
          </button>
          <button
            onClick={() => handleFilterChange("completed")}
            className={`btn btn-sm btn-ghost rounded-lg font-bold text-xs ${
              filter === "completed"
                ? "bg-slate-100 text-slate-700"
                : "text-slate-500"
            }`}
          >
            {t("filterCompleted")} ({completedCount})
          </button>
          <button
            onClick={() => handleFilterChange("in-progress")}
            className={`btn btn-sm btn-ghost rounded-lg font-bold text-xs ${
              filter === "in-progress"
                ? "bg-slate-100 text-slate-700"
                : "text-slate-500"
            }`}
          >
            {t("filterInProgress")} ({inProgressCount})
          </button>
          <button
            onClick={() => handleFilterChange("not-started")}
            className={`btn btn-sm btn-ghost rounded-lg font-bold text-xs ${
              filter === "not-started"
                ? "bg-slate-100 text-slate-700"
                : "text-slate-500"
            }`}
          >
            {t("filterNotStarted")} ({notStartedCount})
          </button>
        </div>

        <div className="progress-container mt-6">
          <div className="space-y-6">
            {paginatedChapters.map((chapter) => {
              const chapterStatus = chapter.chapter_completion_status ?? 0;
              return (
                <Link
                  key={chapter.id}
                  href={`/courses/${courseId}/chapter-details/${chapter.id}`}
                >
                  <div
                    className={`border border-slate-200 bg-white rounded-xl p-6 ga-4 flex items-center my-3 shadow ${
                      chapterStatus === 0 ? "opacity-70" : ""
                    }`}
                  >
                    <div className="grow">
                      <div className="flex flex-wrap justify-between items-center mb-2">
                        <span className="flex gap-2 font-bold text-slate-800">
                          <BookOpen className="w-5 h-5 mr-2" />
                          {chapter.title}
                        </span>
                        {chapterStatus === 100 ? (
                          <span className="badge badge-soft badge-success badge-xs border border-green-500 rounded-full font-bold  uppercase ">
                            {t("badgeCompleted")}
                          </span>
                        ) : chapterStatus > 0 ? (
                          <span className="badge badge-soft badge-primary badge-xs border border-blue-500 rounded-full font-bold text-[10px] uppercase">
                            {t("badgeInProgress")}
                          </span>
                        ) : (
                          <span className="badge badge-outline badge-xs border border-slate-300 rounded-full font-bold text-[10px] uppercase">
                            {t("badgeNotStarted")}
                          </span>
                        )}
                      </div>
                      <div>
                        <span className="text-slate-800 text-sm font-medium">
                          {chapterStatus}
                          {t("percentComplete")}
                        </span>
                        <div className="w-full bg-slate-100 rounded-full h-2 mb-2 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-info"
                            style={{ width: `${chapterStatus}%` }}
                          ></div>
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center justify-between text-[11px] font-medium text-slate-400 py-2">
                        {/* Videos Group */}
                        <div className="flex items-center gap-1.5">
                          <span className="text-blue-500">
                            <Video size={14} />
                          </span>
                          <span className="font-bold text-slate-700">
                            {chapter?.total_completed_video_items || 0}/
                            {chapter?.total_video_items || 0}
                          </span>
                          <span>{t("videos")}</span>
                        </div>

                        {/* Activities Group */}
                        <div className="flex items-center gap-1.5">
                          <span className="text-teal-600">
                            <Gamepad2Icon size={14} />
                          </span>
                          <span className="font-bold text-slate-700">
                            {chapter?.total_completed_activity_items || 0}/
                            {chapter?.total_activity_items || 0}
                          </span>
                          <span>{t("activities")}</span>
                        </div>

                        {/* Document Group */}
                        <div className="flex items-center gap-1.5">
                          <span className="text-green-600">
                            <FileText size={14} />
                          </span>
                          <span className="font-bold text-slate-700">
                            {chapter?.total_completed_document_items || 0}/
                            {chapter?.total_document_items || 0}
                          </span>
                          <span>{t("documents")}</span>
                        </div>

                        {/* Quizzes Group */}
                        <div className="flex items-center gap-1.5">
                          <span className="text-purple-500">
                            <FileQuestionMark size={14} />
                          </span>
                          <span className="font-bold text-slate-700">
                            {chapter?.total_completed_quiz_items || 0}/
                            {chapter?.total_quiz_items || 0}
                          </span>
                          <span>{t("quizzes")}</span>
                        </div>

                        {/* Scorm Group */}
                        <div className="flex items-center gap-1.5">
                          <span className="text-orange-500">
                            <Package size={14} />
                          </span>
                          <span className="font-bold text-slate-700">
                            {chapter?.total_completed_scorm_items || 0}/
                            {chapter?.total_scorm_items || 0}
                          </span>
                          <span>{t("scorms")}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      </div>
    </div>
  );
};

export default OverallProgress;