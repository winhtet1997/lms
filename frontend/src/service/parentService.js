import apiClient from "@/lib/api";

export const parentService = {
  getChildren: async () => {
    const { data } = await apiClient.get("/auth/children/");
    return data;
  },

  createChild: async (payload) => {
    const { data } = await apiClient.post("/auth/children/", payload);
    return data;
  },

  linkChild: async (payload) => {
    const { data } = await apiClient.post("/auth/children/link/", payload);
    return data;
  },

  searchChildren: async (query) => {
    const { data } = await apiClient.get("/auth/children/search/", {
      params: { search: query },
    });
    return data;
  },

  unlinkChild: async (id) => {
    await apiClient.delete(`/auth/children/${id}/unlink/`);
  },
};
