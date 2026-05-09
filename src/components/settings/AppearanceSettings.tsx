import React from 'react';
import useSettingsStore from '../../stores/settingsStore';
import styles from './AppearanceSettings.module.css';

type Theme = 'light' | 'dark' | 'system';

export const AppearanceSettings: React.FC = () => {
  const { settings, setAppearanceSettings } = useSettingsStore();
  const theme = settings.appearance.theme;

  const themes: { value: Theme; label: string; icon: string }[] = [
    { value: 'dark', label: 'Dark', icon: '🌙' },
    { value: 'light', label: 'Light', icon: '☀️' },
    { value: 'system', label: 'System', icon: '💻' },
  ];

  const handleThemeChange = (t: Theme) => {
    setAppearanceSettings({ theme: t });
  };

  return (
    <div className={styles.appearanceSettings}>
      <div className={styles.section}>
        <h3>Theme</h3>
        <div className={styles.themeGrid}>
          {themes.map((t) => (
            <button
              key={t.value}
              className={`${styles.themeCard} ${theme === t.value ? styles.active : ''}`}
              onClick={() => handleThemeChange(t.value)}
            >
              <span className={styles.themeIcon}>{t.icon}</span>
              <span className={styles.themeLabel}>{t.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AppearanceSettings;
