// Electron 主进程 API 类型定义
export interface LLMGenerateOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  tools?: any[];
}

export interface LLMGenerateResult {
  content: string | null;
  toolCalls?: { id: string; name: string; arguments: Record<string, any> }[];
  usage?: { prompt_tokens?: number; completion_tokens?: number; input_tokens?: number; output_tokens?: number };
  model?: string;
}

export interface FileEntry {
  name: string;
  path: string;
  type: 'file' | 'directory' | 'symlink';
  size: number;
  modifiedTime: Date;
  createdTime: Date;
}

export interface FileStat {
  isFile: boolean;
  isDirectory: boolean;
  isSymlink: boolean;
  size: number;
  atime: Date;
  mtime: Date;
  ctime: Date;
  mode: number;
}

export interface SearchOptions {
  pattern: string;
  exclude?: string[];
  maxResults?: number;
}

export interface FileInfo {
  path: string;
  name: string;
  size: number;
  mtime: Date;
}

export interface GitStatusData {
  files: Array<{
    path: string;
    status: 'modified' | 'added' | 'deleted' | 'untracked';
  }>;
  branch: string;
}

export interface GitCommitData {
  oid: string;
  message: string;
  author: string;
  date: string;
}

export interface GitBranchData {
  name: string;
  current: boolean;
}

export interface AIProviderConfig {
  key?: string;
  baseUrl?: string;
  model?: string;
}

export interface ProviderConfigInfo {
  hasKey: boolean;
  baseUrl: string;
  model: string;
}

export interface CommandApprovalInfo {
  nonce: string;
  command: string;
}

export interface CommandExecutionResult {
  exitCode: number | null;
  stdout: string;
  stderr: string;
  timedOut: boolean;
}

export interface CommandDecisionResult {
  nonce: string;
  denied?: boolean;
  approved?: boolean;
  reason?: string;
  exitCode?: number | null;
  stdout?: string;
  stderr?: string;
  timedOut?: boolean;
}

export interface ElectronAPI {
  getVersion: () => Promise<string>;
  getPlatform: () => Promise<string>;
  getWorkspacePath: () => Promise<string | null>;
  setWorkspacePath: (dirPath: string) => Promise<string | null>;
  openFileDialog: () => Promise<string | null>;
  saveFileDialog: () => Promise<string | null>;
  openDirectoryDialog: () => Promise<string | null>;
  file: {
    read: (path: string) => Promise<string>;
    readBinary: (path: string) => Promise<Uint8Array>;
    write: (path: string, content: string) => Promise<void>;
    writeBinary: (path: string, data: Uint8Array) => Promise<void>;
    exists: (path: string) => Promise<boolean>;
    readdir: (path: string) => Promise<FileEntry[]>;
    stat: (path: string) => Promise<FileStat>;
    create: (path: string, content?: string) => Promise<void>;
    createDirectory: (path: string) => Promise<void>;
    delete: (path: string, recursive?: boolean) => Promise<void>;
    rename: (oldPath: string, newPath: string) => Promise<void>;
    copy: (sourcePath: string, destPath: string) => Promise<void>;
    search: (pattern: string, options?: SearchOptions) => Promise<FileInfo[]>;
    searchCode: (query: string, dirPath?: string, maxResults?: number) => Promise<{ path: string; line: number; snippet: string }[]>;
    addWorkspacePath: (path: string) => Promise<void>;
  };
  git: {
    init: (repoPath: string) => Promise<{ success: boolean; isRepo: boolean; error?: string }>;
    getConfig: (repoPath: string, key: string) => Promise<string>;
    setConfig: (repoPath: string, key: string, value: string) => Promise<{ success: boolean; error?: string }>;
    getStatus: (repoPath: string) => Promise<GitStatusData>;
    add: (repoPath: string, files: string | string[]) => Promise<{ success: boolean; error?: string }>;
    remove: (repoPath: string, files: string | string[]) => Promise<{ success: boolean; error?: string }>;
    commit: (repoPath: string, message: string, author?: { name?: string; email?: string }) => Promise<{ success: boolean; oid: string; error?: string }>;
    getLog: (repoPath: string, count?: number) => Promise<GitCommitData[]>;
    getCurrentBranch: (repoPath: string) => Promise<string>;
    getBranches: (repoPath: string) => Promise<GitBranchData[]>;
    createBranch: (repoPath: string, name: string) => Promise<{ success: boolean; error?: string }>;
    checkout: (repoPath: string, branch: string) => Promise<{ success: boolean; error?: string }>;
  };
  llm: {
    setAPIKey: (provider: string, config: string | AIProviderConfig) => Promise<{ success: boolean }>;
    hasAPIKey: (provider: string) => Promise<boolean>;
    getProviderConfig: (provider: string) => Promise<ProviderConfigInfo>;
    validateAPIKey: (provider: string) => Promise<{ valid: boolean }>;
    generate: (provider: string, messages: any[], options?: LLMGenerateOptions) => Promise<LLMGenerateResult>;
  };
  command: {
    requestApproval: (command: string, cwd?: string) => Promise<CommandApprovalInfo>;
    decideApproval: (nonce: string, approved: boolean) => Promise<CommandDecisionResult>;
  };
  send: (channel: string, ...args: any[]) => void;
  on: (channel: string, callback: (...args: any[]) => void) => () => void;
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}