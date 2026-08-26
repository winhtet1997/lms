"use client";
import { useCourseStore } from "@/store/useCourseStore";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { useConfirm } from "@/components/ui/AlertModal";
import toast from "react-hot-toast";
import { usePermission } from "@/hooks/usePermission";
import { useRouter, useSearchParams } from "next/navigation";
import CourseFilterBar from "./CourseFilterBar";
import CourseViews from "./CourseViews";

const PAGE_SIZE = 9;
const SEARCH_DEBOUNCE_MS = 500;
const FILTER_KEY = "course_filters";

function loadStoredFilters() {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(sessionStorage.getItem(FILTER_KEY) || "{}");
  } catch {
    return {};
  }
}

function persistFilters(filters) {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(FILTER_KEY, JSON.stringify(filters));
  } catch {}
}

const CourseFilter = () => {
  const t = useTranslations("CourseFilter");
  const router = useRouter();
  const searchParams = useSearchParams();

  // Single sessionStorage read shared across all filter useState initializers
  const storedRef = useRef(null);

  const [viewMode, setViewMode] = useState("grid");
  const [searchTerm, setSearchTerm] = useState(() => {
    if (!storedRef.current) storedRef.current = loadStoredFilters();
    const fromUrl = searchParams.get("search");
    return fromUrl !== null ? fromUrl : storedRef.current.search || "";
  });
  const [selectedGrade, setSelectedGrade] = useState(() => {
    const fromUrl = searchParams.get("grade");
    return fromUrl !== null ? fromUrl : storedRef.current?.grade || "";
  });
  const [sortBy, setSortBy] = useState(() => {
    const fromUrl = searchParams.get("ordering");
    return fromUrl !== null ? fromUrl : storedRef.current?.ordering || "newest";
  });
  const [currentPage, setCurrentPage] = useState(() => {
    const fromUrl = searchParams.get("page");
    if (fromUrl !== null) return Math.max(1, Number(fromUrl) || 1);
    return Math.max(1, Number(storedRef.current?.page) || 1);
  });
  const [deletingId, setDeletingId] = useState(null);
  const searchDebounceRef = useRef(null);

  // Always-current filter values — doFetch reads from here to avoid stale closures
  const filterRef = useRef({});
  filterRef.current = { searchTerm, selectedGrade, sortBy, currentPage };


  const courses = useCourseStore((state) => state.courses);
  const fetchCourses = useCourseStore((state) => state.fetchCourses);
  const deleteCourse = useCourseStore((state) => state.deleteCourse);
  const coursesTotalPages = useCourseStore((state) => state.coursesTotalPages);
  const coursesTotalCount = useCourseStore((state) => state.coursesTotalCount);

  const { confirm, ConfirmModal } = useConfirm();
  const { can } = usePermission();

  const updateURL = useCallback(
    (params) => {
      const current = filterRef.current;
      const merged = {
        search: current.searchTerm,
        grade: current.selectedGrade,
        ordering: current.sortBy,
        page: current.currentPage,
        ...params,
      };
      const next = new URLSearchParams();
      for (const [key, value] of Object.entries(merged)) {
        if (value !== "" && value != null) {
          next.set(key, String(value));
        }
      }
      router.replace(`?${next.toString()}`, { scroll: false });
      persistFilters(merged);
    },
    [router],
  );

  const doFetch = useCallback(
    (overrides = {}) => {
      fetchCourses({
        search: filterRef.current.searchTerm,
        grade: filterRef.current.selectedGrade,
        ordering: filterRef.current.sortBy,
        page: filterRef.current.currentPage,
        page_size: PAGE_SIZE,
        ...overrides,
      });
    },
    [fetchCourses],
  );

  // Clear stored filters when navigating away from the course management section entirely.
  // Exclude upload-course so filters survive the edit-and-back flow.
  useEffect(() => {
    return () => {
      const path = window.location.pathname;
      if (
        !path.includes("/dashboard/course-management") &&
        !path.includes("/dashboard/upload-course")
      ) {
        sessionStorage.removeItem(FILTER_KEY);
      }
    };
  }, []);

  // Initial load — if URL had no params, push the restored filter values into the URL
  useEffect(() => {
    const hasUrlFilters = ["search", "grade", "ordering", "page"].some(
      (k) => searchParams.get(k) !== null,
    );
    if (!hasUrlFilters) {
      updateURL({
        search: searchTerm,
        grade: selectedGrade,
        ordering: sortBy,
        page: currentPage,
      });
    }
    doFetch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSearchChange = useCallback(
    (e) => {
      const value = e.target.value;
      setSearchTerm(value);
      clearTimeout(searchDebounceRef.current);
      searchDebounceRef.current = setTimeout(() => {
        setCurrentPage(1);
        updateURL({ search: value, page: 1 });
        doFetch({ search: value, page: 1 });
      }, SEARCH_DEBOUNCE_MS);
    },
    [updateURL, doFetch],
  );

  const handleGradeChange = useCallback(
    (e) => {
      const value = e.target.value;
      setSelectedGrade(value);
      setCurrentPage(1);
      updateURL({ grade: value, page: 1 });
      doFetch({ grade: value, page: 1 });
    },
    [updateURL, doFetch],
  );

  const handleSortChange = useCallback(
    (e) => {
      const value = e.target.value;
      setSortBy(value);
      setCurrentPage(1);
      updateURL({ ordering: value, page: 1 });
      doFetch({ ordering: value, page: 1 });
    },
    [updateURL, doFetch],
  );

  const handlePageChange = useCallback(
    (page) => {
      setCurrentPage(page);
      updateURL({ page });
      doFetch({ page });
    },
    [updateURL, doFetch],
  );

  const handleDelete = useCallback(
    async (courseId) => {
      document.activeElement?.blur();
      const ok = await confirm({
        title: t("deleteConfirmTitle"),
        message: t("deleteConfirmMessage"),
        confirmText: t("deleteConfirmButton"),
      });
      if (!ok) return;

      try {
        setDeletingId(courseId);
        await deleteCourse(courseId);
        toast.success(t("deleteSuccess"));
        doFetch();
      } catch {
        toast.error(t("deleteError"));
      } finally {
        setDeletingId(null);
      }
    },
    [confirm, t, deleteCourse, doFetch],
  );

  return (
    <div>
      <ConfirmModal />
      <CourseFilterBar
        searchTerm={searchTerm}
        selectedGrade={selectedGrade}
        sortBy={sortBy}
        viewMode={viewMode}
        setViewMode={setViewMode}
        handleSearchChange={handleSearchChange}
        handleGradeChange={handleGradeChange}
        handleSortChange={handleSortChange}
        t={t}
      />
      <CourseViews
        viewMode={viewMode}
        courses={courses ?? []}
        coursesTotalCount={coursesTotalCount}
        coursesTotalPages={coursesTotalPages}
        currentPage={currentPage}
        onPageChange={handlePageChange}
        deletingId={deletingId}
        handleDelete={handleDelete}
        can={can}
        t={t}
      />
    </div>
  );
};

export default CourseFilter;
