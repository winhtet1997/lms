"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useCourseStore } from "@/store/useCourseStore";
import { useAuthStore } from "@/store/useAuthStore";
import { useTranslations } from "next-intl";
import { Award, CircleCheck, CirclePlay, Clock, Lock, TrendingUp } from "lucide-react";
import Link from "next/link";
import ChapterCard from "./ChapterCard";
import StudentSubNavbar from "@/components/layout/StudentSubNavbar";
import { courseService } from "@/service/courseService";
import { enrollmentService } from "@/service/enrollmentService";
import { parentService } from "@/service/parentService";

const CourseDetail = () => {
  const { id } = useParams();
  const { course } = useCourseStore();
  const { user } = useAuthStore();
  const [chapterStats, setChapterStats] = useState({});
  const [myEnrollment, setMyEnrollment] = useState(null);
  const [activeChildNames, setActiveChildNames] = useState([]);
  const isParent = user?.role === "Parent";

  const chapters = course?.chapters ?? [];

  const completedCount = Object.values(chapterStats).filter(
    (s) => s && (s.chapter_completion_status ?? 0) === 100,
  ).length;
  const inProgressCount = Object.values(chapterStats).filter((s) => {
    const v = s?.chapter_completion_status ?? 0;
    return v > 0 && v < 100;
  }).length;
  const notStartedCount = Object.values(chapterStats).filter(
    (s) => s && (s.chapter_completion_status ?? 0) === 0,
  ).length;

  const t = useTranslations("CourseDetailPage");

  const isEnrolledActive = isParent
    ? activeChildNames.length > 0
    : Boolean(myEnrollment?.enrolled && myEnrollment?.is_active);

  useEffect(() => {
    if (!id) return;
    courseService.getCourseByIdBasic(id).then((data) =>
      useCourseStore.setState({ course: data })
    );
  }, [id]);

  useEffect(() => {
    if (!id || !user) return;
    if (isParent) {
      parentService
        .getChildren()
        .then((children) =>
          Promise.all(
            children.map((child) =>
              enrollmentService
                .getMyEnrollment(id, child.id)
                .then((data) => (data?.enrolled && data?.is_active ? child : null)),
            ),
          ),
        )
        .then((results) =>
          setActiveChildNames(
            results.filter(Boolean).map((c) => c.full_name || c.username),
          ),
        )
        .catch(() => setActiveChildNames([]));
    } else {
      enrollmentService
        .getMyEnrollment(id)
        .then(setMyEnrollment)
        .catch(() => setMyEnrollment(null));
    }
  }, [id, user, isParent]);

  useEffect(() => {
    if (!chapters.length) return;
    chapters.forEach((chapter) => {
      courseService
        .getChapter(chapter.id)
        .then((stats) =>
          setChapterStats((prev) => ({ ...prev, [chapter.id]: stats }))
        )
        .catch(() =>
          setChapterStats((prev) => ({ ...prev, [chapter.id]: null }))
        );
    });
  }, [chapters.length]);

  if (!course) return <span className="loading loading-spinner"></span>;

  return (
    <>
      <StudentSubNavbar />
      <div className="min-h-screen py-24 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-6 mb-12">
            <div className="card bg-base-100 shadow border border-gray-200">
              <div className="card-body">
                <div className="flex flex-wrap items-start gap-4 border-b border-gray-200 pb-4 ">
                  <div
                    className="radial-progress progress-info text-center bg-base-300"
                    style={{ "--value": course.course_progress }}
                    aria-valuenow={course.course_progress}
                    role="progressbar"
                  >
                    <p className="text-black text-xs">
                      <span className="font-bold text-lg">
                        {course.course_progress}%
                      </span>{" "}
                      {t("completeLabel")}
                    </p>
                  </div>
                  <div className="flex flex-col">
                    <h4>{t("overallProgressLabel")}</h4>
                    <p className="text-sm text-gray-500">
                      {t("chaptersCompleteCount", {
                        completed: completedCount,
                        total: course.chapters.length,
                      })}
                    </p>
                    <div className="flex flex-col lg:flex-row items-center gap-4 text-sm">
                      <div className="flex items-center gap-1.5">
                        <CircleCheck color="green" size={16} />
                        <span className="text-gray-500">
                          {t("masteredCount", { count: completedCount })}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <CirclePlay color="blue" size={16} />
                        <span className="text-gray-500">
                          {t("inProgressCount", { count: inProgressCount })}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Clock color="gray" size={16} />
                        <span className="text-muted-foreground">
                          {t("remainingCount", {
                            count: notStartedCount,
                          })}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                <Link href={`./${course.id}/progress`}>
                  <button className="btn btn-outline border-gray-300 btn-sm mt-3 w-full">
                    <TrendingUp size={16} /> {t("viewDetailedProgressButton")}
                  </button>
                </Link>
              </div>
            </div>
            <div className="card bg-[#FDF4DE] border border-amber-200 shadow-sm">
              <div className="card-body">
                <div className="flex gap-4">
                  <div className="bg-amber-500 w-14 h-14 rounded-xl flex items-center justify-center">
                    <Award color="white" size={24} />
                  </div>
                  <div className="flex flex-col">
                    <h6>{t("dailyQuizTitle")}</h6>

                    <span className="text-gray-600">{t("dailyQuizMeta")}</span>
                  </div>
                </div>

                <Link href={`/daily-quiz?autostart=true&course_id=${course.id}`}>
                  <button className="btn btn-warning bg-linear-to-r from-amber-500 to-orange-500 border-none shadow-none mt-3 w-full">
                    {t("startQuizButton")}
                  </button>
                </Link>
              </div>
            </div>
          </div>

          {user && (() => {
            return (
              <div
                className={`card mb-8 border shadow-sm ${
                  isEnrolledActive
                    ? "bg-emerald-50 border-emerald-200"
                    : "bg-blue-50 border-blue-200"
                }`}
              >
                <div className="card-body flex-row items-center justify-between flex-wrap gap-4">
                  <div className="flex items-center gap-3">
                    {isEnrolledActive ? (
                      <CircleCheck className="text-emerald-600" size={24} />
                    ) : (
                      <Lock className="text-blue-600" size={24} />
                    )}
                    <div>
                      <h6>
                        {isEnrolledActive
                          ? t("enrolledBadge")
                          : t("subscribeCardTitle")}
                      </h6>
                      {isParent ? (
                        <span className="text-sm text-gray-500">
                          {isEnrolledActive
                            ? t("activeForChildrenLabel", {
                                names: activeChildNames.join(", "),
                              })
                            : t("subscribeCardMessageParent")}
                        </span>
                      ) : isEnrolledActive ? (
                        myEnrollment.expires_at && (
                          <span className="text-sm text-gray-500">
                            {t("activeUntilLabel")}{" "}
                            {new Date(myEnrollment.expires_at).toLocaleDateString()}
                          </span>
                        )
                      ) : (
                        <span className="text-sm text-gray-500">
                          {t("subscribeCardMessage")}
                        </span>
                      )}
                    </div>
                  </div>
                  {(isParent || !isEnrolledActive) && (
                    <Link href={`/courses/${course.id}/subscribe`}>
                      <button className="btn btn-info btn-sm shadow-none border-none text-white">
                        {isParent ? t("manageSubscriptionsButton") : t("subscribeButton")}
                      </button>
                    </Link>
                  )}
                </div>
              </div>
            );
          })()}

          <div className="mb-8">
            <h3>{course.title}</h3>
            <p className="text-gray-500 mt-1">{t("chaptersSubheading")}</p>
            <p className="text-gray-500 mt-1">{course.description}</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {course.chapters.map((chapter, index) => (
              <ChapterCard
                key={chapter.id}
                chapter={chapter}
                index={index}
                courseId={course.id}
                user={user}
                stats={chapterStats[chapter.id]}
                hasFullAccess={isEnrolledActive}
              />
            ))}
          </div>
        </div>
      </div>
    </>
  );
};

export default CourseDetail;
