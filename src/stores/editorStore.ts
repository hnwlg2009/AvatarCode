import { create } from 'zustand';
import { IEditorConfig, defaultEditorConfig } from '../config/editor.config';

interface EditorState {
  // 当前打开的文件
  currentFile: string | null;

  // 文件内容
  fileContent: string;

  // 文件语言
  language: string;

  // 编辑器配置
  config: IEditorConfig;

  // 光标位置
  cursorPosition: {
    lineNumber: number;
    column: number;
  } | null;

  // 选中内容
  selection: {
    startLineNumber: number;
    startColumn: number;
    endLineNumber: number;
    endColumn: number;
  } | null;

  // 是否保存
  isDirty: boolean;

  // 是否加载
  isLoading: boolean;

  // 错误信息
  error: string | null;

  // 设置当前文件
  setCurrentFile: (filePath: string) => void;

  // 设置文件内容
  setFileContent: (content: string) => void;

  // 设置语言
  setLanguage: (language: string) => void;

  // 更新配置
  updateConfig: (config: Partial<IEditorConfig>) => void;

  // 设置光标位置
  setCursorPosition: (position: { lineNumber: number; column: number }) => void;

  // 设置选中
  setSelection: (
    selection: {
      startLineNumber: number;
      startColumn: number;
      endLineNumber: number;
      endColumn: number;
    } | null
  ) => void;

  // 标记为已保存
  markAsSaved: () => void;

  // 标记为已修改
  markAsDirty: () => void;

  // 设置加载状态
  setLoading: (loading: boolean) => void;

  // 设置错误
  setError: (error: string | null) => void;

  // 重置状态
  reset: () => void;
}

const initialState = {
  currentFile: null,
  fileContent: '',
  language: 'plaintext',
  config: defaultEditorConfig,
  cursorPosition: null,
  selection: null,
  isDirty: false,
  isLoading: false,
  error: null,
};

export const useEditorStore = create<EditorState>((set) => ({
  ...initialState,

  setCurrentFile: (filePath: string) => {
    set({ currentFile: filePath });
  },

  setFileContent: (content: string) => {
    set({ fileContent: content, isDirty: true });
  },

  setLanguage: (language: string) => {
    set({ language });
  },

  updateConfig: (config: Partial<IEditorConfig>) => {
    set((state) => ({
      config: { ...state.config, ...config },
    }));
  },

  setCursorPosition: (position) => {
    set({ cursorPosition: position });
  },

  setSelection: (selection) => {
    set({ selection });
  },

  markAsSaved: () => {
    set({ isDirty: false });
  },

  markAsDirty: () => {
    set({ isDirty: true });
  },

  setLoading: (loading) => {
    set({ isLoading: loading });
  },

  setError: (error) => {
    set({ error });
  },

  reset: () => {
    set(initialState);
  },
}));
