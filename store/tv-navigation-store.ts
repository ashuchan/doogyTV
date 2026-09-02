import { create } from "zustand";

export interface TVNavigationState {
  activeZone: "content" | "sidebar";
  sidebarIndex: number;
  lastFocusedCardKey: string | null;
  setActiveZone: (zone: "content" | "sidebar") => void;
  setSidebarIndex: (index: number) => void;
  setLastFocusedCardKey: (key: string | null) => void;
}

export const useTVNavigationStore = create<TVNavigationState>((set) => ({
  activeZone: "content",
  sidebarIndex: 0,
  lastFocusedCardKey: null,
  setActiveZone: (zone) => set({ activeZone: zone }),
  setSidebarIndex: (index) => set({ sidebarIndex: index }),
  setLastFocusedCardKey: (key) => set({ lastFocusedCardKey: key }),
}));
