"use client";

import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

export default function Pagination({ currentPage, totalPages, onPageChange }) {
  // Prevent rendering if there is only one page
  if (totalPages <= 1) return null;

  const getPages = () => {
    const pages = [];
    const showMax = 2;
    let prevWasEllipsis = false;

    for (let i = 1; i <= totalPages; i++) {
      if (
        i === 1 ||
        i === totalPages ||
        (i >= currentPage - showMax && i <= currentPage + showMax)
      ) {
        pages.push({ type: "page", value: i, key: `page-${i}` });
        prevWasEllipsis = false;
      } else if (!prevWasEllipsis) {
        pages.push({ type: "ellipsis", value: "...", key: `ellipsis-${i}` });
        prevWasEllipsis = true;
      }
    }
    return pages;
  };

  return (
    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-8 px-4">
      <div className="flex items-center gap-1">
        {/* Previous Button */}
        <button
          className="btn btn-sm btn-ghost hover:bg-base-200 disabled:opacity-30"
          disabled={currentPage === 1}
          onClick={() => onPageChange(currentPage - 1)}
        >
          <ChevronLeft size={18} />
        </button>

        {/* Page Group */}
        <div className="join border border-base-200 bg-base-100 shadow-sm rounded-lg">
          {getPages().map(({ type, value, key }) => (
            <button
              key={key}
              disabled={type === "ellipsis"}
              className={`join-item btn btn-sm min-w-10 border-none transition-all ${
                currentPage === value
                  ? "btn-info shadow-none text-white hover:btn-info"
                  : "btn-ghost hover:bg-base-200 text-slate-600"
              } ${type === "ellipsis" ? "btn-disabled bg-transparent" : ""}`}
              onClick={() => type === "page" && onPageChange(value)}
            >
              {value}
            </button>
          ))}
        </div>

        {/* Next Button */}
        <button
          className="btn btn-sm btn-ghost hover:bg-base-200 disabled:opacity-30"
          disabled={currentPage === totalPages}
          onClick={() => onPageChange(currentPage + 1)}
        >
          <ChevronRight size={18} />
        </button>
      </div>

      {/* Quick Jump (Optional but great for Admin UIs) */}
      <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
        <span>Go to page</span>
        <input
          type="number"
          min="1"
          max={totalPages}
          // Set the value to the current page prop
          value={currentPage}
          // Handle changes if the user types manually
          onChange={(e) => {
            const val = parseInt(e.target.value);
            if (val >= 1 && val <= totalPages) {
              onPageChange(val);
            } else if (e.target.value === "") {
              // Allow clearing the input temporarily while typing
              onPageChange("");
            }
          }}
          className="input input-bordered input-xs w-12 text-center focus:input-info "
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              const val = parseInt(e.target.value);
              if (val >= 1 && val <= totalPages) onPageChange(val);
            }
          }}
        />
        <span className="opacity-50">of {totalPages}</span>
      </div>
    </div>
  );
}
