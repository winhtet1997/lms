import { create } from "zustand";
import { groupService } from "@/service/groupService";
import handleError from "@/lib/handleError";

export const useGroupStore = create((set, get) => ({
    groups: [],
    selectedGroup: null,
    availablePermissions: {},
    loading: false,
    detailLoading: false,
    permissionsLoading: false,
    error: null,

    fetchGroups: async () => {
        set({ loading: true, error: null });
        try {
            const data = await groupService.getGroups();
            set({ groups: data, loading: false });
        } catch (err) {
            set({ loading: false, error: handleError(err).message });
        }
    },

    fetchGroup: async (id) => {
        set({ detailLoading: true, error: null });
        try {
            const data = await groupService.getGroupById(id);
            set({ selectedGroup: data, detailLoading: false });
        } catch (err) {
            set({ detailLoading: false, error: handleError(err).message });
        }
    },

    createGroup: async (payload) => {
        const data = await groupService.createGroup(payload);
        set((state) => ({
            groups: [
                ...state.groups,
                {
                    id: data.id,
                    name: data.name,
                    description: data.description,
                    user_count: data.user_count,
                    permission_count: data.permission_count,
                    created_at: data.created_at,
                    updated_at: data.updated_at,
                },
            ],
            selectedGroup: data,
        }));
        return data;
    },

    updateGroup: async (id, payload) => {
        const data = await groupService.updateGroup(id, payload);
        set((state) => ({
            groups: state.groups.map((g) =>
                g.id === id
                    ? {
                          ...g,
                          name: data.name,
                          description: data.description,
                          user_count: data.user_count,
                          permission_count: data.permission_count,
                          updated_at: data.updated_at,
                      }
                    : g
            ),
            selectedGroup: data,
        }));
        return data;
    },

    deleteGroup: async (id) => {
        await groupService.deleteGroup(id);
        set((state) => ({
            groups: state.groups.filter((g) => g.id !== id),
            selectedGroup:
                state.selectedGroup?.id === id ? null : state.selectedGroup,
        }));
    },

    fetchAvailablePermissions: async () => {
        if (Object.keys(get().availablePermissions).length > 0) return;
        set({ permissionsLoading: true });
        try {
            const data = await groupService.getAvailablePermissions();
            set({ availablePermissions: data, permissionsLoading: false });
        } catch (err) {
            set({ permissionsLoading: false, error: handleError(err).message });
        }
    },

    setSelectedGroup: (group) => set({ selectedGroup: group }),
}));
