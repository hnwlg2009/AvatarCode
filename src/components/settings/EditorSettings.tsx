import React from 'react';
import { useSettingsStore } from '../../stores/settingsStore';
import styles from './EditorSettings.module.css';

export const EditorSettings: React.FC = () => {
  const { settings, setEditorSettings } = useSettingsStore();
  const editor = settings.editor;

  return (
    <div className={styles.editorSettings}>
      <div className={styles.section}>
        <h3>Font</h3>
        <div className={styles.formGroup}>
          <label>Font Size: {editor.fontSize}px</label>
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
          <label>Font Family</label>
          <select
            value={editor.fontFamily}
            onChange={(e) => setEditorSettings({ fontFamily: e.target.value })}
            className={styles.select}
          >
            <option value="'Monaco', 'Courier New', monospace">Monaco</option>
            <option value="'Consolas', 'Courier New', monospace">Consolas</option>
            <option value="'Fira Code', monospace">Fira Code</option>
            <option value="'Source Code Pro', monospace">Source Code Pro</option>
          </select>
        </div>
      </div>

      <div className={styles.section}>
        <h3>Indentation</h3>
        <div className={styles.formGroup}>
          <label>Tab Size</label>
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
        <h3>Display</h3>
        <label className={styles.checkbox}>
          <input
            type="checkbox"
            checked={editor.wordWrap}
            onChange={(e) => setEditorSettings({ wordWrap: e.target.checked })}
          />
          <span>Word Wrap</span>
        </label>

        <label className={styles.checkbox}>
          <input
            type="checkbox"
            checked={editor.minimap}
            onChange={(e) => setEditorSettings({ minimap: e.target.checked })}
          />
          <span>Minimap</span>
        </label>

        <label className={styles.checkbox}>
          <input
            type="checkbox"
            checked={editor.lineNumbers}
            onChange={(e) => setEditorSettings({ lineNumbers: e.target.checked })}
          />
          <span>Show Line Numbers</span>
        </label>

        <label className={styles.checkbox}>
          <input
            type="checkbox"
          />
          <span>Scroll Beyond Last Line</span>
        </label>
      </div>

      <div className={styles.section}>
        <h3>Auto Save</h3>
        <label className={styles.checkbox}>
          <input
            type="checkbox"
            checked={editor.autoSave}
            onChange={(e) => setEditorSettings({ autoSave: e.target.checked })}
          />
          <span>Enable Auto Save</span>
        </label>

        {editor.autoSave && (
          <div className={styles.formGroup}>
            <label>Delay: {editor.autoSaveDelay}ms</label>
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
