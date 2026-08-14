import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { GitSettings } from '../../features/git/settings/GitSettings';
import { EditorSettings } from './EditorSettings';
import { AppearanceSettings } from './AppearanceSettings';
import { WorkspaceSettings } from './WorkspaceSettings';
import { GeneralSettings } from './GeneralSettings';
import { APISettings } from './APISettings';
import { IconGlobe, IconCode, IconBranch, IconFiles, IconKey, IconPalette, IconClose } from '../common/Icons';
import styles from './SettingsPanel.module.css';

type SettingsTab = 'editor' | 'git' | 'appearance' | 'workspace' | 'general' | 'api';

interface SettingsPanelProps {
  onClose?: () => void;
}

export const SettingsPanel: React.FC<SettingsPanelProps> = ({ onClose }) => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<SettingsTab>('editor');

  return (
    <div className={styles.settingsPanel}>
      <div className={styles.header}>
        <h2>{t('settings.title')}</h2>
        <button className={styles.closeBtn} onClick={onClose}>
          <IconClose />
        </button>
      </div>

      <div className={styles.content}>
        <aside className={styles.sidebar}>
          <nav className={styles.nav}>
            <button
              className={`${styles.navItem} ${activeTab === 'general' ? styles.active : ''}`}
              onClick={() => setActiveTab('general')}
            >
              <span className={styles.navIcon}><IconGlobe /></span>
              <span>{t('settings.nav.general')}</span>
            </button>
            <button
              className={`${styles.navItem} ${activeTab === 'editor' ? styles.active : ''}`}
              onClick={() => setActiveTab('editor')}
            >
              <span className={styles.navIcon}><IconCode /></span>
              <span>{t('settings.nav.editor')}</span>
            </button>
            <button
              className={`${styles.navItem} ${activeTab === 'git' ? styles.active : ''}`}
              onClick={() => setActiveTab('git')}
            >
              <span className={styles.navIcon}><IconBranch /></span>
              <span>{t('settings.nav.git')}</span>
            </button>
            <button
              className={`${styles.navItem} ${activeTab === 'workspace' ? styles.active : ''}`}
              onClick={() => setActiveTab('workspace')}
            >
              <span className={styles.navIcon}><IconFiles /></span>
              <span>{t('settings.nav.workspace')}</span>
            </button>
            <button
              className={`${styles.navItem} ${activeTab === 'api' ? styles.active : ''}`}
              onClick={() => setActiveTab('api')}
            >
              <span className={styles.navIcon}><IconKey /></span>
              <span>{t('settings.nav.api')}</span>
            </button>
            <button
              className={`${styles.navItem} ${activeTab === 'appearance' ? styles.active : ''}`}
              onClick={() => setActiveTab('appearance')}
            >
              <span className={styles.navIcon}><IconPalette /></span>
              <span>{t('settings.nav.appearance')}</span>
            </button>
          </nav>
        </aside>

        <main className={styles.main}>
          {activeTab === 'general' && <GeneralSettings />}
          {activeTab === 'editor' && <EditorSettings />}
          {activeTab === 'git' && <GitSettings />}
          {activeTab === 'workspace' && <WorkspaceSettings />}
          {activeTab === 'api' && <APISettings />}
          {activeTab === 'appearance' && <AppearanceSettings />}
        </main>
      </div>
    </div>
  );
};

export default SettingsPanel;
