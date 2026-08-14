import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSettingsStore } from '../../../stores/settingsStore';
import styles from './GitSettings.module.css';

export interface GitConfig {
  userName: string;
  userEmail: string;
}

interface GitSettingsProps {
  onSave?: (config: { userName: string; userEmail: string }) => void;
}

export const GitSettings: React.FC<GitSettingsProps> = ({ onSave }) => {
  const { t } = useTranslation();
  const { settings, setGitSettings } = useSettingsStore();
  const [userName, setUserName] = useState(settings.git.userName);
  const [userEmail, setUserEmail] = useState(settings.git.userEmail);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleSave = async () => {
    if (!userName.trim() || !userEmail.trim()) {
      setMessage({ type: 'error', text: t('settings.gitSettings.fillAll') });
      return;
    }

    setIsSaving(true);
    setMessage(null);

    try {
      setGitSettings({ userName: userName.trim(), userEmail: userEmail.trim() });
      setMessage({ type: 'success', text: t('settings.gitSettings.saved') });
      onSave?.({ userName: userName.trim(), userEmail: userEmail.trim() });
      setTimeout(() => setMessage(null), 3000);
    } catch (error: any) {
      setMessage({ type: 'error', text: `${t('settings.gitSettings.saveFailed')}: ${error.message}` });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className={styles.settings}>
      <div className={styles.header}>
        <h3>{t('settings.gitSettings.title')}</h3>
        <p className={styles.description}>{t('settings.gitSettings.description')}</p>
      </div>

      <div className={styles.form}>
        <div className={styles.formGroup}>
          <label htmlFor="userName">{t('settings.gitSettings.userName')}</label>
          <input
            id="userName"
            type="text"
            value={userName}
            onChange={(e) => setUserName(e.target.value)}
            placeholder={t('settings.gitSettings.userNamePlaceholder')}
            className={styles.input}
          />
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="userEmail">{t('settings.gitSettings.userEmail')}</label>
          <input
            id="userEmail"
            type="email"
            value={userEmail}
            onChange={(e) => setUserEmail(e.target.value)}
            placeholder={t('settings.gitSettings.userEmailPlaceholder')}
            className={styles.input}
          />
        </div>

        {message && (
          <div className={`${styles.message} ${styles[message.type]}`}>{message.text}</div>
        )}

        <button className={styles.saveButton} onClick={handleSave} disabled={isSaving}>
          {isSaving ? t('settings.gitSettings.saving') : t('settings.gitSettings.save')}
        </button>
      </div>

      <div className={styles.tips}>
        <h4>{t('settings.gitSettings.tipsTitle')}</h4>
        <ul>
          <li>{t('settings.gitSettings.tip1')}</li>
          <li>{t('settings.gitSettings.tip2')}</li>
          <li>{t('settings.gitSettings.tip3')}</li>
        </ul>
      </div>
    </div>
  );
};

export default GitSettings;