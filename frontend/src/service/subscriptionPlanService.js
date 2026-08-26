import apiClient from "@/lib/api";

export const subscriptionPlanService = {
  getPlans: async (params = {}) => {
    const { data } = await apiClient.get("/billing/plans/", { params });
    return data;
  },

  createPlan: async (payload) => {
    const { data } = await apiClient.post("/billing/plans/", payload);
    return data;
  },

  updatePlan: async (id, payload) => {
    const { data } = await apiClient.patch(`/billing/plans/${id}/`, payload);
    return data;
  },
};
