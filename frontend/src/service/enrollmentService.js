import apiClient from "@/lib/api";

export const enrollmentService = {
  getEnrollments: async () => {
    const { data } = await apiClient.get("/billing/enrollments/");
    return data;
  },

  getEnrollmentById: async (id) => {
    const { data } = await apiClient.get(`/billing/enrollments/${id}/`);
    return data;
  },

  createEnrollment: async (payload) => {
    const { data } = await apiClient.post("/billing/enrollments/", payload);
    return data;
  },

  updateEnrollment: async (id, payload) => {
    const { data } = await apiClient.patch(
      `/billing/enrollments/${id}/`,
      payload,
    );
    return data;
  },

  getMyEnrollment: async (courseId, childId) => {
    const { data } = await apiClient.get("/billing/enrollments/me/", {
      params: {
        course_id: courseId,
        ...(childId ? { child_id: childId } : {}),
      },
    });
    return data;
  },

  getMyEnrollments: async (childId) => {
    const { data } = await apiClient.get("/billing/enrollments/me/", {
      params: childId ? { child_id: childId } : {},
    });
    return data;
  },
  getCurrentEnrollmentInfo: async (courseId) => {
        const {data} = await apiClient.get("/billing/enrollments/me/", {
            params: courseId ? { course_id: courseId } : {},
        });
        return data;
    },
    getMyEnrollments: async () => {
        const {data} = await apiClient.get("/billing/enrollments/me/");
        return data;
    },
};
