import React, { useState, useEffect } from 'react';
import styles from './GitSettings.module.css';

export interface GitConfig {
  userName: string;
  userEmail: string;
}

interface GitSettingsProps {
  onSave?: (config: GitConfig) => void;
}

export const GitSettings: React.FC<GitSettingsProps> = ({ onSave }) => {
  const [config, setConfig] = useState<GitConfig>({
    userName: '',
    userEmail: '',
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    loadGitConfig();
  }, []);

  const loadGitConfig = async () => {
    try {
      const userName = (await (window as any).electron?.git.getConfig('user.name')) || '';
      const userEmail = (await (window as any).electron?.git.getConfig('user.email')) || '';

      setConfig({ userName, userEmail });
    } catch (error) {
      console.error('Failed to load git config:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!config.userName.trim() || !config.userEmail.trim()) {
      setMessage({ type: 'error', text: 'Please fill in all fields' });
      return;
    }

    setIsSaving(true);
    setMessage(null);

    try {
      await (window as any).electron?.git.setConfig('user.name', config.userName);
      await (window as any).electron?.git.setConfig('user.email', config.userEmail);

      setMessage({ type: 'success', text: 'Git configuration saved successfully!' });
      onSave?.(config);
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Failed to save configuration' });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <div className={styles.loading}>Loading Git configuration...</div>;
  }

  return (
    <div className={styles.settings}>
      <div className={styles.header}>
        <h3>Git Configuration</h3>
        <p className={styles.description}>Configure your Git identity for commits</p>
      </div>

      <div className={styles.form}>
        <div className={styles.formGroup}>
          <label htmlFor="userName">User Name</label>
          <input
            id="userName"
            type="text"
            value={config.userName}
            onChange={(e) => setConfig({ ...config, userName: e.target.value })}
            placeholder="Your Name"
            className={styles.input}
          />
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="userEmail">User Email</label>
          <input
            id="userEmail"
            type="email"
            value={config.userEmail}
            onChange={(e) => setConfig({ ...config, userEmail: e.target.value })}
            placeholder="your@email.com"
            className={styles.input}
          />
        </div>

        {message && (
          <div className={`${styles.message} ${styles[message.type]}`}>{message.text}</div>
        )}

        <button className={styles.saveButton} onClick={handleSave} disabled={isSaving}>
          {isSaving ? 'Saving...' : 'Save Configuration'}
        </button>
      </div>

      <div className={styles.tips}>
        <h4>Tips:</h4>
        <ul>
          <li>Your name and email will be attached to each commit</li>
          <li>Use the same email as your GitHub account</li>
          <li>You can change these settings at any time</li>
        </ul>
      </div>
    </div>
  );
};

export default GitSettings;
