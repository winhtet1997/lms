import { create } from "zustand";
import { parentService } from "@/service/parentService";
import handleError from "@/lib/handleError";

export const useParentStore = create((set, get) => ({
  children: [],
  loading: false,
  error: null,

  fetchChildren: async () => {
    set({ loading: true, error: null });
    try {
      const data = await parentService.getChildren();
      set({ children: data, loading: false });
    } catch (err) {
      set({ loading: false, error: handleError(err).message });
    }
  },

  createChild: async (payload) => {
    const data = await parentService.createChild(payload);
    set((state) => ({ children: [...state.children, data] }));
    return data;
  },

  linkChild: async (payload) => {
    const data = await parentService.linkChild(payload);
    set((state) => ({ children: [...state.children, data] }));
    return data;
  },

  unlinkChild: async (id) => {
    await parentService.unlinkChild(id);
    set((state) => ({ children: state.children.filter((c) => c.id !== id) }));
  },
}));
