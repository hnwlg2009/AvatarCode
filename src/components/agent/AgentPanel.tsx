import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { AgentOrchestrator } from '../../features/agent/AgentOrchestrator';
import { FileTool, SearchTool } from '../../features/agent/tools';
import { Agent, TaskStep, AgentState as AgentStateEnum } from '../../features/agent/types/agent.types';
import styles from './AgentPanel.module.css';

type AgentTab = 'explore' | 'plan' | 'execute' | 'review' | 'history';

interface AgentPanelProps {
  onSubmitTask?: (task: string) => void;
}

export const AgentPanel: React.FC<AgentPanelProps> = ({ onSubmitTask }) => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<AgentTab>('explore');
  const [taskInput, setTaskInput] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [currentTask, setCurrentTask] = useState<string | null>(null);
  const [steps, setSteps] = useState<TaskStep[]>([]);
  const [logs, setLogs] = useState<string[]>([]);

  const orchestrator = new AgentOrchestrator();

  useEffect(() => {
    orchestrator.registerTool(new FileTool());
    orchestrator.registerTool(new SearchTool());
  }, []);

  const handleStartTask = async () => {
    if (!taskInput.trim()) return;

    setIsRunning(true);
    setCurrentTask(taskInput);
    setSteps([]);
    setLogs([t('agent.taskStarted') + taskInput]);

    try {
      onSubmitTask?.(taskInput);

      // 启动 Agent 任务流程
      const task = await orchestrator.startTask(taskInput);

      setSteps(task.steps);
      setLogs((prev) => [...prev, t('agent.taskCompleted')]);
    } catch (error: any) {
      setLogs((prev) => [...prev, t('agent.taskFailed') + error.message]);
    } finally {
      setIsRunning(false);
      setCurrentTask(null);
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'explore':
        return <div className={styles.tabContent}>{t('agent.exploreContent')}</div>;
      case 'plan':
        return (
          <div className={styles.tabContent}>
            <h3>{t('agent.taskPlan')}</h3>
            {steps.length > 0 ? (
              <div className={styles.steps}>
                {steps.map((step, i) => (
                  <div key={step.id} className={`${styles.stepItem} ${styles[step.status]}`}>
                    <span className={styles.stepNumber}>{i + 1}</span>
                    <span className={styles.stepDesc}>{step.description}</span>
                    <span className={styles.stepAgent}>{step.agent}</span>
                    <span className={styles.stepStatus}>{step.status}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className={styles.empty}>{t('agent.noPlan')}</p>
            )}
          </div>
        );
      case 'execute':
        return <div className={styles.tabContent}>{t('agent.executeContent')}</div>;
      case 'review':
        return <div className={styles.tabContent}>{t('agent.reviewContent')}</div>;
      case 'history':
        return <div className={styles.tabContent}>{t('agent.historyContent')}</div>;
      default:
        return null;
    }
  };

  return (
    <div className={styles.agentPanel}>
      {/* 任务输入区 */}
      <div className={styles.taskInput}>
        <textarea
          value={taskInput}
          onChange={(e) => setTaskInput(e.target.value)}
          placeholder={t('agent.taskPlaceholder')}
          disabled={isRunning}
          className={styles.textarea}
        />
        <button
          onClick={handleStartTask}
          disabled={isRunning || !taskInput.trim()}
          className={styles.startButton}
        >
          {isRunning ? t('agent.running') : t('agent.startTask')}
        </button>
      </div>

      {/* Agent 标签页 */}
      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${activeTab === 'explore' ? styles.active : ''}`}
          onClick={() => setActiveTab('explore')}
        >
          🔍 {t('agent.tabs.explore')}
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'plan' ? styles.active : ''}`}
          onClick={() => setActiveTab('plan')}
        >
          📋 {t('agent.tabs.plan')}
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'execute' ? styles.active : ''}`}
          onClick={() => setActiveTab('execute')}
        >
          ⚡ {t('agent.tabs.execute')}
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'review' ? styles.active : ''}`}
          onClick={() => setActiveTab('review')}
        >
          ✅ {t('agent.tabs.review')}
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'history' ? styles.active : ''}`}
          onClick={() => setActiveTab('history')}
        >
          📜 {t('agent.tabs.history')}
        </button>
      </div>

      {/* 当前任务状态 */}
      {isRunning && (
        <div className={styles.runningState}>
          <div className={styles.spinner}></div>
          <span>{t('agent.runningTask')}{currentTask}</span>
        </div>
      )}

      {/* 标签页内容 */}
      {renderTabContent()}

      {/* 日志输出 */}
      {logs.length > 0 && (
        <div className={styles.logs}>
          <h4>{t('agent.executionLogs')}</h4>
          <div className={styles.logList}>
            {logs.map((log, i) => (
              <div key={i} className={styles.logItem}>
                {log}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AgentPanel;
