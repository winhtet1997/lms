import apiClient from "@/lib/api";

export const sessionService = {
    getAdminStats: async () => {
        const { data } = await apiClient.get("/sessions/admin/stats/");
        return data;
    },

    getAdminSessions: async (params = {}) => {
        const { data } = await apiClient.get("/sessions/admin/", { params });
        return data;
    },

    approveSession: async (id) => {
        const { data } = await apiClient.post(`/sessions/${id}/approve/`);
        return data;
    },

    rejectSession: async (id) => {
        const { data } = await apiClient.post(`/sessions/${id}/reject/`);
        return data;
    },

    getSession: async (id) => {
        const { data } = await apiClient.get(`/sessions/${id}/`);
        return data;
    },

    joinSession: async (id) => {
        const { data } = await apiClient.post(`/sessions/${id}/join/`);
        return data;
    },

    getTutors: async () => {
        const { data } = await apiClient.get("/sessions/tutors/");
        return data;
    },

    getTutorAvailability: async (tutorId) => {
        const { data } = await apiClient.get(`/sessions/tutors/${tutorId}/availability/`);
        return data;
    },

    getMyAvailability: async () => {
        const { data } = await apiClient.get("/sessions/availability/");
        return data;
    },

    addAvailabilitySlot: async (payload) => {
        const { data } = await apiClient.post("/sessions/availability/", payload);
        return data;
    },

    updateAvailabilitySlot: async (id, payload) => {
        const { data } = await apiClient.patch(`/sessions/availability/${id}/`, payload);
        return data;
    },

    deleteAvailabilitySlot: async (id) => {
        await apiClient.delete(`/sessions/availability/${id}/`);
    },

    bookSession: async (payload) => {
        const { data } = await apiClient.post("/sessions/", payload);
        return data;
    },

    getMySessions: async () => {
        const { data } = await apiClient.get("/sessions/");
        return data;
    },

    cancelSession: async (id) => {
        await apiClient.delete(`/sessions/${id}/`);
    },

    getTutorPendingSessions: async () => {
        const { data } = await apiClient.get("/sessions/tutor/pending/");
        return data;
    },

    getTutorSessions: async (params = {}) => {
        const { data } = await apiClient.get("/sessions/tutor/all/", { params });
        return data;
    },

    getTutorStats: async () => {
        const { data } = await apiClient.get("/sessions/tutor/stats/");
        return data;
    },

    createGroupSession: async (payload) => {
        const { data } = await apiClient.post("/sessions/group/", payload);
        return data;
    },

    registerGroupSession: async (id) => {
        const { data } = await apiClient.post(`/sessions/${id}/register/`);
        return data;
    },

    endSession: async (id) => {
        const { data } = await apiClient.post(`/sessions/${id}/end/`);
        return data;
    },

    rateSession: async (id, payload) => {
        const { data } = await apiClient.post(`/sessions/${id}/rate/`, payload);
        return data;
    },
};
