import { create } from 'zustand';

export interface TerminalTab {
  id: string;
  name: string;
  cwd: string;
  isActive: boolean;
}

interface TerminalState {
  tabs: TerminalTab[];
  activeTabId: string | null;
  isPanelOpen: boolean;

  addTab: (cwd?: string) => string;
  closeTab: (id: string) => void;
  activateTab: (id: string) => void;
  renameTab: (id: string, name: string) => void;
  setPanelOpen: (open: boolean) => void;
  getActiveTab: () => TerminalTab | null;
}

export const useTerminalStore = create<TerminalState>((set, get) => ({
  tabs: [],
  activeTabId: null,
  isPanelOpen: false,

  addTab: (cwd = process.env.HOME || '/root') => {
    const id = `term-${Date.now()}`;
    const name = `Terminal ${get().tabs.length + 1}`;
    const newTab: TerminalTab = { id, name, cwd, isActive: true };

    set((state) => ({
      tabs: [...state.tabs.map((t) => ({ ...t, isActive: false })), newTab],
      activeTabId: id,
    }));

    return id;
  },

  closeTab: (id) => {
    set((state) => {
      const index = state.tabs.findIndex((t) => t.id === id);
      if (index === -1) return state;

      const newTabs = state.tabs.filter((t) => t.id !== id);
      const newActiveId =
        state.activeTabId === id
          ? newTabs.length > 0
            ? newTabs[Math.min(index, newTabs.length - 1)].id
            : null
          : state.activeTabId;

      return {
        tabs: newTabs.map((t) => ({ ...t, isActive: t.id === newActiveId })),
        activeTabId: newActiveId,
      };
    });
  },

  activateTab: (id) => {
    set((state) => ({
      tabs: state.tabs.map((t) => ({ ...t, isActive: t.id === id })),
      activeTabId: id,
    }));
  },

  renameTab: (id, name) => {
    set((state) => ({
      tabs: state.tabs.map((t) => (t.id === id ? { ...t, name } : t)),
    }));
  },

  setPanelOpen: (open) => {
    set({ isPanelOpen: open });
  },

  getActiveTab: () => {
    const { tabs, activeTabId } = get();
    return tabs.find((t) => t.id === activeTabId) || null;
  },
}));

export default useTerminalStore;
