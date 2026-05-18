import { contextBridge, ipcRenderer } from 'electron';

// electronAPI 对象
const electronAPI = {
  // App
  getVersion: () => ipcRenderer.invoke('app:version'),
  getPlatform: () => ipcRenderer.invoke('app:platform'),

  // File
  readFile: (path: string) => ipcRenderer.invoke('file:read', path),
  writeFile: (path: string, content: string) => ipcRenderer.invoke('file:write', path, content),
  fileExists: (path: string) => ipcRenderer.invoke('file:exists', path),

  // Dialog
  openFileDialog: () => ipcRenderer.invoke('dialog:openFile'),
  saveFileDialog: () => ipcRenderer.invoke('dialog:saveFile'),
  openDirectoryDialog: () => ipcRenderer.invoke('dialog:openDirectory'),

  // Git
  git: {
    init: (repoPath: string) => ipcRenderer.invoke('git:init', repoPath),
    getConfig: (key: string) => ipcRenderer.invoke('git:getConfig', key),
    setConfig: (key: string, value: string) => ipcRenderer.invoke('git:setConfig', key, value),
    getStatus: () => ipcRenderer.invoke('git:getStatus'),
    add: (files: string | string[]) => ipcRenderer.invoke('git:add', files),
    commit: (message: string) => ipcRenderer.invoke('git:commit', message),
    getLog: (count?: number) => ipcRenderer.invoke('git:getLog', count),
    getCurrentBranch: () => ipcRenderer.invoke('git:getCurrentBranch'),
    selectRepo: () => ipcRenderer.invoke('git:selectRepo'),
  },

  // LLM
  llm: {
    setConfig: (provider: string, config: any) =>
      ipcRenderer.invoke('llm:setConfig', provider, config),
    chat: (messages: any[], config?: any) => ipcRenderer.invoke('llm:chat', messages, config),
    chatStream: (messages: any[], config?: any) =>
      ipcRenderer.invoke('llm:chat:stream', messages, config),
  },

  // IPC 通用方法
  send: (channel: string, ...args: any[]) => ipcRenderer.send(channel, ...args),
};

// 暴露给渲染进程
contextBridge.exposeInMainWorld('electronAPI', electronAPI);
