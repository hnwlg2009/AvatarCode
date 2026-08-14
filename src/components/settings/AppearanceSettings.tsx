import React from 'react';
import { useTranslation } from 'react-i18next';
import useSettingsStore from '../../stores/settingsStore';
import styles from './AppearanceSettings.module.css';

type Theme = 'light' | 'dark' | 'system';

export const AppearanceSettings: React.FC = () => {
  const { t } = useTranslation();
  const { settings, setAppearanceSettings } = useSettingsStore();
  const theme = settings.appearance.theme;

  const themes: { value: Theme; label: string; icon: string }[] = [
    { value: 'dark', label: t('settings.appearance.themes.dark'), icon: '🌙' },
    { value: 'light', label: t('settings.appearance.themes.light'), icon: '☀️' },
    { value: 'system', label: t('settings.appearance.themes.system'), icon: '💻' },
  ];

  const handleThemeChange = (t: Theme) => {
    setAppearanceSettings({ theme: t });
  };

  return (
    <div className={styles.appearanceSettings}>
      <div className={styles.section}>
        <h3>{t('settings.appearance.theme')}</h3>
        <div className={styles.themeGrid}>
          {themes.map((item) => (
            <button
              key={item.value}
              className={`${styles.themeCard} ${theme === item.value ? styles.active : ''}`}
              onClick={() => handleThemeChange(item.value)}
            >
              <span className={styles.themeIcon}>{item.icon}</span>
              <span className={styles.themeLabel}>{item.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AppearanceSettings;