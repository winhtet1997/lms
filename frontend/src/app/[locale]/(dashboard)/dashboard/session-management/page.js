"use client";
import { useTranslations } from "next-intl";
import React, { useState, useEffect } from "react";
import SessionCard from "../../../../../components/layout/SessionCard";
import { useSessionStore } from "@/store/useSessionStore";
import { useAuthStore } from "@/store/useAuthStore";

export default function SessionManagement() {
  const t = useTranslations("SessionManagement");
  const [filter, setFilter] = useState("group_sessions");
  const { user } = useAuthStore();
  const isTutor = user?.role === "Tutor";

  const stats = useSessionStore((state) => state.stats);
  const groupSessions = useSessionStore((state) => state.groupSessions);
  const privateSessions = useSessionStore((state) => state.privateSessions);
  const notApprovedSessions = useSessionStore(
    (state) => state.notApprovedSessions,
  );
  const loading = useSessionStore((state) => state.loading);
  const error = useSessionStore((state) => state.error);
  const fetchDashboard = useSessionStore((state) => state.fetchDashboard);
  const fetchTutorDashboard = useSessionStore(
    (state) => state.fetchTutorDashboard,
  );
  const approveSession = useSessionStore((state) => state.approveSession);
  const rejectSession = useSessionStore((state) => state.rejectSession);
  const endSession = useSessionStore((state) => state.endSession);

  useEffect(() => {
    if (!user) return;
    isTutor ? fetchTutorDashboard() : fetchDashboard();
  }, [user?.role]);

  const notApprovedGroup = notApprovedSessions.filter(
    (s) => s.session_type === "group",
  );
  const notApprovedPrivate = notApprovedSessions.filter(
    (s) => s.session_type === "private",
  );

  const handleApprove = (id) => approveSession(id, isTutor);
  const handleReject = (id) => rejectSession(id, isTutor);
  const handleEnd = (id) => endSession(id, isTutor);

  const TABS = [
    {
      key: "group_sessions",
      label: t("Group Sessions"),
      count: groupSessions.length,
    },
    {
      key: "private",
      label: t("Private Sessions"),
      count: privateSessions.length,
    },
    {
      key: "not_approved",
      label: t("Not Approved"),
      count: notApprovedSessions.length,
    },
  ];

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-1">{t("Session Management")}</h1>
          <p className="text-gray-500">
            {t(
              "Manage recordings, approve sessions, and monitor all tutoring activities",
            )}
          </p>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-50 text-red-600 text-sm">
          {error}
        </div>
      )}

      {/* Stats */}
      <div className="grid md:grid-cols-3 gap-6 mb-8">
        <div className="bg-card text-card-foreground flex flex-col gap-6 rounded-xl border border-gray-200 py-6 shadow-sm">
          <div className="px-6 pb-2 text-sm font-medium">
            {t("Group Sessions")}
          </div>
          <div className="px-6">
            <div className="text-2xl font-bold">
              {loading ? "—" : (stats?.group ?? 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              {t("Group Sessions")}
            </p>
          </div>
        </div>
        <div className="bg-card text-card-foreground flex flex-col gap-6 rounded-xl border border-gray-200 py-6 shadow-sm">
          <div className="px-6 pb-2 text-sm font-medium">
            {t("Private Sessions")}
          </div>
          <div className="px-6">
            <div className="text-2xl font-bold">
              {loading ? "—" : (stats?.private ?? 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              {t("Private Sessions")}
            </p>
          </div>
        </div>
        <div className="bg-card text-card-foreground flex flex-col gap-6 rounded-xl border border-gray-200 py-6 shadow-sm">
          <div className="px-6 pb-2 text-sm font-medium">
            {t("Pending Approval")}
          </div>
          <div className="px-6">
            <div className="text-2xl font-bold">
              {loading ? "—" : (stats?.pending ?? 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              {t("Pending Approval")}
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 bg-white shadow-sm md:w-fit rounded-lg mb-6">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={`btn btn-sm btn-ghost rounded-lg font-bold text-xs ${
              filter === tab.key
                ? "bg-slate-100 text-slate-700"
                : "text-slate-500"
            }`}
          >
            {tab.label} ({tab.count})
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex justify-center py-12">
          <span className="loading loading-spinner loading-md text-slate-400" />
        </div>
      ) : (
        <>
          {filter === "group_sessions" && (
            <div className="grid md:grid-cols-2 gap-4">
              {groupSessions.length === 0 ? (
                <p className="text-sm text-gray-400 col-span-2">
                  {t("noUpcomingGroupSessions")}
                </p>
              ) : (
                groupSessions.map((s) => (
                  <SessionCard
                    key={s.id}
                    session={s}
                    isPrivate={false}
                    onEnd={handleEnd}
                  />
                ))
              )}
            </div>
          )}

          {filter === "private" && (
            <div className="grid md:grid-cols-2 gap-4">
              {privateSessions.length === 0 ? (
                <p className="text-sm text-gray-400 col-span-2">
                  {t("noUpcomingPrivateSessions")}
                </p>
              ) : (
                privateSessions.map((s) => (
                  <SessionCard
                    key={s.id}
                    session={s}
                    isPrivate={true}
                    onEnd={handleEnd}
                  />
                ))
              )}
            </div>
          )}

          {filter === "not_approved" && (
            <div className="flex flex-col gap-8">
              <div>
                <h2 className="text-base font-semibold text-gray-700 mb-3">
                  {t("Group Sessions")}
                </h2>
                <div className="grid md:grid-cols-2 gap-4">
                  {notApprovedGroup.length === 0 ? (
                    <p className="text-sm text-gray-400 col-span-2">
                      {t("noPendingGroupSessions")}
                    </p>
                  ) : (
                    notApprovedGroup.map((s) => (
                      <SessionCard
                        key={s.id}
                        session={s}
                        isPrivate={false}
                        onApprove={handleApprove}
                        onReject={handleReject}
                      />
                    ))
                  )}
                </div>
              </div>
              <div>
                <h2 className="text-base font-semibold text-gray-700 mb-3">
                  {t("Private Sessions")}
                </h2>
                <div className="grid md:grid-cols-2 gap-4">
                  {notApprovedPrivate.length === 0 ? (
                    <p className="text-sm text-gray-400 col-span-2">
                      {t("noPendingPrivateSessions")}
                    </p>
                  ) : (
                    notApprovedPrivate.map((s) => (
                      <SessionCard
                        key={s.id}
                        session={s}
                        isPrivate={true}
                        onApprove={handleApprove}
                        onReject={handleReject}
                      />
                    ))
                  )}
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
