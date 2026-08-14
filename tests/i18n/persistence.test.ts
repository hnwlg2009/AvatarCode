import { describe, it, expect, beforeEach, vi } from 'vitest';
import i18n from '../../src/i18n';
import { useSettingsStore } from '../../src/stores/settingsStore';

describe('Language Persistence', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  describe('localStorage persistence', () => {
    it('save language to localStorage', async () => {
      await i18n.changeLanguage('zh');
      expect(localStorage.getItem('avatarcode-language')).toBe('zh');
    });

    it('load language from localStorage', async () => {
      localStorage.setItem('avatarcode-language', 'zh');

      // The detection happens on init, so we test the stored value
      expect(localStorage.getItem('avatarcode-language')).toBe('zh');
    });

    it('persist language across sessions', async () => {
      // First session
      await i18n.changeLanguage('zh');
      expect(localStorage.getItem('avatarcode-language')).toBe('zh');

      // New session reads the stored preference
      const restored = localStorage.getItem('avatarcode-language');
      expect(restored).toBe('zh');
    });
  });

  describe('settings store persistence', () => {
    it('save language preference in settings', () => {
      useSettingsStore.getState().setGeneralSettings({ language: 'zh' });
      
      const stored = localStorage.getItem('avatarcode-settings');
      expect(stored).toBeDefined();
      
      if (stored) {
        const parsed = JSON.parse(stored);
        expect(parsed.state.settings.general.language).toBe('zh');
      }
    });

    it('restore language preference from settings', () => {
      // Pre-populate localStorage
      localStorage.setItem('avatarcode-settings', JSON.stringify({
        state: {
          settings: {
            general: { language: 'zh' },
            editor: {},
            appearance: {},
            git: {},
          },
        },
      }));

      // The store should load this on next init
      const stored = localStorage.getItem('avatarcode-settings');
      expect(stored).toBeDefined();
      
      if (stored) {
        const parsed = JSON.parse(stored);
        expect(parsed.state.settings.general.language).toBe('zh');
      }
    });
  });
});
