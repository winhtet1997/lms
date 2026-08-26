"use client";
import { useCourseStore } from "@/store/useCourseStore";
import React, { useCallback, useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { useConfirm } from "@/components/ui/AlertModal";
import { useTranslations } from "next-intl";
import { usePermission } from "@/hooks/usePermission";
import { useRouter, useSearchParams } from "next/navigation";
import ItemFilterBar from "./ItemFilterBar";
import ItemViews from "./ItemViews";

const PAGE_SIZE = 9;
const SEARCH_DEBOUNCE_MS = 500;
const FILTER_KEY = "content_item_filters";

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

const FilterItems = () => {
  const t = useTranslations("ItemFilter");
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
  const [selectedType, setSelectedType] = useState(() => {
    const fromUrl = searchParams.get("type");
    return fromUrl !== null ? fromUrl : storedRef.current?.type || "";
  });
  const [selectedGrade, setSelectedGrade] = useState(() => {
    const fromUrl = searchParams.get("grade");
    return fromUrl !== null ? fromUrl : storedRef.current?.grade || "";
  });
  const [sortBy, setSortBy] = useState(() => {
    const fromUrl = searchParams.get("ordering");
    return fromUrl !== null ? fromUrl : storedRef.current?.ordering || "newest";
  });
  const [selectedStatus, setSelectedStatus] = useState(() => {
    const fromUrl = searchParams.get("status");
    return fromUrl !== null ? fromUrl : storedRef.current?.status || "";
  });
  const [currentPage, setCurrentPage] = useState(() => {
    const fromUrl = searchParams.get("page");
    if (fromUrl !== null) return Math.max(1, Number(fromUrl) || 1);
    return Math.max(1, Number(storedRef.current?.page) || 1);
  });
  const searchDebounceRef = useRef(null);

  // Always-current filter values — doFetch reads from here to avoid stale closures
  const filterRef = useRef({});
  filterRef.current = {
    searchTerm,
    selectedType,
    selectedGrade,
    sortBy,
    selectedStatus,
    currentPage,
  };

  const { can } = usePermission();


  const items = useCourseStore((state) => state.items);
  const fetchItems = useCourseStore((state) => state.fetchItems);
  const deleteItem = useCourseStore((state) => state.deleteItem);
  const itemsTotalCount = useCourseStore((state) => state.itemsTotalCount);
  const itemsTotalPages = useCourseStore((state) => state.itemsTotalPages);
  const updateItem = useCourseStore((state) => state.updateItem);

  const { confirm, ConfirmModal } = useConfirm();

  // Permissions computed once per render instead of once per item
  const canViewItem = can("lms_course", "view_item");
  const canChangeItem = can("lms_course", "edit_item");
  const canDeleteItem = can("lms_course", "delete_item");
  const canChangeStatus = can("lms_course", "can_change_item_status");

  const updateURL = useCallback(
    (params) => {
      const current = filterRef.current;
      const merged = {
        search: current.searchTerm,
        type: current.selectedType,
        grade: current.selectedGrade,
        ordering: current.sortBy,
        status: current.selectedStatus,
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
      fetchItems({
        search: filterRef.current.searchTerm,
        type: filterRef.current.selectedType,
        grade: filterRef.current.selectedGrade,
        ordering: filterRef.current.sortBy,
        publication_status: filterRef.current.selectedStatus,
        page: filterRef.current.currentPage,
        page_size: PAGE_SIZE,
        ...overrides,
      });
    },
    [fetchItems],
  );

  // Clear stored filters when navigating away from the content section entirely
  useEffect(() => {
    return () => {
      if (!window.location.pathname.includes("/dashboard/content")) {
        sessionStorage.removeItem(FILTER_KEY);
      }
    };
  }, []);

  // Initial load — if URL had no params, push the restored filter values into the URL
  useEffect(() => {
    const hasUrlFilters = [
      "search",
      "type",
      "grade",
      "ordering",
      "status",
      "page",
    ].some((k) => searchParams.get(k) !== null);
    if (!hasUrlFilters) {
      updateURL({
        search: searchTerm,
        type: selectedType,
        grade: selectedGrade,
        ordering: sortBy,
        status: selectedStatus,
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

  const handleTypeChange = useCallback(
    (e) => {
      const value = e.target.value;
      setSelectedType(value);
      setCurrentPage(1);
      updateURL({ type: value, page: 1 });
      doFetch({ type: value, page: 1 });
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

  const handleStatusChange = useCallback(
    (e) => {
      const value = e.target.value;
      setSelectedStatus(value);
      setCurrentPage(1);
      updateURL({ status: value, page: 1 });
      doFetch({ publication_status: value, page: 1 });
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
    async (itemId) => {
      document.activeElement?.blur();

      const ok = await confirm({
        title: t("deleteConfirmTitle"),
        message: t("deleteConfirmMessage"),
        confirmText: t("deleteConfirmButton"),
      });

      if (!ok) return;

      try {
        await deleteItem(itemId);
        toast.success(t("toastDeleteSuccess"));
        doFetch();
      } catch {
        toast.error(t("toastDeleteError"));
      }
    },
    [confirm, t, deleteItem, doFetch],
  );

  const handleDownload = useCallback(
    (item) => {
      const url = item.file;
      if (!url) {
        return toast.error(t("toastNoFileLink"));
      }
      const newWindow = window.open(url, "_blank", "noopener,noreferrer");
      if (newWindow) {
        toast.success(t("toastOpeningFile"));
      }
    },
    [t],
  );

  const handleToggleStatus = useCallback(
    async (item) => {
      try {
        await updateItem(
          item.id,
          { publication_status: !item.publication_status },
          null,
        );
        toast.success(
          !item.publication_status ? "Item set to Active" : "Item Archived",
        );
        doFetch();
      } catch {
        toast.error("Failed to update status");
      }
    },
    [updateItem, doFetch],
  );

  return (
    <div>
      <ConfirmModal />
      <ItemFilterBar
        searchTerm={searchTerm}
        selectedType={selectedType}
        selectedGrade={selectedGrade}
        sortBy={sortBy}
        selectedStatus={selectedStatus}
        viewMode={viewMode}
        setViewMode={setViewMode}
        handleSearchChange={handleSearchChange}
        handleTypeChange={handleTypeChange}
        handleGradeChange={handleGradeChange}
        handleSortChange={handleSortChange}
        handleStatusChange={handleStatusChange}
        t={t}
      />
      <ItemViews
        viewMode={viewMode}
        items={items ?? []}
        canViewItem={canViewItem}
        canChangeItem={canChangeItem}
        canDeleteItem={canDeleteItem}
        canChangeStatus={canChangeStatus}
        t={t}
        handleDownload={handleDownload}
        handleDelete={handleDelete}
        handleToggleStatus={handleToggleStatus}
        currentPage={currentPage}
        totalPages={itemsTotalPages}
        onPageChange={handlePageChange}
        itemsTotalCount={itemsTotalCount}
      />
    </div>
  );
};

export default FilterItems;
