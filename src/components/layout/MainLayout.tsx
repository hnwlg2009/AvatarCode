import React, { useState } from 'react';
import { Workspace } from '../common/Workspace';
import { ChatPanel } from '../chat/ChatPanel';
import { GitPanel } from '../../features/git/GitPanel';
import { SettingsPanel } from '../settings/SettingsPanel';
import { FileTree } from '../common/FileTree';
import styles from './MainLayout.module.css';

interface MainLayoutProps {
  workspacePath?: string;
}

type SidebarView = 'explorer' | 'git' | 'search' | 'settings';

export const MainLayout: React.FC<MainLayoutProps> = ({ workspacePath }) => {
  const [activeSidebar, setActiveSidebar] = useState<SidebarView | null>('explorer');
  const [showSettings, setShowSettings] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(250);

  const toggleSidebar = (view: SidebarView) => {
    if (view === 'settings') {
      setShowSettings(true);
    } else {
      setActiveSidebar(activeSidebar === view ? null : view);
    }
  };

  const renderSidebarContent = () => {
    const handleFileSelect = (path: string) => {
      console.log('File selected:', path);
    };

    switch (activeSidebar) {
      case 'explorer':
        return (
          <FileTree rootPath={workspacePath || '/workspace'} onFileSelect={handleFileSelect} />
        );
      case 'git':
        return <GitPanel repoPath={workspacePath || '/workspace'} />;
      default:
        return <div className={styles.placeholder}>Coming soon...</div>;
    }
  };

  if (showSettings) {
    return <SettingsPanel onClose={() => setShowSettings(false)} />;
  }

  return (
    <div className={styles.layout}>
      {/* 活动栏 */}
      <aside className={styles.activityBar}>
        <button
          className={`${styles.activityBtn} ${activeSidebar === 'explorer' ? styles.active : ''}`}
          onClick={() => toggleSidebar('explorer')}
          title="Explorer"
        >
          📁
        </button>
        <button
          className={`${styles.activityBtn} ${activeSidebar === 'git' ? styles.active : ''}`}
          onClick={() => toggleSidebar('git')}
          title="Source Control"
        >
          🌿
        </button>
        <button
          className={`${styles.activityBtn} ${activeSidebar === 'search' ? styles.active : ''}`}
          onClick={() => toggleSidebar('search')}
          title="Search"
        >
          🔍
        </button>
        <button
          className={`${styles.activityBtn} ${activeSidebar === 'settings' ? styles.active : ''}`}
          onClick={() => toggleSidebar('settings')}
          title="Settings"
        >
          ⚙️
        </button>
      </aside>

      {/* 侧边栏 */}
      {activeSidebar && (
        <aside className={styles.sidebar} style={{ width: sidebarWidth }}>
          <div className={styles.sidebarHeader}>
            <span className={styles.sidebarTitle}>
              {activeSidebar === 'explorer' && 'Explorer'}
              {activeSidebar === 'git' && 'Source Control'}
              {activeSidebar === 'search' && 'Search'}
              {activeSidebar === 'settings' && 'Settings'}
            </span>
          </div>
          <div className={styles.sidebarContent}>{renderSidebarContent()}</div>
        </aside>
      )}

      {/* 主编辑区 */}
      <main className={styles.main}>
        <Workspace />
      </main>

      {/* 右侧 AI Chat */}
      <aside className={styles.chatPanel}>
        <ChatPanel />
      </aside>
    </div>
  );
};

export default MainLayout;
