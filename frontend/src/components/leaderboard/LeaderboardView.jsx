"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import {
    Trophy,
    Crown,
    Medal,
    Users,
    GraduationCap,
    ChevronDown,
    Sparkles,
    UserPlus,
    UserCheck,
    CalendarCheck,
    CheckCircle2,
    BookOpen,
    FileQuestionMark,
    Info,
    X,
} from "lucide-react";
import { useLeaderboardStore } from "@/store/useLeaderboardStore";
import { useAuthStore } from "@/store/useAuthStore";
import { resolveMediaUrl } from "@/lib/media";
import LeaderboardBreadcrumb from "./LeaderboardBreadcrumb";

const POINT_TABLE = [
    { key: "eventRegistration", points: 500, countsTowardGrade: false, icon: UserPlus },
    { key: "eventProfileComplete", points: 200, countsTowardGrade: false, icon: UserCheck },
    { key: "eventDailyLogin", points: 100, countsTowardGrade: false, icon: CalendarCheck },
    { key: "eventDailyQuiz", points: 200, countsTowardGrade: true, icon: FileQuestionMark },
    { key: "eventItemComplete", points: 300, countsTowardGrade: true, icon: CheckCircle2 },
    { key: "eventChapterComplete", points: 500, countsTowardGrade: true, icon: BookOpen },
    { key: "eventCourseComplete", points: 1000, countsTowardGrade: true, icon: GraduationCap },
];

const GRADE_OPTIONS = [6, 7, 8, 9, 10, 11, 12];

const RANK_BADGE_STYLES = {
    1: "bg-gradient-to-br from-yellow-400 to-amber-500 text-white shadow-sm shadow-amber-200",
    2: "bg-slate-200 text-slate-600",
    3: "bg-amber-200 text-amber-700",
};

const RANK_RING_STYLES = {
    1: "ring-2 ring-amber-400",
    2: "ring-2 ring-slate-300",
    3: "ring-2 ring-amber-300",
};

const RankBadge = ({ rank }) => {
    if (rank === 1) {
        return (
            <span
                className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${RANK_BADGE_STYLES[1]}`}
            >
                <Crown size={15} fill="currentColor" />
            </span>
        );
    }
    if (rank === 2 || rank === 3) {
        return (
            <span
                className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${RANK_BADGE_STYLES[rank]}`}
            >
                <Medal size={15} />
            </span>
        );
    }
    return (
        <span className="w-8 h-8 rounded-full border border-gray-200 bg-gray-50 text-gray-500 flex items-center justify-center shrink-0 text-xs font-bold">
            {rank}
        </span>
    );
};

const EmptyPanel = ({ icon: Icon, message }) => (
    <div className="flex flex-col items-center justify-center gap-2 px-5 py-12 text-center">
        <div className="w-11 h-11 rounded-full bg-gray-100 text-gray-300 flex items-center justify-center">
            <Icon size={20} />
        </div>
        <p className="text-sm text-gray-400">{message}</p>
    </div>
);

const PointsList = ({ t }) => (
    <ul className="space-y-2.5">
        {POINT_TABLE.map((row) => {
            const Icon = row.icon;
            return (
                <li key={row.key} className="flex items-center gap-3">
                    <span className="w-8 h-8 rounded-full bg-gray-50 border border-gray-100 text-gray-400 flex items-center justify-center shrink-0">
                        <Icon size={14} />
                    </span>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-700">{t(row.key)}</p>
                        {row.countsTowardGrade && (
                            <p className="text-[10px] font-medium text-emerald-600">
                                {t("countsTowardGradeBadge")}
                            </p>
                        )}
                    </div>
                    <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full whitespace-nowrap shrink-0">
                        +{row.points}
                    </span>
                </li>
            );
        })}
    </ul>
);


// --- UI OPTION B: circular info icon that opens a modal. Remove its render call below to drop this option. ---
const HowToEarnInfoButton = ({ t }) => {
    const [open, setOpen] = useState(false);

    return (
        <>
            <button
                type="button"
                onClick={() => setOpen(true)}
                className="flex items-center gap-2 rounded-full border border-gray-200 bg-white pl-1.5 pr-3 py-1.5 text-xs font-semibold text-gray-600 shadow-sm hover:border-blue-200 hover:text-blue-600 transition-colors shrink-0"
            >
                <span className="w-6 h-6 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center shrink-0">
                    <Info size={13} />
                </span>
                {t("howToEarnHeading")}
            </button>

            {open && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
                    onClick={() => setOpen(false)}
                >
                    <div
                        className="bg-white rounded-2xl shadow-xl w-full max-w-xl max-h-[80vh] overflow-y-auto p-5"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-gray-500">
                                <Sparkles size={13} className="text-amber-400" />
                                {t("howToEarnHeading")}
                            </h3>
                            <button
                                type="button"
                                onClick={() => setOpen(false)}
                                aria-label="Close"
                                className="text-gray-400 hover:text-gray-600"
                            >
                                <X size={16} />
                            </button>
                        </div>
                        <PointsList t={t} />
                    </div>
                </div>
            )}
        </>
    );
};

export default function LeaderboardView() {
    const t = useTranslations("LeaderboardPage");
    const { user } = useAuthStore();
    const isStudent = user?.role === "Student";
    const [activeTab, setActiveTab] = useState("combined");
    const [selectedGrade, setSelectedGrade] = useState("");
    const [hasAppliedDefaults, setHasAppliedDefaults] = useState(false);
    const {
        entries,
        loading,
        myStats,
        gradeEntries,
        gradeLoading,
        gradeLevel,
        gradeError,
        fetchLeaderboard,
        fetchGradeLeaderboard,
        fetchMyStats,
    } = useLeaderboardStore();

    useEffect(() => {
        fetchLeaderboard();
        if (isStudent) fetchMyStats();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isStudent]);

    // Default a student straight into their own grade's leaderboard the first time
    // their profile becomes available; afterwards they're free to pick any grade.
    if (!hasAppliedDefaults && user) {
        setHasAppliedDefaults(true);
        if (isStudent && user.grade_level) {
            setActiveTab("grade");
            setSelectedGrade(user.grade_level);
        }
    }

    useEffect(() => {
        if (activeTab !== "grade" || !selectedGrade) return;
        fetchGradeLeaderboard({ grade_level: selectedGrade });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeTab, selectedGrade]);

    const isGradeTab = activeTab === "grade";
    const listEntries = isGradeTab ? gradeEntries : entries;
    const listLoading = isGradeTab ? gradeLoading : loading;
    const awaitingGradeSelection = isGradeTab && !selectedGrade;
    const isOwnGrade = isStudent && selectedGrade === user?.grade_level;
    const showPersonalStats = isStudent && (activeTab === "combined" || isOwnGrade);

    return (
        <div className="max-w-4xl mx-auto">
            <LeaderboardBreadcrumb />
            <div className="flex items-center justify-between gap-3 flex-wrap mb-6">
                <div className="flex items-center gap-3 flex-wrap">
                    <div className="inline-flex items-center gap-1 bg-gray-100 rounded-lg p-1">
                        <button
                            onClick={() => setActiveTab("combined")}
                            className={`flex items-center gap-1.5 rounded-lg px-4 py-1.5 text-sm font-semibold transition-colors ${
                                activeTab === "combined"
                                    ? "bg-white text-info shadow-sm"
                                    : "text-gray-500 hover:text-gray-700"
                            }`}
                        >
                            <Users size={14} />
                            {t("combinedTab")}
                        </button>
                        <button
                            onClick={() => setActiveTab("grade")}
                            className={`flex items-center gap-1.5 rounded-lg px-4 py-1.5 text-sm font-semibold transition-colors ${
                                isGradeTab
                                    ? "bg-white text-info shadow-sm"
                                    : "text-gray-500 hover:text-gray-700"
                            }`}
                        >
                            <GraduationCap size={14} />
                            {t("gradeTab")}
                        </button>
                    </div>

                    {isGradeTab && (
                        <div className="relative inline-block">
                            <select
                                className="appearance-none bg-white border border-gray-200 rounded-lg pl-4 pr-9 py-1.5 text-sm font-medium text-gray-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300"
                                value={selectedGrade}
                                onChange={(e) => setSelectedGrade(e.target.value)}
                            >
                                <option value="">{t("selectGradePrompt")}</option>
                                {GRADE_OPTIONS.map((g) => (
                                    <option key={g} value={String(g)}>
                                        {t("gradeLabel")} {g}
                                    </option>
                                ))}
                            </select>
                            <ChevronDown
                                size={15}
                                className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                            />
                        </div>
                    )}
                </div>

                {/* UI OPTION B render call — delete this line to remove the info-icon/modal option */}
                <HowToEarnInfoButton t={t} />
            </div>

            {showPersonalStats ? (
                <div className="space-y-6 mb-6">
                    <div className="relative overflow-hidden bg-gradient-to-r from-indigo-100 via-white to-purple-100 rounded-2xl p-5 shadow-sm text-gray-800">
                        <Trophy
                            size={96}
                            className="absolute -right-4 -bottom-6 text-indigo-200 rotate-12"
                        />
                        <div className="relative flex items-center gap-2 mb-4">
                            <div className="bg-indigo-500/10 text-indigo-600 p-1.5 rounded-lg">
                                <Trophy size={14} />
                            </div>
                            <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-500">
                                {isGradeTab
                                    ? t("yourGradeStatsHeading", { grade: user?.grade_level ?? "" })
                                    : t("yourStatsHeading")}
                            </h3>
                        </div>
                        {myStats ? (
                            <div className="relative flex items-center gap-8">
                                <div>
                                    <p className="text-3xl font-extrabold tracking-tight">
                                        #{isGradeTab ? myStats.grade_rank ?? "-" : myStats.rank}
                                    </p>
                                    <p className="text-xs text-gray-500">{t("rankLabel")}</p>
                                </div>
                                <div className="w-px h-10 bg-gray-200" />
                                <div>
                                    <p className="text-3xl font-extrabold tracking-tight">
                                        {isGradeTab ? myStats.grade_points : myStats.total_points}
                                    </p>
                                    <p className="text-xs text-gray-500">{t("pointsLabel")}</p>
                                </div>
                            </div>
                        ) : (
                            <p className="relative text-sm text-gray-500">{t("loadingStats")}</p>
                        )}
                    </div>
                </div>
            ) : (
                <div className="mb-6 space-y-3">
                    <p className="text-sm text-gray-500">
                        {!isStudent
                            ? t("viewOnlyNote")
                            : t("viewingOtherGradeNote", { grade: selectedGrade })}
                    </p>
                </div>
            )}

            <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
                <div className="px-5 py-4 border-b border-gray-100">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500">
                        {isGradeTab
                            ? t("gradeRankingsHeading", { grade: gradeLevel ?? user?.grade_level ?? "" })
                            : t("rankingsHeading")}
                    </h3>
                </div>

                {awaitingGradeSelection ? (
                    <EmptyPanel icon={GraduationCap} message={t("selectGradePrompt")} />
                ) : listLoading ? (
                    <EmptyPanel icon={Trophy} message={t("loading")} />
                ) : gradeError && isGradeTab ? (
                    <EmptyPanel icon={Trophy} message={gradeError} />
                ) : listEntries.length === 0 ? (
                    <EmptyPanel icon={Trophy} message={t("emptyState")} />
                ) : (
                    <ul className="divide-y divide-gray-100">
                        {listEntries.map((entry) => {
                            const isMe = isStudent && entry.user_id === user?.id;
                            return (
                                <li
                                    key={entry.user_id}
                                    className={`flex items-center gap-4 px-5 py-3 transition-colors ${
                                        isMe ? "bg-blue-50/60" : "hover:bg-gray-50"
                                    }`}
                                >
                                    <RankBadge rank={entry.rank} />
                                    <div
                                        className={`w-10 h-10 rounded-full bg-gray-100 overflow-hidden flex items-center justify-center shrink-0 ${
                                            RANK_RING_STYLES[entry.rank] || ""
                                        }`}
                                    >
                                        {entry.avatar ? (
                                            <img
                                                src={resolveMediaUrl(entry.avatar)}
                                                alt={entry.username}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <span className="text-xs text-gray-400">
                                                {(entry.full_name || entry.username || "?")
                                                    .charAt(0)
                                                    .toUpperCase()}
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-semibold text-gray-800 truncate flex items-center">
                                            {entry.full_name || entry.username}
                                            {isMe && (
                                                <span className="ml-2 text-[10px] font-semibold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded-full">
                                                    {t("youLabel")}
                                                </span>
                                            )}
                                        </p>
                                        {entry.grade_level && (
                                            <p className="text-xs text-gray-400">
                                                {t("gradeLabel")} {entry.grade_level}
                                            </p>
                                        )}
                                    </div>
                                    <span className="font-bold text-gray-800 whitespace-nowrap">
                                        {entry.total_points}
                                        <span className="text-xs font-medium text-gray-400 ml-1">
                                            {t("pointsLabel")}
                                        </span>
                                    </span>
                                </li>
                            );
                        })}
                    </ul>
                )}
            </div>
        </div>
    );
}
