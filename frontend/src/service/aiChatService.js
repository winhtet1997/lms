import apiClient from "@/lib/api";

export const aiChatService = {
  getSubjects: async () => {
    const { data } = await apiClient.get("/ai-chat/subjects/");
    return data;
  },

  checkAccess: async (chapterId, courseId) => {
    const params = {};
    if (chapterId) params.chapter_id = chapterId;
    else if (courseId) params.course_id = courseId;
    const { data } = await apiClient.get("/ai-chat/access/", { params });
    return data;
  },

  startThread: async (chapterId, courseId, subjectId, newChat) => {
    const payload = {};
    if (chapterId) {
      payload.chapter_id = chapterId;
    } else {
      if (courseId) payload.course_id = courseId;
      if (subjectId) payload.subject_id = subjectId;
    }
    if (newChat) payload.new_chat = true;
    const { data } = await apiClient.post(
      "/ai-chat/threads/start/",
      payload,
      { timeout: 30000 }
    );
    return data;
  },

  getThreads: async (chapterId, courseId, subjectId) => {
    const params = {};
    if (chapterId) {
      params.chapter_id = chapterId;
    } else if (courseId) {
      params.course_id = courseId;
      if (subjectId) params.subject_id = subjectId;
    }
    const { data } = await apiClient.get("/ai-chat/threads/", { params });
    return data;
  },

  getHistory: async (threadId) => {
    const { data } = await apiClient.get(
      `/ai-chat/threads/${threadId}/messages/`,
      { timeout: 30000 }
    );
    return data;
  },

  sendMessage: async (threadId, message, language) => {
    const payload = { message };
    if (language) payload.language = language;
    const { data } = await apiClient.post(
      `/ai-chat/threads/${threadId}/messages/`,
      payload,
      { timeout: 90000 }
    );
    return data;
  },

  getMyThreads: async () => {
    const { data } = await apiClient.get("/ai-chat/threads/");
    return data;
  },

  deleteThread: async (threadId) => {
    await apiClient.delete(`/ai-chat/threads/${threadId}/`);
  },
};