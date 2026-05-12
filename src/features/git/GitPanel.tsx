import React, { useState, useEffect, useCallback } from 'react';
import { GitService, GitStatus, GitCommit, GitBranch } from '../../services/GitService';
import styles from './GitPanel.module.css';

interface GitPanelProps {
  repoPath: string;
}

export const GitPanel: React.FC<GitPanelProps> = ({ repoPath }) => {
  const [gitService] = useState<GitService>(() => new GitService(repoPath));
  const [status, setStatus] = useState<GitStatus | null>(null);
  const [commits, setCommits] = useState<GitCommit[]>([]);
  const [branches, setBranches] = useState<GitBranch[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'changes' | 'history' | 'branches'>('changes');
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [commitMessage, setCommitMessage] = useState('');

  // 加载 Git 状态
  const loadStatus = useCallback(async () => {
    try {
      const isRepo = await gitService.isGitRepo();
      if (!isRepo) {
        setStatus(null);
        return;
      }

      const [statusData, commitsData, branchesData] = await Promise.all([
        gitService.getStatus(),
        gitService.getLog(10),
        gitService.getBranches(),
      ]);

      setStatus(statusData);
      setCommits(commitsData);
      setBranches(branchesData);
    } catch (error) {
      console.error('Failed to load git status:', error);
    } finally {
      setIsLoading(false);
    }
  }, [gitService]);

  useEffect(() => {
    loadStatus();
  }, [loadStatus]);

  // 暂存文件
  const handleStageFile = async (filepath: string) => {
    try {
      await gitService.add(filepath);
      await loadStatus();
    } catch (error) {
      console.error('Failed to stage file:', error);
    }
  };

  // 取消暂存
  const handleUnstageFile = async (filepath: string) => {
    try {
      await gitService.remove(filepath);
      await loadStatus();
    } catch (error) {
      console.error('Failed to unstage file:', error);
    }
  };

  // 提交更改
  const handleCommit = async () => {
    if (!commitMessage.trim() || selectedFiles.length === 0) return;

    try {
      await gitService.add(selectedFiles);
      await gitService.commit(commitMessage);
      setCommitMessage('');
      setSelectedFiles([]);
      await loadStatus();
    } catch (error) {
      console.error('Failed to commit:', error);
    }
  };

  // 切换分支
  const handleCheckout = async (branchName: string) => {
    try {
      await gitService.checkout(branchName);
      await loadStatus();
    } catch (error) {
      console.error('Failed to checkout:', error);
    }
  };

  // 创建新分支
  const handleCreateBranch = async (branchName: string) => {
    try {
      await gitService.createBranch(branchName);
      await loadStatus();
    } catch (error) {
      console.error('Failed to create branch:', error);
    }
  };

  if (isLoading) {
    return <div className={styles.loading}>Loading Git...</div>;
  }

  if (!status) {
    return (
      <div className={styles.notRepo}>
        <p>This is not a Git repository</p>
      </div>
    );
  }

  return (
    <div className={styles.gitPanel}>
      {/* 分支信息 */}
      <div className={styles.branchBar}>
        <span className={styles.branchIcon}>🌿</span>
        <span className={styles.branchName}>{status.branch}</span>
        {status.ahead > 0 && <span className={styles.ahead}>↑{status.ahead}</span>}
        {status.behind > 0 && <span className={styles.behind}>↓{status.behind}</span>}
      </div>

      {/* 标签页 */}
      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${activeTab === 'changes' ? styles.active : ''}`}
          onClick={() => setActiveTab('changes')}
        >
          Changes ({status.files.length})
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'history' ? styles.active : ''}`}
          onClick={() => setActiveTab('history')}
        >
          History
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'branches' ? styles.active : ''}`}
          onClick={() => setActiveTab('branches')}
        >
          Branches
        </button>
      </div>

      {/* 更改列表 */}
      {activeTab === 'changes' && (
        <div className={styles.changesTab}>
          <div className={styles.fileList}>
            {status.files.map((file) => (
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
                  {selectedFiles.includes(file.path) ? 'Unstage' : 'Stage'}
                </button>
              </div>
            ))}
          </div>

          {/* 提交区域 */}
          <div className={styles.commitArea}>
            <textarea
              className={styles.commitMessage}
              placeholder="Commit message..."
              value={commitMessage}
              onChange={(e) => setCommitMessage(e.target.value)}
              rows={3}
            />
            <button
              className={styles.commitButton}
              onClick={handleCommit}
              disabled={!commitMessage.trim() || selectedFiles.length === 0}
            >
              Commit
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
              <span className={styles.branchIcon}>{branch.current ? '✓' : '🌿'}</span>
              <span className={styles.branchName}>{branch.name}</span>
              {branch.current && <span className={styles.currentLabel}>(current)</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default GitPanel;
