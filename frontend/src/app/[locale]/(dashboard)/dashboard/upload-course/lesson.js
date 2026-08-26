"use client";
import React, { useState } from "react";
import { useCourseStore } from "@/store/useCourseStore";
import { useRouter } from "next/navigation";
import { Trash2, ChevronDown, ChevronUp } from "lucide-react";
import { useTranslations } from "next-intl";
import { getContentTypeInfo } from "../../../../../../data/contentData";

function Lesson({ chapterIndex, lessonIndex, lesson }) {
  const t = useTranslations("Lesson");
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(true);
  const {
    updateLessonDraft,
    saveLesson,
    removeItemAndSave,
    deleteLesson,
    reorderLesson,
    reorderItem,
    courseDraft,
  } = useCourseStore();

  const totalLessons = courseDraft.chapters[chapterIndex]?.lessons.length ?? 0;

  const handleTitleChange = (e) => {
    updateLessonDraft(
      chapterIndex,
      lessonIndex,
      "title",
      e.target.value
    );
  };

  const handleDescriptionChange = (e) => {
    updateLessonDraft(
      chapterIndex,
      lessonIndex,
      "description",
      e.target.value
    );
  };

  // const handleSaveLesson = async () => {
  //   await saveLesson(chapterIndex, lessonIndex);
  // };

  const handleAddItem = async () => {
    // ensure lesson is saved first
    const lessonId = await saveLesson(chapterIndex, lessonIndex);

    if (!lessonId) return;

    router.push(
      `/dashboard/upload-course/add-item?chapter=${chapterIndex}&lesson=${lessonIndex}`
    );
  };

  const isLessonValid =
    lesson.title?.trim() && lesson.description?.trim();

  return (
    <div className="card bg-base-100 border-l-4 border-blue-500/85 shadow">
      <div className="card-body">
        <div className="flex flex-wrap md:flex-nowrap items-center gap-2">
          <div className="flex flex-col gap-2">
            <button
              className="btn btn-xs btn-ghost"
              disabled={lessonIndex === 0}
              onClick={() => reorderLesson(chapterIndex, lessonIndex, "up")}
            >
              <ChevronUp className="size-4" />
            </button>
            <button
              className="btn btn-xs btn-ghost"
              disabled={lessonIndex === totalLessons - 1}
              onClick={() => reorderLesson(chapterIndex, lessonIndex, "down")}
            >
              <ChevronDown className="size-4" />
            </button>
          </div>
          <span className="badge badge-info text-center text-nowrap rounded-full">
            {t("lessonLabel")} {lessonIndex + 1}
          </span>

          <div className="flex flex-col justify-center gap-1 flex-1 min-w-0">
            <input
              className="input w-full"
              value={lesson.title}
              onChange={handleTitleChange}
              placeholder={t("lessonTitlePlaceholder")}
              maxLength={255}
            />
            {courseDraft.chapters[chapterIndex]?.lessons[lessonIndex]?.title?.length >= 255 && (
              <span className="block text-xs text-error">
                {t("lessonTitleMaxLengthError")}
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
            onClick={() => deleteLesson(chapterIndex, lessonIndex)}
            className="btn btn-xs btn-ghost text-error"
            title={t("deleteLessonTitle")}
          >
            <Trash2 className="size-4" />
          </button>
        </div>

      {isOpen && (
        <>
          <textarea
            maxLength={255}
            className="textarea w-full mt-2"
            value={lesson.description}
            onChange={handleDescriptionChange}
            placeholder={t("lessonDescriptionPlaceholder")}
          />
          {
            courseDraft.chapters[chapterIndex]?.lessons[lessonIndex]?.description?.length >= 255 && (
              <span className="block text-xs text-error">
                {t("lessonDescriptionMaxLengthError")}
              </span>
            )
          }

          {/* ITEMS LIST */}
          {lesson.items && lesson.items.length > 0 && (
            <div className="mt-4 space-y-2">
              <p className="text-sm font-semibold text-gray-600">{t("addedItemsLabel")} ({lesson.items.length})</p>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {lesson.items.map((item, itemIndex) => {
                  const config = getContentTypeInfo(item.type);
                  return (
                    <div
                      key={item.id}
                      className={`flex items-center justify-between p-2  border border-gray-200 rounded-lg ${config.itembg}`}
                    >
                      <div className="flex flex-col gap-0.5 mr-1">
                        <button
                          className="btn btn-xs btn-ghost p-0 h-4 min-h-0"
                          disabled={itemIndex === 0}
                          onClick={() => reorderItem(chapterIndex, lessonIndex, itemIndex, "up")}
                        >
                          <ChevronUp className="size-3" />
                        </button>
                        <button
                          className="btn btn-xs btn-ghost p-0 h-4 min-h-0"
                          disabled={itemIndex === lesson.items.length - 1}
                          onClick={() => reorderItem(chapterIndex, lessonIndex, itemIndex, "down")}
                        >
                          <ChevronDown className="size-3" />
                        </button>
                      </div>
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <div className={`bg-black/5 p-2 rounded ${config.itemText}`}><span>{config.itemicon}</span></div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium w-full break-words line-clamp-2">{item.title}</p>
                          <p className="text-xs text-gray-500 truncate">{t("gradeLabel")} {item.grade_level} • {item.type}</p>
                        </div>
                      </div>
                      <button
                        onClick={() =>
                          removeItemAndSave(chapterIndex, lessonIndex, item.id)
                        }
                        className="btn btn-xs btn-ghost text-error ml-2"
                        title={t("removeItemTitle")}
                      >
                        <Trash2 className="size-3" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <button
            onClick={handleAddItem}
            disabled={!isLessonValid}
            className="btn btn-sm w-full mt-4"
          >
            {t("addItemButton")}
          </button>
        </>
      )}
    </div>
    </div >
  );
}

export default Lesson;