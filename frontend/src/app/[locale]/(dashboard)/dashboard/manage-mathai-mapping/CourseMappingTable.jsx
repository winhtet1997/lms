"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { mathAiMappingService } from "@/service/mathAiMappingService";

export default function CourseMappingTable() {
  const [courses, setCourses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState({}); // course_id -> selected subject_id
  const [savingId, setSavingId] = useState(null);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      mathAiMappingService.getCourseMappings(),
      mathAiMappingService.getSubjects(),
    ])
      .then(([courseRows, subjectRows]) => {
        if (cancelled) return;
        setCourses(courseRows || []);
        setSubjects(subjectRows || []);
      })
      .catch(() => {
        if (!cancelled) toast.error("Couldn't load courses or Math AI subjects.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const selectedFor = (course) =>
    pending[course.course_id] ?? course.mathai_subject_id ?? "";

  const handleSave = async (course) => {
    const subjectId = selectedFor(course);
    if (!subjectId) return;
    setSavingId(course.course_id);
    try {
      await mathAiMappingService.updateCourseMapping(course.course_id, subjectId);
      setCourses((prev) =>
        prev.map((c) =>
          c.course_id === course.course_id ? { ...c, mathai_subject_id: subjectId } : c
        )
      );
      toast.success("Mapping saved");
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Couldn't save this mapping.");
    } finally {
      setSavingId(null);
    }
  };

  const handleClear = async (course) => {
    setSavingId(course.course_id);
    try {
      await mathAiMappingService.clearCourseMapping(course.course_id);
      setCourses((prev) =>
        prev.map((c) =>
          c.course_id === course.course_id ? { ...c, mathai_subject_id: null } : c
        )
      );
      setPending((prev) => ({ ...prev, [course.course_id]: "" }));
      toast.success("Mapping cleared");
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Couldn't clear this mapping.");
    } finally {
      setSavingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <span className="loading loading-spinner loading-md" />
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="table table-zebra w-full">
        <thead className="bg-base-200/50 text-base-content/70">
          <tr>
            <th className="font-bold py-4">Course</th>
            <th className="font-bold">Grade</th>
            <th className="font-bold">Math AI subject</th>
            <th className="text-right px-6 font-bold">Actions</th>
          </tr>
        </thead>
        <tbody>
          {courses.length === 0 ? (
            <tr>
              <td colSpan={4} className="text-center py-10 text-base-content/40">
                No courses found.
              </td>
            </tr>
          ) : (
            courses.map((course) => {
              const isMapped = Boolean(course.mathai_subject_id);
              const isDirty = selectedFor(course) !== (course.mathai_subject_id || "");
              return (
                <tr key={course.course_id}>
                  <td className="font-medium">{course.course_title}</td>
                  <td className="text-base-content/60">{course.grade_level || "—"}</td>
                  <td>
                    <select
                      className="select select-sm select-bordered w-full max-w-xs"
                      value={selectedFor(course)}
                      onChange={(e) =>
                        setPending((prev) => ({ ...prev, [course.course_id]: e.target.value }))
                      }
                    >
                      <option value="">— not mapped —</option>
                      {subjects.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.id} — {s.title}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="text-right px-6">
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        className="btn btn-info btn-xs shadow-none"
                        disabled={!isDirty || savingId === course.course_id}
                        onClick={() => handleSave(course)}
                      >
                        {savingId === course.course_id ? (
                          <span className="loading loading-spinner loading-xs" />
                        ) : (
                          "Save"
                        )}
                      </button>
                      {isMapped && (
                        <button
                          type="button"
                          className="btn btn-ghost btn-xs"
                          disabled={savingId === course.course_id}
                          onClick={() => handleClear(course)}
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
  );
}
