"use client";
import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { sessionService } from "@/service/sessionService";
import { Loader2, Clock, AlertCircle, CalendarX } from "lucide-react";

function isSessionExpired(session) {
    if (!session?.scheduled_at || !session?.duration_minutes) return false;
    const end = new Date(session.scheduled_at).getTime() + session.duration_minutes * 60 * 1000;
    return Date.now() > end;
}

function LoadingScreen() {
    const t = useTranslations("DashboardSessionRoomPage");
    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3 text-gray-400">
            <Loader2 size={32} className="animate-spin" />
            <p className="text-sm">{t("connecting")}</p>
        </div>
    );
}

function WaitingScreen({ error, onRetry }) {
    const t = useTranslations("DashboardSessionRoomPage");
    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-gray-500">
            <div className="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center">
                <Clock size={28} className="text-blue-400" />
            </div>
            <div className="text-center">
                <p className="font-semibold text-gray-700">{t("sessionNotReady")}</p>
                <p className="text-sm mt-1 text-gray-400">{error}</p>
            </div>
            <button onClick={onRetry} className="btn btn-sm btn-outline rounded-lg mt-2">{t("retry")}</button>
        </div>
    );
}

function ExpiredScreen() {
    const t = useTranslations("DashboardSessionRoomPage");
    const router = useRouter();
    const locale = useLocale();
    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-gray-500">
            <div className="w-16 h-16 rounded-full bg-orange-50 flex items-center justify-center">
                <CalendarX size={28} className="text-orange-400" />
            </div>
            <div className="text-center">
                <p className="font-semibold text-gray-700">{t("sessionExpired")}</p>
                <p className="text-sm mt-1 text-gray-400">{t("sessionExpiredDesc")}</p>
            </div>
            <button onClick={() => router.push(`/${locale}/dashboard/session-management`)} className="btn btn-sm btn-outline rounded-lg">{t("goBack")}</button>
        </div>
    );
}

function ErrorScreen({ error }) {
    const t = useTranslations("DashboardSessionRoomPage");
    const router = useRouter();
    const locale = useLocale();
    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-gray-500">
            <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center">
                <AlertCircle size={28} className="text-red-400" />
            </div>
            <div className="p-4 rounded-xl bg-red-50 text-red-600 text-sm max-w-sm text-center">{error}</div>
            <button onClick={() => router.push(`/${locale}/dashboard/session-management`)} className="btn btn-sm btn-ghost rounded-lg">{t("close")}</button>
        </div>
    );
}

export default function DashboardSessionRoomPage() {
    const { id } = useParams();
    const [state, setState] = useState("loading");
    const [error, setError] = useState(null);

    const join = useCallback(() => {
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

    const handleRetry = useCallback(() => {
        setState("loading");
        setError(null);
        join();
    }, [join]);

    useEffect(() => { if (id) join(); }, [join, id]);

    if (state === "loading") return <LoadingScreen />;
    if (state === "expired") return <ExpiredScreen />;
    if (state === "waiting") return <WaitingScreen error={error} onRetry={handleRetry} />;
    return <ErrorScreen error={error} />;
}
