import React from 'react';
import { useTranslation } from 'react-i18next';
import styles from './GeneralSettings.module.css';

export const GeneralSettings: React.FC = () => {
  const { t, i18n } = useTranslation();

  const handleLanguageChange = (lang: string) => {
    i18n.changeLanguage(lang);
    localStorage.setItem('avatarcode-language', lang);
    
    // 通知主进程更新菜单语言
    if (window.electronAPI) {
      window.electronAPI.send('language-changed', lang);
    }
  };

  const languages = [
    { value: 'en', label: t('settings.langEn'), flag: '🇺🇸' },
    { value: 'zh', label: t('settings.langZh'), flag: '🇨🇳' },
  ];

  return (
    <div className={styles.generalSettings}>
      <div className={styles.section}>
        <h3>{t('settings.language')}</h3>
        <div className={styles.languageGrid}>
          {languages.map((lang) => (
            <button
              key={lang.value}
              className={`${styles.languageCard} ${i18n.language === lang.value ? styles.active : ''}`}
              onClick={() => handleLanguageChange(lang.value)}
            >
              <span className={styles.languageFlag}>{lang.flag}</span>
              <span className={styles.languageLabel}>{lang.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default GeneralSettings;
