import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import useSettingsStore from '../../stores/settingsStore';
import styles from './WorkspaceSettings.module.css';

export const WorkspaceSettings: React.FC = () => {
  const { t } = useTranslation();
  const {
    workspacePath,
    workspaceSettings,
    isLoading,
    loadWorkspaceSettings,
    saveWorkspaceSettings,
    setWorkspaceSettings,
  } = useSettingsStore();

  const [localSettings, setLocalSettings] = useState(workspaceSettings);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (workspacePath) {
      loadWorkspaceSettings();
    }
  }, [workspacePath]);

  useEffect(() => {
    setLocalSettings(workspaceSettings);
  }, [workspaceSettings]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      setWorkspaceSettings(localSettings);
      await saveWorkspaceSettings();
      setMessage({ type: 'success', text: t('settings.workspace.saved') });
      setTimeout(() => setMessage(null), 3000);
    } catch (error: any) {
      setMessage({ type: 'error', text: `${t('settings.workspace.saveFailed')}：${error.message}` });
    } finally {
      setIsSaving(false);
    }
  };

  if (!workspacePath) {
    return (
      <div className={styles.emptyWorkspace}>
        <p>{t('settings.workspace.emptyTitle')}</p>
        <p className={styles.hint}>{t('settings.workspace.emptyHint')}</p>
      </div>
    );
  }

  return (
    <div className={styles.workspaceSettings}>
      <div className={styles.header}>
        <h3>{t('settings.workspace.title')}</h3>
        <span className={styles.path}>{workspacePath}</span>
      </div>

      {message && <div className={`${styles.message} ${styles[message.type]}`}>{message.text}</div>}

      {isLoading && <div className={styles.loading}>{t('settings.workspace.loading')}</div>}

      <div className={styles.section}>
        <h4>{t('settings.workspace.editor')}</h4>
        <div className={styles.formGroup}>
          <label>
            {t('settings.workspace.fontSize')}：
            <input
              type="number"
              value={localSettings.editor?.fontSize ?? 14}
              onChange={(e) =>
                setLocalSettings({
                  ...localSettings,
                  editor: { ...localSettings.editor, fontSize: Number(e.target.value) },
                })
              }
              disabled={isLoading}
            />
          </label>
        </div>
        <div className={styles.formGroup}>
          <label>
            {t('settings.workspace.tabSize')}：
            <input
              type="number"
              value={localSettings.editor?.tabSize ?? 2}
              onChange={(e) =>
                setLocalSettings({
                  ...localSettings,
                  editor: { ...localSettings.editor, tabSize: Number(e.target.value) },
                })
              }
              disabled={isLoading}
            />
          </label>
        </div>
        <div className={styles.formGroup}>
          <label>
            <input
              type="checkbox"
              checked={localSettings.editor?.wordWrap ?? false}
              onChange={(e) =>
                setLocalSettings({
                  ...localSettings,
                  editor: { ...localSettings.editor, wordWrap: e.target.checked },
                })
              }
              disabled={isLoading}
            />
            {t('settings.workspace.wordWrap')}
          </label>
        </div>
        <div className={styles.formGroup}>
          <label>
            <input
              type="checkbox"
              checked={localSettings.editor?.autoSave ?? false}
              onChange={(e) =>
                setLocalSettings({
                  ...localSettings,
                  editor: { ...localSettings.editor, autoSave: e.target.checked },
                })
              }
              disabled={isLoading}
            />
            {t('settings.workspace.autoSave')}
          </label>
        </div>
      </div>

      <div className={styles.section}>
        <h4>{t('settings.workspace.git')}</h4>
        <div className={styles.formGroup}>
          <label>
            {t('settings.workspace.userName')}：
            <input
              type="text"
              value={localSettings.git?.userName ?? ''}
              onChange={(e) =>
                setLocalSettings({
                  ...localSettings,
                  git: { ...localSettings.git, userName: e.target.value },
                })
              }
              disabled={isLoading}
              placeholder={t('settings.workspace.userNamePlaceholder')}
            />
          </label>
        </div>
        <div className={styles.formGroup}>
          <label>
            {t('settings.workspace.userEmail')}：
            <input
              type="email"
              value={localSettings.git?.userEmail ?? ''}
              onChange={(e) =>
                setLocalSettings({
                  ...localSettings,
                  git: { ...localSettings.git, userEmail: e.target.value },
                })
              }
              disabled={isLoading}
              placeholder={t('settings.workspace.userEmailPlaceholder')}
            />
          </label>
        </div>
      </div>

      <div className={styles.actions}>
        <button onClick={handleSave} disabled={isLoading || isSaving} className={styles.saveButton}>
          {isSaving ? t('settings.workspace.saving') : t('settings.workspace.save')}
        </button>
        <button
          onClick={() => window.open('.avatarcode/settings.json')}
          className={styles.openButton}
        >
          {t('settings.workspace.openConfig')}
        </button>
      </div>
    </div>
  );
};

export default WorkspaceSettings;