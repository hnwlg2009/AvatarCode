import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import Editor from '@monaco-editor/react';
import { CodeEditor } from '../../src/components/editor/CodeEditor';
import { useSettingsStore } from '../../src/stores/settingsStore';

vi.mock('@monaco-editor/react', () => ({
  default: vi.fn(() => <div data-testid="monaco-editor" />),
}));

function lastEditorProps() {
  const call = vi.mocked(Editor).mock.calls[vi.mocked(Editor).mock.calls.length - 1];
  return call && typeof call[0] === 'object' ? call[0] : {};
}

const mockEditor = {
  getValue: vi.fn().mockReturnValue('test value'),
  setValue: vi.fn(),
  getModel: vi.fn().mockReturnValue({ getLanguageId: () => 'typescript' }),
  focus: vi.fn(),
};

describe('CodeEditor', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useSettingsStore.setState({ settings: useSettingsStore.getState().settings });
  });

  it('should render with default props', () => {
    render(<CodeEditor />);

    expect(screen.getByTestId('monaco-editor')).toBeInTheDocument();
    expect(lastEditorProps().theme).toBe('vs-dark');
  });

  it('should render with custom value', () => {
    render(<CodeEditor value="const test = 123;" />);

    expect(lastEditorProps().value).toBe('const test = 123;');
  });

  it('should set language prop', () => {
    render(<CodeEditor language="python" />);

    expect(lastEditorProps().language).toBe('python');
  });

  it('should set theme prop', () => {
    render(<CodeEditor theme="vs-light" />);

    expect(lastEditorProps().theme).toBe('vs-light');
  });

  it('should call onMount when editor mounts', () => {
    const onMount = vi.fn();
    render(<CodeEditor onMount={onMount} />);

    const props = lastEditorProps();
    props.onMount?.(mockEditor);

    expect(onMount).toHaveBeenCalledWith(mockEditor);
  });

  it('should call onChange when content changes', () => {
    const onChange = vi.fn();
    render(<CodeEditor onChange={onChange} />);

    const props = lastEditorProps();
    props.onChange?.('new content', undefined);

    expect(onChange).toHaveBeenCalledWith('new content', undefined);
  });

  it('should apply settings from settings store', () => {
    useSettingsStore.getState().setEditorSettings({ fontSize: 16, tabSize: 4, minimap: false });

    render(<CodeEditor />);

    const options = lastEditorProps().options as Record<string, unknown>;
    expect(options.fontSize).toBe(16);
    expect(options.tabSize).toBe(4);
    expect(options.minimap).toEqual({ enabled: false });
  });

  it('should set readOnly mode', () => {
    render(<CodeEditor readOnly={true} />);

    const options = lastEditorProps().options as Record<string, unknown>;
    expect(options.readOnly).toBe(true);
  });

  it('should forward ref methods', () => {
    const ref = React.createRef<React.ComponentRef<typeof CodeEditor>>();
    render(<CodeEditor ref={ref} />);

    const props = lastEditorProps();
    props.onMount?.(mockEditor);

    expect(ref.current).toBeDefined();
    expect(typeof ref.current?.getCode).toBe('function');
    expect(typeof ref.current?.setCode).toBe('function');
    expect(typeof ref.current?.getLanguage).toBe('function');
    expect(typeof ref.current?.setLanguage).toBe('function');
    expect(typeof ref.current?.focus).toBe('function');

    expect(ref.current?.getCode()).toBe('test value');
    expect(mockEditor.getValue).toHaveBeenCalled();

    ref.current?.setCode('new value');
    expect(mockEditor.setValue).toHaveBeenCalledWith('new value');

    ref.current?.focus();
    expect(mockEditor.focus).toHaveBeenCalled();
  });

  it('should accept className prop', () => {
    const { container } = render(<CodeEditor className="custom-class" />);

    expect(container.querySelector('[class*="container"]')).not.toBeNull();
    expect(container.querySelector('.custom-class')).not.toBeNull();
  });
});
