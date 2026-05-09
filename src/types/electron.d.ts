// Electron 主进程 API 类型定义
export interface ElectronAPI {
  getVersion: () => Promise<string>;
  getPlatform: () => Promise<NodeJS.Platform>;
  readFile: (path: string) => Promise<string>;
  writeFile: (path: string, content: string) => Promise<void>;
  fileExists: (path: string) => Promise<boolean>;
  openFileDialog: () => Promise<string | null>;
  saveFileDialog: () => Promise<string | null>;
  openDirectoryDialog: () => Promise<string | null>;
  git: {
    init: (repoPath: string) => Promise<{ success: boolean; isRepo: boolean }>;
    getConfig: (key: string) => Promise<string>;
    setConfig: (key: string, value: string) => Promise<{ success: boolean }>;
    getStatus: () => Promise<{ files: any[]; branch: string }>;
    add: (files: string | string[]) => Promise<{ success: boolean }>;
    commit: (message: string) => Promise<{ success: boolean; oid: string }>;
    getLog: (count?: number) => Promise<any[]>;
    getCurrentBranch: () => Promise<string>;
    selectRepo: () => Promise<{ canceled: boolean; path?: string }>;
  };
  llm: {
    setConfig: (provider: string, config: any) => Promise<{ success: boolean }>;
    chat: (
      messages: any[],
      config?: any
    ) => Promise<{ success: boolean; content?: string; error?: string }>;
    chatStream: (
      messages: any[],
      config?: any
    ) => Promise<{ success: boolean; content?: string; error?: string }>;
  };
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}
