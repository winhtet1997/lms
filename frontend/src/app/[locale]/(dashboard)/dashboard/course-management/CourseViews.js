"use client";
import {
  ArrowRight,
  BookOpen,
  Calendar,
  Edit,
  EllipsisVertical,
  Eye,
  Trash2,
  Video,
} from "lucide-react";
import Link from "next/link";
import Pagination from "@/components/layout/Pagination";

const CourseViews = ({
  viewMode,
  courses,
  coursesTotalCount,
  coursesTotalPages,
  currentPage,
  onPageChange,
  deletingId,
  handleDelete,
  can,
  t,
}) => {
  return (
    <>
      {/* Count */}
      <p className="mt-4 text-sm text-gray-500">
        {t("showingCount", {
          count: courses.length,
          total: coursesTotalCount.length,
        })}
      </p>

      {/* Cards Grid */}
      {viewMode === "grid" && (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mt-4">
          {courses.map((course, idx) => (
            <div
              key={course.id || idx}
              className="card bg-base-100 shadow-md border border-base-300 rounded-2xl hover:border-blue-700"
            >
              <div className="card-body">
                <div className="flex justify-between items-start">
                  <div className="p-3 rounded-lg bg-5 text-primary-content">
                    <BookOpen size={24} />
                  </div>

                  {/* Dropdown Menu */}
                  <div className="dropdown dropdown-end">
                    <div
                      tabIndex={0}
                      role="button"
                      className="btn btn-ghost btn-sm"
                    >
                      <EllipsisVertical size={16} />
                    </div>
                    <ul
                      tabIndex={0}
                      className="menu menu-sm dropdown-content bg-base-100 border border-gray-200 space-y-1 rounded-box mt-3 p-2 z-70 shadow-lg"
                    >
                      <li className="p-2 border-b border-gray-100 mb-1 font-semibold">
                        {t("dropdownActionsHeader")}
                      </li>
                      <li>
                        <Link
                          href={`/dashboard/course-management/${course.id}`}
                        >
                          <Eye size={14} /> {t("dropdownPreview")}
                        </Link>
                      </li>
                      {can("lms_course", "edit_course") && (
                        <li>
                          <Link
                            href={`/dashboard/upload-course?courseId=${course.id}`}
                          >
                            <Edit size={14} /> {t("dropdownEdit")}
                          </Link>
                        </li>
                      )}
                      {can("lms_course", "delete_course") && (
                        <li className="text-red-500 border-t border-gray-100 pt-2">
                          <button
                            onClick={() => handleDelete(course.id)}
                            disabled={deletingId === course.id}
                          >
                            <Trash2 size={16} /> {t("dropdownDelete")}
                          </button>
                        </li>
                      )}
                    </ul>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  <span className="badge badge-outline badge-sm">
                    {t("gradeLabel")} {course.grade_level}
                  </span>
                </div>
                <h2 className="card-title mt-2 text-base font-bold line-clamp-3">
                  {course.title}
                </h2>
                <p className="text-muted mt-1 text-sm line-clamp-2">
                  {course.description}
                </p>

                <div className="text-sm text-gray-500 grid grid-cols-1 gap-2">
                  <div className="flex justify-between">
                    <div className="flex gap-2 items-center">
                      <BookOpen size={16} /> {t("statChapters")}
                    </div>
                    <p className="text-black font-medium text-right">
                      {course.total_chapters || 0}
                    </p>
                  </div>
                  <div className="flex justify-between">
                    <div className="flex gap-2 items-center">
                      <Video size={16} /> {t("statItems")}
                    </div>
                    <p className="text-black font-medium text-right">
                      {course.total_items || 0}
                    </p>
                  </div>
                  <div className="flex justify-between">
                    <div className="flex gap-2 items-center">
                      <Calendar size={16} /> {t("statCreatedAt")}
                    </div>
                    <p className="text-black font-medium text-right">
                      {course.created_at
                        ? new Date(course.created_at).toLocaleDateString()
                        : "N/A"}
                    </p>
                  </div>
                  <Link
                    href={`/dashboard/course-management/${course.id}`}
                    className="btn btn-ghost border border-gray-300 btn-sm"
                  >
                    {t("viewCourseButton")} <ArrowRight size={14} />
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* List View */}
      {viewMode === "list" && (
        <div className="flex flex-col gap-4 mt-4">
          {courses.map((course, idx) => (
            <div
              key={course.id || idx}
              className="card w-full shadow border border-base-200"
            >
              <div className="card-body flex flex-col sm:flex-row sm:items-center gap-4 p-4">
                {/* Left: icon + info */}
                <div className="flex gap-3 items-start flex-1 min-w-0">
                  <div className="p-5 rounded-xl bg-5 text-primary-content shrink-0">
                    <BookOpen size={20} />
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap gap-2 mb-1">
                      <span className="badge badge-outline badge-sm">
                        {t("gradeLabel")} {course.grade_level}
                      </span>
                      {course.is_free && (
                        <span className="badge badge-outline badge-sm text-green-600 border-green-400">
                          Free
                        </span>
                      )}
                    </div>
                    <h4 className="font-bold truncate">{course.title}</h4>
                    <p className="text-sm text-gray-500 mt-0.5 line-clamp-1">
                      {course.description}
                    </p>
                    <div className="flex flex-wrap gap-3 mt-2 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <BookOpen size={14} /> {course.total_chapters || 0}{" "}
                        {t("statChapters")}
                      </span>
                      <span className="flex items-center gap-1">
                        <Video size={14} /> {course.total_items || 0}{" "}
                        {t("statItems")}
                      </span>
                    </div>
                  </div>
                </div>
                {/* Right: actions */}
                <div className="flex gap-2 items-center shrink-0 self-end sm:self-auto">
                  {can("lms_course", "edit_course") && (
                    <Link
                      href={`/dashboard/upload-course?courseId=${course.id}`}
                      className="btn btn-ghost btn-sm gap-1"
                    >
                      <Edit size={14} />
                      <span className="hidden sm:inline">
                        {t("dropdownEdit")}
                      </span>
                    </Link>
                  )}
                  <Link
                    href={`/dashboard/course-management/${course.id}`}
                    className="btn btn-ghost border border-gray-300 btn-sm gap-1"
                  >
                    <span className="hidden sm:inline">
                      {t("viewCourseButton")}
                    </span>
                    <ArrowRight size={14} />
                  </Link>
                  {can("lms_course", "delete_course") && (
                    <button
                      onClick={() => handleDelete(course.id)}
                      disabled={deletingId === course.id}
                      className="btn btn-ghost btn-sm text-red-500 gap-1"
                    >
                      <Trash2 size={14} />
                      <span className="hidden sm:inline">
                        {t("dropdownDelete")}
                      </span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Pagination
        currentPage={currentPage}
        totalPages={coursesTotalPages}
        onPageChange={onPageChange}
      />
    </>
  );
};

export default CourseViews;
