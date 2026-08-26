import { create } from "zustand";
import { subscriptionPlanService } from "@/service/subscriptionPlanService";
import { enrollmentService } from "@/service/enrollmentService";
import { paymentService } from "@/service/paymentService";
import handleError from "@/lib/handleError";

export const useCoursePurchaseStore = create((set, get) => ({
  plans: [],
  myEnrollment: null,
  loading: false,
  initializing: false,
  error: null,

  fetchCoursePlans: async (courseId) => {
    set({ loading: true, error: null });
    try {
      const data = await subscriptionPlanService.getPlans({
        course_id: courseId,
      });
      set({ plans: data, loading: false });
    } catch (err) {
      set({ loading: false, error: handleError(err).message });
    }
  },

  fetchPlans: async (params = {}) => {
    set({ loading: true, error: null });
    try {
      const data = await subscriptionPlanService.getPlans(params);
      set({ plans: data, loading: false });
    } catch (err) {
      set({ loading: false, error: handleError(err).message });
    }
  },

  fetchMyEnrollment: async (courseId, childId) => {
    try {
      const data = await enrollmentService.getMyEnrollment(courseId, childId);
      set({ myEnrollment: data });
      return data;
    } catch (err) {
      set({ error: handleError(err).message });
    }
  },

  initializePayment: async (planId, childId) => {
    set({ initializing: true, error: null });
    try {
      const data = await paymentService.initializePayment(planId, childId);
      set({ initializing: false });
      return data;
    } catch (err) {
      set({ initializing: false, error: handleError(err).message });
      throw err;
    }
  },

  getPaymentStatus: async (orderNumber) => {
    return paymentService.getPaymentStatus(orderNumber);
  },
}));
