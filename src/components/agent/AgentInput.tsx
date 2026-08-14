import React, { useState, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useAgentStore } from '../../stores/agentStore';
import styles from './AgentInput.module.css';

export const AgentInput: React.FC = () => {
  const { t } = useTranslation();
  const [input, setInput] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { sendMessage, status } = useAgentStore();

  const handleSend = useCallback(() => {
    if (!input.trim() || status === 'executing' || status === 'loading') return;
    sendMessage(input);
    setInput('');
  }, [input, status, sendMessage]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend]
  );

  const disabled = status === 'executing' || status === 'loading';

  return (
    <div className={styles.inputArea}>
      <textarea
        ref={textareaRef}
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={t('agent.placeholder')}
        className={styles.input}
        disabled={disabled}
        rows={3}
      />
      <button
        onClick={handleSend}
        disabled={!input.trim() || disabled}
        className={styles.sendBtn}
      >
        {t('agent.send')}
      </button>
    </div>
  );
};

export default AgentInput;