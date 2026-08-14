import { create } from 'zustand';

export type RightPanelView = 'chat' | 'agent';

interface UIState {
  sidebarVisible: boolean;
  sidebarWidth: number;
  rightPanelWidth: number;
  rightView: RightPanelView;
  toggleSidebar: () => void;
  setSidebarWidth: (width: number) => void;
  setRightPanelWidth: (width: number) => void;
  setRightView: (view: RightPanelView) => void;
}

export const useUIStore = create<UIState>((set, get) => ({
  sidebarVisible: true,
  sidebarWidth: 250,
  rightPanelWidth: 400,
  rightView: 'chat',

  toggleSidebar: () => {
    set({ sidebarVisible: !get().sidebarVisible });
  },

  setSidebarWidth: (width) => {
    set({ sidebarWidth: Math.min(500, Math.max(180, width)) });
  },

  setRightPanelWidth: (width) => {
    set({ rightPanelWidth: Math.min(600, Math.max(300, width)) });
  },

  setRightView: (view) => {
    set({ rightView: view });
  },
}));

export default useUIStore;
