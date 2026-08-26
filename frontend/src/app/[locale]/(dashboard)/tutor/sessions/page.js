"use client";
import React, { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { sessionService } from "@/service/sessionService";
import { Calendar, Clock, User, Users, Video, CheckCircle, XCircle, PhoneOff } from "lucide-react";

const STATUS_CLASSES = {
    pending:   "bg-yellow-100 text-yellow-700",
    approved:  "bg-blue-100 text-blue-700",
    live:      "bg-green-100 text-green-700",
    completed: "bg-gray-100 text-gray-600",
    rejected:  "bg-red-100 text-red-600",
    cancelled: "bg-gray-100 text-gray-400",
};

const STATUS_LABEL_KEYS = {
    pending:   "statusPending",
    approved:  "statusApproved",
    live:      "statusLive",
    completed: "statusCompleted",
    rejected:  "statusRejected",
    cancelled: "statusCancelled",
};

function StatusBadge({ status }) {
    const t = useTranslations("TutorSessionsPage");
    const className = STATUS_CLASSES[status] ?? "bg-gray-100 text-gray-500";
    const labelKey = STATUS_LABEL_KEYS[status];
    return (
        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${className}`}>
            {labelKey ? t(labelKey) : status}
        </span>
    );
}

function SessionCard({ session, onApprove, onReject, onEnd, busy }) {
    const t = useTranslations("TutorSessionsPage");
    const locale = useLocale();
    const dt = new Date(session.scheduled_at);
    const date = dt.toLocaleDateString("en-CA");
    const time = dt.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
    const studentName = session.host_student?.full_name || session.host_student?.username || "—";

    return (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 flex flex-col gap-3">
            <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-800 text-sm truncate">
                        {session.topic || `${session.session_type_label} Session`}
                    </h3>
                    <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1">
                        <User size={11} /> {studentName}
                    </p>
                </div>
                <StatusBadge status={session.status} />
            </div>

            <div className="flex flex-wrap gap-3 text-xs text-gray-500">
                <span className="flex items-center gap-1"><Calendar size={12} /> {date}</span>
                <span className="flex items-center gap-1"><Clock size={12} /> {time}</span>
                <span className="flex items-center gap-1">
                    {session.session_type === "group"
                        ? <><Users size={12} /> {t("typeGroup")}</>
                        : <><User size={12} /> {t("typePrivate")}</>}
                </span>
            </div>

            {session.status === "pending" && (
                <div className="flex gap-2 mt-1">
                    <button
                        onClick={() => onApprove(session.id)}
                        disabled={busy}
                        className="btn btn-xs btn-success rounded-lg text-white gap-1 disabled:opacity-40"
                    >
                        <CheckCircle size={12} /> {t("approveButton")}
                    </button>
                    <button
                        onClick={() => onReject(session.id)}
                        disabled={busy}
                        className="btn btn-xs btn-error rounded-lg text-white gap-1 disabled:opacity-40"
                    >
                        <XCircle size={12} /> {t("rejectButton")}
                    </button>
                </div>
            )}

            {["approved", "live"].includes(session.status) && (
                <div className="flex gap-2 mt-1">
                    <button
                        onClick={() => window.open(`/${locale}/dashboard/sessions/${session.id}`, "_blank")}
                        className="btn btn-xs btn-info rounded-lg text-white gap-1"
                    >
                        <Video size={12} /> {session.status === "live" ? t("joinNow") : t("startSession")}
                    </button>
                    {session.status === "live" && (
                        <button
                            onClick={() => onEnd(session.id)}
                            disabled={busy}
                            className="btn btn-xs btn-error rounded-lg text-white gap-1 disabled:opacity-40"
                        >
                            <PhoneOff size={12} /> {t("endButton")}
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}

export default function TutorSessionsPage() {
    const t = useTranslations("TutorSessionsPage");
    const [sessions, setSessions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [busyId, setBusyId] = useState(null);
    const [activeTab, setActiveTab] = useState("pending");

    const fetchSessions = async () => {
        try {
            const all = await sessionService.getTutorSessions();
            setSessions(all);
        } catch {
            setSessions([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchSessions(); }, []);

    const handleApprove = async (id) => {
        setBusyId(id);
        try { await sessionService.approveSession(id); await fetchSessions(); }
        finally { setBusyId(null); }
    };

    const handleReject = async (id) => {
        setBusyId(id);
        try { await sessionService.rejectSession(id); await fetchSessions(); }
        finally { setBusyId(null); }
    };

    const handleEnd = async (id) => {
        setBusyId(id);
        try { await sessionService.endSession(id); await fetchSessions(); }
        finally { setBusyId(null); }
    };

    const tabSessions = {
        pending:  sessions.filter(s => s.status === "pending"),
        upcoming: sessions.filter(s => ["approved", "live"].includes(s.status)),
        past:     sessions.filter(s => ["completed", "rejected", "cancelled"].includes(s.status)),
    };
    const current = tabSessions[activeTab] ?? [];

    const TABS = [
        { key: "pending",  label: t("tabPending") },
        { key: "upcoming", label: t("tabUpcoming") },
        { key: "past",     label: t("tabPast") },
    ];

    return (
        <div className="max-w-3xl mx-auto">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">{t("pageTitle")}</h1>
                    <p className="text-sm text-gray-500 mt-1">{t("pageSubtitle")}</p>
                </div>
            </div>

            <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 text-center">
                    <div className="text-2xl font-bold text-yellow-500">{tabSessions.pending.length}</div>
                    <div className="text-xs text-gray-500 mt-1">{t("pendingLabel")}</div>
                </div>
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 text-center">
                    <div className="text-2xl font-bold text-blue-600">{tabSessions.upcoming.length}</div>
                    <div className="text-xs text-gray-500 mt-1">{t("upcomingLabel")}</div>
                </div>
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 text-center">
                    <div className="text-2xl font-bold text-gray-500">{tabSessions.past.length}</div>
                    <div className="text-xs text-gray-500 mt-1">{t("pastLabel")}</div>
                </div>
            </div>

            <div className="flex gap-1 bg-gray-100 p-1 rounded-lg w-fit mb-6">
                {TABS.map(tab => (
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

            {loading ? (
                <div className="flex justify-center py-16">
                    <span className="loading loading-spinner loading-md text-slate-400" />
                </div>
            ) : current.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                    <Calendar size={40} className="mb-3 opacity-30" />
                    <p className="text-sm font-medium">{t("noSessions", { tab: t(`tab${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}`) })}</p>
                </div>
            ) : (
                <div className="grid sm:grid-cols-2 gap-4">
                    {current.map(s => (
                        <SessionCard
                            key={s.id}
                            session={s}
                            onApprove={handleApprove}
                            onReject={handleReject}
                            onEnd={handleEnd}
                            busy={busyId === s.id}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
