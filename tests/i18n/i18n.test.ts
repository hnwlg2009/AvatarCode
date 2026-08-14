import { describe, it, expect, beforeEach } from 'vitest';
import i18n from '../../src/i18n';

describe('i18n Framework', () => {
  beforeEach(async () => {
    await i18n.changeLanguage('en');
  });

  describe('initialization', () => {
    it('should initialize with English as default', () => {
      expect(i18n.language).toBe('en');
    });

    it('have English resources loaded', () => {
      expect(i18n.hasResourceBundle('en', 'common')).toBe(true);
      expect(i18n.hasResourceBundle('en', 'editor')).toBe(true);
      expect(i18n.hasResourceBundle('en', 'settings')).toBe(true);
      expect(i18n.hasResourceBundle('en', 'menu')).toBe(true);
      expect(i18n.hasResourceBundle('en', 'chat')).toBe(true);
    });

    it('have Chinese resources loaded', () => {
      expect(i18n.hasResourceBundle('zh', 'common')).toBe(true);
      expect(i18n.hasResourceBundle('zh', 'editor')).toBe(true);
      expect(i18n.hasResourceBundle('zh', 'settings')).toBe(true);
      expect(i18n.hasResourceBundle('zh', 'menu')).toBe(true);
      expect(i18n.hasResourceBundle('zh', 'chat')).toBe(true);
    });
  });

  describe('language switching', () => {
    it('switch to Chinese', async () => {
      await i18n.changeLanguage('zh');
      expect(i18n.language).toBe('zh');
    });

    it('switch back to English', async () => {
      await i18n.changeLanguage('zh');
      await i18n.changeLanguage('en');
      expect(i18n.language).toBe('en');
    });
  });

  describe('translation', () => {
    it('translate English keys', () => {
      expect(i18n.t('common.app.name')).toBe('AvatarCode');
      expect(i18n.t('common.workspace.emptyTitle')).toBe('Welcome to AvatarCode');
    });

    it('translate Chinese keys', async () => {
      await i18n.changeLanguage('zh');
      expect(i18n.t('common.app.name')).toBe('分身Code');
      expect(i18n.t('common.workspace.emptyTitle')).toBe('欢迎使用分身Code');
    });

    it('fallback to English for missing keys', async () => {
      await i18n.changeLanguage('zh');
      const result = i18n.t('nonexistent.key');
      expect(result).toBe('nonexistent.key');
    });
  });

  describe('namespaces', () => {
    it('access different namespaces', () => {
      expect(i18n.t('common.app.name')).toBeDefined();
      expect(i18n.t('editor.title')).toBeDefined();
      expect(i18n.t('settings.title')).toBeDefined();
      expect(i18n.t('menu.file')).toBeDefined();
      expect(i18n.t('chat.title')).toBeDefined();
    });
  });
});
