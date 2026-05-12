import React, { useState } from 'react';
import { GitSettings } from '../../features/git/settings/GitSettings';
import { EditorSettings } from './EditorSettings';
import { AppearanceSettings } from './AppearanceSettings';
import { WorkspaceSettings } from './WorkspaceSettings';
import styles from './SettingsPanel.module.css';

type SettingsTab = 'editor' | 'git' | 'appearance' | 'workspace';

interface SettingsPanelProps {
  onClose?: () => void;
}

export const SettingsPanel: React.FC<SettingsPanelProps> = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState<SettingsTab>('editor');

  return (
    <div className={styles.settingsPanel}>
      <div className={styles.header}>
        <h2>Settings</h2>
        <button className={styles.closeBtn} onClick={onClose}>
          ✕
        </button>
      </div>

      <div className={styles.content}>
        <aside className={styles.sidebar}>
          <nav className={styles.nav}>
            <button
              className={`${styles.navItem} ${activeTab === 'editor' ? styles.active : ''}`}
              onClick={() => setActiveTab('editor')}
            >
              <span className={styles.navIcon}>📝</span>
              <span>Editor</span>
            </button>
            <button
              className={`${styles.navItem} ${activeTab === 'git' ? styles.active : ''}`}
              onClick={() => setActiveTab('git')}
            >
              <span className={styles.navIcon}>🌿</span>
              <span>Git</span>
            </button>
            <button
              className={`${styles.navItem} ${activeTab === 'workspace' ? styles.active : ''}`}
              onClick={() => setActiveTab('workspace')}
            >
              <span className={styles.navIcon}>📁</span>
              <span>Workspace</span>
            </button>
            <button
              className={`${styles.navItem} ${activeTab === 'appearance' ? styles.active : ''}`}
              onClick={() => setActiveTab('appearance')}
            >
              <span className={styles.navIcon}>🎨</span>
              <span>Appearance</span>
            </button>
          </nav>
        </aside>

        <main className={styles.main}>
          {activeTab === 'editor' && <EditorSettings />}
          {activeTab === 'git' && <GitSettings />}
          {activeTab === 'workspace' && <WorkspaceSettings />}
          {activeTab === 'appearance' && <AppearanceSettings />}
        </main>
      </div>
    </div>
  );
};

export default SettingsPanel;
