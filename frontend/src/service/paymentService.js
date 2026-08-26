import apiClient from "@/lib/api";

export const paymentService = {
  initializePayment: async (planId, childId) => {
    const { data } = await apiClient.post("/billing/payments/initialize/", {
      plan_id: planId,
      ...(childId ? { child_id: childId } : {}),
    });
    return data;
  },

  getPaymentStatus: async (orderNumber) => {
    const { data } = await apiClient.get(
      `/billing/payments/status/${orderNumber}/`,
    );
    return data;
  },

  getPaymentTransactions: async () => {
    const { data } = await apiClient.get("/billing/payment-transactions/");
    return data;
  },
};
