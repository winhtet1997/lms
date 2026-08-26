"use client";
import { AlertCircle, Code2, Info, Sparkles } from "lucide-react";
import { useTranslations } from "next-intl";
import React, { useState } from "react";

const CodeSnipet = ({ value, onChange }) => {
  const [activeTab, setActiveTab] = useState("code");
  const t = useTranslations("CodeSnipet");

  return (
    <div className="card bg-white border border-gray-200 shadow-sm">
      <div className="card-body p-6">
        <div className="flex justify-between items-center mb-1">
          <h5 className="text-md font-bold">{t("sectionTitle")}</h5>
          <span className="badge badge-outline rounded-2xl text-[10px] font-mono px-2">
            {"</>"} HTML
          </span>
        </div>
        <p className="text-xs text-gray-400 mb-4">
          {t("sectionSubtitle")}
        </p>

        <div className="flex flex-col border border-gray-200 rounded-lg overflow-hidden bg-white h-[600px]">
          {/* Tab Bar */}
          <div className="flex bg-gray-50 border-b border-gray-200 shrink-0">
            <button
              onClick={() => setActiveTab("code")}
              className={`flex items-center gap-2 px-6 py-2.5 text-xs font-semibold border-r border-gray-200 transition-colors ${
                activeTab === "code"
                  ? "bg-white text-slate-700"
                  : "text-gray-400 hover:text-gray-600"
              }`}
            >
              <Code2 size={14} /> {t("tabCodeEditor")}
            </button>
            <button
              onClick={() => setActiveTab("instructions")}
              className={`flex items-center gap-2 px-6 py-2.5 text-xs font-semibold transition-colors ${
                activeTab === "instructions"
                  ? "bg-white text-slate-700"
                  : "text-gray-400 hover:text-gray-600"
              }`}
            >
              <Info size={14} /> {t("tabInstructions")}
            </button>
          </div>

          {/* Code Editor Tab */}
          {activeTab === "code" && (
            <div className="p-4 flex-1 overflow-hidden">
              <textarea
                className="w-full h-full resize-none focus:outline-none text-sm font-mono placeholder:text-gray-300"
                placeholder={t("codeEditorPlaceholder")}
                value={value}
                onChange={(e) => onChange(e.target.value)}
              />
            </div>
          )}

          {/* Instructions Tab */}
          {activeTab === "instructions" && (
            <div className="flex-1 overflow-y-auto p-6 space-y-6 text-sm text-slate-600">
              {/* How to Use Section */}
              <div className="flex items-start gap-4">
                <Sparkles size={18} className="text-info shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="font-bold mb-2 text-slate-800">
                    {t("instructionsHowToUseTitle")}
                  </p>
                  <ol className="space-y-2 text-xs text-gray-500 list-decimal pl-4">
                    <li>{t("instructionsStep1")}</li>
                    <li>{t("instructionsStep2")}</li>
                    <li>{t("instructionsStep3")}</li>
                    <li>{t("instructionsStep4")}</li>
                  </ol>
                </div>
              </div>

              <div className="divider opacity-50 my-0" />

              {/* Code Requirements Section */}
              <div className="flex items-start gap-4">
                <Code2 size={18} className="text-green-500 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="font-bold mb-2 text-slate-800">
                    {t("codeRequirementsTitle")}
                  </p>
                  <ul className="space-y-1.5 text-xs text-gray-500">
                    <li className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-300 shrink-0 mt-1.5" />
                      {t("codeReq1")}
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-300 shrink-0 mt-1.5" />
                      {t("codeReq2")}
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-300 shrink-0 mt-1.5" />
                      {t("codeReq3")}
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-300 shrink-0 mt-1.5" />
                      {t("codeReq4")}
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-300 shrink-0 mt-1.5" />
                      {t("codeReq5")}
                    </li>
                  </ul>
                </div>
              </div>

              <div className="divider opacity-50 my-0" />

              {/* Example AI Prompt Section */}
              <div className="flex items-start gap-4">
                <Info size={18} className="text-info shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="font-bold mb-2 text-slate-800">
                    {t("examplePromptTitle")}
                  </p>
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs text-slate-500 italic leading-relaxed">
                    {t("examplePromptText")}
                  </div>
                </div>
              </div>

              {/* Important Notes Section - Fixed Alignment */}
              <div className="flex items-start gap-4 pt-2">
                <AlertCircle
                  size={18}
                  className="text-amber-500 shrink-0 mt-0.5"
                />
                <div className="flex-1">
                  <p className="font-bold mb-2 text-slate-800">
                    {t("importantNotesTitle")}
                  </p>
                  <ul className="space-y-2 text-xs text-amber-800 bg-amber-50 border border-amber-100 rounded-xl p-4 shadow-sm">
                    <li className="flex items-start gap-2">
                      <span className="shrink-0">•</span> {t("importantNote1")}
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="shrink-0">•</span> {t("importantNote2")}
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="shrink-0">•</span> {t("importantNote3")}
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="shrink-0">•</span> {t("importantNote4")}
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CodeSnipet;
