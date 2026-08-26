"use client";
import React, {useRef, useState} from "react";
import {ArrowLeft} from "lucide-react";
import {useRouter} from "next/navigation";
import Content from "./content";
import {CONTENT_TYPES} from "../../../../../../data/contentData";
import {useCourseStore} from "@/store/useCourseStore";
import {useTranslations} from "next-intl";

const UploadDashboard = ({initialData, forcedType}) => {
    const isEditMode = Boolean(initialData);
    const [activeTab, setActiveTab] = useState(forcedType || "video");
    const contentRef = useRef(null);
    const createItem = useCourseStore((state) => state.createItem);
    const updateItem = useCourseStore((state) => state.updateItem);
    const loading = useCourseStore((state) => state.loading);

    const activeItem = CONTENT_TYPES.find((item) => item.id === activeTab);

    const handleSelection = (e, item) => {
        if (isEditMode) return;
        if (item.type === "tab") {
            e.preventDefault();
            setActiveTab(item.id);
        }
        if (window.innerWidth < 1024) {
            contentRef.current?.scrollIntoView({
                behavior: "smooth",
                block: "start",
            });
        }
    };
    const router = useRouter();
    const t = useTranslations("UploadContentPage");


    return (
        <div className="p-4">
            <div className="mb-8">
                <button className="btn btn-ghost" onClick={() => router.push("/dashboard/content")}>
                    <ArrowLeft size={16}/>
                    {t("backToLibraryButton")}
                </button>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mt-4">
                    <div>
                        <h1 className="text-3xl font-bold mb-2">
                            {isEditMode ? t("headingEdit") : t("headingUpload")}
                        </h1>
                        <p className="text-muted-foreground">
                            {isEditMode
                                ? t("subtitleEdit")
                                : t("subtitleUpload")}
                        </p>
                    </div>
                </div>
            </div>
            <div className=" mx-auto grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-10">
                {/* --- LEFT SIDEBAR --- */}
                <aside className="space-y-8 border border-gray-200 bg-base-200 rounded-2xl p-5">
                    <div>
                        <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                            {t("sidebarContentTypeHeading")}
                        </h2>
                        <p className="text-sm text-gray-500 mt-1">
                            {isEditMode
                                ? t("sidebarContentTypeSubtitleEdit")
                                : t("sidebarContentTypeSubtitleUpload")}
                        </p>
                    </div>

                    <div className="space-y-3 grid grid-cols-2 gap-3 md:gap-0 md:grid-cols-1">
                        {CONTENT_TYPES.map((item) => {
                            const isDisabled = isEditMode && item.id !== forcedType;
                            let isImplemented = item.implemented === true; // Will remove this later as not all the items are implemented.
                            return (
                                isImplemented &&
                                <a
                                    href={!isDisabled && item.type === "page" ? item.href : undefined}
                                    target={item.type === "page" ? "_blank" : "_self"}
                                    rel="noopener noreferrer"
                                    key={item.id}
                                    onClick={(e) => {
                                        if (isDisabled) {
                                            e.preventDefault();
                                            return;
                                        }
                                        handleSelection(e, item);
                                    }}
                                    className={`w-full md:w-full md:flex items-center gap-4 p-4 rounded-2xl border-2 transition-all text-left ${
                                        isDisabled
                                            ? "bg-gray-100 border-transparent opacity-40 cursor-not-allowed"
                                            : activeTab === item.id
                                                ? `${item.bg} ${item.border} shadow-md ring-1 ring-blue-500/20`
                                                : "bg-white border-transparent hover:shadow shadow-sm"
                                    }`}
                                >
                                    <div
                                        className={`hidden md:block p-3 rounded-xl ${item.bg} ${item.color} ${activeTab === item.id ? `${item.bg2} text-white` : ""}`}
                                    >
                                        {item.icon}
                                    </div>
                                    <div className="">
                                        <h3 className="font-bold text-gray-800 text-sm">
                                            {item.title}
                                        </h3>
                                        <p className="text-xs text-gray-400 font-medium">
                                            {item.subtitle}
                                        </p>
                                    </div>
                                </a>

                            );
                        })}
                    </div>

                    <div className="pt-6 border-t border-gray-200">
                        <h4 className="text-xs font-bold text-gray-700 mb-3">
                            {t("fileSizeLimitsHeading")}
                        </h4>
                        <ul className="text-xs text-gray-400 space-y-2 list-disc pl-4">
                            <li>{t("fileSizeVideos")}</li>
                            <li>{t("fileSizeDocuments")}</li>
                            {/*<li>{t("fileSizeScorm")}</li>*/}
                        </ul>
                    </div>
                </aside>

                <div ref={contentRef}>
                    <Content
                        key={activeTab}
                        activeItem={activeItem}
                        createItem={createItem}
                        updateItem={updateItem}
                        loading={loading}
                        initialData={initialData}
                    />
                </div>
            </div>
        </div>
    );
};

export default UploadDashboard;
