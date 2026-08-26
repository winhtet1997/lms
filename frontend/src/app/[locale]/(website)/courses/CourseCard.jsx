import Link from "next/link";

import { BookOpen, Briefcase, ChevronRight } from "lucide-react";

export default function CourseCard({ course, colorClass, t }) {
  const topicList = Array.isArray(course.chapters)
    ? course.chapters.slice(0, 4)
    : [];

  return (
    <Link href={`/courses/${course.id}`} className="group block text-left">
      <div className="rounded-2xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-md transition-shadow duration-300 bg-white flex flex-col h-full">
        <div
          className={`relative ${colorClass} px-4 pt-8 pb-5 md:px-5 md:pt-12 md:pb-6 overflow-hidden`}
        >
          <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full bg-white/10" />
          <div className="absolute -bottom-8 -left-8 w-28 h-28 rounded-full bg-white/10" />

          <div className="relative flex items-start justify-between">
            <div className="flex-1 pr-3">
              <h2 className="text-white font-bold text-base md:text-lg leading-tight">
                {course.title}
              </h2>
              <p className="text-white/70 text-xs mt-1">
                {t("gradeLabel")} - {course.grade_level}
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-col flex-1 p-4 md:p-5">
          <p className="text-gray-500 text-xs md:text-sm line-clamp-2 mb-3 md:mb-4">
            {course.description}
          </p>

          {topicList.length > 0 && (
            <ul className="space-y-1 md:space-y-1.5 mb-3 md:mb-4 flex-1">
              {topicList.map((chapter) => (
                <li
                  key={chapter.id}
                  className="flex items-center gap-2 text-xs md:text-sm text-gray-600 min-w-0"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-gray-400 shrink-0" />
                  <span className="truncate">{chapter.title}</span>
                </li>
              ))}
            </ul>
          )}

          <div className="flex items-center gap-3 pt-3 border-t border-gray-100 mt-auto text-gray-500 text-xs">
            <span className="flex items-center gap-1">
              <BookOpen size={12} />
              {course.total_chapters ?? 0} {t("chaptersLabel")}
            </span>
            <span className="flex items-center gap-1">
              <Briefcase size={12} />
              {course.total_items ?? 0} {t("itemsLabel")}
            </span>
            <span className="ml-auto">
              <ChevronRight
                size={15}
                className="group-hover:translate-x-0.5 transition-transform"
              />
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
