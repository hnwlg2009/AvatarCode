import React from 'react';
import styles from './TabBar.module.css';
import { ITab } from '../../stores/tabManagerStore';

interface TabBarProps {
  tabs: ITab[];
  activeTabId: string | null;
  onTabClick: (tabId: string) => void;
  onTabClose: (tabId: string) => void;
  className?: string;
}

export const TabBar: React.FC<TabBarProps> = ({
  tabs,
  activeTabId,
  onTabClick,
  onTabClose,
  className = '',
}) => {
  return (
    <div className={`${styles.tabBar} ${className}`}>
      <div className={styles.tabs}>
        {tabs.map((tab) => (
          <div
            key={tab.id}
            className={`${styles.tab} ${tab.id === activeTabId ? styles.active : ''} ${
              tab.isDirty ? styles.dirty : ''
            }`}
            onClick={() => onTabClick(tab.id)}
          >
            <span className={styles.tabName}>{tab.name}</span>
            {tab.isDirty && <span className={styles.dirtyIndicator}>•</span>}
            <button
              className={styles.closeButton}
              onClick={(e) => {
                e.stopPropagation();
                onTabClose(tab.id);
              }}
              title="Close"
            >
              <svg width="12" height="12" viewBox="0 0 12 12">
                <path
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  d="M3 3l6 6m0-6l-6 6"
                />
              </svg>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TabBar;
