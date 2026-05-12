import React, { useEffect, useRef } from 'react';
import useTerminalStore from '../../stores/terminalStore';
import { Terminal } from '@xterm/xterm';
import '@xterm/xterm/css/xterm.css';
import styles from './TerminalPanel.module.css';

export const TerminalPanel: React.FC = () => {
  const { tabs, activeTabId, isPanelOpen, closeTab, activateTab, addTab } = useTerminalStore();
  const terminalRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const termInstances = useRef<Map<string, Terminal>>(new Map());

  useEffect(() => {
    if (!isPanelOpen || tabs.length === 0) return;

    const activeTab = tabs.find((t) => t.isActive);
    if (!activeTab) return;

    // 初始化活跃的 Terminal
    const container = terminalRefs.current.get(activeTab.id);
    if (container && !termInstances.current.has(activeTab.id)) {
      const term = new Terminal({
        cursorBlink: true,
        fontSize: 14,
        fontFamily: 'Consolas, "Courier New", monospace',
        theme:
          document.documentElement.getAttribute('data-theme') === 'dark'
            ? { background: '#1e1e1e' }
            : { background: '#ffffff' },
      });

      term.open(container);
      term.write('\x1b[32mWelcome to AvatarCode Terminal!\x1b[0m\n');
      term.write(`\x1b[33mWorking directory:\x1b[0m ${activeTab.cwd}\n\n`);
      termInstances.current.set(activeTab.id, term);
    }

    return () => {
      // Cleanup on unmount
    };
  }, [tabs, isPanelOpen]);

  useEffect(() => {
    // 切换主题时更新 Terminal 主题
    termInstances.current.forEach((term) => {
      const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
      term.options.theme = isDark ? { background: '#1e1e1e' } : { background: '#ffffff' };
    });
  }, []);

  if (!isPanelOpen) return null;

  return (
    <div className={styles.terminalPanel}>
      <div className={styles.tabBar}>
        <div className={styles.tabs}>
          {tabs.map((tab) => (
            <div
              key={tab.id}
              className={`${styles.tab} ${tab.isActive ? styles.active : ''}`}
              onClick={() => activateTab(tab.id)}
            >
              <span>{tab.name}</span>
              <button
                className={styles.closeBtn}
                onClick={(e) => {
                  e.stopPropagation();
                  closeTab(tab.id);
                }}
              >
                ×
              </button>
            </div>
          ))}
        </div>
        <button className={styles.addBtn} onClick={() => addTab()}>
          +
        </button>
      </div>

      <div className={styles.content}>
        {tabs.map((tab) => (
          <div
            key={tab.id}
            ref={(el) => {
              if (el) terminalRefs.current.set(tab.id, el);
              else terminalRefs.current.delete(tab.id);
            }}
            className={`${styles.terminalContainer} ${tab.isActive ? styles.active : styles.hidden}`}
          />
        ))}
      </div>
    </div>
  );
};

export default TerminalPanel;

// 快捷键打开 Terminal
export function useTerminalShortcuts() {
  const { addTab, setPanelOpen, isPanelOpen } = useTerminalStore();
  
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + ` 打开/关闭 Terminal
      if ((e.ctrlKey || e.metaKey) && e.key === '`') {
        e.preventDefault();
        if (!isPanelOpen) {
          addTab();
          setPanelOpen(true);
        } else {
          setPanelOpen(false);
        }
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPanelOpen]);
}
