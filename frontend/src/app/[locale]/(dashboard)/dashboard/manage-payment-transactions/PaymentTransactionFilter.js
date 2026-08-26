"use client";

import { Search } from "lucide-react";
import React, { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import Pagination from "@/components/layout/Pagination";

const PAGE_SIZE = 10;

const formatDateTime = (value) =>
  value ? new Date(value).toLocaleString() : "—";

const STATUS_BADGE = {
  success: "badge-info",
  pending: "badge-warning",
  failed: "badge-error",
  cancelled: "badge-error",
};

const PaymentTransactionFilter = ({ transactions, loading, error }) => {
  const t = useTranslations("ManagePaymentTransactions");

  const STATUSES = [
    { label: t("allStatuses"), value: "" },
    { label: t("statusSuccess"), value: "success" },
    { label: t("statusPending"), value: "pending" },
    { label: t("statusFailed"), value: "failed" },
    { label: t("statusCancelled"), value: "cancelled" },
  ];

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const filtered = useMemo(() => {
    let result = [...(transactions ?? [])];

    if (search.trim()) {
      const lower = search.toLowerCase();
      result = result.filter(
        (tx) =>
          tx.order_number?.toLowerCase().includes(lower) ||
          tx.payer?.toLowerCase().includes(lower) ||
          tx.user?.toLowerCase().includes(lower) ||
          tx.course_title?.toLowerCase().includes(lower) ||
          tx.plan_name?.toLowerCase().includes(lower),
      );
    }

    if (statusFilter) {
      result = result.filter((tx) => tx.status === statusFilter);
    }

    return result;
  }, [transactions, search, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  const handleSearch = (e) => {
    setSearch(e.target.value);
    setCurrentPage(1);
  };

  const handleStatus = (e) => {
    setStatusFilter(e.target.value);
    setCurrentPage(1);
  };

  return (
    <div className="w-full bg-base-100 rounded-xl shadow-sm border border-base-200">
      <div className="p-4 grid md:grid-cols-2 justify-between items-center gap-4 border-b border-base-200">
        <h2 className="text-xl font-bold px-2">{t("allTransactionsHeading")}</h2>
        <div className="flex flex-wrap items-center justify-end gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 z-10" />
            <input
              type="text"
              placeholder={t("searchPlaceholder")}
              className="input input-sm input-bordered pl-10 w-64 focus:input-primary"
              value={search}
              onChange={handleSearch}
            />
          </div>
          <select
            className="select select-sm select-bordered font-medium"
            value={statusFilter}
            onChange={handleStatus}
          >
            {STATUSES.map((s) => (
              <option key={String(s.value)} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error && (
        <div className="px-6 py-3">
          <p className="text-sm text-error">{error}</p>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="table table-zebra w-full">
          <thead className="bg-base-200/50 text-base-content/70">
            <tr>
              <th className="font-bold py-4">{t("colOrderNumber")}</th>
              <th className="font-bold">{t("colPayer")}</th>
              <th className="font-bold">{t("colStudent")}</th>
              <th className="font-bold">{t("colCourse")}</th>
              <th className="font-bold">{t("colPlan")}</th>
              <th className="font-bold">{t("colAmount")}</th>
              <th className="font-bold">{t("colStatus")}</th>
              <th className="font-bold">{t("colCreated")}</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={8} className="text-center py-10">
                  <span className="loading loading-spinner loading-md" />
                </td>
              </tr>
            ) : paginated.length === 0 ? (
              <tr>
                <td colSpan={8} className="text-center py-10 text-base-content/40">
                  {t("noTransactionsFound")}
                </td>
              </tr>
            ) : (
              paginated.map((tx) => (
                <tr key={tx.id} className="hover:bg-base-200/30 transition-colors">
                  <td className="font-mono text-xs">{tx.order_number}</td>
                  <td className="font-semibold text-base-content/80">
                    {tx.payer || "—"}
                  </td>
                  <td className="text-base-content/60">{tx.user || "—"}</td>
                  <td className="text-base-content/60">
                    {tx.course_title || "—"}
                  </td>
                  <td className="text-base-content/60">
                    {tx.plan_name || "—"}
                  </td>
                  <td className="text-base-content/60">
                    {tx.amount} {tx.currency}
                  </td>
                  <td>
                    <span
                      className={`badge badge-sm font-bold py-3 px-4 rounded-full capitalize ${STATUS_BADGE[tx.status] ?? "badge-ghost"}`}
                    >
                      {t(`status${tx.status.charAt(0).toUpperCase()}${tx.status.slice(1)}`)}
                    </span>
                  </td>
                  <td className="text-base-content/60">
                    {formatDateTime(tx.created_at)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
      />
    </div>
  );
};

export default PaymentTransactionFilter;
