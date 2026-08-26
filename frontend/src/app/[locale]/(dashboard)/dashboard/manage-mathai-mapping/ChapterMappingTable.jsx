"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { mathAiMappingService } from "@/service/mathAiMappingService";

export default function ChapterMappingTable() {
  const [courses, setCourses] = useState([]);
  const [loadingCourses, setLoadingCourses] = useState(true);
  const [courseId, setCourseId] = useState("");

  const [chapterData, setChapterData] = useState(null); // { course_id, mathai_subject_id, chapters }
  const [lessons, setLessons] = useState([]);
  const [loadingChapters, setLoadingChapters] = useState(false);
  const [pending, setPending] = useState({}); // chapter_id -> selected lesson_id
  const [savingId, setSavingId] = useState(null);

  useEffect(() => {
    mathAiMappingService
      .getCourseMappings()
      .then((rows) => setCourses(rows || []))
      .catch(() => toast.error("Couldn't load courses."))
      .finally(() => setLoadingCourses(false));
  }, []);

  useEffect(() => {
    if (!courseId) {
      setChapterData(null);
      setLessons([]);
      return;
    }
    let cancelled = false;
    setLoadingChapters(true);
    mathAiMappingService
      .getChapterMappings(courseId)
      .then(async (data) => {
        if (cancelled) return;
        setChapterData(data);
        setPending({});
        if (data?.mathai_subject_id) {
          const subject = await mathAiMappingService.getSubjectDetail(data.mathai_subject_id);
          if (!cancelled) setLessons(subject?.lessons || []);
        } else {
          setLessons([]);
        }
      })
      .catch(() => {
        if (!cancelled) toast.error("Couldn't load chapters for that course.");
      })
      .finally(() => {
        if (!cancelled) setLoadingChapters(false);
      });
    return () => {
      cancelled = true;
    };
  }, [courseId]);

  const selectedFor = (chapter) => pending[chapter.chapter_id] ?? chapter.mathai_lesson_id ?? "";

  const handleSave = async (chapter) => {
    const lessonId = selectedFor(chapter);
    if (!lessonId) return;
    setSavingId(chapter.chapter_id);
    try {
      await mathAiMappingService.updateChapterMapping(chapter.chapter_id, lessonId);
      setChapterData((prev) => ({
        ...prev,
        chapters: prev.chapters.map((c) =>
          c.chapter_id === chapter.chapter_id ? { ...c, mathai_lesson_id: lessonId } : c
        ),
      }));
      toast.success("Mapping saved");
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Couldn't save this mapping.");
    } finally {
      setSavingId(null);
    }
  };

  const handleClear = async (chapter) => {
    setSavingId(chapter.chapter_id);
    try {
      await mathAiMappingService.clearChapterMapping(chapter.chapter_id);
      setChapterData((prev) => ({
        ...prev,
        chapters: prev.chapters.map((c) =>
          c.chapter_id === chapter.chapter_id ? { ...c, mathai_lesson_id: "" } : c
        ),
      }));
      setPending((prev) => ({ ...prev, [chapter.chapter_id]: "" }));
      toast.success("Mapping cleared");
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Couldn't clear this mapping.");
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div>
      <div className="p-4 border-b border-base-200">
        <label className="text-sm font-medium text-base-content/70 mr-2">Course</label>
        <select
          className="select select-sm select-bordered"
          value={courseId}
          disabled={loadingCourses}
          onChange={(e) => setCourseId(e.target.value)}
        >
          <option value="">— pick a course —</option>
          {courses.map((c) => (
            <option key={c.course_id} value={c.course_id}>
              {c.course_title} {c.grade_level ? `(Grade ${c.grade_level})` : ""}
            </option>
          ))}
        </select>
      </div>

      {loadingChapters ? (
        <div className="flex items-center justify-center py-16">
          <span className="loading loading-spinner loading-md" />
        </div>
      ) : !courseId ? (
        <p className="text-center py-10 text-base-content/40">
          Pick a course to see its chapters.
        </p>
      ) : !chapterData?.mathai_subject_id ? (
        <p className="text-center py-10 text-warning">
          This course isn&apos;t mapped to a Math AI subject yet — map it in
          the Courses tab first.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="table table-zebra w-full">
            <thead className="bg-base-200/50 text-base-content/70">
              <tr>
                <th className="font-bold py-4">Chapter</th>
                <th className="font-bold">Math AI lesson</th>
                <th className="text-right px-6 font-bold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {chapterData.chapters.length === 0 ? (
                <tr>
                  <td colSpan={3} className="text-center py-10 text-base-content/40">
                    This course has no chapters yet.
                  </td>
                </tr>
              ) : (
                chapterData.chapters.map((chapter) => {
                  const isMapped = Boolean(chapter.mathai_lesson_id);
                  const isDirty =
                    selectedFor(chapter) !== (chapter.mathai_lesson_id || "");
                  return (
                    <tr key={chapter.chapter_id}>
                      <td className="font-medium">{chapter.chapter_title}</td>
                      <td>
                        <select
                          className="select select-sm select-bordered w-full max-w-xs"
                          value={selectedFor(chapter)}
                          onChange={(e) =>
                            setPending((prev) => ({
                              ...prev,
                              [chapter.chapter_id]: e.target.value,
                            }))
                          }
                        >
                          <option value="">— not mapped —</option>
                          {lessons.map((l) => (
                            <option key={l.id} value={l.id}>
                              {l.id} — {l.title}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="text-right px-6">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            className="btn btn-info btn-xs shadow-none"
                            disabled={!isDirty || savingId === chapter.chapter_id}
                            onClick={() => handleSave(chapter)}
                          >
                            {savingId === chapter.chapter_id ? (
                              <span className="loading loading-spinner loading-xs" />
                            ) : (
                              "Save"
                            )}
                          </button>
                          {isMapped && (
                            <button
                              type="button"
                              className="btn btn-ghost btn-xs"
                              disabled={savingId === chapter.chapter_id}
                              onClick={() => handleClear(chapter)}
                            >
                              Clear
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
