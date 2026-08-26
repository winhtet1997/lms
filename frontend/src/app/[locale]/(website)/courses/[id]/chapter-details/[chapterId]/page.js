"use client";
import { useCourseStore } from "@/store/useCourseStore";
import { getContentTypeInfo } from "../../../../../../../../data/contentData";
import { useTranslations } from "next-intl";
import {
  ChevronRight,
  CircleCheck,
  ClipboardMinus,
  FileText,
  Lock,
  Play,
  Sparkles,
  VideoIcon,
} from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";

import React, { useEffect } from "react";
import StudentSubNavbar from "@/components/layout/StudentSubNavbar";
import Breadcrumb from "@/components/layout/Breadcrumb";
import { useAuthStore } from "@/store/useAuthStore";

const ChapterDetailsSkeleton = () => (
  <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start animate-pulse">
    <div className="lg:col-span-9 space-y-4">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="border border-slate-200 rounded-xl p-4">
          <div className="flex gap-6">
            <div className="w-10 h-10 rounded-full bg-slate-200 shrink-0" />
            <div className="w-1/2 lg:w-full space-y-2 py-1">
              <div className="h-4 w-24 bg-slate-200 rounded-full" />
              <div className="h-5 w-48 bg-slate-200 rounded" />
              <div className="h-3 w-64 bg-slate-100 rounded" />
            </div>
          </div>
          <div className="ml-16 mt-4 flex flex-col gap-3">
            {Array.from({ length: 2 }).map((__, j) => (
              <div
                key={j}
                className="h-20 bg-slate-100 rounded-xl border border-slate-200"
              />
            ))}
          </div>
        </div>
      ))}
    </div>

    <aside className="lg:col-span-3 flex flex-col gap-6">
      <div className="card bg-white border border-slate-200 p-6 shadow-sm space-y-4">
        <div className="h-5 w-32 bg-slate-200 rounded" />
        <div className="h-3 w-full bg-slate-100 rounded" />
        <div className="h-3 w-full bg-slate-200 rounded-full" />
        <div className="space-y-3 pt-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-4 w-full bg-slate-100 rounded" />
          ))}
        </div>
      </div>

      <div className="card bg-white border border-slate-200 p-6 shadow-sm space-y-3">
        <div className="h-5 w-28 bg-slate-200 rounded" />
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-3 w-full bg-slate-100 rounded" />
        ))}
      </div>
    </aside>
  </div>
);

const ChapterDetails = () => {
  const { chapterId, id } = useParams();
  const { chapter, course, fetchChapter, lastViewedItem, loading } = useCourseStore();
  const showSkeleton = loading && !chapter;
  const { user } = useAuthStore();
  const t = useTranslations("ChapterDetailsPage");

  const isGuestFreePreview = !user && chapter?.is_free_preview === true;
  const tNav = useTranslations("Navbar");

  const breadcrumbItems = [
    { label: tNav("courses"), href: "/courses" },
    { label: course?.title || t("currentCourse"), href: `/courses/${id}` },
    chapter?.title ? { label: chapter.title } : null,
  ].filter(Boolean);

  useEffect(() => {
    if (chapterId) fetchChapter(chapterId);
  }, [chapterId, fetchChapter]);

  const allItems = chapter?.lessons?.flatMap((l) => l.items ?? []) ?? [];
  const completedItems = allItems.filter(
    (i) => i.completion_status === "completed",
  );
  const totalCompleted = completedItems.length;
  const totalItems = allItems.length;
  const overallProgress = chapter?.chapter_completion_status ?? 0;

  return (
    <div>
      <StudentSubNavbar />
      <div className="min-h-screen bg-slate-50 text-slate-700 py-8">
        <div className="md:container mx-auto px-4 md:px-8 py-8 md:py-12">
          <Breadcrumb items={breadcrumbItems} />
          {chapter?.locked && (
            <div className="alert bg-amber-50 border border-amber-200 text-amber-800 mb-6 flex items-center gap-2">
              <Lock size={16} />
              <span>{t("chapterLockedBanner")}</span>
              <Link href={`/courses/${id}/subscribe`} className="btn btn-xs btn-outline border-amber-300 ml-auto">
                {t("viewPlansButton")}
              </Link>
            </div>
          )}

          {showSkeleton ? (
            <ChapterDetailsSkeleton />
          ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-9 relative">
            <div className="absolute left-4.75 top-4 bottom-0 w-0.5 bg-blue-100"></div>

            {chapter?.lessons?.map((lesson, index) => {
              const isActiveLesson =
                lastViewedItem && lastViewedItem.chapterId == chapterId
                  ? lesson.items?.some((item) => item.id === lastViewedItem.id)
                  : index === 0;

              return (
                <div key={lesson.id} className="collapse collapse-arrow mb-4">
                  <input type="checkbox" defaultChecked={isActiveLesson} />

                  <div className="collapse-title p-0 flex gap-6">
                    <div className=" w-10 h-10 rounded-full bg-info text-white flex items-center justify-center font-bold ring-8 ring-slate-50">
                      {index + 1}
                    </div>

                    <div className="w-1/2 lg:w-full">
                      <span className="badge badge-ghost badge-sm border-gray-200 mb-1 font-semibold">
                        {t("lessonLabel")} {index + 1}
                      </span>

                      <h2 className="text-lg md:text-2xl font-bold text-slate-800">
                        {lesson?.title}
                      </h2>

                      <p className="text-sm text-slate-400">
                        {lesson.description}
                      </p>
                    </div>
                  </div>

                  <div className="collapse-content ml-16 pt-4 flex flex-col gap-3">
                    {lesson.items?.map((item) => {
                      const typeConfig = getContentTypeInfo(item.type);
                      return (
                        <Link
                          href={`/courses/${id}/chapter-details/${chapterId}/${item.id}`}
                          key={item.id}
                        >
                          <div
                            className={`card  py-3 rounded-xl shadow hover:scale-[1.03] transition-transform duration-200 cursor-pointer ${item.is_locked ? "border border-slate-200 opacity-80" : item.completion_status === "completed" ? "border border-green-400 bg-green-50/50" : "border border-slate-200"}`}
                          >
                            <div className="p-4 flex flex-wrap items-center justify-between">
                              <div className="flex flex-wrap items-center gap-4">
                                <div
                                  className={`p-3 rounded-full ${item.completion_status === "completed" ? "bg-green-100 text-green-700" : `${typeConfig?.itembg} ${typeConfig?.itemText}`}`}
                                >
                                  {typeConfig?.badgeicon}
                                </div>
                                <div>
                                  <p
                                    className={`badge badge-sm ${typeConfig?.itembg} ${typeConfig?.itemText} mb-1`}
                                  >
                                    {item.type}
                                  </p>
                                  <p className="text-sm font-bold">
                                    {item.title}
                                  </p>
                                  <p className="text-xs text-slate-400">
                                    {t("timeLabel")}: {item.duration || "N/A"}{" "}
                                    {t("minLabel")}
                                  </p>
                                </div>
                              </div>

                              <div className="flex items-center gap-2">
                                {item.completion_status == "completed" && (
                                  <span className="badge badge-success badge-sm">
                                    {t("completedBadge")}
                                  </span>
                                )}
                                {item.completion_status == "in_progress" && (
                                  <span className="badge badge-warning badge-sm">
                                    {t("inProgressBadge")}
                                  </span>
                                )}
                                {item.is_locked && !isGuestFreePreview && (
                                  <span className="badge border-amber-500 bg-amber-100 text-amber-700 badge-sm gap-1">
                                   <Lock size={12} />{t("lockedItemBadge")}
                                  </span>
                                )}
                                <span className="">
                                  
                                    <ChevronRight />
                                  
                                </span>
                              </div>
                            </div>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          {/* RIGHT SIDE */}
          <aside className="lg:col-span-3 flex flex-col gap-6 sticky top-24">
            {/* Continue Learning */}
            {lastViewedItem && lastViewedItem.chapterId == chapterId && (
              <div className="card bg-blue-50 border border-blue-100 p-6">
                <div className="flex gap-2 text-blue-600 mb-4">
                  <Play size={16} />{" "}
                  <h3 className="text-sm font-semibold mb-4 text-black">
                    {" "}
                    {t("continueLearningHeading")}
                  </h3>
                </div>

                <div className="bg-white p-4 rounded-xl shadow-sm border border-blue-100">
                  <span className="badge badge-ghost badge-xs mb-2">
                    {lastViewedItem.type}
                  </span>

                  <p className="font-bold text-sm mb-1 line-clamp-2">
                    {lastViewedItem.title}
                  </p>

                  <p className="text-xs text-gray-400">
                    {lastViewedItem.type} • {lastViewedItem.duration || "N/A"}{" "}
                    min
                  </p>

                  <Link
                    href={`/courses/${id}/chapter-details/${chapterId}/${lastViewedItem.id}`}
                  >
                    <button className="btn btn-info shadow-none btn-sm w-full mt-4 rounded-lg border-none text-white">
                      {t("continueButton")} ➔
                    </button>
                  </Link>
                </div>
              </div>
            )}

            {/* Progress */}
            <div className="card bg-white border border-slate-200 p-6 shadow-sm">
              <h3 className="font-semibold text-lg mb-6">
                {t("yourProgressHeading")}
              </h3>

              <div className="flex justify-between text-xs font-bold mb-2">
                <span>{t("overallProgressLabel")}</span>
                <span className="text-slate-400">
                  {totalCompleted} of {totalItems}
                </span>
              </div>

              <progress
                className="progress progress-info w-full h-3 mb-1"
                value={overallProgress}
                max="100"
              />

              <p className="text-[10px] text-right text-slate-400 mb-6">
                {overallProgress}% {t("completeLabel")}
              </p>
              <div className="flex flex-wrap gap-y-4 text-sm">
                <div className="w-full flex items-center gap-2">
                  <VideoIcon size={16} color="#155dfc" />
                  {t("videosLabel")}
                  <span className="ml-auto mr-4 font-bold">
                    {chapter?.total_completed_video_items || 0}/
                    {chapter?.total_video_items || 0}
                  </span>
                </div>
                <div className="w-full flex items-center gap-2">
                  <Sparkles size={16} color="#fe8e43" />
                  {t("activitiesLabel")}
                  <span className="ml-auto mr-4 font-bold">
                    {chapter?.total_completed_activity_items || 0}/
                    {chapter?.total_activity_items || 0}
                  </span>
                </div>
                <div className="w-full flex items-center gap-2">
                  <ClipboardMinus size={16} color="#5615b7" />
                  {t("quizzesLabel")}
                  <span className="ml-auto mr-4 font-bold">
                    {chapter?.total_completed_quiz_items || 0}/
                    {chapter?.total_quiz_items || 0}
                  </span>
                </div>
                <div className="w-full flex items-center gap-2">
                  <FileText size={16} color="#2ea60c" />
                  {t("documentsLabel")}
                  <span className="ml-auto mr-4 font-bold">
                    {chapter?.total_completed_document_items || 0}/
                    {chapter?.total_document_items || 0}
                  </span>
                </div>
              </div>
            </div>
            <div className="card bg-orange-50/50 border border-orange-100 p-6 shadow">
              <h3 className="font-bold text-sm flex items-center gap-2 mb-4">
                <span className="text-orange-400 text-xl"></span>
                {t("studyTipsHeading")}
              </h3>
              <ul className="text-xs space-y-3 text-slate-600">
                <li className="flex gap-2">
                  <span>
                    <CircleCheck size={16} color="#bd6500" />
                  </span>{" "}
                  {t("studyTip1")}
                </li>
                <li className="flex gap-2">
                  <span>
                    <CircleCheck size={16} color="#bd6500" />
                  </span>{" "}
                  {t("studyTip2")}
                </li>
                <li className="flex gap-2">
                  <span>
                    <CircleCheck size={16} color="#bd6500" />
                  </span>{" "}
                  {t("studyTip3")}
                </li>
                <li className="flex gap-2">
                  <span>
                    <CircleCheck size={16} color="#bd6500" />
                  </span>{" "}
                  {t("studyTip4")}
                </li>
              </ul>
            </div>
          </aside>
          </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChapterDetails;