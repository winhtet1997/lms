import apiClient from "@/lib/api";

export const mathAiMappingService = {
  getSubjects: async () => {
    const { data } = await apiClient.get("/ai-chat/subjects/");
    return data?.data || [];
  },
  getSubjectDetail: async (subjectId) => {
    const { data } = await apiClient.get(`/ai-chat/subjects/${subjectId}/`);
    return data?.data || null;
  },

  getCourseMappings: async () => {
    const { data } = await apiClient.get("/ai-chat/course-mappings/");
    return data;
  },
  updateCourseMapping: async (courseId, subjectId) => {
    const { data } = await apiClient.patch(`/ai-chat/course-mappings/${courseId}/`, {
      mathai_subject_id: subjectId,
    });
    return data;
  },
  clearCourseMapping: async (courseId) => {
    await apiClient.delete(`/ai-chat/course-mappings/${courseId}/`);
  },

  getChapterMappings: async (courseId) => {
    const { data } = await apiClient.get("/ai-chat/chapter-mappings/", {
      params: { course_id: courseId },
    });
    return data;
  },
  updateChapterMapping: async (chapterId, lessonId) => {
    const { data } = await apiClient.patch(`/ai-chat/chapter-mappings/${chapterId}/`, {
      mathai_lesson_id: lessonId,
    });
    return data;
  },
  clearChapterMapping: async (chapterId) => {
    await apiClient.delete(`/ai-chat/chapter-mappings/${chapterId}/`);
  },
};
