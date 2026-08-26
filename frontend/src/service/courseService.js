import apiClient from "@/lib/api";

export const courseService = {

    getSubjects: async () => {
        const { data } = await apiClient.get("/courses/subjects/");
        return data;
    },
    getCourses: async (params={}) => {
        const { data } = await apiClient.get("/courses/", {params})
        return data;
    },
    getCourseById: async (courseId) => {
        const { data } = await apiClient.get(`/courses/${courseId}/`)
        return data;
    },
    getCourseByIdBasic: async (courseId) => {
        const { data } = await apiClient.get(`/courses/${courseId}/?basic_chapters=1`)
        return data;
    },
    getChapter: async (chapterId) => {
        const { data } = await apiClient.get(`/courses/chapters/${chapterId}/`)
        return data;
    },


    createCourse: async (formData) => {
        const { data } = await apiClient.post(
            "/courses/",
            formData,
        );
        return data;
    },
    createChapter: async (formData) => {
        const { data } = await apiClient.post(
            "/courses/chapters/",
            formData,
        );
        return data;
    },
    createLesson: async (formData) => {
        const { data } = await apiClient.post(
            "/courses/lessons/",
            formData,
        );
        return data;
    },
    updateLesson: async (lessonId, formData) => {
        const { data } = await apiClient.patch(
            `/courses/lessons/${lessonId}/`,
            formData,
        );
        return data;
    },
    updateCourse: async (courseId, formData) => {
        const { data } = await apiClient.patch(
            `/courses/${courseId}/`,
            formData,
        );
        return data;
    },
    updateChapter: async (chapterId, formData) => {
        const { data } = await apiClient.patch(
            `/courses/chapters/${chapterId}/`,
            formData,
        );
        return data;
    },
    deleteCourse: async (courseId) => {
        const { data } = await apiClient.delete(`/courses/${courseId}/`);
        return data;
    },
    deleteChapter: async (chapterId) => {
        const { data } = await apiClient.delete(`/courses/chapters/${chapterId}/`);
        return data;
    },
    uploadChapterIcon: async (chapterId, file) => {
        const formData = new FormData();
        formData.append("icon", file);
        const { data } = await apiClient.patch(
            `/courses/chapters/${chapterId}/`,
            formData,
            { headers: { "Content-Type": "multipart/form-data" } }
        );
        return data;
    },
    reorderChapters: async (items) => {
        const { data } = await apiClient.post("/courses/chapters/reorder/", items);
        return data;
    },
    reorderLessons: async (items) => {
        const { data } = await apiClient.post("/courses/lessons/reorder/", items);
        return data;
    },
    reorderItems: async (items) => {
        const { data } = await apiClient.post("/courses/items/reorder/", items);
        return data;
    },
    deleteLesson: async (lessonId) => {
        const { data } = await apiClient.delete(`/courses/lessons/${lessonId}/`);
        return data;
    },

    // item management
    createItem: async (itemData) => {
        const { data } = await apiClient.post("/courses/items/", itemData);
        return data;
    },
    getItems: async (params = {}) => {
        const { data } = await apiClient.get("/courses/items/", { params });
        return data;
    },
    getItemsGrouped: async (params = {}) => {
        const { data } = await apiClient.get("/courses/items/grouped/", { params });
        return data;
    },
    getItem: async (Id) => {
        const { data } = await apiClient.get(`/courses/items/${Id}/`)
        return data;
    },
    initiateUpload: async (payload) => {
        const { data } = await apiClient.post("/courses/upload/initiate/", payload);
        return data;
    },
    completeUpload: async (payload) => {
        const { data } = await apiClient.post("/courses/upload/complete/", payload);
        return data;
    },
    abortUpload: async (payload) => {
        const { data } = await apiClient.post("/courses/upload/abort/", payload);
        return data;
    },

    updateItem: async (itemId, itemData) => {
        const { data } = await apiClient.patch(`/courses/items/${itemId}/`, itemData);
        return data;
    },
    deleteItem: async (itemId) => {
        const { data } = await apiClient.delete(`/courses/items/${itemId}/`);
        return data;
    },
    applyCourseTags: async (courseId) => {
        const { data } = await apiClient.post(`/courses/${courseId}/apply-tags/`);
        return data;
    },
    saveItemProgress: async (itemId, progress, status) => {
        const { data } = await apiClient.post(`/courses/items/${itemId}/progress/`, { progress, status });
        return data;
    },
    getItemProgress: async (itemId) => {
        const { data } = await apiClient.get(`/courses/items/${itemId}/progress/`);
        return data;
    },

    // student quiz attempt
    getLatestQuizAttempt: async (itemId) => {
        const { data } = await apiClient.get(`/courses/items/${itemId}/quiz/start/`);
        return data;
    },
    startQuizAttempt: async (itemId) => {
        const { data } = await apiClient.post(`/courses/items/${itemId}/quiz/start/`);
        return data;
    },
    submitQuizAnswer: async (attemptId, questionId, selectedChoice) => {
        const { data } = await apiClient.post(`/courses/quiz-attempts/${attemptId}/answer/`, {
            question_id: questionId,
            selected_choice: selectedChoice,
        });
        return data;
    },
    getQuizResults: async (attemptId) => {
        const { data } = await apiClient.get(`/courses/quiz-attempts/${attemptId}/results/`);
        return data;
    },

    // quiz item management
    createQuiz: async (itemId, payload) => {
        const { data } = await apiClient.post(`/courses/items/${itemId}/quiz/`, payload);
        return data;
    },
    getQuiz: async (itemId) => {
        const { data } = await apiClient.get(`/courses/items/${itemId}/quiz/`);
        return data;
    },
    updateQuiz: async (itemId, payload) => {
        const { data } = await apiClient.patch(`/courses/items/${itemId}/quiz/`, payload);
        return data;
    },
    getQuizQuestions: async (itemId) => {
        const { data } = await apiClient.get(`/courses/items/${itemId}/quiz/questions/`);
        return data;
    },
    createQuizQuestion: async (itemId, payload) => {
        const { data } = await apiClient.post(`/courses/items/${itemId}/quiz/questions/`, payload);
        return data;
    },
    updateQuizQuestion: async (itemId, questionId, payload) => {
        const { data } = await apiClient.patch(`/courses/items/${itemId}/quiz/questions/${questionId}/`, payload);
        return data;
    },
    deleteQuizQuestion: async (itemId, questionId) => {
        await apiClient.delete(`/courses/items/${itemId}/quiz/questions/${questionId}/`);
    },
    uploadQuizQuestionsFile: async (itemId, file) => {
        const formData = new FormData();
        formData.append("file", file);
        const { data } = await apiClient.post(`/courses/items/${itemId}/quiz/questions/upload/`, formData);
        return data;
    },
}





