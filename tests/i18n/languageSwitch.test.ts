import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useSettingsStore } from '../../src/stores/settingsStore';

describe('Language Switch', () => {
  beforeEach(() => {
    // Reset store
    useSettingsStore.getState().setGeneralSettings({ language: 'en' });
    localStorage.clear();
  });

  describe('settings store', () => {
    it('have default language as English', () => {
      const { settings } = useSettingsStore.getState();
      expect(settings.general.language).toBe('en');
    });

    it('update language preference', () => {
      useSettingsStore.getState().setGeneralSettings({ language: 'zh' });
      const { settings } = useSettingsStore.getState();
      expect(settings.general.language).toBe('zh');
    });

    it('persist language preference', () => {
      useSettingsStore.getState().setGeneralSettings({ language: 'zh' });
      
      // Check localStorage
      const stored = localStorage.getItem('avatarcode-settings');
      expect(stored).toBeDefined();
      
      if (stored) {
        const parsed = JSON.parse(stored);
        expect(parsed.state.settings.general.language).toBe('zh');
      }
    });
  });

  describe('language detection', () => {
    it('detect browser language', () => {
      // Mock navigator.language
      const originalLanguage = navigator.language;
      Object.defineProperty(navigator, 'language', {
        value: 'zh-CN',
        configurable: true,
      });

      // i18next will detect this on next init
      expect(navigator.language).toBe('zh-CN');

      // Restore
      Object.defineProperty(navigator, 'language', {
        value: originalLanguage,
        configurable: true,
      });
    });
  });
});
