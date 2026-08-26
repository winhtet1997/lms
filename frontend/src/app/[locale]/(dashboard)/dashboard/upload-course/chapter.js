"use client";
import React, { useRef, useState } from "react";
import { Layers, BookOpen, Plus, Trash2, ChevronUp, ChevronDown, Upload, Lock, Unlock } from "lucide-react";
import Lesson from "./lesson";
import { useCourseStore } from "@/store/useCourseStore";
import { useTranslations } from "next-intl";
import Image from "next/image";

function Chapter({ chapter, index }) {
    const t = useTranslations("Chapter");
    const {
        updateChapterDraft,
        addLessonDraft,
        saveChapter,
        deleteChapter,
        reorderChapter,
        uploadChapterIcon,
        removeChapterIcon,
        toggleChapterFreePreview,
        courseDraft,
    } = useCourseStore();

    const totalChapters = courseDraft.chapters.length;
    const iconInputRef = useRef(null);
    const [isOpen, setIsOpen] = useState(true);

    const handleTitleChange = (e) => {
        updateChapterDraft(index, "title", e.target.value);
    };

    const handleDescriptionChange = (e) => {
        updateChapterDraft(index, "description", e.target.value);
    };

    const handleAddLesson = async () => {
        await saveChapter(index);
        addLessonDraft(index);
    };

    const isChapterValid =
        chapter.title?.trim() && chapter.description?.trim();

    return (
        <div className="card bg-blue-100/30 border-2 border-blue-800/30 shadow">
            <div className="card-body">
                <div className="flex flex-wrap md:flex-nowrap items-center gap-2">
                    <div className="flex flex-col gap-2">
                        <button
                            className="btn btn-xs btn-ghost"
                            disabled={index === 0}
                            onClick={() => reorderChapter(index, "up")}
                        >
                            <ChevronUp className="size-4" />
                        </button>
                        <button
                            className="btn btn-xs btn-ghost"
                            disabled={index === totalChapters - 1}
                            onClick={() => reorderChapter(index, "down")}
                        >
                            <ChevronDown className="size-4" />
                        </button>
                    </div>
                    <span className="badge badge-info text-center text-nowrap rounded-full">
                        <Layers className="size-4" />
                        {t("chapterLabel")} {index + 1}
                    </span>

                    <div className="flex flex-col justify-center gap-1 flex-1 min-w-0">
                        <input
                            maxLength={255}
                            className="input w-full bg-transparent"
                            value={chapter.title}
                            onChange={handleTitleChange}
                            placeholder={`${t("chapterLabel")} ${index + 1}`}
                        />
                        {chapter.title?.length >= 255 && (
                            <span className="block text-xs text-error">
                                {t("chapterTitleMaxLengthError")}
                            </span>
                        )}
                    </div>

                    <button
                        onClick={() => setIsOpen((o) => !o)}
                        className="btn btn-xs btn-ghost"
                        title={isOpen ? t("collapseTitle") : t("expandTitle")}
                    >
                        {isOpen ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
                    </button>

                    <button
                        onClick={() => toggleChapterFreePreview(index)}
                        className={`btn btn-xs ${chapter.is_free_preview ? "badge border-blue-600 bg-blue-100 text-blue-700 rounded-full text-xs whitespace-nowrap shrink-0" : "badge border-amber-600 bg-amber-100 text-amber-700 rounded-full text-xs"}`}
                        title={t("freePreviewToggleTitle")}
                    >
                        {chapter.is_free_preview ? <Unlock className="size-4" /> : <Lock className="size-4" />}
                        {t(chapter.is_free_preview ? "freePreviewLabel" : "lockedLabel")}
                    </button>

                    <button
                        onClick={() => deleteChapter(index)}
                        className="btn btn-xs btn-ghost text-error"
                        title={t("deleteChapterTitle")}
                    >
                        <Trash2 className="size-4" />
                    </button>
                </div>

                {isOpen && (
                    <>
                        <textarea
                            maxLength={255}
                            className="textarea w-full mt-2 bg-transparent"
                            value={chapter.description}
                            onChange={handleDescriptionChange}
                            placeholder={t("descriptionPlaceholder")}
                        />

                        {
                            courseDraft.chapters[index]?.description?.length >= 255 && (
                                <span className="block text-xs text-error">
                                    {t("chapterDescriptionMaxLengthError")}
                                </span>
                            )
                        }

                        {/* Chapter icon */}
                        <div className="flex items-center gap-3 mt-1">
                            <span className="text-sm font-medium text-nowrap">{t("chapterIconLabel")}</span>
                            <input
                                ref={iconInputRef}
                                type="file"
                                accept="image/svg+xml,.svg"
                                className="hidden"
                                onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                        if (file.type !== "image/svg+xml" && !file.name.toLowerCase().endsWith(".svg")) {
                                            alert(t("svgOnlyError"));
                                            e.target.value = "";
                                            return;
                                        }
                                        uploadChapterIcon(index, file);
                                    }
                                    e.target.value = "";
                                }}
                            />
                            {/* Preview with delete badge */}
                            {courseDraft.chapters[index]?.icon && (
                                <div className="relative">
                                    <div className="size-10 rounded border border-base-300 overflow-hidden  flex items-center justify-center">
                                        <Image
                                            src={courseDraft.chapters[index].icon.startsWith("blob:") ? courseDraft.chapters[index].icon : `${courseDraft.chapters[index].icon}`}
                                            alt={t("chapterIconAlt")}
                                            className="size-full object-contain"
                                            width={40}
                                            height={40}
                                        />
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => removeChapterIcon(index)}
                                        className="absolute -top-1.5 -right-1.5 btn btn-xs btn-circle btn-error"
                                    >
                                        <Trash2 className="size-3" />
                                    </button>
                                </div>
                            )}
                            {/* Change / Upload button */}
                            <button
                                type="button"
                                onClick={() => iconInputRef.current?.click()}
                                className="btn btn-sm btn-ghost border border-base-300"
                            >
                                <Upload className="size-4" />
                                {courseDraft.chapters[index]?.icon ? t("changeIconButton") : t("uploadIconButton")}
                            </button>
                        </div>

                        {/* LESSONS */}
                        {chapter.lessons.length === 0 ? (
                            <div className="card border border-dotted mt-4 text-center">
                                <div className="card-body">
                                    <BookOpen className="mx-auto size-8" />
                                    <p>{t("noLessonsTitle")}</p>
                                    <button
                                        onClick={handleAddLesson}
                                        disabled={!isChapterValid}
                                        className="btn btn-sm btn-info"
                                    >
                                        <Plus className="size-4" />
                                        {t("addFirstLessonButton")}
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {chapter.lessons.map((lesson, lessonIndex) => (
                                    <Lesson
                                        key={lessonIndex}
                                        lesson={lesson}
                                        chapterIndex={index}
                                        lessonIndex={lessonIndex}
                                    />
                                ))}

                                <button onClick={handleAddLesson} className="btn w-full">
                                    {t("addAnotherLessonButton")}
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}

export default Chapter;