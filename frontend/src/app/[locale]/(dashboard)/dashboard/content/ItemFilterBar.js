"use client";
import { LayoutGrid, List, Search } from "lucide-react";
import { CONTENT_TYPES } from "../../../../../../data/contentData";

const ItemFilterBar = ({
  searchTerm,
  selectedType,
  selectedGrade,
  sortBy,
  selectedStatus,
  viewMode,
  setViewMode,
  handleSearchChange,
  handleTypeChange,
  handleGradeChange,
  handleSortChange,
  handleStatusChange,
  t,
}) => {
  return (
    <div className="bg-base-100 p-4 rounded-xl shadow border border-base-200 flex flex-col xl:flex-row gap-4 items-center">
      {/* Search Input */}
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
          className="select select-bordered  select-sm sm:select-md flex-1 min-w-30 max-w-full"
          value={selectedType}
          onChange={handleTypeChange}
        >
          <option value="">{t("filterAllTypes")}</option>
          {CONTENT_TYPES.map((type) => (
            <option key={type.id} value={type.id}>
              {type.id}
            </option>
          ))}
        </select>
        <select
          className="select select-bordered select-sm sm:select-md flex-1 min-w-30 max-w-full"
          value={selectedGrade}
          onChange={handleGradeChange}
        >
          <option value="">{t("filterAllGrades")}</option>
          {[6, 7, 8, 9, 10, 11, 12].map((g) => (
            <option key={g} value={String(g)}>
              {t(`grade${g}`)}
            </option>
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
        <select
          className="select select-bordered select-sm sm:select-md flex-1 min-w-30 max-w-full"
          value={selectedStatus}
          onChange={handleStatusChange}
        >
          <option value="">{t("filterAllStatuses")}</option>
          <option value="true">{t("filterStatusActive")}</option>
          <option value="false">{t("filterStatusArchived")}</option>
        </select>

        {/* Grid/List Toggle */}
        <div className="join ml-auto xl:ml-0">
          <button
            onClick={() => setViewMode("grid")}
            className={`btn btn-sm sm:btn-md join-item px-4 shadow-none ${viewMode === "grid" ? "btn-info" : "bg-base-100 text-gray-600"}`}
          >
            <LayoutGrid size={18} />
            <span className="hidden sm:inline">{t("viewGridButton")}</span>
          </button>
          <button
            onClick={() => setViewMode("list")}
            className={`btn btn-sm sm:btn-md join-item px-4 border-l-0 shadow-none ${viewMode === "list" ? "btn-info" : "bg-base-100 text-gray-600"}`}
          >
            <List size={18} />
            <span className="hidden sm:inline">{t("viewListButton")}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ItemFilterBar;
