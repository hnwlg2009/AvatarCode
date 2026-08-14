import * as fs from 'fs';
import * as path from 'path';
import { app } from 'electron';

const LOCALES_ROOT = path.resolve(__dirname, '../../src/i18n/locales');

class ElectronI18n {
  private currentLang: string = 'zh';
  private translations: Record<string, any> = {};

  constructor() {
    this.loadPersistedLanguage();
    this.loadTranslations(this.currentLang);
  }

  private get languageFile(): string {
    return path.join(app.getPath('userData'), 'language.json');
  }

  private loadPersistedLanguage() {
    try {
      if (fs.existsSync(this.languageFile)) {
        const { lang } = JSON.parse(fs.readFileSync(this.languageFile, 'utf-8'));
        if (lang === 'en' || lang === 'zh') {
          this.currentLang = lang;
        }
      }
    } catch (error) {
      console.error('Failed to load persisted language:', error);
    }
  }

  loadTranslations(lang: string) {
    try {
      const langDir = path.join(LOCALES_ROOT, lang);
      if (!fs.existsSync(langDir)) {
        console.warn(`Translation directory not found: ${langDir}`);
        return;
      }

      const merged: Record<string, any> = {};
      for (const file of fs.readdirSync(langDir)) {
        if (!file.endsWith('.json')) continue;
        const namespace = file.replace(/\.json$/, '');
        merged[namespace] = JSON.parse(fs.readFileSync(path.join(langDir, file), 'utf-8'));
      }

      this.translations = merged;
      this.currentLang = lang;

      // 持久化语言选择，保证下次启动主进程菜单语言一致
      try {
        fs.writeFileSync(this.languageFile, JSON.stringify({ lang }), 'utf-8');
      } catch (error) {
        console.error('Failed to persist language:', error);
      }
    } catch (error) {
      console.error('Failed to load translations:', error);
    }
  }

  t(key: string): string {
    try {
      const keys = key.split('.');
      let value: any = this.translations;
      for (const k of keys) {
        value = value?.[k];
      }
      return typeof value === 'string' ? value : key;
    } catch (error) {
      console.error('Translation error:', error);
      return key;
    }
  }

  getLanguage(): string {
    return this.currentLang;
  }
}

export const electronI18n = new ElectronI18n();
