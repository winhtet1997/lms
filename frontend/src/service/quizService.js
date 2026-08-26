import apiClient from "@/lib/api";

export const quizService = {
    getStatus: async (courseId) => {
        const params = courseId ? `?course_id=${courseId}` : "";
        const { data } = await apiClient.get(`/courses/daily-quiz/${params}`);
        return data;
    },
    start: async (courseId) => {
        const { data } = await apiClient.post("/courses/daily-quiz/start/", courseId ? { course_id: courseId } : {});
        return data;
    },
    submitAnswer: async (quizId, dailyQuizQuestionId, selectedChoice) => {
        const { data } = await apiClient.post(`/courses/daily-quiz/${quizId}/answer/`, {
            daily_quiz_question_id: dailyQuizQuestionId,
            selected_choice: selectedChoice,
        });
        return data;
    },
    getResults: async (quizId) => {
        const { data } = await apiClient.get(`/courses/daily-quiz/${quizId}/results/`);
        return data;
    },
    getCourseList: async () => {
        const { data } = await apiClient.get("/courses/daily-quiz/questions/list/");
        return data;
    },
    getQuestionsByCourse: async (courseId, { search = "", page = 1, pageSize = 10, ordering = "newest" } = {}) => {
        const params = new URLSearchParams({ course: courseId, page, page_size: pageSize, ordering });
        if (search) params.set("search", search);
        const { data } = await apiClient.get(`/courses/daily-quiz/questions/?${params}`);
        return data;
    },
    createQuestion: async (payload) => {
        const { data } = await apiClient.post("/courses/daily-quiz/questions/", payload);
        return data;
    },
    updateQuestion: async (id, payload) => {
        const { data } = await apiClient.patch(`/courses/daily-quiz/questions/${id}/`, payload);
        return data;
    },
    deleteQuestion: async (id) => {
        await apiClient.delete(`/courses/daily-quiz/questions/${id}/`);
    },
    uploadQuestions: async (courseId, file) => {
        const formData = new FormData();
        formData.append("course_id", courseId);
        formData.append("file", file);
        const { data } = await apiClient.post("/courses/daily-quiz/questions/upload/", formData, {
            headers: {"Content-Type": "multipart/form-data"},
        });
        return data;
    },
};