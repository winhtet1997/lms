"use client";
import { LayoutGrid, List, Search } from "lucide-react";

const CourseFilterBar = ({
    searchTerm,
    selectedGrade,
    sortBy,
    viewMode,
    setViewMode,
    handleSearchChange,
    handleGradeChange,
    handleSortChange,
    t,
}) => {
    return (
        <div className="bg-base-100 p-4 rounded-xl shadow border border-base-200 flex flex-col xl:flex-row gap-4 items-center">
            <div className="relative w-full xl:max-w-lg">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 z-20">
                    <Search size={16} />
                </span>
                <input
                    type="text"
                    placeholder={t("searchPlaceholder")}
                    className="input input-bordered w-full pl-10 focus:outline-none"
                    value={searchTerm}
                    onChange={handleSearchChange}
                />
            </div>

            {/* Filter Section */}
            <div className="flex flex-wrap items-center justify-center xl:justify-start gap-2 w-full shadow-none">
                <select
                    className="select select-bordered select-sm sm:select-md flex-1 min-w-30 max-w-full"
                    value={selectedGrade}
                    onChange={handleGradeChange}
                >
                    <option value="">{t("filterAllGrades")}</option>
                    {[6, 7, 8, 9, 10, 11, 12].map((g) => (
                        <option key={g} value={String(g)}>{t("gradeLabel")} {g}</option>
                    ))}
                </select>
                <select
                    className="select select-bordered select-sm sm:select-md flex-1 min-w-30 max-w-full"
                    value={sortBy}
                    onChange={handleSortChange}
                >
                    <option value="newest">{t("sortNewestFirst")}</option>
                    <option value="oldest">{t("sortOldestFirst")}</option>
                </select>

                {/* Grid/List Toggle */}
                <div className="join ml-auto xl:ml-0">
                    <button
                        onClick={() => setViewMode("grid")}
                        className={`btn btn-sm sm:btn-md shadow-none join-item px-4 ${viewMode === "grid" ? "btn-info" : "bg-base-100 text-gray-600"}`}
                    >
                        <LayoutGrid size={18} />
                        <span className="hidden sm:inline">{t("viewGridButton")}</span>
                    </button>
                    <button
                        onClick={() => setViewMode("list")}
                        className={`btn btn-sm sm:btn-md shadow-none join-item px-4 border-l-0 ${viewMode === "list" ? "btn-info" : "bg-base-100 text-gray-600"}`}
                    >
                        <List size={18} />
                        <span className="hidden sm:inline">{t("viewListButton")}</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CourseFilterBar;
