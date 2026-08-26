"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { paymentService } from "@/service/paymentService";
import PaymentTransactionFilter from "./PaymentTransactionFilter";

const StatCard = ({ label, value, sub, loading }) => (
  <div className="bg-card text-card-foreground flex flex-col gap-6 rounded-xl border border-gray-200 py-6 shadow-sm">
    <div className="auto-rows-min grid-rows-[auto_auto] gap-2 px-6 flex flex-row items-center justify-between pb-2">
      <div className="text-sm font-medium">{label}</div>
    </div>
    <div className="px-6">
      <div className="text-2xl font-bold">
        {loading ? (
          <span className="loading loading-spinner loading-sm" />
        ) : (
          value
        )}
      </div>
      <p className="text-xs text-muted-foreground">{sub}</p>
    </div>
  </div>
);

const ManagePaymentTransactions = () => {
  const t = useTranslations("ManagePaymentTransactions");
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    paymentService
      .getPaymentTransactions()
      .then((data) => setTransactions(data))
      .catch((err) =>
        setError(err?.response?.data?.error || t("loadFailed")),
      )
      .finally(() => setLoading(false));
  }, [t]);

  const { total, successCount, pendingCount, failedCount } = useMemo(() => {
    return {
      total: transactions.length,
      successCount: transactions.filter((tx) => tx.status === "success").length,
      pendingCount: transactions.filter((tx) => tx.status === "pending").length,
      failedCount: transactions.filter(
        (tx) => tx.status === "failed" || tx.status === "cancelled",
      ).length,
    };
  }, [transactions]);

  return (
    <div>
      <div className="p-4">
        <div className="md:flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">{t("title")}</h1>
            <p className="text-gray-500">{t("subtitle")}</p>
          </div>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            label={t("totalTransactions")}
            value={total}
            sub={t("allTransactions")}
            loading={loading}
          />
          <StatCard
            label={t("successfulTransactions")}
            value={successCount}
            sub={t("successfulSub")}
            loading={loading}
          />
          <StatCard
            label={t("pendingTransactions")}
            value={pendingCount}
            sub={t("pendingSub")}
            loading={loading}
          />
          <StatCard
            label={t("failedTransactions")}
            value={failedCount}
            sub={t("failedSub")}
            loading={loading}
          />
        </div>
        <div className="mt-8">
          <PaymentTransactionFilter
            transactions={transactions}
            loading={loading}
            error={error}
          />
        </div>
      </div>
    </div>
  );
};

export default ManagePaymentTransactions;
