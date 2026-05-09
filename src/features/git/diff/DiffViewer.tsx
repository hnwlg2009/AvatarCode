import React, { useRef, useEffect, useState } from 'react';
import * as monaco from 'monaco-editor';
import styles from './DiffViewer.module.css';

interface DiffViewerProps {
  original: string;
  modified: string;
  language?: string;
  title?: string;
}

export const DiffViewer: React.FC<DiffViewerProps> = ({
  original,
  modified,
  language = 'typescript',
  title,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [editor, setEditor] = useState<monaco.editor.IStandaloneDiffEditor | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const diffEditor = monaco.editor.createDiffEditor(containerRef.current, {
      originalEditable: false,
      automaticLayout: true,
      renderSideBySide: true,
      theme: 'vs-dark',
      fontSize: 14,
      minimap: { enabled: false },
      scrollBeyondLastLine: false,
      wordWrap: 'on',
      lineNumbers: 'on',
      glyphMargin: true,
      folding: true,
      renderMarginRevertIcon: true,
    });

    const originalModel = monaco.editor.createModel(original, language);
    const modifiedModel = monaco.editor.createModel(modified, language);

    diffEditor.setModel({
      original: originalModel,
      modified: modifiedModel,
    });

    setEditor(diffEditor);

    return () => {
      originalModel.dispose();
      modifiedModel.dispose();
      diffEditor.dispose();
    };
  }, [original, modified, language]);

  return (
    <div className={styles.diffViewer}>
      {title && <div className={styles.title}>{title}</div>}
      <div ref={containerRef} className={styles.editor} />
    </div>
  );
};

export default DiffViewer;
