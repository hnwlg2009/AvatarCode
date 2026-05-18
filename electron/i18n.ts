import * as fs from 'fs';
import * as path from 'path';

class ElectronI18n {
  private currentLang: string = 'en';
  private translations: Record<string, any> = {};

  constructor() {
    this.loadTranslations(this.currentLang);
  }

  loadTranslations(lang: string) {
    try {
      const localePath = path.join(__dirname, 'locales', `${lang}.json`);
      if (fs.existsSync(localePath)) {
        this.translations = JSON.parse(fs.readFileSync(localePath, 'utf-8'));
        this.currentLang = lang;
      } else {
        console.warn(`Translation file not found: ${localePath}`);
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
      return value || key;
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
