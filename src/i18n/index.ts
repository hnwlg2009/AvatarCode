import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import enCommon from './locales/en/common.json';
import enEditor from './locales/en/editor.json';
import enSettings from './locales/en/settings.json';
import enMenu from './locales/en/menu.json';
import enChat from './locales/en/chat.json';
import enGit from './locales/en/git.json';

import zhCommon from './locales/zh/common.json';
import zhEditor from './locales/zh/editor.json';
import zhSettings from './locales/zh/settings.json';
import zhMenu from './locales/zh/menu.json';
import zhChat from './locales/zh/chat.json';
import zhGit from './locales/zh/git.json';

const resources = {
  en: {
    common: enCommon,
    editor: enEditor,
    settings: enSettings,
    menu: enMenu,
    chat: enChat,
    git: enGit,
  },
  zh: {
    common: zhCommon,
    editor: zhEditor,
    settings: zhSettings,
    menu: zhMenu,
    chat: zhChat,
    git: zhGit,
  },
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'zh',
    defaultNS: 'common',
    ns: ['common', 'editor', 'settings', 'menu', 'chat', 'git'],
    nsSeparator: '.',
    keySeparator: '.',
    debug: process.env.NODE_ENV === 'development',
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ['localStorage', 'navigator'],
      lookupLocalStorage: 'avatarcode-language',
      caches: ['localStorage'],
    },
  });

export default i18n;
