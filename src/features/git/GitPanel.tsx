import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import type {
  GitStatusData,
  GitCommitData,
  GitBranchData,
} from '../../types/electron';
import useSettingsStore from '../../stores/settingsStore';
import { IconBranch } from '../../components/common/Icons';
import styles from './GitPanel.module.css';

interface GitPanelProps {
  repoPath: string | null;
}

export const GitPanel: React.FC<GitPanelProps> = ({ repoPath }) => {
  const { t } = useTranslation();
  const settingsStore = useSettingsStore();
  const [isRepo, setIsRepo] = useState<boolean | null>(null);
  const [status, setStatus] = useState<GitStatusData | null>(null);
  const [commits, setCommits] = useState<GitCommitData[]>([]);
  const [branches, setBranches] = useState<GitBranchData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'changes' | 'history' | 'branches'>('changes');
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [commitMessage, setCommitMessage] = useState('');

  // 加载 Git 状态
  const loadStatus = useCallback(async () => {
    if (!repoPath || !window.electronAPI) {
      setIsLoading(false);
      return;
    }

    try {
      const git = window.electronAPI.git;
      const initResult = await git.init(repoPath);
      if (!initResult.success || !initResult.isRepo) {
        setIsRepo(false);
        setStatus(null);
        return;
      }

      setIsRepo(true);
      const [statusData, commitsData, branchesData] = await Promise.all([
        git.getStatus(repoPath),
        git.getLog(repoPath, 10),
        git.getBranches(repoPath),
      ]);

      setStatus(statusData);
      setCommits(commitsData);
      setBranches(branchesData);
    } catch (error) {
      console.error('Failed to load git status:', error);
      setStatus(null);
    } finally {
      setIsLoading(false);
    }
  }, [repoPath]);

  useEffect(() => {
    setIsLoading(true);
    loadStatus();
  }, [loadStatus]);

  // 暂存文件
  const handleStageFile = async (filepath: string) => {
    if (!repoPath || !window.electronAPI) return;
    try {
      await window.electronAPI.git.add(repoPath, filepath);
      await loadStatus();
    } catch (error) {
      console.error('Failed to stage file:', error);
    }
  };

  // 取消暂存
  const handleUnstageFile = async (filepath: string) => {
    if (!repoPath || !window.electronAPI) return;
    try {
      await window.electronAPI.git.remove(repoPath, filepath);
      await loadStatus();
    } catch (error) {
      console.error('Failed to unstage file:', error);
    }
  };

  // 提交更改
  const handleCommit = async () => {
    if (!repoPath || !commitMessage.trim() || selectedFiles.length === 0) return;

    try {
      const git = window.electronAPI!.git!;
      await git.add(repoPath, selectedFiles);
      await git.commit(repoPath, commitMessage, {
        name: settingsStore.settings.git.userName || undefined,
        email: settingsStore.settings.git.userEmail || undefined,
      });
      setCommitMessage('');
      setSelectedFiles([]);
      await loadStatus();
    } catch (error) {
      console.error('Failed to commit:', error);
    }
  };

  // 切换分支
  const handleCheckout = async (branchName: string) => {
    if (!repoPath || !window.electronAPI) return;
    try {
      await window.electronAPI.git.checkout(repoPath, branchName);
      await loadStatus();
    } catch (error) {
      console.error('Failed to checkout:', error);
    }
  };

  // 创建新分支
  const handleCreateBranch = async (branchName: string) => {
    if (!repoPath || !branchName.trim() || !window.electronAPI) return;
    try {
      await window.electronAPI.git.createBranch(repoPath, branchName.trim());
      await loadStatus();
    } catch (error) {
      console.error('Failed to create branch:', error);
    }
  };

  if (isLoading) {
    return <div className={styles.loading}>{t('git.loading')}</div>;
  }

  if (!repoPath) {
    return (
      <div className={styles.notRepo}>
        <p>{t('git.noWorkspace')}</p>
      </div>
    );
  }

  if (!isRepo) {
    return (
      <div className={styles.notRepo}>
        <p>{t('git.notRepo')}</p>
      </div>
    );
  }

  return (
    <div className={styles.gitPanel}>
      {/* 分支信息 */}
      <div className={styles.branchBar}>
        <span className={styles.branchIcon}><IconBranch /></span>
        <span className={styles.branchName}>{status?.branch || 'HEAD'}</span>
      </div>

      {/* 标签页 */}
      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${activeTab === 'changes' ? styles.active : ''}`}
          onClick={() => setActiveTab('changes')}
        >
          {t('git.changes')} ({status?.files.length ?? 0})
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'history' ? styles.active : ''}`}
          onClick={() => setActiveTab('history')}
        >
          {t('git.history')}
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'branches' ? styles.active : ''}`}
          onClick={() => setActiveTab('branches')}
        >
          {t('git.branches')}
        </button>
      </div>

      {/* 更改列表 */}
      {activeTab === 'changes' && (
        <div className={styles.changesTab}>
          <div className={styles.fileList}>
            {(status?.files ?? []).map((file) => (
              <div key={file.path} className={styles.fileItem}>
                <input
                  type="checkbox"
                  checked={selectedFiles.includes(file.path)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedFiles([...selectedFiles, file.path]);
                    } else {
                      setSelectedFiles(selectedFiles.filter((f) => f !== file.path));
                    }
                  }}
                />
                <span className={`${styles.fileStatus} ${styles[file.status]}`}>{file.status}</span>
                <span className={styles.filePath}>{file.path}</span>
                <button
                  className={styles.stageButton}
                  onClick={() =>
                    selectedFiles.includes(file.path)
                      ? handleUnstageFile(file.path)
                      : handleStageFile(file.path)
                  }
                >
                  {selectedFiles.includes(file.path) ? t('git.unstage') : t('git.stage')}
                </button>
              </div>
            ))}
          </div>

          {/* 提交区域 */}
          <div className={styles.commitArea}>
            <textarea
              className={styles.commitMessage}
              placeholder={t('git.commitPlaceholder')}
              value={commitMessage}
              onChange={(e) => setCommitMessage(e.target.value)}
              rows={3}
            />
            <button
              className={styles.commitButton}
              onClick={handleCommit}
              disabled={!commitMessage.trim() || selectedFiles.length === 0}
            >
              {t('git.commit')}
            </button>
          </div>
        </div>
      )}

      {/* 提交历史 */}
      {activeTab === 'history' && (
        <div className={styles.historyTab}>
          {commits.map((commit) => (
            <div key={commit.oid} className={styles.commitItem}>
              <div className={styles.commitHash}>{commit.oid.substring(0, 7)}</div>
              <div className={styles.commitMessage}>{commit.message}</div>
              <div className={styles.commitMeta}>
                <span>{commit.author}</span>
                <span>{new Date(commit.date).toLocaleString()}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 分支管理 */}
      {activeTab === 'branches' && (
        <div className={styles.branchesTab}>
          {branches.map((branch) => (
            <div
              key={branch.name}
              className={`${styles.branchItem} ${branch.current ? styles.current : ''}`}
              onClick={() => !branch.current && handleCheckout(branch.name)}
            >
              <span className={styles.branchIcon}>{branch.current ? '✓' : <IconBranch />}</span>
              <span className={styles.branchName}>{branch.name}</span>
              {branch.current && <span className={styles.currentLabel}>{t('git.current')}</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default GitPanel;