import React, { useEffect, useRef, useState } from 'react';
import { marked, Renderer } from 'marked';
import DOMPurify from 'dompurify';
import mermaid from 'mermaid';
import { useSettingsStore } from '../../stores/settingsStore';
import styles from './MarkdownPreview.module.css';

marked.use({ gfm: true, breaks: true });

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// mermaid 代码块渲染为图表容器，其余代码块保持 pre/code
const renderer = new Renderer();
renderer.code = ({ text, lang }: { text: string; lang?: string }) => {
  const language = (lang || '').split(/\s+/)[0] || '';
  const escaped = escapeHtml(text);
  if (language.toLowerCase() === 'mermaid') {
    return `<div class="mermaid">${escaped}</div>`;
  }
  return `<pre><code class="language-${language}">${escaped}</code></pre>`;
};
marked.use({ renderer });

interface MarkdownPreviewProps {
  content: string;
}

export const MarkdownPreview: React.FC<MarkdownPreviewProps> = ({ content }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const theme = useSettingsStore((s) => s.settings.appearance.theme);
  const [isDark, setIsDark] = useState(() =>
    theme === 'system'
      ? window.matchMedia('(prefers-color-scheme: dark)').matches
      : theme === 'dark'
  );

  useEffect(() => {
    if (theme !== 'system') {
      setIsDark(theme === 'dark');
      return;
    }
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => setIsDark(media.matches);
    media.addEventListener('change', onChange);
    return () => media.removeEventListener('change', onChange);
  }, [theme]);

  useEffect(() => {
    mermaid.initialize({
      startOnLoad: false,
      theme: isDark ? 'dark' : 'default',
      securityLevel: 'strict',
    });
  }, [isDark]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let cancelled = false;
    const timer = setTimeout(async () => {
      try {
        const raw = marked.parse(content, { async: false }) as string;
        if (cancelled) return;
        container.innerHTML = DOMPurify.sanitize(raw);

        const nodes = Array.from(container.querySelectorAll<HTMLElement>('.mermaid'));
        if (nodes.length > 0) {
          try {
            await mermaid.run({ nodes });
          } catch (error) {
            console.error('Mermaid render failed:', error);
          }
        }
      } catch (error) {
        console.error('Markdown render failed:', error);
      }
    }, 300);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [content]);

  return (
    <div className={styles.preview} data-testid="markdown-preview">
      <div ref={containerRef} className={styles.content} />
    </div>
  );
};

export default MarkdownPreview;
