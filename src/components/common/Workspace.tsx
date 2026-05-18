import React, { useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { CodeEditor, CodeEditorRef } from '../editor';
import { useTabManagerStore } from '../../stores/tabManagerStore';
import fileSystemService from '../../services/FileSystemService';
import { TabBar } from './TabBar';
import styles from './Workspace.module.css';

export const Workspace: React.FC = () => {
  const { t } = useTranslation();
  const editorRef = useRef<CodeEditorRef>(null);

  const {
    tabs,
    activeTabId,
    addTab,
    closeTab,
    activateTab,
    updateTabContent,
    markAsSaved,
    updateTabConfig,
    getActiveTab,
  } = useTabManagerStore();

  const activeTab = getActiveTab();

  // 打开文件
  const handleOpenFile = useCallback(async () => {
    const filePath = await fileSystemService.openFileDialog();
    if (!filePath) return;

    try {
      const content = await fileSystemService.readFile(filePath);
      if (!content) return;
      const language = fileSystemService.getFileLanguage(filePath);
      const fileName = filePath.split('/').pop() || 'Untitled';

      addTab({
        path: filePath,
        name: fileName,
        language,
        id: filePath,
        content,
        isDirty: false,
        isLoading: false,
        config: { theme: 'vs-dark' as const },
      });
    } catch (error) {
      console.error('Failed to open file:', error);
    }
  }, [addTab]);

  // 保存文件
  const handleSaveFile = useCallback(async () => {
    if (!activeTab) return;

    try {
      await fileSystemService.writeFile(activeTab.path, activeTab.content);
      markAsSaved(activeTab.id);
      console.log('File saved:', activeTab.path);
    } catch (error) {
      console.error('Failed to save file:', error);
    }
  }, [activeTab, markAsSaved]);

  // 处理内容变化
  const handleValueChange = useCallback(
    (value: string | undefined) => {
      if (activeTabId && value !== undefined) {
        updateTabContent(activeTabId, value);
      }
    },
    [activeTabId, updateTabContent]
  );

  // 处理 Tab 点击
  const handleTabClick = useCallback(
    (tabId: string) => {
      activateTab(tabId);
    },
    [activateTab]
  );

  // 处理 Tab 关闭
  const handleTabClose = useCallback(
    (tabId: string) => {
      closeTab(tabId);
    },
    [closeTab]
  );

  // 键盘快捷键
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + S: Save
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleSaveFile();
      }

      // Ctrl/Cmd + O: Open
      if ((e.ctrlKey || e.metaKey) && e.key === 'o') {
        e.preventDefault();
        handleOpenFile();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleSaveFile, handleOpenFile]);

  return (
    <div className={styles.workspace}>
      {tabs.length > 0 && (
        <TabBar
          tabs={tabs}
          activeTabId={activeTabId}
          onTabClick={handleTabClick}
          onTabClose={handleTabClose}
        />
      )}

      <div className={styles.editorArea}>
        {activeTab ? (
          <>
            <div className={styles.fileTab}>
              <span className={styles.fileName}>{activeTab.path}</span>
            </div>
            <CodeEditor
              ref={editorRef}
              value={activeTab.content}
              language={activeTab.language}
              onChange={handleValueChange}
            />
          </>
        ) : (
          <div className={styles.emptyState}>
            <div className={styles.emptyStateContent}>
              <h2>{t('workspace.emptyTitle')}</h2>
              <p>{t('workspace.emptyHint')}</p>
              <div className={styles.shortcuts}>
                <div className={styles.shortcutItem}>
                  <kbd>Ctrl+O</kbd>
                  <span>{t('workspace.openFile')}</span>
                </div>
                <div className={styles.shortcutItem}>
                  <kbd>Ctrl+S</kbd>
                  <span>{t('workspace.saveFile')}</span>
                </div>
              </div>
              <button className={styles.openButton} onClick={handleOpenFile}>
                {t('workspace.selectFile')}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Workspace;
