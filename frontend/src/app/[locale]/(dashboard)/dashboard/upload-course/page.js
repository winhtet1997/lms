"use client";
import React, { useEffect, useState } from "react";
import { Save, ArrowLeft, Layers } from "lucide-react";
import Link from "next/link";
import Chapter from "./chapter";
import { useCourseStore } from "@/store/useCourseStore";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import toast from "react-hot-toast";
import handleError from "@/lib/handleError";

const ChaptersSkeleton = () => (
    <div className="space-y-4 animate-pulse">
        {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="card bg-gray-100/30 border-2 border-blue-800/20 shadow">
                <div className="card-body space-y-4">
                    <div className="flex items-center gap-3">
                        <div className="h-6 w-28 bg-blue-200 rounded-full" />
                        <div className="h-10 flex-1 bg-white/70 rounded-lg" />
                    </div>
                    <div className="h-16 w-full bg-white/70 rounded-lg" />
                    <div className="space-y-2 pl-4">
                        <div className="h-10 w-full bg-white/60 rounded-lg" />
                        <div className="h-10 w-full bg-white/60 rounded-lg" />
                    </div>
                </div>
            </div>
        ))}
    </div>
);

const UploadCourse = () => {
    const t = useTranslations("UploadCourse");
    const searchParams = useSearchParams();
    const {
        courseDraft,
        setCourseField,
        addChapterDraft,
        initCourse,
        saveCourse,
        resetCourseDraft,
        fetchCourseById,
        loadCourseIntoDraft,
        togglePublishStatus,
        loading, 
        subjects,
        fetchSubjects,
    } = useCourseStore();

    const [pendingPublish, setPendingPublish] = useState(null);

    const courseId = searchParams.get("courseId");
    const isEditMode = !!courseId;
    const [initialLoading, setInitialLoading] = useState(isEditMode);

    useEffect(() => {
        fetchSubjects();
        if (courseId) {
            setInitialLoading(true);
            fetchCourseById(courseId).then((course) => {
                if (course) loadCourseIntoDraft(course);
                setInitialLoading(false);
            });
        } else if (searchParams.get("new") === "true") {
            resetCourseDraft();
        }
    }, []);

    const handleAddChapter = async () => {
        await initCourse();
        addChapterDraft();
    };

    const handleSave = async () => {
        try {
            if (!courseDraft.id) {
                await initCourse();
            }
            await saveCourse();
            toast.success(t("alertSaveSuccess"));
        } catch (error) {
            const { message } = handleError(error);
            toast.error(message || t("alertSaveError"));
        }
    };

    const handlePublishToggle = () => {
        if (!courseDraft.id) {
            toast.error(t("publishToggleSaveFirst"));
            return;
        }
        setPendingPublish(!courseDraft.publication_status);
    };

    const confirmPublishToggle = async () => {
        try {
            await togglePublishStatus(pendingPublish);
            toast.success(pendingPublish ? t("alertPublishSuccess") : t("alertUnpublishSuccess"));
        } catch (error) {
            const { message } = handleError(error);
            toast.error(message || t("alertPublishError"));
        } finally {
            setPendingPublish(null);
        }
    };

    return (
        <>
        <div className="pt-8 pb-8 px-4 md:px-6 lg:px-8 lg:h-screen lg:flex lg:flex-col lg:overflow-hidden">
            <div className="mx-auto max-w-7xl lg:h-full lg:flex lg:flex-col lg:min-h-0 w-full">
                <div className="md:flex items-center justify-between mb-6 lg:shrink-0">
                    <div className="inline-flex items-center gap-4 mb-4">
                        <Link href="/dashboard/course-management" className="btn btn-sm btn-ghost">
                            <ArrowLeft className="size-4" />
                        </Link>
                        <div>
                            <h1 className="text-2xl font-bold">{isEditMode ? t("headingEdit") : t("headingCreate")}</h1>
                            <p className="text-sm text-gray-500">
                                {t("subtitle")}
                            </p>
                        </div>
                    </div>

                    <div className="flex gap-4">
                        <button
                            onClick={handleSave}
                            disabled={loading || !courseDraft.title || !courseDraft.description}
                            className="btn btn-sm btn-info shadow-none"
                        >
                            <Save size={16}/> {loading ? t("savingButton") : t("saveButton")}
                        </button>
                    </div>
                </div>

                <div className="flex flex-col lg:flex-row gap-8 lg:flex-1 lg:min-h-0">
                    {/* LEFT PANEL */}
                    <div className="card shadow flex-1/3 lg:h-full lg:overflow-y-auto">
                        <div className="card-body">
                            <h5>{t("sectionCourseInfo")}</h5>

                            <input
                                className="input input-bordered w-full"
                                placeholder={t("courseNamePlaceholder")}
                                maxLength={255}
                                value={courseDraft.title}
                                onChange={(e) =>
                                    setCourseField("title", e.target.value)
                                }
                            />
                            {courseDraft.title?.length >= 255 && (
                                <span className="block text-xs text-error mt-1">
                                    {t("courseNameMaxLengthError")}
                                </span>
                            )}

                            <textarea
                                maxLength={255}
                                className="textarea textarea-bordered w-full"
                                placeholder={t("descriptionPlaceholder")}
                                value={courseDraft.description}
                                onChange={(e) =>
                                    setCourseField("description", e.target.value)
                                }
                            />
                            {courseDraft.description?.length >= 255 && (
                                <span className="block text-xs text-error mt-1">
                                    {t("courseDescriptionMaxLengthError")}
                                </span>
                            )}

                            <select
                                className="select w-full"
                                value={courseDraft.grade}
                                onChange={(e) =>
                                    setCourseField("grade", e.target.value)
                                }
                            >
                                <option value="">{t("gradeSelectDefault")}</option>
                                <option value="6">{t("grade6")}</option>
                                <option value="7">{t("grade7")}</option>
                                <option value="8">{t("grade8")}</option>
                                <option value="9">{t("grade9")}</option>
                                <option value="10">{t("grade10")}</option>
                                <option value="11">{t("grade11")}</option>
                                <option value="12">{t("grade12")}</option>
                            </select>

                            <select
                                className="select w-full"
                                value={courseDraft.subject}
                                onChange={(e) =>
                                    setCourseField("subject", e.target.value)
                                }
                            >
                                <option value="">{t("subjectSelectDefault")}</option>
                                {subjects.map((s) => (
                                    <option key={s.id} value={s.id}>
                                        {s.name}
                                    </option>
                                ))}
                            </select>

                            <div className="mt-2">
                                <h6 className="font-semibold text-sm mb-2">{t("visibilityHeading")}</h6>
                                <div className="border border-gray-300 rounded-lg px-4 py-3 flex items-center justify-between">
                                    <div>
                                        <p className="font-semibold text-sm">{t("visibilityToggleLabel")}</p>
                                        <p className="text-xs text-gray-500">{t("visibilityToggleSubtitle")}</p>
                                    </div>
                                    <input
                                        type="checkbox"
                                        className="toggle toggle-info"
                                        checked={courseDraft.publication_status}
                                        onChange={handlePublishToggle}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* RIGHT PANEL */}
                    <div className="flex-2/3 lg:h-full lg:overflow-y-auto lg:pr-1 lg:pb-8">
                        {initialLoading ? (
                            <ChaptersSkeleton />
                        ) : courseDraft.chapters.length === 0 ? (
                            <div className="card shadow">
                                <div className="card-body mx-auto text-center">
                                    <Layers className="mx-auto size-12" />
                                    <h5>{t("noChaptersTitle")}</h5>
                                    <p className="text-muted-foreground max-w-md">
                                        {t("noChaptersSubtitle")}
                                    </p>
                                    <button
                                        onClick={handleAddChapter}
                                        disabled={
                                            !courseDraft.title ||
                                            !courseDraft.description
                                        }
                                        className="btn btn-info"
                                    >
                                        {t("addFirstChapterButton")}
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {courseDraft.chapters.map((chapter, index) => (
                                    <Chapter
                                        key={index}
                                        chapter={chapter}
                                        index={index}
                                    />
                                ))}

                                <button
                                    onClick={handleAddChapter}
                                    className="btn w-full border border-dotted"
                                >
                                    {t("addAnotherChapterButton")}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>

        {pendingPublish !== null && (
            <div className="modal modal-open">
                <div className="modal-box">
                    <h3 className="font-bold text-lg">
                        {pendingPublish ? t("publishModalTitle") : t("unpublishModalTitle")}
                    </h3>
                    <p className="py-4 text-sm text-gray-600">
                        {pendingPublish
                            ? t("publishModalMessage")
                            : t("unpublishModalMessage")}
                    </p>
                    <div className="modal-action">
                        <button
                            className="btn btn-ghost btn-sm"
                            onClick={() => setPendingPublish(null)}
                        >
                            {t("cancelButton")}
                        </button>
                        <button
                            className={`btn btn-sm ${pendingPublish ? "btn-info" : "btn-warning"}`}
                            onClick={confirmPublishToggle}
                            disabled={loading}
                        >
                            {loading ? t("updatingButton") : pendingPublish ? t("publishButton") : t("unpublishButton")}
                        </button>
                    </div>
                </div>
                <div className="modal-backdrop" onClick={() => setPendingPublish(null)} />
            </div>
        )}
    </>
    );
};

export default UploadCourse;