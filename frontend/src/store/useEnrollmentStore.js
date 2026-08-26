import { create } from "zustand";
import { enrollmentService } from "@/service/enrollmentService";
import handleError from "@/lib/handleError";

export const useEnrollmentStore = create((set, get) => ({
  enrollments: [],
  loading: false,
  detailLoading: false,
  error: null,
  myEnrollments: [],
  currentEnrollmentInfo: null,

  fetchEnrollments: async () => {
    set({ loading: true, error: null });
    try {
      const data = await enrollmentService.getEnrollments();
      set({ enrollments: data, loading: false });
    } catch (err) {
      set({ loading: false, error: handleError(err).message });
    }
  },

  fetchEnrollment: async (id) => {
    set({ detailLoading: true, error: null });
    try {
      const data = await enrollmentService.getEnrollmentById(id);
      set({ selectedEnrollment: data, detailLoading: false });
    } catch (err) {
      set({ detailLoading: false, error: handleError(err).message });
    }
  },

  setSelectedEnrollment: (enrollment) =>
    set({ selectedEnrollment: enrollment }),

  createEnrollment: async (payload) => {
    const data = await enrollmentService.createEnrollment(payload);
    set((state) => {
      const exists = state.enrollments.some((e) => e.id === data.id);
      return {
        enrollments: exists
          ? state.enrollments.map((e) => (e.id === data.id ? data : e))
          : [...state.enrollments, data],
      };
    });
    return data;
  },

  updateEnrollment: async (id, payload) => {
    const data = await enrollmentService.updateEnrollment(id, payload);
    set((state) => ({
      enrollments: state.enrollments.map((e) => (e.id === id ? data : e)),
    }));
    return data;
  },

  fetchCurrentEnrollmentInfo: async (courseId) => {
    set({ loading: true, error: null });
    try {
      const data = await enrollmentService.getCurrentEnrollmentInfo(courseId);
      set({ currentEnrollmentInfo: data, loading: false });
      return data;
    } catch (err) {
      set({ loading: false, error: handleError(err).message });
    }
  },

  fetchMyEnrollments: async () => {
    set({ loading: true, error: null });
    try {
      const data = await enrollmentService.getMyEnrollments();
      set({ myEnrollments: data, loading: false });
      return data;
    } catch (err) {
      set({ loading: false, error: handleError(err).message });
    }
  },
}));
