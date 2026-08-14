import React from 'react';
import { useTranslation } from 'react-i18next';
import { useSettingsStore } from '../../stores/settingsStore';
import styles from './EditorSettings.module.css';

export const EditorSettings: React.FC = () => {
  const { t } = useTranslation();
  const { settings, setEditorSettings } = useSettingsStore();
  const editor = settings.editor;

  return (
    <div className={styles.editorSettings}>
      <div className={styles.section}>
        <h3>{t('editor.font')}</h3>
        <div className={styles.formGroup}>
          <label>{t('editor.fontSize')}: {editor.fontSize}px</label>
          <input
            type="range"
            min="10"
            max="24"
            value={editor.fontSize}
            onChange={(e) => setEditorSettings({ fontSize: Number(e.target.value) })}
            className={styles.range}
          />
        </div>

        <div className={styles.formGroup}>
          <label>{t('editor.fontFamily')}</label>
          <select
            value={editor.fontFamily}
            onChange={(e) => setEditorSettings({ fontFamily: e.target.value })}
            className={styles.select}
          >
            <option value="'JetBrains Mono', 'Cascadia Code', 'Fira Code', Consolas, monospace">JetBrains Mono</option>
            <option value="'Cascadia Code', Consolas, monospace">Cascadia Code</option>
            <option value="'Fira Code', Consolas, monospace">Fira Code</option>
            <option value="'Consolas', Menlo, monospace">Consolas</option>
          </select>
        </div>
      </div>

      <div className={styles.section}>
        <h3>{t('editor.indentation')}</h3>
        <div className={styles.formGroup}>
          <label>{t('editor.tabSize')}</label>
          <select
            value={editor.tabSize}
            onChange={(e) => setEditorSettings({ tabSize: Number(e.target.value) })}
            className={styles.select}
          >
            <option value={2}>2 spaces</option>
            <option value={4}>4 spaces</option>
            <option value={8}>8 spaces</option>
          </select>
        </div>
      </div>

      <div className={styles.section}>
        <h3>{t('editor.display')}</h3>
        <label className={styles.checkbox}>
          <input
            type="checkbox"
            checked={editor.wordWrap}
            onChange={(e) => setEditorSettings({ wordWrap: e.target.checked })}
          />
          <span>{t('editor.wordWrap')}</span>
        </label>

        <label className={styles.checkbox}>
          <input
            type="checkbox"
            checked={editor.minimap}
            onChange={(e) => setEditorSettings({ minimap: e.target.checked })}
          />
          <span>{t('editor.minimap')}</span>
        </label>

        <label className={styles.checkbox}>
          <input
            type="checkbox"
            checked={editor.lineNumbers}
            onChange={(e) => setEditorSettings({ lineNumbers: e.target.checked })}
          />
          <span>{t('editor.lineNumbers')}</span>
        </label>

        <label className={styles.checkbox}>
          <input
            type="checkbox"
          />
          <span>{t('editor.scrollBeyondLastLine')}</span>
        </label>
      </div>

      <div className={styles.section}>
        <h3>{t('editor.autoSave')}</h3>
        <label className={styles.checkbox}>
          <input
            type="checkbox"
            checked={editor.autoSave}
            onChange={(e) => setEditorSettings({ autoSave: e.target.checked })}
          />
          <span>{t('editor.enableAutoSave')}</span>
        </label>

        {editor.autoSave && (
          <div className={styles.formGroup}>
            <label>{t('editor.delay')}: {editor.autoSaveDelay}ms</label>
            <input
              type="range"
              min="500"
              max="5000"
              step="500"
              value={editor.autoSaveDelay}
              onChange={(e) => setEditorSettings({ autoSaveDelay: Number(e.target.value) })}
              className={styles.range}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default EditorSettings;
