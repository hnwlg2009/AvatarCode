import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Workspace } from '../common/Workspace';
import { ChatPanel } from '../chat/ChatPanel';
import { AgentPanel } from '../agent/AgentPanel';
import { GitPanel } from '../../features/git/GitPanel';
import { SettingsPanel } from '../settings/SettingsPanel';
import { FileTree, IFileNode } from '../common/FileTree';
import { IconFiles, IconBranch, IconSearch, IconSettings } from '../common/Icons';
import useSettingsStore from '../../stores/settingsStore';
import useUIStore from '../../stores/uiStore';
import { openFileInWorkspace } from '../../utils/workspace';
import { buildFileTree } from '../../utils/explorer';
import styles from './MainLayout.module.css';

type SidebarView = 'explorer' | 'git' | 'search';

export const MainLayout: React.FC = () => {
  const { t } = useTranslation();
  const workspacePath = useSettingsStore((s) => s.workspacePath);
  const setWorkspacePath = useSettingsStore((s) => s.setWorkspacePath);
  const {
    sidebarVisible,
    sidebarWidth,
    rightPanelWidth,
    rightView,
    toggleSidebar,
    setSidebarWidth,
    setRightPanelWidth,
    setRightView,
  } = useUIStore();
  const [activeSidebar, setActiveSidebar] = useState<SidebarView | null>('explorer');
  const [showSettings, setShowSettings] = useState(false);
  const [fileNodes, setFileNodes] = useState<IFileNode[] | null>(null);
  const [isTreeLoading, setIsTreeLoading] = useState(false);
  const dragRef = useRef<{ type: 'sidebar' | 'right'; startX: number; startWidth: number } | null>(
    null
  );

  const toggleSidebarView = (view: SidebarView) => {
    setActiveSidebar(activeSidebar === view ? null : view);
  };

  // 打开工作区
  const handleOpenWorkspace = useCallback(async () => {
    const dirPath = await window.electronAPI?.openDirectoryDialog();
    if (!dirPath) return;
    setWorkspacePath(dirPath);
    await window.electronAPI?.file.addWorkspacePath(dirPath);
  }, [setWorkspacePath]);

  // 加载文件树
  useEffect(() => {
    let cancelled = false;

    if (!workspacePath) {
      setFileNodes(null);
      return;
    }

    setIsTreeLoading(true);
    buildFileTree(workspacePath)
      .then((nodes) => {
        if (!cancelled) setFileNodes(nodes);
      })
      .catch((error) => {
        console.error('Failed to load file tree:', error);
        if (!cancelled) setFileNodes([]);
      })
      .finally(() => {
        if (!cancelled) setIsTreeLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [workspacePath]);

  // 菜单事件：切换侧栏
  useEffect(() => {
    const api = window.electronAPI;
    if (!api) return;
    const off = api.on('menu:toggle-sidebar', () => {
      toggleSidebar();
      if (activeSidebar) {
        setActiveSidebar(activeSidebar);
      }
    });
    return off;
  }, [toggleSidebar, activeSidebar]);

  // 拖拽调整分栏宽度
  const startDrag = (type: 'sidebar' | 'right') => (e: React.MouseEvent) => {
    e.preventDefault();
    dragRef.current = {
      type,
      startX: e.clientX,
      startWidth: type === 'sidebar' ? sidebarWidth : rightPanelWidth,
    };
    document.body.style.userSelect = 'none';
    document.addEventListener('mousemove', onDragMove);
    document.addEventListener('mouseup', stopDrag);
  };

  const onDragMove = (e: MouseEvent) => {
    const drag = dragRef.current;
    if (!drag) return;
    const delta = drag.type === 'sidebar' ? e.clientX - drag.startX : drag.startX - e.clientX;
    if (drag.type === 'sidebar') {
      setSidebarWidth(drag.startWidth + delta);
    } else {
      setRightPanelWidth(drag.startWidth + delta);
    }
  };

  const stopDrag = () => {
    dragRef.current = null;
    document.body.style.userSelect = '';
    document.removeEventListener('mousemove', onDragMove);
    document.removeEventListener('mouseup', stopDrag);
  };

  const renderSidebarContent = () => {
    switch (activeSidebar) {
      case 'explorer':
        if (!workspacePath) {
          return (
            <div className={styles.explorerEmpty}>
              <p>{t('explorer.noWorkspace')}</p>
              <button onClick={handleOpenWorkspace} className={styles.openWorkspaceButton}>
                {t('explorer.openWorkspace')}
              </button>
            </div>
          );
        }
        return (
          <>
            <div className={styles.explorerHeader}>
              <span className={styles.explorerPath}>{workspacePath}</span>
              <button onClick={handleOpenWorkspace} className={styles.openWorkspaceButton}>
                {t('explorer.openWorkspace')}
              </button>
            </div>
            {isTreeLoading ? (
              <div className={styles.treeLoading}>{t('git.loading')}</div>
            ) : (
              <FileTree
                rootPath={workspacePath}
                files={fileNodes ?? []}
                onFileSelect={openFileInWorkspace}
              />
            )}
          </>
        );
      case 'git':
        return <GitPanel repoPath={workspacePath} />;
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
          onClick={() => toggleSidebarView('explorer')}
          title={t('main.explorer')}
        >
          <IconFiles />
        </button>
        <button
          className={`${styles.activityBtn} ${activeSidebar === 'git' ? styles.active : ''}`}
          onClick={() => toggleSidebarView('git')}
          title={t('main.git')}
        >
          <IconBranch />
        </button>
        <button
          className={`${styles.activityBtn} ${activeSidebar === 'search' ? styles.active : ''}`}
          onClick={() => toggleSidebarView('search')}
          title={t('main.search')}
        >
          <IconSearch />
        </button>
        <div className={styles.activitySpacer} />
        <button
          className={`${styles.activityBtn} ${showSettings ? styles.active : ''}`}
          onClick={() => setShowSettings(true)}
          title={t('main.settings')}
        >
          <IconSettings />
        </button>
      </aside>

      {/* 侧边栏 */}
      {sidebarVisible && activeSidebar && (
        <aside className={styles.sidebar} style={{ width: sidebarWidth }}>
          <div className={styles.sidebarHeader}>
            <span className={styles.sidebarTitle}>
              {activeSidebar === 'explorer' && t('main.explorer')}
              {activeSidebar === 'git' && t('main.git')}
              {activeSidebar === 'search' && t('main.search')}
            </span>
          </div>
          <div className={styles.sidebarContent}>{renderSidebarContent()}</div>
        </aside>
      )}
      <div className={styles.resizeHandle} onMouseDown={startDrag('sidebar')} />

      {/* 主编辑区 */}
      <main className={styles.main}>
        <Workspace />
      </main>

      {/* 右侧 AI 面板（Chat / Agent tab） */}
      <div className={styles.resizeHandleRight} onMouseDown={startDrag('right')} />
      <aside className={styles.chatPanel} style={{ width: rightPanelWidth }}>
        <div className={styles.rightPanelTabs}>
          <button
            className={`${styles.rightPanelTab} ${rightView === 'chat' ? styles.active : ''}`}
            onClick={() => setRightView('chat')}
          >
            {t('main.chat')}
          </button>
          <button
            className={`${styles.rightPanelTab} ${rightView === 'agent' ? styles.active : ''}`}
            onClick={() => setRightView('agent')}
          >
            {t('main.agent')}
          </button>
        </div>
        {rightView === 'chat' ? <ChatPanel /> : <AgentPanel />}
      </aside>
    </div>
  );
};

export default MainLayout;