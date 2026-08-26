"use client";

import { useState } from "react";
import CourseMappingTable from "./CourseMappingTable";
import ChapterMappingTable from "./ChapterMappingTable";

export default function ManageMathAiMappingPage() {
  const [tab, setTab] = useState("courses");

  return (
    <div className="p-6">
      <h2 className="text-xl font-bold mb-1">Math AI Mapping</h2>
      <p className="text-sm text-base-content/60 mb-4">
        Map courses and chapters to Math AI&apos;s subjects and lessons so
        Ask AI knows what curriculum to scope a chat to.
      </p>

      <div className="w-full bg-base-100 rounded-xl shadow-sm border border-base-200">
        <div className="p-4 border-b border-base-200">
          <div className="tabs tabs-boxed w-fit">
            <button
              type="button"
              className={`tab ${tab === "courses" ? "tab-active" : ""}`}
              onClick={() => setTab("courses")}
            >
              Courses
            </button>
            <button
              type="button"
              className={`tab ${tab === "chapters" ? "tab-active" : ""}`}
              onClick={() => setTab("chapters")}
            >
              Chapters
            </button>
          </div>
        </div>

        {tab === "courses" ? <CourseMappingTable /> : <ChapterMappingTable />}
      </div>
    </div>
  );
}
