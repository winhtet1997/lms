"use client";

import React, { useEffect, useRef, useState } from "react";
import {
    Video,
    FileText,
    Boxes,
    Activity,
    ClipboardList,
    Award,
    Search,
    Plus,
    Folder,
    Tag,
    ChevronLeft,
    LayoutGrid,
    List,
} from "lucide-react";
import { useCourseStore } from "@/store/useCourseStore";
import { useSearchParams, useRouter } from "next/navigation";
import { CONTENT_TYPES } from "../../../../../../../data/contentData";
import Link from "next/link";
import { useTranslations } from "next-intl";
import Pagination from "@/components/layout/Pagination";

const ITEM_TYPES = [
    { key: "video", label: "Video", icon: Video },
    { key: "document", label: "Document", icon: FileText },
    { key: "scorm", label: "SCORM", icon: Boxes },
    { key: "activity", label: "Activity", icon: Activity },
    { key: "quiz", label: "Quiz", icon: ClipboardList },
    { key: "assessment", label: "Assessment", icon: Award },
];

const PAGE_SIZE = 9;
const SEARCH_DEBOUNCE_MS = 500;

export default function AddItem() {
    const t = useTranslations("AddItem");
    const [activeType, setActiveType] = useState("video");
    const [selectedItems, setSelectedItems] = useState([]);
    const [selectedGrade, setSelectedGrade] = useState(null);
    const [selectedTag, setSelectedTag] = useState(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [viewMode, setViewMode] = useState("list");
    const [currentPage, setCurrentPage] = useState(1);
    const searchDebounceRef = useRef(null);

    const params = useSearchParams();
    const router = useRouter();

    const chapterIndex = Number(params.get("chapter"));
    const lessonIndex = Number(params.get("lesson"));
    const {
        addItemsToLesson,
        items,
        fetchItems,
        fetchItemsGrouped,
        sidebarGrouped,
        sidebarGroupedLoading,
        itemsLoading,
        itemsTotalPages,
        saveLessonItems,
        courseDraft,
    } = useCourseStore();

    const courseId = courseDraft.id;

    const doFetch = (overrides = {}) => {
        fetchItems({
            type: activeType,
            grade: selectedGrade ?? "",
            search: searchQuery,
            publication_status: "true",
            page: currentPage,
            page_size: PAGE_SIZE,
            ...overrides,
        });
    };

    const doFetchSidebar = (type) => {
        fetchItemsGrouped({
            type: type ?? activeType,
            publication_status: "true",
        });
    };

    useEffect(() => {
        doFetch();
        doFetchSidebar();
    }, []);

    const getTypeConfig = (itemType) => {
        return (
            CONTENT_TYPES.find((t) => t.id === itemType?.toLowerCase()) ||
            CONTENT_TYPES[0]
        );
    };

    const allItems = items ?? [];

    const filteredItems = selectedTag
        ? allItems.filter((item) => item.tags?.includes(selectedTag))
        : allItems;

    const grades = Object.keys(sidebarGrouped);
    const sidebarTotal = grades.reduce((sum, g) => sum + (sidebarGrouped[g]?.total ?? 0), 0);

    const handleTypeChange = (type) => {
        setActiveType(type);
        setSelectedGrade(null);
        setSelectedTag(null);
        setSearchQuery("");
        setCurrentPage(1);
        doFetch({ type, grade: "", search: "", page: 1 });
        doFetchSidebar(type);
    };

    const handleGradeSelect = (gradeNumber) => {
        setSelectedGrade(gradeNumber);
        setSelectedTag(null);
        setCurrentPage(1);
        doFetch({ grade: gradeNumber ?? "", page: 1 });
    };

    const handleSearchChange = (e) => {
        const value = e.target.value;
        setSearchQuery(value);
        clearTimeout(searchDebounceRef.current);
        searchDebounceRef.current = setTimeout(() => {
            setCurrentPage(1);
            doFetch({ search: value, page: 1 });
        }, SEARCH_DEBOUNCE_MS);
    };

    const handlePageChange = (page) => {
        setCurrentPage(page);
        doFetch({ page });
    };

    const toggleSelect = (item) => {
        setSelectedItems((prev) =>
            prev.some((i) => i.id === item.id)
                ? prev.filter((i) => i.id !== item.id)
                : [...prev, item]
        );
    };

    const handleAddToLesson = async () => {
        addItemsToLesson(chapterIndex, lessonIndex, selectedItems);
        await saveLessonItems(chapterIndex, lessonIndex);
        router.push(`/dashboard/upload-course?courseId=${courseId}`);
    };

    return (
        <div className="p-3 md:p-6 space-y-6">
            {/* Header Section */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <Link href={`/dashboard/upload-course?courseId=${courseId}`}
                        className="btn btn-ghost btn-sm btn-circle border border-slate-300">
                        <ChevronLeft className="w-4 h-4" />
                    </Link>
                    <div>
                        <h1 className="text-lg md:text-xl font-semibold">{t("pageTitle")}</h1>
                        <p className="text-xs md:text-sm text-gray-500">{t("pageSubtitle")}</p>
                    </div>
                </div>
                <Link href="/dashboard/upload-content" className="w-full sm:w-auto">
                    <button className="btn btn-info btn-sm shadow-none w-full">
                        <Plus className="size-4" />
                        {t("uploadItemButton")}
                    </button>
                </Link>
            </div>

            {/* Type Filters - Horizontal Scroll on small screens */}
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide no-scrollbar">
                {ITEM_TYPES.map((type) => {
                    const Icon = type.icon;
                    return (
                        <button
                            key={type.key}
                            onClick={() => handleTypeChange(type.key)}
                            className={`btn btn-sm whitespace-nowrap flex items-center gap-2 ${activeType === type.key ? "btn-info shadow-none text-white" : "btn-ghost"}`}
                        >
                            <Icon className="size-4" />
                            {type.label}
                        </button>
                    );
                })}
            </div>

            {/* Search and View Toggles */}
            <div className="flex flex-col md:flex-row gap-3 items-center">
                <div className="flex items-center gap-2 border border-gray-300 rounded-lg px-3 py-2 w-full bg-white">
                    <Search className="size-4 text-gray-400 shrink-0" />
                    <input
                        placeholder={t("searchPlaceholder")}
                        className="outline-none w-full text-sm"
                        value={searchQuery}
                        onChange={handleSearchChange}
                    />
                </div>
           
                    <div className="join border border-gray-300 rounded-lg overflow-hidden shrink-0">
                        <button
                            className={`join-item btn btn-sm px-4 ${viewMode === "grid" ? "btn-info text-white" : "btn-ghost"}`}
                            onClick={() => setViewMode("grid")}
                        >
                            <LayoutGrid className="size-4" />
                        </button>
                        <button
                            className={`join-item btn btn-sm px-4 ${viewMode === "list" ? "btn-info text-white" : "btn-ghost"}`}
                            onClick={() => setViewMode("list")}
                        >
                            <List className="size-4" />
                        </button>
                    </div>
                    <button
                        onClick={handleAddToLesson}
                        disabled={selectedItems.length === 0}
                        className="btn btn-info btn-sm shadow-none text-white md:min-w-[140px]"
                    >
                        {t("addSelectedButton")} ({selectedItems.length})
                    </button>
               
            </div>

            {/* Layout Body */}
            <div className="flex flex-col md:flex-row gap-6">
                {/* Sidebar - Stacks on top in Mobile */}
                <div className="w-full md:w-64 shrink-0 space-y-2 bg-slate-50/50 p-2 rounded-xl border border-slate-100 md:border-none md:bg-transparent">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider px-3 mb-2 md:hidden">{t("filtersHeading")}</h3>
                    {sidebarGroupedLoading ? (
                        <div className="text-center text-gray-500 py-5 text-sm">{t("loadingItems")}</div>
                    ) : (
                        <>
                            <button
                                onClick={() => {
                                    setSelectedGrade(null);
                                    setSelectedTag(null);
                                    doFetch({ grade: "", page: 1 });
                                    setCurrentPage(1);
                                }}
                                className={`w-full text-left text-sm font-medium px-3 py-2.5  flex justify-between items-center transition-all ${!selectedGrade ? " border-b  border-gray-300  text-blue-600" : "text-gray-600 hover:bg-white"}`}
                            >
                                <span className="flex items-center gap-2">
                                    <Folder size={16} />
                                    All {ITEM_TYPES.find(t => t.key === activeType)?.label}s
                                </span>
                                <span className={`text-xs px-2 rounded-full ${!selectedGrade ? "bg-blue-100" : "bg-gray-100 text-gray-400"}`}>{sidebarTotal}</span>
                            </button>
                            
                            <div className="space-y-1">
                                {grades.map((gradeKey) => {
                                    const grade = sidebarGrouped[gradeKey];
                                    const gradeNumber = gradeKey.replace("Grade-", "");
                                    const tags = Object.keys(grade.tags);
                                    const isSelected = selectedGrade === gradeNumber;

                                    return (
                                        <div key={gradeKey} className="collapse collapse-arrow bg-white/50 border border-gray-100/50 rounded-lg ">
                                            <input type="checkbox" className="min-h-0" />
                                            <div className={`collapse-title min-h-0 py-2.5 px-3 text-sm font-medium flex items-center gap-2 ${isSelected ? "text-blue-600" : "text-slate-700"}`}>
                                                <Folder size={14} />
                                                {gradeKey}
                                                <span className="ml-auto mr-6 text-xs bg-slate-100 px-1.5 py-0.5 rounded-md">{grade.total}</span>
                                            </div>
                                            <div className="collapse-content px-2">
                                                <div className="pt-1 space-y-1">
                                                    {tags.map((tag) => (
                                                        <div
                                                            key={tag}
                                                            onClick={() => {
                                                                setSelectedGrade(gradeNumber);
                                                                setSelectedTag(tag);
                                                            }}
                                                            className={`cursor-pointer text-xs flex justify-between px-3 py-2 rounded-md transition-colors ${selectedTag === tag ? "bg-blue-50 text-blue-600 font-semibold" : "text-gray-500 hover:bg-gray-100"}`}
                                                        >
                                                            <span className="flex gap-2 items-center">
                                                                <Tag size={12} className={selectedTag === tag ? "text-blue-500" : "text-gray-400"} /> {tag}
                                                            </span>
                                                            <span className="text-[10px] opacity-60 border rounded-full px-1 bg-gray-100">
                                                                {grade.tags[tag]}
                                                            </span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </>
                    )}
                </div>

                {/* Main Content Area */}
                <div className="flex-1 min-w-0">
                    {itemsLoading ? (
                        <div className="flex flex-col items-center justify-center py-20 gap-3">
                             <span className="loading loading-spinner text-info"></span>
                             <span className="text-sm text-slate-400">{t("loadingItems")}</span>
                        </div>
                    ) : filteredItems.length === 0 ? (
                        <div className="text-center text-gray-400 py-20 border-2 border-dashed rounded-2xl">
                            {t("noItemsFound")}
                        </div>
                    ) : viewMode === "grid" ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {filteredItems.map((item, index) => {
                                const isSelected = selectedItems.some((i) => i.id === item.id);
                                const config = getTypeConfig(item.type);
                                return (
                                    <div
                                        key={index}
                                        onClick={() => toggleSelect(item)}
                                        className={`group relative card bg-white border transition-all duration-200 cursor-pointer ${isSelected ? "border-blue-500 ring-2 ring-blue-50" : "border-slate-200 hover:border-blue-300 shadow-sm"}`}
                                    >
                                        <div className="card-body p-4">
                                            <div className="flex justify-between items-start mb-3">
                                                <div className={`p-2 rounded-lg ${config.itembg} ${config.itemText}`}>
                                                    {config.itemicon}
                                                </div>
                                                <input
                                                    className="checkbox checkbox-info checkbox-sm pointer-events-none"
                                                    type="checkbox"
                                                    checked={isSelected}
                                                    readOnly
                                                />
                                            </div>
                                            <p className="font-semibold text-sm line-clamp-2 min-h-[40px] text-slate-800">{item.title}</p>
                                            <div className="flex items-center gap-2 mt-2">
                                                <span className="text-[10px] font-bold uppercase text-slate-400">{t("gradeLabel")} {item.grade_level}</span>
                                                <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                                                <span className="text-[10px] font-bold uppercase text-info">{item.type}</span>
                                            </div>
                                            <div className="flex flex-wrap gap-1 mt-3">
                                                {item.tags?.slice(0, 2).map((tag, tagIdx) => (
                                                    <span key={tagIdx} className="px-2 py-0.5 rounded text-[10px] bg-slate-100 text-slate-500 border border-slate-200">{tag}</span>
                                                ))}
                                                {item.tags?.length > 2 && (
                                                    <span className="text-[10px] text-slate-400 ml-1">+{item.tags.length - 2} more</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {filteredItems.map((item, index) => {
                                const isSelected = selectedItems.some((i) => i.id === item.id);
                                const config = getTypeConfig(item.type);
                                return (
                                    <div
                                        key={index}
                                        onClick={() => toggleSelect(item)}
                                        className={`flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 bg-white border rounded-xl transition-all cursor-pointer ${isSelected ? "border-blue-500 ring-2 ring-blue-50" : "border-slate-200 hover:border-blue-300 shadow-sm"}`}
                                    >
                                        <div className={`p-3 rounded-lg shrink-0 ${config.itembg} ${config.itemText}`}>
                                            {config.itemicon}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-semibold text-slate-800 ">{item.title}</p>
                                            <div className="flex items-center gap-3 mt-1">
                                                <span className="text-[11px] font-medium text-slate-400">{t("gradeLabel")} {item.grade_level}</span>
                                                <div className="flex flex-wrap gap-1">
                                                    {item.tags?.map((tag, tagIdx) => (
                                                        <span key={tagIdx} className="px-2 py-0.5 rounded text-[10px] bg-slate-50 text-slate-500 border border-slate-100">{tag}</span>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="w-full sm:w-auto flex justify-end border-t sm:border-none pt-2 sm:pt-0">
                                            <input
                                                className="checkbox checkbox-info"
                                                type="checkbox"
                                                checked={isSelected}
                                                readOnly
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    <div className="mt-8 pb-10">
                        <Pagination
                            currentPage={currentPage}
                            totalPages={itemsTotalPages}
                            onPageChange={handlePageChange}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}