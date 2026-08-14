import React from 'react';
import { render, screen, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import i18n from '../../src/i18n';
import { Workspace } from '../../src/components/common/Workspace';
import { useTabManagerStore } from '../../src/stores/tabManagerStore';

const { MockCodeEditor } = vi.hoisted(() => ({
  MockCodeEditor: vi.fn(() => null),
}));

vi.mock('../../src/components/editor', () => ({
  CodeEditor: (props: unknown) => MockCodeEditor(props),
}));

function addTab(path: string, language = 'typescript', content = '') {
  return useTabManagerStore.getState().addTab({
    path,
    name: path.split('/').pop() || path,
    language,
    content,
    isDirty: false,
    isLoading: false,
    config: { theme: 'vs-dark' } as const,
  });
}

describe('Workspace', () => {
  beforeEach(() => {
    i18n.changeLanguage('en');
    useTabManagerStore.getState().reset();
    MockCodeEditor.mockClear();
  });

  it('should render empty state when no file is open', () => {
    render(<Workspace />);

    expect(screen.getByText('Welcome to AvatarCode')).toBeInTheDocument();
    expect(screen.getByText('Open a file to start editing')).toBeInTheDocument();
    expect(MockCodeEditor).not.toHaveBeenCalled();
  });

  it('should render editor when file is open', () => {
    addTab('/test.ts', 'typescript', 'console.log("hello");');

    render(<Workspace />);

    expect(MockCodeEditor).toHaveBeenCalled();
  });

  it('should display file path in tab', () => {
    addTab('src/App.tsx');

    render(<Workspace />);

    expect(screen.getByText('src/App.tsx')).toBeInTheDocument();
  });

  it('should pass language and content to CodeEditor', () => {
    addTab('script.py', 'python', 'print(1)');

    render(<Workspace />);

    expect(MockCodeEditor).toHaveBeenCalledWith(
      expect.objectContaining({
        language: 'python',
        value: 'print(1)',
      })
    );
  });

  it('should handle file content changes via store', () => {
    const tabId = addTab('test.ts', 'typescript', 'initial content');

    render(<Workspace />);

    act(() => {
      useTabManagerStore.getState().updateTabContent(tabId, 'changed content');
    });
    expect(MockCodeEditor).toHaveBeenLastCalledWith(
      expect.objectContaining({ value: 'changed content' })
    );
  });

  it('should have correct CSS classes', () => {
    const { container } = render(<Workspace />);

    expect(container.querySelector('[class*="workspace"]')).not.toBeNull();
  });

  it('should switch from empty to editor state', () => {
    const { rerender } = render(<Workspace />);

    expect(screen.getByText('Welcome to AvatarCode')).toBeInTheDocument();
    expect(MockCodeEditor).not.toHaveBeenCalled();

    addTab('newfile.ts');

    rerender(<Workspace />);

    expect(screen.queryByText('Welcome to AvatarCode')).not.toBeInTheDocument();
    expect(MockCodeEditor).toHaveBeenCalled();
  });
});
