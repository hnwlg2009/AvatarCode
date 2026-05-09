import React, { useRef, useImperativeHandle, forwardRef, useEffect } from 'react';
import * as monaco from 'monaco-editor';
import Editor, { OnChange } from '@monaco-editor/react';
import { useSettingsStore } from '../../stores/settingsStore';
import styles from './CodeEditor.module.css';

export interface CodeEditorRef {
  getCode: () => string;
  setCode: (code: string) => void;
  getLanguage: () => string;
  setLanguage: (language: string) => void;
  focus: () => void;
}

export interface CodeEditorProps {
  path?: string;
  language?: string;
  value?: string;
  theme?: 'vs-dark' | 'vs-light' | 'hc-black';
  onChange?: OnChange;
  onMount?: (editor: monaco.editor.IStandaloneCodeEditor) => void;
  className?: string;
  readOnly?: boolean;
}

export const CodeEditor = forwardRef<CodeEditorRef, CodeEditorProps>(
  (
    {
      path,
      language = 'typescript',
      value = '',
      theme = 'vs-dark',
      onChange,
      onMount,
      className = '',
      readOnly = false,
    },
    ref
  ) => {
    const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
    const { settings } = useSettingsStore();
    const editorSettings = settings.editor;

    useImperativeHandle(ref, () => ({
      getCode: () => editorRef.current?.getValue() || '',
      setCode: (code: string) => editorRef.current?.setValue(code),
      getLanguage: () => editorRef.current?.getModel()?.getLanguageId() || '',
      setLanguage: (lang: string) => {
        const model = editorRef.current?.getModel();
        if (model) monaco.editor.setModelLanguage(model, lang);
      },
      focus: () => editorRef.current?.focus(),
    }));

    const handleMount = (editor: monaco.editor.IStandaloneCodeEditor) => {
      editorRef.current = editor;
      onMount?.(editor);
    };

    return (
      <div className={`${styles.container} ${className}`}>
        <Editor
          height="100%"
          language={language}
          value={value}
          theme={theme}
          onChange={onChange}
          onMount={handleMount}
          options={{
            fontSize: editorSettings.fontSize,
            fontFamily: editorSettings.fontFamily,
            tabSize: editorSettings.tabSize,
            wordWrap: editorSettings.wordWrap ? 'on' : 'off',
            minimap: { enabled: editorSettings.minimap },
            lineNumbers: editorSettings.lineNumbers ? 'on' : 'off',
            readOnly,
            renderWhitespace: 'selection',
            bracketPairColorization: { enabled: true },
            formatOnPaste: true,
            formatOnType: true,
            autoIndent: 'full',
            suggestOnTriggerCharacters: true,
            quickSuggestions: true,
            folding: true,
            matchBrackets: 'always',
            autoClosingBrackets: 'always',
            autoClosingQuotes: 'always',
          }}
        />
      </div>
    );
  }
);

CodeEditor.displayName = 'CodeEditor';
export default CodeEditor;
