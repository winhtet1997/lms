"use client";

import { ArrowRight, CircleCheck, Clock, Crown, Lock, Video } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useTranslations } from "next-intl";

const iconGradients = [
  "bg-gradient-to-br from-blue-500 to-cyan-400",
  "bg-gradient-to-br from-purple-600 to-indigo-500",
  "bg-gradient-to-br from-emerald-500 to-teal-400",
  "bg-gradient-to-br from-orange-500 to-amber-400",
  "bg-gradient-to-br from-pink-500 to-rose-400",
  "bg-gradient-to-br from-slate-700 to-slate-500",
];

const ChapterCard = ({ chapter, index, courseId, user, isAdmin = false, stats, hasFullAccess = false }) => {
  const t = useTranslations("CourseDetailPage");

  // stats === undefined means still loading; null means failed; object means loaded
  const loading = stats === undefined;
  const isLocked = !isAdmin && !loading && stats?.is_locked === true;
  const isFreePreview =
    !isAdmin && !loading && !isLocked && !hasFullAccess && stats?.is_free_preview === true;
  const status = stats?.chapter_completion_status ?? 0;
  const isComplete = !loading && !isLocked && status === 100;
  const isInProgress = !loading && !isLocked && status > 0 && status < 100;

  const cardBorder = isAdmin
    ? "border-[1px] border-gray-200"
    : isComplete
      ? "border-[1px] border-green-300"
      : isInProgress
        ? "border-[1px] border-blue-300"
        : "border-[1px] border-gray-200";

  const chapterHref = isAdmin
    ? `/courses/${courseId}/chapter-details/${chapter.id}`
    : `./${courseId}/chapter-details/${chapter.id}`;

  const buttonLabel = isAdmin
    ? "See Learning Path"
    : isLocked
      ? t("lockedButton")
      : isComplete
        ? t("reviewButton")
        : isInProgress
          ? t("continueButton") 
          : t("startLearningButton");

  return (
    <div
      className={`card shadow hover:shadow-primary cursor-pointer hover:scale-[1.05] transition-transform duration-200 hover:shadow group ${cardBorder}`}
    >
      <div className="card-body">
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <div
              className={`text-white flex items-center justify-center size-10 bg-1 rounded-md ${iconGradients[index % iconGradients.length]}`}
            >
              {chapter.icon && (
                <Image
                  src={`${chapter.icon}`}
                  alt={`${chapter.title} icon`}
                  width={20}
                  height={20}
                />
              )}
            </div>
            {!isAdmin && !loading && (
              isLocked ? (
                <span className="badge badge-sm bg-amber-100 text-amber-700 rounded-full text-xs">
                  <Crown size={12} /> {t("lockedBadge")}
                </span>
              ) : isComplete ? (
                <span className="badge badge-sm bg-emerald-600 text-white rounded-full text-xs">
                  <CircleCheck size={12} /> {t("completeBadge")}
                </span>
              ) : isInProgress ? (
                <span className="badge badge-sm bg-gray-200 font-semibold rounded-full text-xs">
                  {status}%
                </span>
              ) : isFreePreview ? (
                <span className="badge badge-sm bg-blue-100 text-blue-700 rounded-full text-xs whitespace-nowrap shrink-0">
                  {t("freePreviewBadge")}
                </span>
              ) : null
            )}
          </div>
          <div className="grid gap-1">
            <h5 className="group-hover:text-[#0055B3] transition-colors duration-200">
              {chapter.title}
            </h5>
            <p className="text-gray-500 text-xs">{chapter.description}</p>
          </div>
        </div>
        <div>
          <div className="flex justify-between text-xs text-gray-500 mb-1" />
          {!isAdmin && user && !loading && status > 0 && (
            <progress
              className="progress progress-info w-full"
              value={status}
              max={100}
            />
          )}
          <div className="flex gap-4 mt-2 text-xs text-gray-500">
            {loading ? (
              <>
                <div className="skeleton h-3 w-16 rounded" />
                <div className="skeleton h-3 w-14 rounded" />
              </>
            ) : (
              <>
                <div className="flex justify-center items-center gap-1">
                  <Video size={12} />
                  {stats?.total_video_items ?? 0} {t("videosLabel")}
                </div>
                <div className="flex justify-center items-center gap-1">
                  <Clock size={12} /> {stats?.total_time ?? 0} {t("minLabel")}
                </div>
              </>
            )}
          </div>
        </div>
        <Link href={chapterHref}>
          <button className="btn btn-info btn-sm shadow-none border-none text-white w-full">
            {buttonLabel}
            {isLocked ? (
              <Lock color="#fff" size={16} />
            ) : (
              <ArrowRight color="#fff" size={16} />
            )}
          </button>
        </Link>
      </div>
    </div>
  );
};

export default ChapterCard;
