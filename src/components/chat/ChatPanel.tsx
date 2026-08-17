import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useChatStore, ChatMode, ChatStrength, ChatAttachment } from '../../stores/chatStore';
import fileSystemService from '../../services/FileSystemService';
import useSettingsStore from '../../stores/settingsStore';
import { ModelPicker } from './ModelPicker';
import styles from './ChatPanel.module.css';

type MenuId = 'plus' | 'shell' | 'commands' | 'mode' | 'strength' | 'model' | null;

const FILE_ATTACH_LIMIT = 100 * 1024;
const IMAGE_ATTACH_LIMIT = 2 * 1024 * 1024;

export const ChatPanel: React.FC = () => {
  const { t, i18n } = useTranslation();
  const [inputValue, setInputValue] = useState('');
  const [openMenu, setOpenMenu] = useState<MenuId>(null);
  const [shellInput, setShellInput] = useState('');
  const [shellRunning, setShellRunning] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const inputAreaRef = useRef<HTMLDivElement>(null);
  const workspacePath = useSettingsStore((s) => s.workspacePath);

  const {
    messages,
    status,
    context,
    mode,
    strength,
    model,
    attachments,
    sendMessage,
    clearMessages,
    stopGeneration,
    updateContext,
    setMode,
    setStrength,
    setModel,
    addAttachment,
    removeAttachment,
  } = useChatStore();

  const isBusy = status === 'loading' || status === 'streaming';

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
    if (!inputValue.trim() || isBusy) return;

    const content = inputValue.trim();
    setInputValue('');

    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    await sendMessage(content);
  }, [inputValue, isBusy, sendMessage]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend]
  );

  // + 菜单：上传文件
  const handleAttachFile = useCallback(async () => {
    setOpenMenu(null);
    const filePath = await fileSystemService.openFileDialog();
    if (!filePath) return;
    try {
      const content = await fileSystemService.readFile(filePath);
      const name = filePath.split(/[\\/]/).pop() || filePath;
      addAttachment({
        id: `att_${Date.now()}`,
        type: 'file',
        name,
        path: filePath,
        content:
          content.length > FILE_ATTACH_LIMIT
            ? `${content.slice(0, FILE_ATTACH_LIMIT)}\n[content truncated]`
            : content,
      });
    } catch (error) {
      console.error('Failed to attach file:', error);
    }
  }, [addAttachment]);

  // + 菜单：上传图片
  const handleAttachImage = useCallback(async () => {
    setOpenMenu(null);
    const filePath = await fileSystemService.openFileDialog();
    if (!filePath) return;
    try {
      const data = await fileSystemService.readBinaryFile(filePath);
      if (data.byteLength > IMAGE_ATTACH_LIMIT) {
        console.warn('Image too large, skipped');
        return;
      }
      let binary = '';
      for (let i = 0; i < data.byteLength; i += 8192) {
        binary += String.fromCharCode(...data.subarray(i, i + 8192));
      }
      const dataUrl = `data:image/png;base64,${btoa(binary)}`;
      const name = filePath.split(/[\\/]/).pop() || filePath;
      addAttachment({ id: `att_${Date.now()}`, type: 'image', name, path: filePath, dataUrl });
    } catch (error) {
      console.error('Failed to attach image:', error);
    }
  }, [addAttachment]);

  // + 菜单：上下文文件
  const handlePickContextFile = useCallback(async () => {
    setOpenMenu(null);
    const filePath = await fileSystemService.openFileDialog();
    if (!filePath) return;
    updateContext({ enabled: true, file: filePath });
  }, [updateContext]);

  // + 菜单：Shell 命令
  const handleRunShell = useCallback(async () => {
    const command = shellInput.trim();
    if (!command || shellRunning) return;
    setShellRunning(true);
    try {
      const api = window.electronAPI;
      if (!api) throw new Error('electronAPI unavailable');
      const { nonce } = await api.command.requestApproval(command, workspacePath || undefined);
      const result = await api.command.decideApproval(nonce, true);

      const userMessage = {
        id: `msg_${Date.now()}_u`,
        role: 'user' as const,
        content: `$ ${command}`,
        timestamp: Date.now(),
      };
      let output = '';
      if (result.denied) {
        output = `${t('chat.shellCommand')} ${command}\n${result.reason || 'denied'}`;
      } else if (result.timedOut) {
        output = `${t('chat.shellTimeout')}\n${result.stdout || ''}${result.stderr || ''}`;
      } else {
        output = `${t('chat.shellExit')}: ${result.exitCode}\n${result.stdout || ''}${
          result.stderr || ''
        }`;
      }
      const assistantMessage = {
        id: `msg_${Date.now()}_a`,
        role: 'assistant' as const,
        content: output.trim(),
        timestamp: Date.now(),
      };
      const { messages: current } = useChatStore.getState();
      useChatStore.setState({
        messages: [...current, userMessage, assistantMessage],
      });
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : String(error);
      const { messages: current } = useChatStore.getState();
      useChatStore.setState({
        messages: [
          ...current,
          {
            id: `msg_${Date.now()}_e`,
            role: 'assistant' as const,
            content: errMsg,
            timestamp: Date.now(),
            isError: true,
          },
        ],
      });
    } finally {
      setShellRunning(false);
      setShellInput('');
      setOpenMenu(null);
    }
  }, [shellInput, shellRunning, workspacePath, t]);

  // 命令子菜单
  const runCommand = useCallback(
    (cmd: string) => {
      setOpenMenu(null);
      if (cmd === '/clear') clearMessages();
      if (cmd === '/build') setMode('build');
      if (cmd === '/plan') setMode('plan');
    },
    [clearMessages, setMode]
  );

  // 点击弹层/徽章以外任意处（消息区、输入框等）收起所有下拉
  useEffect(() => {
    const onMouseDown = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target?.closest('[data-popover]')) {
        setOpenMenu(null);
      }
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpenMenu(null);
    };
    document.addEventListener('mousedown', onMouseDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onMouseDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, []);

  const formatTimestamp = (timestamp: number): string => {
    const locale = i18n.language === 'zh' ? 'zh-CN' : 'en-US';
    return new Date(timestamp).toLocaleTimeString(locale, {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const renderMessageContent = (content: string) => {
    const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
    const parts = content.split(codeBlockRegex);

    return parts.map((part, index) => {
      if (index % 3 === 1) return null;
      if (index % 3 === 2) {
        return (
          <pre key={index} className={styles.codeBlock}>
            <code className={styles.code}>{part}</code>
          </pre>
        );
      }
      return <span key={index}>{part}</span>;
    });
  };

  const strengthLabel = {
    default: t('chat.strengthDefault'),
    low: t('chat.strengthLow'),
    high: t('chat.strengthHigh'),
    max: t('chat.strengthMax'),
  }[strength];

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
                <span className={styles.role}>
                  {message.role === 'user' ? t('chat.userRole') : t('chat.aiRole')}
                </span>
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
      <div className={styles.inputArea} ref={inputAreaRef}>
        {/* 附件条 */}
        {attachments.length > 0 && (
          <div className={styles.attachmentsBar}>
            {attachments.map((att: ChatAttachment) => (
              <span key={att.id} className={styles.attachmentChip}>
                {att.type === 'image' ? '🖼️' : '📄'} {att.name}
                <button className={styles.removeChip} onClick={() => removeAttachment(att.id)}>
                  ×
                </button>
              </span>
            ))}
          </div>
        )}

        {/* 上下文信息 */}
        {context.file && context.enabled && (
          <div className={styles.contextBar}>
            <span className={styles.contextIcon}>📄</span>
            <span className={styles.contextFile}>{context.file}</span>
            <button
              className={styles.removeContext}
              onClick={() => updateContext({ file: null, enabled: false })}
            >
              ×
            </button>
          </div>
        )}

        {/* 整体输入框 */}
        <div className={styles.inputBox}>
          <div className={styles.inputBadges}>
            {/* + 菜单 */}
            <div className={styles.popoverWrap} data-popover>
              <button
                className={styles.iconBadge}
                onClick={() => setOpenMenu(openMenu === 'plus' ? null : 'plus')}
                title={t('chat.attachFile')}
              >
                <svg width="15" height="15" viewBox="0 0 16 16">
                  <path
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    d="M8 2.5v11M2.5 8h11"
                  />
                </svg>
              </button>
              {openMenu === 'plus' && (
                <div className={styles.menu}>
                  <button className={styles.menuItem} onClick={handleAttachFile}>
                    <span className={styles.menuText}>
                      {t('chat.attachFile')}
                      <small>{t('chat.attachFileDesc')}</small>
                    </span>
                  </button>
                  <button className={styles.menuItem} onClick={handleAttachImage}>
                    <span className={styles.menuText}>
                      {t('chat.attachImage')}
                      <small>{t('chat.attachImageDesc')}</small>
                    </span>
                  </button>
                  <button
                    className={styles.menuItem}
                    onClick={() => updateContext({ enabled: !context.enabled })}
                  >
                    <span className={styles.menuText}>
                      {context.enabled ? t('chat.contextEnabled') : t('chat.contextDisabled')}
                      <small>{t('chat.contextDesc')}</small>
                    </span>
                  </button>
                  {context.enabled && (
                    <button className={styles.menuItem} onClick={handlePickContextFile}>
                      <span className={styles.menuText}>
                        {t('chat.contextPickFile')}
                        <small>{context.file || '-'}</small>
                      </span>
                    </button>
                  )}
                  <div className={styles.menuDivider} />
                  <button className={styles.menuItem} onClick={() => setOpenMenu('shell')}>
                    <span className={styles.menuText}>
                      {t('chat.shellCommand')}
                      <small>{t('chat.shellCommandDesc')}</small>
                    </span>
                  </button>
                  <button className={styles.menuItem} onClick={() => setOpenMenu('commands')}>
                    <span className={styles.menuText}>
                      {t('chat.commands')}
                      <small>/clear /build /plan</small>
                    </span>
                  </button>
                </div>
              )}

              {/* Shell 子面板 */}
              {openMenu === 'shell' && (
                <div className={styles.shellPanel}>
                  <input
                    className={styles.shellInput}
                    value={shellInput}
                    onChange={(e) => setShellInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleRunShell()}
                    placeholder={t('chat.shellPlaceholder')}
                    autoFocus
                  />
                  <button className={styles.runBtn} onClick={handleRunShell} disabled={shellRunning}>
                    {shellRunning ? t('chat.loading') : t('chat.run')}
                  </button>
                </div>
              )}

              {/* 命令子面板 */}
              {openMenu === 'commands' && (
                <div className={styles.menu}>
                  {['/clear', '/build', '/plan'].map((cmd) => (
                    <button key={cmd} className={styles.menuItem} onClick={() => runCommand(cmd)}>
                      <span className={styles.menuText}>
                        {cmd}
                        <small>
                          {cmd === '/clear' && t('chat.clearChat')}
                          {cmd === '/build' && t('chat.modeBuild')}
                          {cmd === '/plan' && t('chat.modePlan')}
                        </small>
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* 模式 */}
            <div className={styles.popoverWrap} data-popover>
              <button
                className={`${styles.modeBadge} ${mode === 'plan' ? styles.planBadge : ''}`}
                onClick={() => setOpenMenu(openMenu === 'mode' ? null : 'mode')}
              >
                {mode === 'build' ? t('chat.modeBuild') : t('chat.modePlan')}
                <span className={styles.badgeCaret}>▾</span>
              </button>
              {openMenu === 'mode' && (
                <div className={styles.menu}>
                  {(['build', 'plan'] as ChatMode[]).map((m) => (
                    <button
                      key={m}
                      className={`${styles.menuItem} ${mode === m ? styles.menuActive : ''}`}
                      onClick={() => {
                        setMode(m);
                        setOpenMenu(null);
                      }}
                    >
                      <span className={styles.menuText}>
                        {m === 'build' ? t('chat.modeBuild') : t('chat.modePlan')}
                        <small>
                          {m === 'build'
                            ? 'Execute tools, edit files'
                            : 'Read-only analysis & plan'}
                        </small>
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* 模型 */}
            <div className={`${styles.popoverWrap} ${styles.alignRight}`} data-popover>
              <button
                className={styles.iconBadge}
                onClick={() => setOpenMenu(openMenu === 'model' ? null : 'model')}
                title={t('chat.model')}
              >
                {model || t('chat.modelNotSelected')}
                <span className={styles.badgeCaret}>▾</span>
              </button>
              {openMenu === 'model' && <ModelPicker onClose={() => setOpenMenu(null)} />}
            </div>

            {/* 强度 */}
            <div className={`${styles.popoverWrap} ${styles.alignRight}`} data-popover>
              <button
                className={styles.iconBadge}
                onClick={() => setOpenMenu(openMenu === 'strength' ? null : 'strength')}
                title={t('chat.strength')}
              >
                {t('chat.strength')}: {strengthLabel}
                <span className={styles.badgeCaret}>▾</span>
              </button>
              {openMenu === 'strength' && (
                <div className={styles.menu}>
                  {(['default', 'low', 'high', 'max'] as ChatStrength[]).map((s) => (
                    <button
                      key={s}
                      className={`${styles.menuItem} ${strength === s ? styles.menuActive : ''}`}
                      onClick={() => {
                        setStrength(s);
                        setOpenMenu(null);
                      }}
                    >
                      <span className={styles.menuText}>
                        {{
                          default: t('chat.strengthDefault'),
                          low: t('chat.strengthLow'),
                          high: t('chat.strengthHigh'),
                          max: t('chat.strengthMax'),
                        }[s]}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <textarea
            ref={textareaRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={t('chat.inputPlaceholder')}
            className={styles.input}
            disabled={isBusy}
            rows={1}
          />

          <div className={styles.inputArrowRow}>
            {isBusy ? (
              <button className={styles.arrowBtn} onClick={stopGeneration} title={t('chat.stop')}>
                <svg width="14" height="14" viewBox="0 0 16 16">
                  <rect x="3" y="3" width="10" height="10" rx="1.5" fill="currentColor" />
                </svg>
              </button>
            ) : (
              <button
                className={`${styles.arrowBtn} ${!inputValue.trim() ? styles.disabled : ''}`}
                onClick={handleSend}
                disabled={!inputValue.trim()}
                title={t('chat.send')}
              >
                <svg width="16" height="16" viewBox="0 0 16 16">
                  <path
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M8 13V3M3.5 7.5L8 3l4.5 4.5"
                  />
                </svg>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatPanel;
