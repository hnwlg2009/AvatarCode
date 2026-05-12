import React, { useState, useEffect } from 'react';
import useSettingsStore from '../../stores/settingsStore';
import styles from './WorkspaceSettings.module.css';

export const WorkspaceSettings: React.FC = () => {
  const {
    workspacePath,
    workspaceSettings,
    isLoading,
    loadWorkspaceSettings,
    saveWorkspaceSettings,
    setEditorSettings,
    setAppearanceSettings,
    setGitSettings,
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
      await saveWorkspaceSettings();
      setMessage({ type: 'success', text: '工作区配置已保存' });
      setTimeout(() => setMessage(null), 3000);
    } catch (error: any) {
      setMessage({ type: 'error', text: `保存失败：${error.message}` });
    } finally {
      setIsSaving(false);
    }
  };

  if (!workspacePath) {
    return (
      <div className={styles.emptyWorkspace}>
        <p>未打开工作区</p>
        <p className={styles.hint}>请先打开一个工作区以配置工作区特定设置</p>
      </div>
    );
  }

  return (
    <div className={styles.workspaceSettings}>
      <div className={styles.header}>
        <h3>工作区设置</h3>
        <span className={styles.path}>{workspacePath}</span>
      </div>

      {message && <div className={`${styles.message} ${styles[message.type]}`}>{message.text}</div>}

      {isLoading && <div className={styles.loading}>加载中...</div>}

      <div className={styles.section}>
        <h4>编辑器设置</h4>
        <div className={styles.formGroup}>
          <label>
            字体大小：
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
            Tab 大小：
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
            自动换行
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
            自动保存
          </label>
        </div>
      </div>

      <div className={styles.section}>
        <h4>Git 设置</h4>
        <div className={styles.formGroup}>
          <label>
            用户名：
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
              placeholder="例如：devin WLG"
            />
          </label>
        </div>
        <div className={styles.formGroup}>
          <label>
            邮箱：
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
              placeholder="例如：devin@example.com"
            />
          </label>
        </div>
      </div>

      <div className={styles.actions}>
        <button onClick={handleSave} disabled={isLoading || isSaving} className={styles.saveButton}>
          {isSaving ? '保存中...' : '保存配置'}
        </button>
        <button
          onClick={() => window.open('.avatarcode/settings.json')}
          className={styles.openButton}
        >
          打开配置文件
        </button>
      </div>
    </div>
  );
};

export default WorkspaceSettings;
