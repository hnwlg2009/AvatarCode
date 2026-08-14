import React from 'react';
import type { AgentMessage as AgentMessageType } from '../../features/agent/types/agent.types';
import styles from './AgentMessage.module.css';

interface AgentMessageProps {
  message: AgentMessageType;
}

export const AgentMessage: React.FC<AgentMessageProps> = ({ message }) => {
  const isUser = message.role === 'user';
  const isTool = message.role === 'tool';

  return (
    <div className={`${styles.message} ${isUser ? styles.user : styles.assistant}`}>
      <div className={styles.role}>
        {isUser ? 'You' : isTool ? 'Tool' : 'Agent'}
      </div>
      <div className={styles.content}>
        {message.content}
      </div>
      {message.toolCalls && message.toolCalls.length > 0 && (
        <div className={styles.toolCalls}>
          {message.toolCalls.map((tc) => (
            <div key={tc.id} className={styles.toolCall}>
              <span className={styles.toolName}>{tc.name}</span>
              <pre className={styles.toolArgs}>
                {JSON.stringify(tc.arguments, null, 2)}
              </pre>
            </div>
          ))}
        </div>
      )}
      {message.toolResult && (
        <div className={styles.toolResult}>
          <div className={styles.toolResultHeader}>Result:</div>
          <pre className={styles.toolResultContent}>
            {typeof message.toolResult.result === 'string'
              ? message.toolResult.result
              : JSON.stringify(message.toolResult.result, null, 2)}
          </pre>
          {message.toolResult.error && (
            <div className={styles.toolError}>{message.toolResult.error}</div>
          )}
        </div>
      )}
    </div>
  );
};

export default AgentMessage;
