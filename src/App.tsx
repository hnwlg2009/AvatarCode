import React, { useEffect } from 'react';
import { MainLayout } from './components/layout';
import useSettingsStore from './stores/settingsStore';
import fileSystemService from './services/FileSystemService';
import { openFileInWorkspace, saveActiveTab, createUntitledTab } from './utils/workspace';
import i18n from './i18n';

function App() {
  const theme = useSettingsStore((s) => s.settings.appearance.theme);
  const language = useSettingsStore((s) => s.settings.general.language);
  const setWorkspacePath = useSettingsStore((s) => s.setWorkspacePath);

  // 主题应用：dark / light / system
  useEffect(() => {
    const resolved =
      theme === 'system'
        ? window.matchMedia('(prefers-color-scheme: dark)').matches
          ? 'dark'
          : 'light'
        : theme;
    document.documentElement.dataset.theme = resolved;
    document.body.style.backgroundColor = resolved === 'dark' ? '#0d0d0d' : '#f5f5f5';
    document.body.style.color = resolved === 'dark' ? '#e0e0e0' : '#1a1a1a';
  }, [theme]);

  // 语言同步
  useEffect(() => {
    i18n.changeLanguage(language);
    // 主进程菜单语言同步（含启动时）
    window.electronAPI?.send('language-changed', language);
  }, [language]);

  // 启动时恢复工作区路径；主进程重启后丢失授权，需重新声明
  useEffect(() => {
    const api = window.electronAPI;
    if (!api) return;
    const restore = async () => {
      // 本次会话内主进程已记录的工作区
      const mainPath = await api.getWorkspacePath();
      if (mainPath) {
        setWorkspacePath(mainPath);
        return;
      }
      // 上次会话持久化的工作区：重新授权（workspace:setPath 会 addAllowedPath）
      const persisted = useSettingsStore.getState().workspacePath;
      if (persisted) {
        await api.workspace.setPath(persisted);
      }
    };
    restore();
  }, [setWorkspacePath]);

  // 菜单事件：打开 / 保存 / 新建文件
  useEffect(() => {
    const api = window.electronAPI;
    if (!api) return;

    const offOpen = api.on('menu:open-file', async () => {
      const filePath = await fileSystemService.openFileDialog();
      if (filePath) await openFileInWorkspace(filePath);
    });
    const offSave = api.on('menu:save-file', () => {
      saveActiveTab();
    });
    const offNew = api.on('menu:new-file', () => {
      createUntitledTab();
    });

    return () => {
      offOpen();
      offSave();
      offNew();
    };
  }, []);

  return (
    <div className="app">
      <MainLayout />
    </div>
  );
}

export default App;