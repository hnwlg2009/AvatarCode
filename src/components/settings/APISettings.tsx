import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import styles from './APISettings.module.css';

interface ProviderForm {
  apiKey: string;
  baseUrl: string;
  model: string;
}

const DEFAULT_PROVIDERS: Record<string, { label: string; defaultBaseUrl: string; defaultModel: string }> = {
  openai: {
    label: 'OpenAI',
    defaultBaseUrl: 'https://api.openai.com/v1',
    defaultModel: 'gpt-4',
  },
  anthropic: {
    label: 'Anthropic',
    defaultBaseUrl: 'https://api.anthropic.com/v1',
    defaultModel: 'claude-3-sonnet-20240229',
  },
};

export const APISettings: React.FC = () => {
  const { t } = useTranslation();
  const [forms, setForms] = useState<Record<string, ProviderForm>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    const llm = window.electronAPI?.llm;
    if (!llm) return;

    let cancelled = false;
    (async () => {
      const loaded: Record<string, ProviderForm> = {};
      for (const provider of Object.keys(DEFAULT_PROVIDERS)) {
        try {
          const config = await llm.getProviderConfig(provider);
          loaded[provider] = {
            apiKey: '',
            baseUrl: config.baseUrl || DEFAULT_PROVIDERS[provider].defaultBaseUrl,
            model: config.model || DEFAULT_PROVIDERS[provider].defaultModel,
          };
        } catch {
          loaded[provider] = {
            apiKey: '',
            baseUrl: DEFAULT_PROVIDERS[provider].defaultBaseUrl,
            model: DEFAULT_PROVIDERS[provider].defaultModel,
          };
        }
      }
      if (!cancelled) setForms(loaded);
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const updateForm = (provider: string, patch: Partial<ProviderForm>) => {
    setForms((prev) => ({
      ...prev,
      [provider]: { ...prev[provider], ...patch },
    }));
  };

  const handleSave = async () => {
    const llm = window.electronAPI?.llm;
    if (!llm) {
      setMessage({ type: 'error', text: t('api.llmUnavailable') });
      return;
    }
    setIsSaving(true);
    try {
      for (const provider of Object.keys(forms)) {
        const form = forms[provider];
        await llm.setAPIKey(provider, {
          ...(form.apiKey ? { key: form.apiKey } : {}),
          baseUrl: form.baseUrl,
          model: form.model,
        });
      }
      setMessage({ type: 'success', text: t('api.saved') });
      setForms((prev) => {
        const next: Record<string, ProviderForm> = {};
        for (const provider of Object.keys(prev)) {
          next[provider] = { ...prev[provider], apiKey: '' };
        }
        return next;
      });
      setTimeout(() => setMessage(null), 3000);
    } catch (error: any) {
      setMessage({ type: 'error', text: `${t('api.saveFailed')}: ${error.message}` });
    } finally {
      setIsSaving(false);
    }
  };

  const anyDirty = Object.values(forms).some((f) => f.apiKey);

  return (
    <div className={styles.apiSettings}>
      {Object.entries(DEFAULT_PROVIDERS).map(([provider, meta]) => {
        const form = forms[provider];
        if (!form) return null;
        return (
          <div key={provider} className={styles.section}>
            <h3>{meta.label}</h3>
            <label className={styles.field}>
              <span>{t('api.apiKey')}</span>
              <input
                type="password"
                placeholder="sk-..."
                value={form.apiKey}
                onChange={(e) => updateForm(provider, { apiKey: e.target.value })}
                className={styles.input}
                autoComplete="off"
              />
            </label>
            <label className={styles.field}>
              <span>{t('api.baseUrl')}</span>
              <input
                type="text"
                value={form.baseUrl}
                onChange={(e) => updateForm(provider, { baseUrl: e.target.value })}
                className={styles.input}
                placeholder={meta.defaultBaseUrl}
              />
            </label>
            <label className={styles.field}>
              <span>{t('api.model')}</span>
              <input
                type="text"
                value={form.model}
                onChange={(e) => updateForm(provider, { model: e.target.value })}
                className={styles.input}
                placeholder={meta.defaultModel}
              />
            </label>
          </div>
        );
      })}

      {message && (
        <div className={`${styles.message} ${styles[message.type]}`}>{message.text}</div>
      )}

      <button
        onClick={handleSave}
        disabled={isSaving || !anyDirty}
        className={styles.saveButton}
      >
        {isSaving ? t('api.saving') : t('api.save')}
      </button>
    </div>
  );
};

export default APISettings;