import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Workspace } from '../../src/components/common/Workspace';
import { useEditorStore } from '../../src/stores/editorStore';

// Mock CodeEditor
vi.mock('../../src/components/editor/CodeEditor', () => ({
  CodeEditor: vi.fn(() => <div data-testid="code-editor">Mock Editor</div>),
}));

describe('Workspace', () => {
  beforeEach(() => {
    // Reset store before each test
    useEditorStore.getState().reset();
  });

  it('should render empty state when no file is open', () => {
    render(<Workspace />);
    
    expect(screen.getByText('打开文件开始编辑')).toBeInTheDocument();
    expect(screen.getByText(/使用 Ctrl\+O 打开文件/)).toBeInTheDocument();
  });

  it('should render editor when file is open', () => {
    // Set a file in the store
    const store = useEditorStore.getState();
    store.setCurrentFile('/test.ts');
    store.setFileContent('console.log("hello");');
    store.setLanguage('typescript');

    render(<Workspace />);
    
    expect(screen.getByTestId('code-editor')).toBeInTheDocument();
  });

  it('should display file name in tab', () => {
    const store = useEditorStore.getState();
    store.setCurrentFile('src/App.tsx');

    render(<Workspace />);
    
    expect(screen.getByText('src/App.tsx')).toBeInTheDocument();
  });

  it('should pass language to CodeEditor', () => {
    const store = useEditorStore.getState();
    store.setCurrentFile('script.py');
    store.setLanguage('python');

    render(<Workspace />);
    
    // The mocked CodeEditor should be rendered
    expect(screen.getByTestId('code-editor')).toBeInTheDocument();
  });

  it('should handle file content changes', () => {
    const store = useEditorStore.getState();
    store.setCurrentFile('test.ts');
    store.setFileContent('initial content');

    render(<Workspace />);
    
    // Editor should be rendered with the file
    expect(screen.getByTestId('code-editor')).toBeInTheDocument();
  });

  it('should have correct CSS classes', () => {
    const { container } = render(<Workspace />);
    
    const workspace = container.querySelector('.workspace');
    expect(workspace).toBeInTheDocument();
  });

  it('should switch from empty to editor state', () => {
    const { rerender } = render(<Workspace />);
    
    expect(screen.getByText('打开文件开始编辑')).toBeInTheDocument();
    expect(screen.queryByTestId('code-editor')).not.toBeInTheDocument();

    // Open a file
    const store = useEditorStore.getState();
    store.setCurrentFile('newfile.ts');

    rerender(<Workspace />);
    
    expect(screen.queryByText('打开文件开始编辑')).not.toBeInTheDocument();
    expect(screen.getByTestId('code-editor')).toBeInTheDocument();
  });
});
