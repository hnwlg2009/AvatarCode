// Electron 主进程类型定义
export interface IpcChannel {
  'app:version': () => string;
  'app:platform': () => NodeJS.Platform;
  'file:read': (path: string) => Promise<string>;
  'file:write': (path: string, content: string) => Promise<void>;
  'file:exists': (path: string) => Promise<boolean>;
  'dialog:open': (options?: Electron.OpenDialogOptions) => Promise<Electron.OpenDialogReturnValue>;
  'dialog:save': (options?: Electron.SaveDialogOptions) => Promise<Electron.SaveDialogReturnValue>;
}

export interface AppStore {
  version: string;
  platform: NodeJS.Platform;
  configPath: string;
  workspacePath?: string;
}

export type { ElectronAPI } from '../src/types/electron';
