import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export const useNavigationHistoryStore = create(
  persist(
    (set) => ({
      previousPath: null,
      setPreviousPath: (path) => set({ previousPath: path }),
    }),
    {
      name: "navigation-history",
      storage: createJSONStorage(() => sessionStorage),
    }
  )
);
