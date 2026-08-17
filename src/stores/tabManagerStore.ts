import { create } from 'zustand';
import { defaultEditorConfig, IEditorConfig } from '../config/editor.config';

export interface ITab {
  id: string;
  path: string;
  name: string;
  language: string;
  content: string;
  isDirty: boolean;
  isLoading: boolean;
  error?: string;
  config: IEditorConfig;
}

export interface TabManagerState {
  tabs: ITab[];
  activeTabId: string | null;
  addTab: (tab: ITab) => string;
  closeTab: (tabId: string) => void;
  activateTab: (tabId: string) => void;
  updateTabContent: (tabId: string, content: string) => void;
  updateTabConfig: (tabId: string, config: Partial<IEditorConfig>) => void;
  updateTabInfo: (tabId: string, info: Partial<Pick<ITab, 'path' | 'name' | 'language'>>) => void;
  markAsSaved: (tabId: string) => void;
  setTabError: (tabId: string, error?: string) => void;
  setTabLoading: (tabId: string, isLoading: boolean) => void;
  getActiveTab: () => ITab | null;
  getTabByPath: (path: string) => ITab | null;
  reset: () => void;
}

let tabIdCounter = 0;

export const useTabManagerStore = create<TabManagerState>((set, get) => ({
  tabs: [],
  activeTabId: null,

  addTab: (tab: ITab) => {
    const existingTab = get().tabs.find((t) => t.path === tab.path);
    if (existingTab) {
      set({ activeTabId: existingTab.id });
      return existingTab.id;
    }
    const id = tab.id || `tab-${Date.now()}-${tabIdCounter++}`;
    set((state) => ({
      tabs: [...state.tabs, { ...tab, id }],
      activeTabId: id,
    }));
    return id;
  },

  closeTab: (tabId: string) => {
    const state = get();
    const tabIndex = state.tabs.findIndex((t) => t.id === tabId);
    if (tabIndex === -1) return;

    const newTabs = state.tabs.filter((t) => t.id !== tabId);

    if (state.activeTabId === tabId) {
      const newActiveTabId =
        newTabs.length > 0 ? newTabs[Math.min(tabIndex, newTabs.length - 1)].id : null;
      set({ tabs: newTabs, activeTabId: newActiveTabId });
    } else {
      set({ tabs: newTabs });
    }
  },

  activateTab: (tabId: string) => {
    set({ activeTabId: tabId });
  },

  updateTabContent: (tabId: string, content: string) => {
    set((state) => ({
      tabs: state.tabs.map((tab) => (tab.id === tabId ? { ...tab, content, isDirty: true } : tab)),
    }));
  },

  updateTabConfig: (tabId: string, config: Partial<IEditorConfig>) => {
    set((state) => ({
      tabs: state.tabs.map((tab) =>
        tab.id === tabId ? { ...tab, config: { ...tab.config, ...config } } : tab
      ),
    }));
  },

  updateTabInfo: (tabId: string, info: Partial<Pick<ITab, 'path' | 'name' | 'language'>>) => {
    set((state) => ({
      tabs: state.tabs.map((tab) => (tab.id === tabId ? { ...tab, ...info } : tab)),
    }));
  },

  markAsSaved: (tabId: string) => {
    set((state) => ({
      tabs: state.tabs.map((tab) => (tab.id === tabId ? { ...tab, isDirty: false } : tab)),
    }));
  },

  setTabError: (tabId: string, error?: string) => {
    set((state) => ({
      tabs: state.tabs.map((tab) => (tab.id === tabId ? { ...tab, error } : tab)),
    }));
  },

  setTabLoading: (tabId: string, isLoading: boolean) => {
    set((state) => ({
      tabs: state.tabs.map((tab) => (tab.id === tabId ? { ...tab, isLoading } : tab)),
    }));
  },

  getActiveTab: () => {
    const { tabs, activeTabId } = get();
    return tabs.find((t) => t.id === activeTabId) || null;
  },

  getTabByPath: (path: string) => {
    return get().tabs.find((t) => t.path === path) || null;
  },

  reset: () => {
    set({ tabs: [], activeTabId: null });
  },
}));

export default useTabManagerStore;
