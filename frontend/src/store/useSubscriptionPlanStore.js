import { create } from "zustand";
import { subscriptionPlanService } from "@/service/subscriptionPlanService";
import handleError from "@/lib/handleError";

export const useSubscriptionPlanStore = create((set, get) => ({
  plans: [],
  loading: false,
  error: null,

  fetchPlans: async (params = {}) => {
    set({ loading: true, error: null });
    try {
      const data = await subscriptionPlanService.getPlans(params);
      set({ plans: data, loading: false });
    } catch (err) {
      set({ loading: false, error: handleError(err).message });
    }
  },

  createPlan: async (payload) => {
    const data = await subscriptionPlanService.createPlan(payload);
    set((state) => ({
      plans: [
        ...(data.is_recommended
          ? state.plans.map((p) =>
              p.course === data.course ? { ...p, is_recommended: false } : p,
            )
          : state.plans),
        data,
      ],
    }));
    return data;
  },

  updatePlan: async (id, payload) => {
    const data = await subscriptionPlanService.updatePlan(id, payload);
    set((state) => ({
      plans: state.plans.map((p) => {
        if (p.id === id) return data;
        // The backend auto-un-recommends any other plan for the same
        // course when this one is set recommended — mirror that here so
        // the list doesn't show two "Recommended" badges until a refetch.
        if (data.is_recommended && p.course === data.course) {
          return { ...p, is_recommended: false };
        }
        return p;
      }),
    }));
    return data;
  },
}));
