import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useChatStore } from '../../stores/chatStore';
import styles from './ChatPanel.module.css';

export const ChatPanel: React.FC = () => {
  const { t, i18n } = useTranslation();
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const {
    messages,
    status,
    context,
    sendMessage,
    clearMessages,
    retryLastMessage,
    stopGeneration,
    updateContext,
  } = useChatStore();

  // 自动滚动到底部
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // 调整文本框高度
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [inputValue]);

  const handleSend = useCallback(async () => {
    if (!inputValue.trim() || status === 'loading') return;

    const content = inputValue.trim();
    setInputValue('');

    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    await sendMessage(content);
  }, [inputValue, status, sendMessage]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend]
  );

  const formatTimestamp = (timestamp: number): string => {
    const locale = i18n.language === 'zh' ? 'zh-CN' : 'en-US';
    return new Date(timestamp).toLocaleTimeString(locale, {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const renderMessageContent = (content: string) => {
    // 简单的代码块检测
    const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
    const parts = content.split(codeBlockRegex);

    return parts.map((part, index) => {
      if (index % 3 === 1) {
        // 语言标识
        return null;
      }
      if (index % 3 === 2) {
        // 代码内容

        return (
          <pre key={index} className={styles.codeBlock}>
            <code className={styles.code}>{part}</code>
          </pre>
        );
      }
      return <span key={index}>{part}</span>;
    });
  };

  return (
    <div className={styles.chatPanel}>
      {/* 头部 */}
      <div className={styles.header}>
        <h3 className={styles.title}>{t('chat.title')}</h3>
        <div className={styles.actions}>
          <button className={styles.clearButton} onClick={clearMessages} title={t('chat.clearChat')}>
            <svg width="16" height="16" viewBox="0 0 16 16">
              <path
                fill="currentColor"
                d="M6 2v1H2v1h1v9a1 1 0 001 1h8a1 1 0 001-1V4h1V3h-4V2H6zm2 2v1H4V4h4zM5 6v6h1v1h1v-1h2v1h1v-1h1V6H5z"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* 消息列表 */}
      <div className={styles.messages}>
        {messages.length === 0 ? (
          <div className={styles.emptyState}>
            <p className={styles.greeting}>{t('chat.greeting')}</p>
            <div className={styles.helpList}>
              <p className={styles.helpTitle}>{t('chat.helpTitle')}</p>
              <ul>
                <li>{t('chat.helpExplain')}</li>
                <li>{t('chat.helpOptimize')}</li>
                <li>{t('chat.helpAnswer')}</li>
                <li>{t('chat.helpGenerate')}</li>
              </ul>
            </div>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`${styles.message} ${
                message.role === 'user' ? styles.userMessage : styles.assistantMessage
              } ${message.isError ? styles.error : ''}`}
            >
              <div className={styles.messageHeader}>
                <span className={styles.role}>{message.role === 'user' ? t('chat.userRole') : t('chat.aiRole')}</span>
                <span className={styles.timestamp}>{formatTimestamp(message.timestamp)}</span>
              </div>
              <div className={styles.messageContent}>{renderMessageContent(message.content)}</div>
              {message.metadata?.duration && (
                <div className={styles.metadata}>
                  <span>{(message.metadata.duration / 1000).toFixed(1)}s</span>
                  {message.metadata.model && (
                    <span className={styles.model}>{message.metadata.model}</span>
                  )}
                </div>
              )}
            </div>
          ))
        )}

        {/* 加载中 */}
        {status === 'loading' && (
          <div className={styles.assistantMessage}>
            <div className={styles.messageHeader}>
              <span className={styles.role}>AI</span>
            </div>
            <div className={styles.loading}>
              <div className={styles.loadingDots} />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* 输入区域 */}
      <div className={styles.inputArea}>
        {/* 上下文信息 */}
        {context.file && (
          <div className={styles.contextBar}>
            <span className={styles.contextIcon}>📄</span>
            <span className={styles.contextFile}>{context.file}</span>
            <button className={styles.removeContext} onClick={() => updateContext({ file: null })}>
              ×
            </button>
          </div>
        )}

        <textarea
          ref={textareaRef}
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={t('chat.inputPlaceholder')}
          className={styles.input}
          disabled={status === 'loading'}
          rows={1}
        />

        <div className={styles.inputActions}>
          {status === 'streaming' ? (
            <button className={styles.stopButton} onClick={stopGeneration}>
              {t('chat.stop')}
            </button>
          ) : (
            <button
              className={`${styles.sendButton} ${!inputValue.trim() ? styles.disabled : ''}`}
              onClick={handleSend}
              disabled={!inputValue.trim() || status === 'loading'}
            >
              {t('chat.send')}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatPanel;
