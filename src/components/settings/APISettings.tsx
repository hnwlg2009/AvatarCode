import React, { useState } from 'react';
import styles from './APISettings.module.css';

export const APISettings: React.FC = () => {
  const [openAIKey, setOpenAIKey] = useState('');
  const [anthropicKey, setAnthropicKey] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const { ipcRenderer } = window.require('electron');
      if (openAIKey) {
        await ipcRenderer.invoke('llm:setAPIKey', 'openai', openAIKey);
      }
      if (anthropicKey) {
        await ipcRenderer.invoke('llm:setAPIKey', 'anthropic', anthropicKey);
      }
      setMessage({ type: 'success', text: 'API Keys 已保存' });
      setOpenAIKey('');
      setAnthropicKey('');
      setTimeout(() => setMessage(null), 3000);
    } catch (error: any) {
      setMessage({ type: 'error', text: `保存失败：${error.message}` });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className={styles.apiSettings}>
      <div className={styles.section}>
        <h3>OpenAI API Key</h3>
        <input
          type="password"
          placeholder="sk-..."
          value={openAIKey}
          onChange={(e) => setOpenAIKey(e.target.value)}
          className={styles.input}
        />
        <p className={styles.hint}>
          在 <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer">OpenAI 平台</a> 获取 API Key
        </p>
      </div>

      <div className={styles.section}>
        <h3>Anthropic API Key</h3>
        <input
          type="password"
          placeholder="sk-ant-..."
          value={anthropicKey}
          onChange={(e) => setAnthropicKey(e.target.value)}
          className={styles.input}
        />
        <p className={styles.hint}>
          在 <a href="https://console.anthropic.com/settings/keys" target="_blank" rel="noopener noreferrer">Anthropic 控制台</a> 获取 API Key
        </p>
      </div>

      {message && (
        <div className={`${styles.message} ${styles[message.type]}`}>
          {message.text}
        </div>
      )}

      <button
        onClick={handleSave}
        disabled={isSaving || (!openAIKey && !anthropicKey)}
        className={styles.saveButton}
      >
        {isSaving ? '保存中...' : '保存 API Keys'}
      </button>
    </div>
  );
};

export default APISettings;
