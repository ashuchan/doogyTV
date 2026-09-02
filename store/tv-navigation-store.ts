import { create } from "zustand";

export interface TVNavigationState {
  activeZone: "content" | "sidebar";
  sidebarIndex: number;
  setActiveZone: (zone: "content" | "sidebar") => void;
  setSidebarIndex: (index: number) => void;
}

export const useTVNavigationStore = create<TVNavigationState>((set) => ({
  activeZone: "content",
  sidebarIndex: 0,
  setActiveZone: (zone) => set({ activeZone: zone }),
  setSidebarIndex: (index) => set({ sidebarIndex: index }),
}));
