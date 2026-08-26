import apiClient from "@/lib/api";

export const groupService = {
    getGroups: async () => {
        const { data } = await apiClient.get("/auth/groups/");
        return data;
    },

    getGroupById: async (id) => {
        const { data } = await apiClient.get(`/auth/groups/${id}/`);
        return data;
    },

    createGroup: async (payload) => {
        const { data } = await apiClient.post("/auth/groups/", payload);
        return data;
    },

    updateGroup: async (id, payload) => {
        const { data } = await apiClient.patch(`/auth/groups/${id}/`, payload);
        return data;
    },

    deleteGroup: async (id) => {
        await apiClient.delete(`/auth/groups/${id}/`);
    },

    getAvailablePermissions: async () => {
        const { data } = await apiClient.get("/auth/groups/available-permissions/");
        return data;
    },
};
