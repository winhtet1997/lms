import apiClient from "@/lib/api";

export const leaderboardService = {
    getLeaderboard: async (params = {}) => {
        const { data } = await apiClient.get("/leaderboard/", { params });
        return data;
    },
    getGradeLeaderboard: async (params = {}) => {
        const { data } = await apiClient.get("/leaderboard/grade/", { params });
        return data;
    },
    getMyStats: async () => {
        const { data } = await apiClient.get("/leaderboard/me/");
        return data;
    },
};
