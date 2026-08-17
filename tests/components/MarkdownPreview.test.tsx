import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import i18n from '../../src/i18n';
import { MarkdownPreview } from '../../src/components/markdown/MarkdownPreview';
import { useSettingsStore } from '../../src/stores/settingsStore';

const mermaidRun = vi.hoisted(() => vi.fn(async () => {}));
const mermaidInitialize = vi.hoisted(() => vi.fn());

vi.mock('mermaid', () => ({
  default: {
    initialize: (config: unknown) => mermaidInitialize(config),
    run: (opts: unknown) => mermaidRun(opts),
  },
}));

describe('MarkdownPreview', () => {
  beforeEach(() => {
    i18n.changeLanguage('en');
    mermaidRun.mockClear();
    mermaidInitialize.mockClear();
  });

  it('renders markdown headings and paragraphs', async () => {
    render(<MarkdownPreview content={'# Title\n\nHello world'} />);

    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Title');
    });
    expect(screen.getByText('Hello world')).toBeInTheDocument();
  });

  it('renders mermaid code block as diagram container and triggers mermaid.run', async () => {
    const md = '```mermaid\ngraph TD\nA-->B\n```';
    render(<MarkdownPreview content={md} />);

    await waitFor(() => {
      const container = screen.getByTestId('markdown-preview');
      const mermaidNode = container.querySelector('.mermaid');
      expect(mermaidNode).not.toBeNull();
    });
    expect(mermaidRun).toHaveBeenCalledTimes(1);
  });

  it('renders regular code block without invoking mermaid', async () => {
    const md = '```ts\nconst a = 1;\n```';
    render(<MarkdownPreview content={md} />);

    await waitFor(() => {
      expect(screen.getByText('const a = 1;')).toBeInTheDocument();
    });
    expect(mermaidRun).not.toHaveBeenCalled();
  });

  it('initializes mermaid with dark theme when app theme is dark', () => {
    useSettingsStore.getState().setAppearanceSettings({ theme: 'dark' });
    render(<MarkdownPreview content="# x" />);

    expect(mermaidInitialize).toHaveBeenCalledWith(
      expect.objectContaining({ theme: 'dark' })
    );
  });
});
