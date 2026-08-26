"use client";
import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { sessionService } from "@/service/sessionService";
import { Loader2, Clock, AlertCircle, CalendarX } from "lucide-react";

function isSessionExpired(session) {
    if (!session?.scheduled_at || !session?.duration_minutes) return false;
    const end = new Date(session.scheduled_at).getTime() + session.duration_minutes * 60 * 1000;
    return Date.now() > end;
}

function LoadingScreen() {
    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3 text-gray-400">
            <Loader2 size={32} className="animate-spin" />
            <p className="text-sm">Connecting to session…</p>
        </div>
    );
}

function WaitingScreen({ onRetry }) {
    const router = useRouter();
    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-gray-500">
            <div className="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center">
                <Clock size={28} className="text-blue-400" />
            </div>
            <div className="text-center">
                <p className="font-semibold text-gray-700">Waiting for your tutor</p>
                <p className="text-sm mt-1 text-gray-400">The session will start once the tutor joins.</p>
            </div>
            <button onClick={onRetry} className="btn btn-sm btn-outline rounded-lg mt-2">Retry</button>
            <button onClick={() => router.back()} className="text-xs text-gray-400 hover:text-gray-600 underline">
                Back to sessions
            </button>
        </div>
    );
}

function ExpiredScreen() {
    const router = useRouter();
    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-gray-500">
            <div className="w-16 h-16 rounded-full bg-orange-50 flex items-center justify-center">
                <CalendarX size={28} className="text-orange-400" />
            </div>
            <div className="text-center">
                <p className="font-semibold text-gray-700">Session has expired</p>
                <p className="text-sm mt-1 text-gray-400">The scheduled time for this session has already passed.</p>
            </div>
            <button onClick={() => router.back()} className="btn btn-sm btn-outline rounded-lg">Go Back</button>
        </div>
    );
}

function ErrorScreen({ error }) {
    const router = useRouter();
    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-gray-500">
            <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center">
                <AlertCircle size={28} className="text-red-400" />
            </div>
            <div className="p-4 rounded-xl bg-red-50 text-red-600 text-sm max-w-sm text-center">{error}</div>
            <button onClick={() => router.back()} className="btn btn-sm btn-ghost rounded-lg">Back to sessions</button>
        </div>
    );
}

export default function SessionRoomPage() {
    const { id } = useParams();
    const [state, setState] = useState("loading");
    const [error, setError] = useState(null);

    const join = useCallback(() => {
        setState("loading");
        setError(null);
        sessionService.getSession(id)
            .then(sessionData => {
                if (isSessionExpired(sessionData)) {
                    setState("expired");
                    return;
                }
                return sessionService.joinSession(id).then(data => {
                    const url = data.token ? `${data.room_url}?t=${data.token}` : data.room_url;
                    window.location.replace(url);
                });
            })
            .catch(err => {
                const msg = err?.response?.data?.error || err?.response?.data?.detail || "Unable to join session.";
                setState(err?.response?.status === 400 ? "waiting" : "error");
                setError(msg);
            });
    }, [id]);

    useEffect(() => { if (id) join(); }, [join, id]);

    if (state === "loading") return <LoadingScreen />;
    if (state === "expired") return <ExpiredScreen />;
    if (state === "waiting") return <WaitingScreen onRetry={join} />;
    return <ErrorScreen error={error} />;
}
