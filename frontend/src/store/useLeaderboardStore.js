import { create } from "zustand";
import { leaderboardService } from "@/service/leaderboardService";
import handleError from "@/lib/handleError";

export const useLeaderboardStore = create((set) => ({
    entries: [],
    totalCount: 0,
    totalPages: 1,
    page: 1,
    loading: false,

    gradeEntries: [],
    gradeTotalCount: 0,
    gradeTotalPages: 1,
    gradePage: 1,
    gradeLevel: null,
    gradeLoading: false,
    gradeError: null,

    myStats: null,
    myStatsLoading: false,

    error: null,

    fetchLeaderboard: async (params = {}) => {
        set({ loading: true, error: null });
        try {
            const data = await leaderboardService.getLeaderboard(params);
            set({
                entries: data.results,
                totalCount: data.total_count,
                totalPages: data.total_pages,
                page: data.page,
                loading: false,
            });
        } catch (err) {
            set({ loading: false, error: handleError(err).message });
        }
    },

    fetchGradeLeaderboard: async (params = {}) => {
        set({ gradeLoading: true, gradeError: null });
        try {
            const data = await leaderboardService.getGradeLeaderboard(params);
            set({
                gradeEntries: data.results,
                gradeTotalCount: data.total_count,
                gradeTotalPages: data.total_pages,
                gradePage: data.page,
                gradeLevel: data.grade_level,
                gradeLoading: false,
            });
        } catch (err) {
            set({
                gradeEntries: [],
                gradeLoading: false,
                gradeError: handleError(err).message,
            });
        }
    },

    fetchMyStats: async () => {
        set({ myStatsLoading: true, error: null });
        try {
            const data = await leaderboardService.getMyStats();
            set({ myStats: data, myStatsLoading: false });
        } catch (err) {
            set({ myStatsLoading: false, error: handleError(err).message });
        }
    },
}));
