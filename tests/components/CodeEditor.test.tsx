import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CodeEditor } from '../../src/components/editor/CodeEditor';
import * as MonacoReact from '@monaco-editor/react';

// Mock Monaco Editor
vi.mock('@monaco-editor/react', () => ({
  default: vi.fn(({ loading, value, language }) => (
    <div data-testid="monaco-editor" data-language={language}>
      {loading ? 'Loading...' : `Editor: ${value?.substring(0, 20)}`}
    </div>
  )),
  Editor: class Editor {},
}));

describe('CodeEditor', () => {
  const mockOnMount = vi.fn();
  const mockOnValueChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render with default props', () => {
    render(<CodeEditor />);
    
    expect(screen.getByTestId('monaco-editor')).toBeInTheDocument();
  });

  it('should render with custom value', () => {
    render(<CodeEditor value="const test = 123;" />);
    
    const editor = screen.getByTestId('monaco-editor');
    expect(editor).toBeInTheDocument();
  });

  it('should set language prop', () => {
    render(<CodeEditor language="python" />);
    
    const editor = screen.getByTestId('monaco-editor');
    expect(editor.getAttribute('data-language')).toBe('python');
  });

  it('should set theme prop', () => {
    render(<CodeEditor theme="vs-light" />);
    
    // Monaco should receive the theme
    expect(MonacoReact.default).toHaveBeenCalledWith(
      expect.objectContaining({
        theme: 'vs-light',
      }),
      expect.anything()
    );
  });

  it('should call onMount when editor mounts', async () => {
    const mockEditor = {
      onDidChangeCursorPosition: vi.fn(),
      onDidChangeCursorSelection: vi.fn(),
      onDidChangeModelContent: vi.fn(),
      getValue: vi.fn().mockReturnValue(''),
      getSelection: vi.fn(),
      getModel: vi.fn(),
      getPosition: vi.fn(),
      executeEdits: vi.fn(),
      focus: vi.fn(),
      setValue: vi.fn(),
    };

    // Mock the onMount callback
    render(<CodeEditor onMount={mockOnMount} />);
    
    // Wait for mount
    await waitFor(() => {
      expect(MonacoReact.default).toHaveBeenCalled();
    });

    // Get the onMount handler from the mock call
    const call = vi.mocked(MonacoReact.default).mock.calls[0];
    if (call && typeof call[0] === 'object' && 'onMount' in call[0]) {
      const onMount = call[0].onMount as any;
      onMount(mockEditor);
    }
    
    expect(mockOnMount).toHaveBeenCalledWith(mockEditor);
  });

  it('should call onValueChange when content changes', async () => {
    const mockEditor = {
      onDidChangeCursorPosition: vi.fn(),
      onDidChangeCursorSelection: vi.fn(),
      onDidChangeModelContent: vi.fn(),
      getValue: vi.fn().mockReturnValue('new content'),
      getSelection: vi.fn(),
      getModel: vi.fn(),
      getPosition: vi.fn(),
      executeEdits: vi.fn(),
      focus: vi.fn(),
      setValue: vi.fn(),
    };

    render(<CodeEditor onValueChange={mockOnValueChange} />);
    
    await waitFor(() => {
      expect(MonacoReact.default).toHaveBeenCalled();
    });

    // Get the onMount handler and trigger content change
    const call = vi.mocked(MonacoReact.default).mock.calls[0];
    if (call && typeof call[0] === 'object' && 'onMount' in call[0]) {
      const onMount = call[0].onMount as any;
      onMount(mockEditor);
    }

    // Trigger content change callback
    await waitFor(() => {
      expect(mockOnValueChange).toHaveBeenCalled();
    });
  });

  it('should apply custom config', () => {
    render(
      <CodeEditor
        config={{
          fontSize: 16,
          theme: 'vs-light',
          minimap: true,
        }}
      />
    );
    
    expect(MonacoReact.default).toHaveBeenCalledWith(
      expect.objectContaining({
        options: expect.objectContaining({
          fontSize: 16,
          theme: 'vs-light',
        }),
      }),
      expect.anything()
    );
  });

  it('should set readOnly mode', () => {
    render(<CodeEditor readOnly={true} />);
    
    expect(MonacoReact.default).toHaveBeenCalledWith(
      expect.objectContaining({
        options: expect.objectContaining({
          readOnly: true,
        }),
      }),
      expect.anything()
    );
  });

  it('should forward ref methods', async () => {
    const ref = React.createRef<any>();
    const mockEditor = {
      onDidChangeCursorPosition: vi.fn(),
      onDidChangeCursorSelection: vi.fn(),
      onDidChangeModelContent: vi.fn(),
      getValue: vi.fn().mockReturnValue('test value'),
      setValue: vi.fn(),
      getSelection: vi.fn().mockReturnValue({ isEmpty: () => true }),
      getModel: vi.fn().mockReturnValue({ getValueInRange: vi.fn() }),
      getPosition: vi.fn().mockReturnValue({ lineNumber: 1, column: 1 }),
      executeEdits: vi.fn(),
      focus: vi.fn(),
    };

    render(<CodeEditor ref={ref} />);
    
    await waitFor(() => {
      expect(MonacoReact.default).toHaveBeenCalled();
    });

    // Trigger mount to set up the ref
    const call = vi.mocked(MonacoReact.default).mock.calls[0];
    if (call && typeof call[0] === 'object' && 'onMount' in call[0]) {
      const onMount = call[0].onMount as any;
      onMount(mockEditor);
    }

    // Test ref methods
    expect(ref.current).toBeDefined();
    expect(typeof ref.current.getEditor).toBe('function');
    expect(typeof ref.current.getValue).toBe('function');
    expect(typeof ref.current.setValue).toBe('function');
    expect(typeof ref.current.focus).toBe('function');
    expect(typeof ref.current.getSelectedText).toBe('function');
    expect(typeof ref.current.insertText).toBe('function');

    // Test getValue
    const value = ref.current.getValue();
    expect(value).toBe('test value');
    expect(mockEditor.getValue).toHaveBeenCalled();

    // Test setValue
    ref.current.setValue('new value');
    expect(mockEditor.setValue).toHaveBeenCalledWith('new value');

    // Test focus
    ref.current.focus();
    expect(mockEditor.focus).toHaveBeenCalled();
  });

  it('should apply default loading component', () => {
    render(<CodeEditor />);
    
    expect(MonacoReact.default).toHaveBeenCalledWith(
      expect.objectContaining({
        loading: expect.anything(),
      }),
      expect.anything()
    );
  });

  it('should accept className prop', () => {
    render(<CodeEditor className="custom-class" />);
    
    // The component should have the custom class
    // This is a basic check since we're mocking Monaco
    expect(screen.getByTestId('monaco-editor')).toBeInTheDocument();
  });
});
