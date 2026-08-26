"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { useSessionStore } from "@/store/useSessionStore";
import { Calendar, Clock, User, Users, Video, Plus } from "lucide-react";

const STATUS_CLASSES = {
  pending: "bg-yellow-100 text-yellow-700",
  approved: "bg-blue-100 text-blue-700",
  live: "bg-green-100 text-green-700",
  completed: "bg-gray-100 text-gray-600",
  rejected: "bg-red-100 text-red-600",
  cancelled: "bg-gray-100 text-gray-400",
};

const STATUS_LABEL_KEYS = {
  pending: "statusPending",
  approved: "statusApproved",
  live: "statusLive",
  completed: "statusCompleted",
  rejected: "statusRejected",
  cancelled: "statusCancelled",
};

function StatusBadge({ status }) {
  const t = useTranslations("StudentSessionsPage");
  const className = STATUS_CLASSES[status] ?? "bg-gray-100 text-gray-500";
  const labelKey = STATUS_LABEL_KEYS[status];
  return (
    <span
      className={`px-2 py-0.5 rounded-full text-xs font-semibold ${className}`}
    >
      {labelKey ? t(labelKey) : status}
    </span>
  );
}

function SessionTypeBadge({ type }) {
  const t = useTranslations("StudentSessionsPage");
  return (
    <span
      className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
        type === "group"
          ? "bg-purple-100 text-purple-700"
          : "bg-teal-100 text-teal-700"
      }`}
    >
      {type === "group" ? t("typeGroup") : t("typePrivate")}
    </span>
  );
}

function SessionCard({ session, onCancel }) {
  const t = useTranslations("StudentSessionsPage");
  const locale = useLocale();
  const [joining, setJoining] = useState(false);
  const dt = new Date(session.scheduled_at);
  const date = dt.toLocaleDateString("en-CA");
  const time = dt.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });
  const tutorName = session.tutor?.full_name || session.tutor?.username || "—";
  const isLive = session.status === "live";
  const isUpcoming = session.status === "approved";
  const isPending = session.status === "pending";

  const handleJoin = () => {
    if (joining) return;
    setJoining(true);
    window.open(`/${locale}/student/sessions/${session.id}`, "_blank");
    setTimeout(() => setJoining(false), 3000);
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 sm:p-5 flex flex-col gap-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-800 text-sm truncate">
            {session.topic || `${session.session_type_label} Session`}
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">
            {t("tutorLabel")}: {tutorName}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <SessionTypeBadge type={session.session_type} />
          <StatusBadge status={session.status} />
        </div>
      </div>

      <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-gray-500">
        <span className="flex items-center gap-1">
          <Calendar size={12} /> {date}
        </span>
        <span className="flex items-center gap-1">
          <Clock size={12} /> {time}
        </span>
        <span className="flex items-center gap-1">
          {session.session_type === "private" ? (
            <>
              <User size={12} /> {t("oneOnOne")}
            </>
          ) : (
            <>
              <Users size={12} />{" "}
              {t("upToStudents", { count: session.max_participants })}
            </>
          )}
        </span>
      </div>

      {(isLive || isUpcoming) && (
        <div className="justify-end flex border-t border-gray-200 pt-3">
          <button
            onClick={handleJoin}
            disabled={joining}
            className="btn btn-xs btn-info rounded-lg shadow-none text-white text-xs font-semibold gap-1 disabled:opacity-60"
          >
            <Video size={12} />
            {isLive ? t("joinNow") : t("joinSession")}
          </button>
        </div>
      )}

      {isPending && (
        <div className="justify-end flex border-t border-gray-200 pt-3">
          <button
            onClick={() => onCancel?.(session.id)}
            className="btn btn-xs btn-ghost rounded-lg shadow-none text-red-500 border border-red-200 text-xs font-semibold"
          >
            {t("cancelRequest")}
          </button>
        </div>
      )}
    </div>
  );
}

export default function StudentSessions() {
  const t = useTranslations("StudentSessionsPage");
  const locale = useLocale();
  const [activeTab, setActiveTab] = useState("upcoming");
  const {
    mySessions,
    mySessionsLoading,
    mySessionsError,
    fetchMySessions,
    cancelSession,
  } = useSessionStore();

  useEffect(() => {
    fetchMySessions();
  }, []);

  const upcoming = mySessions.filter((s) =>
    ["approved", "live"].includes(s.status),
  );
  const pending = mySessions.filter((s) => s.status === "pending");
  const past = mySessions.filter((s) =>
    ["completed", "rejected", "cancelled"].includes(s.status),
  );

  const tabSessions = { upcoming, pending, past };
  const current = tabSessions[activeTab] ?? [];

  const TABS = [
    { key: "upcoming", label: t("tabUpcoming") },
    { key: "pending", label: t("tabPending") },
    { key: "past", label: t("tabPast") },
  ];

  const handleCancel = async (id) => {
    await cancelSession(id);
  };

  return (
    <div className="py-10 bg-linear-to-br from-blue-50 via-white to-purple-50 min-h-screen px-2">
      <div className="container mx-auto ">
        <div className="flex items-center justify-end my-6">
          <Link
            href={`/${locale}/student/book-tutor`}
            className="btn btn-info shadow-none btn-sm rounded-lg gap-1"
          >
            <Plus size={14} /> {t("bookSessionButton")}
          </Link>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">
              {upcoming.length}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {t("upcomingLabel")}
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 text-center">
            <div className="text-2xl font-bold text-yellow-500">
              {pending.length}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {t("pendingApprovalLabel")}
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 text-center">
            <div className="text-2xl font-bold text-gray-500">
              {past.length}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {t("pastSessionsLabel")}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-1 bg-gray-100 p-1 rounded-lg w-fit mb-6">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                activeTab === tab.key
                  ? "bg-white text-gray-800 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {tab.label}
              {tabSessions[tab.key]?.length > 0 && (
                <span className="ml-1.5 bg-gray-200 text-gray-600 rounded-full px-1.5 py-0.5 text-[10px]">
                  {tabSessions[tab.key].length}
                </span>
              )}
            </button>
          ))}
        </div>

        {mySessionsError && (
          <div className="mb-4 p-3 rounded-lg bg-red-50 text-red-600 text-sm flex items-center justify-between gap-3">
            <span>{mySessionsError}</span>
            <button
              onClick={() => fetchMySessions()}
              className="btn btn-xs btn-ghost text-red-600 border border-red-200 rounded-lg shrink-0"
            >
              {t("retry") || "Retry"}
            </button>
          </div>
        )}

        {mySessionsLoading ? (
          <div className="flex justify-center py-16">
            <span className="loading loading-spinner loading-md text-slate-400" />
          </div>
        ) : current.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <Calendar size={40} className="mb-3 opacity-30" />
            <p className="text-sm font-medium">
              {t("noSessions", {
                tab: t(
                  `tab${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}`,
                ),
              })}
            </p>
            {activeTab === "upcoming" && (
              <p className="text-xs mt-1">{t("bookToGetStarted")}</p>
            )}
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 gap-4">
            {current.map((s) => (
              <SessionCard key={s.id} session={s} onCancel={handleCancel} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
