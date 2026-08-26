"use client";
import React from "react";
import { useTranslations } from "next-intl";

export default function StepIndicator({ step }) {
    const t = useTranslations("BookTutorPage");
    const steps = [t("stepChooseTutor"), t("stepSelectTime"), t("stepConfirm")];
    return (
        <div className="flex items-center justify-center gap-0 mb-8">
            {steps.map((label, i) => {
                const num = i + 1;
                const active = step === num;
                const done = step > num;
                return (
                    <React.Fragment key={num}>
                        <div className="flex flex-col items-center gap-1">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
                                done || active ? "bg-info text-white" : "bg-gray-200 text-gray-500"
                            }`}>
                                {done ? "✓" : num}
                            </div>
                            <span className={`text-xs font-medium ${active ? "text-info" : "text-gray-400"}`}>
                                {label}
                            </span>
                        </div>
                        {i < steps.length - 1 && (
                            <div className={`w-16 h-0.5 mb-5 mx-1 ${step > num ? "bg-info" : "bg-gray-200"}`} />
                        )}
                    </React.Fragment>
                );
            })}
        </div>
    );
}
