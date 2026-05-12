import { describe, it, expect, beforeEach } from 'vitest';
import { useTabManagerStore, ITab } from '../../src/stores/tabManagerStore';

describe('TabManagerStore', () => {
  beforeEach(() => {
    useTabManagerStore.getState().reset();
  });

  describe('initial state', () => {
    it('should start with empty tabs', () => {
      const state = useTabManagerStore.getState();
      expect(state.tabs).toEqual([]);
      expect(state.activeTabId).toBeNull();
    });
  });

  describe('addTab', () => {
    it('should add a new tab and activate it', () => {
      const store = useTabManagerStore.getState();
      const tabId = store.addTab({
        path: '/test.ts',
        name: 'test.ts',
        language: 'typescript',
        content: '',
        isDirty: false,
        isLoading: false,
        config: { theme: 'vs-dark' },
      });

      const state = useTabManagerStore.getState();
      expect(state.tabs).toHaveLength(1);
      expect(state.tabs[0].id).toBe(tabId);
      expect(state.activeTabId).toBe(tabId);
      expect(state.tabs[0].path).toBe('/test.ts');
    });

    it('should not add duplicate tabs', () => {
      const store = useTabManagerStore.getState();
      
      // Add first tab
      const tabId1 = store.addTab({
        path: '/test.ts',
        name: 'test.ts',
        language: 'typescript',
        content: '',
        isDirty: false,
        isLoading: false,
        config: { theme: 'vs-dark' },
      });

      // Try to add same tab
      const tabId2 = store.addTab({
        path: '/test.ts',
        name: 'test.ts',
        language: 'typescript',
        content: '',
        isDirty: false,
        isLoading: false,
        config: { theme: 'vs-dark' },
      });

      const state = useTabManagerStore.getState();
      expect(state.tabs).toHaveLength(1);
      expect(tabId1).toBe(tabId2);
    });

    it('should add multiple tabs with different paths', () => {
      const store = useTabManagerStore.getState();
      
      store.addTab({
        path: '/file1.ts',
        name: 'file1.ts',
        language: 'typescript',
        content: '',
        isDirty: false,
        isLoading: false,
        config: { theme: 'vs-dark' },
      });

      store.addTab({
        path: '/file2.py',
        name: 'file2.py',
        language: 'python',
        content: '',
        isDirty: false,
        isLoading: false,
        config: { theme: 'vs-dark' },
      });

      const state = useTabManagerStore.getState();
      expect(state.tabs).toHaveLength(2);
    });
  });

  describe('closeTab', () => {
    it('should close a tab', () => {
      const store = useTabManagerStore.getState();
      const tabId = store.addTab({
        path: '/test.ts',
        name: 'test.ts',
        language: 'typescript',
        content: '',
        isDirty: false,
        isLoading: false,
        config: { theme: 'vs-dark' },
      });

      store.closeTab(tabId);
      const state = useTabManagerStore.getState();
      expect(state.tabs).toHaveLength(0);
      expect(state.activeTabId).toBeNull();
    });

    it('should activate previous tab when closing active tab', () => {
      const store = useTabManagerStore.getState();
      
      const tab1 = store.addTab({
        path: '/file1.ts',
        name: 'file1.ts',
        language: 'typescript',
        content: '',
        isDirty: false,
        isLoading: false,
        config: { theme: 'vs-dark' },
      });

      const tab2 = store.addTab({
        path: '/file2.ts',
        name: 'file2.ts',
        language: 'typescript',
        content: '',
        isDirty: false,
        isLoading: false,
        config: { theme: 'vs-dark' },
      });

      // Close active tab (tab2)
      store.closeTab(tab2);
      const state = useTabManagerStore.getState();
      expect(state.activeTabId).toBe(tab1);
    });

    it('should do nothing when closing non-existent tab', () => {
      const store = useTabManagerStore.getState();
      const initialTabs = [...store.tabs];
      
      store.closeTab('non-existent-id');
      
      const state = useTabManagerStore.getState();
      expect(state.tabs).toEqual(initialTabs);
    });
  });

  describe('activateTab', () => {
    it('should activate a tab', () => {
      const store = useTabManagerStore.getState();
      
      const tab1 = store.addTab({
        path: '/file1.ts',
        name: 'file1.ts',
        language: 'typescript',
        content: '',
        isDirty: false,
        isLoading: false,
        config: { theme: 'vs-dark' },
      });

      store.addTab({
        path: '/file2.ts',
        name: 'file2.ts',
        language: 'typescript',
        content: '',
        isDirty: false,
        isLoading: false,
        config: { theme: 'vs-dark' },
      });

      store.activateTab(tab1);
      const state = useTabManagerStore.getState();
      expect(state.activeTabId).toBe(tab1);
    });
  });

  describe('updateTabContent', () => {
    it('should update tab content and mark as dirty', () => {
      const store = useTabManagerStore.getState();
      const tabId = store.addTab({
        path: '/test.ts',
        name: 'test.ts',
        language: 'typescript',
        content: '',
        isDirty: false,
        isLoading: false,
        config: { theme: 'vs-dark' },
      });

      store.updateTabContent(tabId, 'console.log("hello");');
      const state = useTabManagerStore.getState();
      
      expect(state.tabs[0].content).toBe('console.log("hello");');
      expect(state.tabs[0].isDirty).toBe(true);
    });
  });

  describe('markAsSaved', () => {
    it('should mark tab as saved', () => {
      const store = useTabManagerStore.getState();
      const tabId = store.addTab({
        path: '/test.ts',
        name: 'test.ts',
        language: 'typescript',
        content: '',
        isDirty: false,
        isLoading: false,
        config: { theme: 'vs-dark' },
      });

      store.updateTabContent(tabId, 'content');
      store.markAsSaved(tabId);
      
      const state = useTabManagerStore.getState();
      expect(state.tabs[0].isDirty).toBe(false);
    });
  });

  describe('updateTabConfig', () => {
    it('should update tab configuration', () => {
      const store = useTabManagerStore.getState();
      const tabId = store.addTab({
        path: '/test.ts',
        name: 'test.ts',
        language: 'typescript',
        content: '',
        isDirty: false,
        isLoading: false,
        config: { theme: 'vs-dark' },
      });

      store.updateTabConfig(tabId, { fontSize: 16, theme: 'vs-light' });
      
      const state = useTabManagerStore.getState();
      expect(state.tabs[0].config.fontSize).toBe(16);
      expect(state.tabs[0].config.theme).toBe('vs-light');
    });
  });

  describe('setTabError', () => {
    it('should set error on tab', () => {
      const store = useTabManagerStore.getState();
      const tabId = store.addTab({
        path: '/test.ts',
        name: 'test.ts',
        language: 'typescript',
        content: '',
        isDirty: false,
        isLoading: false,
        config: { theme: 'vs-dark' },
      });

      store.setTabError(tabId, 'File not found');
      
      const state = useTabManagerStore.getState();
      expect(state.tabs[0].error).toBe('File not found');
    });

    it('should clear error', () => {
      const store = useTabManagerStore.getState();
      const tabId = store.addTab({
        path: '/test.ts',
        name: 'test.ts',
        language: 'typescript',
        content: '',
        isDirty: false,
        isLoading: false,
        config: { theme: 'vs-dark' },
      });

      store.setTabError(tabId, 'Error');
      store.setTabError(tabId, undefined);
      
      const state = useTabManagerStore.getState();
      expect(state.tabs[0].error).toBeUndefined();
    });
  });

  describe('setTabLoading', () => {
    it('should set loading state', () => {
      const store = useTabManagerStore.getState();
      const tabId = store.addTab({
        path: '/test.ts',
        name: 'test.ts',
        language: 'typescript',
        content: '',
        isDirty: false,
        isLoading: false,
        config: { theme: 'vs-dark' },
      });

      store.setTabLoading(tabId, true);
      expect(useTabManagerStore.getState().tabs[0].isLoading).toBe(true);

      store.setTabLoading(tabId, false);
      expect(useTabManagerStore.getState().tabs[0].isLoading).toBe(false);
    });
  });

  describe('getActiveTab', () => {
    it('should return active tab', () => {
      const store = useTabManagerStore.getState();
      const tabId = store.addTab({
        path: '/test.ts',
        name: 'test.ts',
        language: 'typescript',
        content: '',
        isDirty: false,
        isLoading: false,
        config: { theme: 'vs-dark' },
      });

      const activeTab = store.getActiveTab();
      expect(activeTab).not.toBeNull();
      expect(activeTab?.id).toBe(tabId);
    });

    it('should return null when no active tab', () => {
      const store = useTabManagerStore.getState();
      const activeTab = store.getActiveTab();
      expect(activeTab).toBeNull();
    });
  });

  describe('getTabByPath', () => {
    it('should return tab by path', () => {
      const store = useTabManagerStore.getState();
      store.addTab({
        path: '/test.ts',
        name: 'test.ts',
        language: 'typescript',
        content: '',
        isDirty: false,
        isLoading: false,
        config: { theme: 'vs-dark' },
      });

      const tab = store.getTabByPath('/test.ts');
      expect(tab).not.toBeNull();
      expect(tab?.path).toBe('/test.ts');
    });

    it('should return null for non-existent path', () => {
      const store = useTabManagerStore.getState();
      const tab = store.getTabByPath('/nonexistent.ts');
      expect(tab).toBeNull();
    });
  });

  describe('ID generation', () => {
    it('should generate unique IDs', () => {
      const store = useTabManagerStore.getState();
      const ids = new Set<string>();
      
      for (let i = 0; i < 100; i++) {
        const id = store.addTab({
          path: `/file${i}.ts`,
          name: `file${i}.ts`,
          language: 'typescript',
          content: '',
          isDirty: false,
          isLoading: false,
          config: { theme: 'vs-dark' },
        });
        ids.add(id);
      }
      
      expect(ids.size).toBe(100);
    });
  });
});
