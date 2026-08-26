"use client";
import { Clock, FileQuestionMark, FileText, Gamepad2Icon, Package, VideoIcon } from "lucide-react";
import { useTranslations } from "next-intl";

const CourseStatsGrid = ({ course }) => {
  const t = useTranslations("OverallProgress");

  if (!course) return null;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-12">
      <div className="card bg-white border border-slate-200 shadow-sm rounded-2xl p-6">
        <div className="flex flex-col items-center text-center">
          <div className="w-12 h-12 text-blue-500 rounded-full bg-blue-100 flex items-center justify-center mb-3">
            <VideoIcon />
          </div>
          <div className="text-3xl font-extrabold tracking-tighter">
            {course.total_completed_video_items}/ {course.total_video_items}
          </div>
          <div className="text-slate-400 font-bold text-[10px] uppercase tracking-widest mt-1">
            {t("videosWatched")}
          </div>
        </div>
      </div>

      <div className="card bg-white border border-slate-200 shadow-sm rounded-2xl p-6">
        <div className="flex flex-col items-center text-center">
          <div className="w-12 h-12 rounded-full bg-teal-100 flex items-center justify-center mb-3 text-teal-600">
            <Gamepad2Icon size={20} />
          </div>
          <div className="text-3xl font-extrabold tracking-tighter">
            {course.total_completed_activity_items}/{" "}
            {course.total_activity_items}
          </div>
          <div className="text-slate-400 font-bold text-[10px] uppercase tracking-widest mt-1">
            {t("activitiesDone")}
          </div>
        </div>
      </div>

      <div className="card bg-white border border-slate-200 shadow-sm rounded-2xl p-6">
        <div className="flex flex-col items-center text-center">
          <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mb-3 text-green-600">
            <FileText size={20} />
          </div>
          <div className="text-3xl font-extrabold tracking-tighter">
            {course.total_completed_document_items}/{" "}
            {course.total_document_items}
          </div>
          <div className="text-slate-400 font-bold text-[10px] uppercase tracking-widest mt-1">
            {t("documentsRead")}
          </div>
        </div>
      </div>

      <div className="card bg-white border border-slate-200 shadow-sm rounded-2xl p-6">
        <div className="flex flex-col items-center text-center">
          <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center mb-3 text-purple-600">
            <FileQuestionMark size={20} />
          </div>
          <div className="text-3xl font-extrabold tracking-tighter">
            {course.total_completed_quiz_items}/ {course.total_quiz_items}
          </div>
          <div className="text-slate-400 font-bold text-[10px] uppercase tracking-widest mt-1">
            {t("quizTaken")}
          </div>
        </div>
      </div>

      <div className="card bg-white border border-slate-200 shadow-sm rounded-2xl p-6">
        <div className="flex flex-col items-center text-center">
          <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center mb-3 text-orange-600">
            <Package size={20} />
          </div>
          <div className="text-3xl font-extrabold tracking-tighter">
            {course.total_completed_scorm_items}/ {course.total_scorm_items}
          </div>
          <div className="text-slate-400 font-bold text-[10px] uppercase tracking-widest mt-1">
            {t("scormCompleted")}
          </div>
        </div>
      </div>

      <div className="card bg-white border border-slate-200 shadow-sm rounded-2xl p-6">
        <div className="flex flex-col items-center text-center">
          <div className="w-12 h-12 rounded-full bg-yellow-100 flex items-center justify-center mb-3 text-yellow-600">
            <Clock size={20} />
          </div>
          <div className="text-3xl font-extrabold tracking-tighter text-nowrap">
            {course.total_time} {t("minuteUnit")}
          </div>
          <div className="text-slate-400 font-bold text-[10px] uppercase tracking-widest mt-1">
            {t("totalTime")}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourseStatsGrid;
