import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useChatStore } from '../../stores/chatStore';
import styles from './ModelPicker.module.css';

interface ModelPickerProps {
  onClose: () => void;
}

interface ProviderConfig {
  hasKey: boolean;
  baseUrl: string;
  model: string;
}

export const ModelPicker: React.FC<ModelPickerProps> = ({ onClose }) => {
  const { t } = useTranslation();
  const model = useChatStore((s) => s.model);
  const setModel = useChatStore((s) => s.setModel);

  const [query, setQuery] = useState('');
  const [models, setModels] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [managing, setManaging] = useState(false);
  const [provider, setProvider] = useState('openai');
  const [baseUrl, setBaseUrl] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [modelName, setModelName] = useState('');
  const [saving, setSaving] = useState(false);

  const loadModels = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await window.electronAPI?.llm.listModels(provider);
      if (result && !result.error) {
        setModels(result.models);
        if (result.models.length === 0) {
          setError(t('chat.noModels'));
        }
      } else {
        setError(result?.error || t('chat.modelError'));
        setModels([]);
      }
    } catch {
      setError(t('chat.modelError'));
      setModels([]);
    } finally {
      setLoading(false);
    }
  }, [provider, t]);

  useEffect(() => {
    // 读取当前提供商配置用于管理表单
    window.electronAPI?.llm.getProviderConfig(provider).then((config: ProviderConfig) => {
      setBaseUrl(config.baseUrl || '');
      setModelName(config.model || '');
    });
    loadModels();
  }, [provider, loadModels]);

  // 外部点击/Esc 关闭由父级 ChatPanel 统一处理

  const filtered = query.trim()
    ? models.filter((m) => m.toLowerCase().includes(query.trim().toLowerCase()))
    : models;

  const handleSave = async () => {
    setSaving(true);
    try {
      await window.electronAPI?.llm.setAPIKey(provider, {
        baseUrl: baseUrl.trim(),
        key: apiKey.trim() || undefined,
        model: modelName.trim() || undefined,
      });
      setManaging(false);
      await loadModels();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={styles.picker} onClick={(e) => e.stopPropagation()}>
      {!managing ? (
        <>
          <div className={styles.searchRow}>
            <input
              className={styles.search}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t('chat.searchModels')}
              autoFocus
            />
            <button
              className={styles.iconButton}
              onClick={loadModels}
              title={t('chat.refresh')}
            >
              <svg width="14" height="14" viewBox="0 0 16 16">
                <path
                  fill="currentColor"
                  d="M8 2a6 6 0 106 6h-2a4 4 0 11-1.17-2.83L9 7H15V1l-1.6 1.6A6 6 0 008 2z"
                />
              </svg>
            </button>
          </div>

          <div className={styles.list}>
            {loading && <div className={styles.hint}>{t('chat.loading')}</div>}
            {!loading && error && <div className={styles.error}>{error}</div>}
            {!loading && !error && filtered.length === 0 && (
              <div className={styles.hint}>{t('chat.noModels')}</div>
            )}
            {!loading &&
              filtered.map((m) => (
                <button
                  key={m}
                  className={`${styles.item} ${model === m ? styles.active : ''}`}
                  onClick={() => {
                    setModel(m);
                    onClose();
                  }}
                >
                  <span className={styles.itemName}>{m}</span>
                </button>
              ))}
          </div>

          <div className={styles.footer}>
            <button className={styles.footerBtn} onClick={() => setManaging(true)}>
              {t('chat.manageModels')}
            </button>
            {model && (
              <button
                className={styles.footerBtn}
                onClick={() => {
                  setModel(null);
                  onClose();
                }}
              >
                {t('chat.modelNotSelected')}
              </button>
            )}
          </div>
        </>
      ) : (
        <>
          <div className={styles.form}>
            <label className={styles.field}>
              <span className={styles.fieldLabel}>{t('chat.provider')}</span>
              <select
                className={styles.input}
                value={provider}
                onChange={(e) => setProvider(e.target.value)}
              >
                <option value="openai">OpenAI / LM Studio</option>
                <option value="anthropic">Anthropic</option>
              </select>
            </label>
            <label className={styles.field}>
              <span className={styles.fieldLabel}>{t('chat.baseUrl')}</span>
              <input
                className={styles.input}
                value={baseUrl}
                onChange={(e) => setBaseUrl(e.target.value)}
                placeholder="http://127.0.0.1:1234/v1"
              />
            </label>
            <label className={styles.field}>
              <span className={styles.fieldLabel}>{t('chat.apiKey')}</span>
              <input
                className={styles.input}
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder={t('chat.apiKey')}
              />
            </label>
            <label className={styles.field}>
              <span className={styles.fieldLabel}>{t('chat.modelName')}</span>
              <input
                className={styles.input}
                value={modelName}
                onChange={(e) => setModelName(e.target.value)}
                placeholder="model-id"
              />
            </label>
            <div className={styles.formActions}>
              <button className={styles.saveBtn} onClick={handleSave} disabled={saving}>
                {saving ? t('chat.loading') : t('chat.save')}
              </button>
              <button className={styles.footerBtn} onClick={() => setManaging(false)}>
                {t('chat.manageDone')}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ModelPicker;
