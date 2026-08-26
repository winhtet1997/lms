import { create } from "zustand";
import { sessionService } from "@/service/sessionService";
import handleError from "@/lib/handleError";

function formatDate(isoString) {
    if (!isoString) return "—";
    return new Date(isoString).toLocaleDateString("en-CA");
}

function formatTime(isoString) {
    if (!isoString) return "—";
    return new Date(isoString).toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
    });
}

function normalizeSession(s) {
    return {
        ...s,
        title: s.topic || `${s.session_type_label} Session`,
        tutor: s.tutor?.full_name || s.tutor?.username || "—",
        student: s.host_student?.full_name || s.host_student?.username || "—",
        students: (s.participants?.length ?? 0) + 1,
        date: formatDate(s.scheduled_at),
        time: formatTime(s.scheduled_at),
        displayStatus: ["approved", "live"].includes(s.status) ? "upcoming" : "not_approved",
    };
}

export const useSessionStore = create((set, get) => ({
    // --- admin dashboard ---
    stats: null,
    groupSessions: [],
    privateSessions: [],
    notApprovedSessions: [],
    completedSessions: [],

    // --- student ---
    mySessions: [],
    mySessionsLoading: false,
    mySessionsError: null,

    loading: false,
    error: null,

    fetchTutorDashboard: async () => {
        set({ loading: true, error: null });
        try {
            const [stats, all] = await Promise.all([
                sessionService.getTutorStats(),
                sessionService.getTutorSessions(),
            ]);

            const active    = all.filter(s => ["approved", "live"].includes(s.status));
            const pending   = all.filter(s => s.status === "pending");
            const completed = all.filter(s => s.status === "completed");

            set({
                stats,
                groupSessions:       active.filter(s => s.session_type === "group").map(normalizeSession),
                privateSessions:     active.filter(s => s.session_type === "private").map(normalizeSession),
                notApprovedSessions: pending.map(normalizeSession),
                completedSessions:   completed,
                loading: false,
            });
        } catch (e) {
            const { message } = handleError(e);
            set({ error: message, loading: false });
        }
    },

    fetchDashboard: async () => {
        set({ loading: true, error: null });
        try {
            const [stats, all] = await Promise.all([
                sessionService.getAdminStats(),
                sessionService.getAdminSessions(),
            ]);

            const active    = all.filter(s => ["approved", "live"].includes(s.status));
            const pending   = all.filter(s => s.status === "pending");
            const completed = all.filter(s => s.status === "completed");

            set({
                stats,
                groupSessions:       active.filter(s => s.session_type === "group").map(normalizeSession),
                privateSessions:     active.filter(s => s.session_type === "private").map(normalizeSession),
                notApprovedSessions: pending.map(normalizeSession),
                completedSessions:   completed,
                loading: false,
            });
        } catch (e) {
            const { message } = handleError(e);
            set({ error: message, loading: false });
        }
    },

    approveSession: async (id, isTutor = false) => {
        try {
            await sessionService.approveSession(id);
            await (isTutor ? get().fetchTutorDashboard() : get().fetchDashboard());
            return { success: true };
        } catch (e) {
            const { message } = handleError(e);
            return { success: false, error: message };
        }
    },

    rejectSession: async (id, isTutor = false) => {
        try {
            await sessionService.rejectSession(id);
            await (isTutor ? get().fetchTutorDashboard() : get().fetchDashboard());
            return { success: true };
        } catch (e) {
            const { message } = handleError(e);
            return { success: false, error: message };
        }
    },

    endSession: async (id, isTutor = false) => {
        try {
            await sessionService.endSession(id);
            await (isTutor ? get().fetchTutorDashboard() : get().fetchDashboard());
            return { success: true };
        } catch (e) {
            const { message } = handleError(e);
            return { success: false, error: message };
        }
    },

    // --- student actions ---
    fetchMySessions: async () => {
        set({ mySessionsLoading: true, mySessionsError: null });
        try {
            const data = await sessionService.getMySessions();
            set({ mySessions: data, mySessionsLoading: false });
        } catch (e) {
            const { message } = handleError(e);
            set({ mySessionsError: message, mySessionsLoading: false });
        }
    },

    cancelSession: async (id) => {
        try {
            await sessionService.cancelSession(id);
            await get().fetchMySessions();
            return { success: true };
        } catch (e) {
            const { message } = handleError(e);
            return { success: false, error: message };
        }
    },
}));
