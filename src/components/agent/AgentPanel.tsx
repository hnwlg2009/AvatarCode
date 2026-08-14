import React, { useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAgentStore } from '../../stores/agentStore';
import { AgentMessage } from './AgentMessage';
import { AgentInput } from './AgentInput';
import styles from './AgentPanel.module.css';

export const AgentPanel: React.FC = () => {
  const { t } = useTranslation();
  const { messages, status, error, toolStatus, currentTask, pendingApproval, clearMessages, stopExecution, approvePendingCommand, denyPendingCommand } =
    useAgentStore();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, toolStatus]);

  const isRunning = status === 'executing' || status === 'loading';

  return (
    <div className={styles.agentPanel}>
      <div className={styles.header}>
        <h3>{t('agent.title')}</h3>
        <div className={styles.headerActions}>
          {isRunning && (
            <button onClick={stopExecution} className={styles.stopBtn}>
              {t('agent.stop')}
            </button>
          )}
          <button onClick={clearMessages} className={styles.clearBtn}>
            {t('agent.clear')}
          </button>
        </div>
      </div>

      {isRunning && currentTask && (
        <div className={styles.statusBar}>
          <span className={styles.statusBadge}>{status}</span>
          <span className={styles.currentTask}>{currentTask}</span>
        </div>
      )}

      <div className={styles.messages}>
        {messages.length === 0 ? (
          <div className={styles.emptyState}>
            <p>{t('agent.welcome')}</p>
            <p className={styles.hint}>{t('agent.hint')}</p>
          </div>
        ) : (
          messages.map((msg) => <AgentMessage key={msg.id} message={msg} />)
        )}

        {toolStatus.length > 0 && (
          <div className={styles.toolStatusList}>
            {toolStatus.map((ts, idx) => (
              <div key={`${ts.name}-${idx}`} className={`${styles.toolStatus} ${styles[ts.status]}`}>
                <span className={styles.toolStatusName}>{ts.name}</span>
                {ts.status === 'running' ? (
                  <span className={styles.toolStatusState}>running...</span>
                ) : ts.status === 'error' ? (
                  <span className={styles.toolStatusError}>{ts.error || 'failed'}</span>
                ) : (
                  <span className={styles.toolStatusState}>done</span>
                )}
              </div>
            ))}
          </div>
        )}

        {pendingApproval && (
          <div className={styles.approvalBar}>
            <div className={styles.approvalText}>
              <span className={styles.approvalLabel}>{t('agent.approval')}</span>
              <code className={styles.approvalCommand}>{pendingApproval.command}</code>
            </div>
            <div className={styles.approvalActions}>
              <button
                onClick={() => approvePendingCommand()}
                className={styles.approveBtn}
              >
                {t('agent.approve')}
              </button>
              <button
                onClick={() => denyPendingCommand()}
                className={styles.denyBtn}
              >
                {t('agent.deny')}
              </button>
            </div>
          </div>
        )}

        {status === 'loading' && (
          <div className={styles.loading}>
            <span>●</span><span>●</span><span>●</span>
          </div>
        )}
        {error && <div className={styles.error}>{error}</div>}
        <div ref={messagesEndRef} />
      </div>

      <AgentInput />
    </div>
  );
};

export default AgentPanel;