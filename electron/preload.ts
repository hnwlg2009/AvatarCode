import { contextBridge, ipcRenderer } from 'electron';

const ALLOWED_EVENTS = new Set([
  'menu:open-file',
  'menu:save-file',
  'menu:new-file',
  'menu:toggle-sidebar',
  'language-changed',
  'command:approval-result',
]);

// electronAPI 对象
const electronAPI = {
  // App
  getVersion: () => ipcRenderer.invoke('app:version'),
  getPlatform: () => ipcRenderer.invoke('app:platform'),

  // Workspace
  getWorkspacePath: () => ipcRenderer.invoke('workspace:getPath'),
  setWorkspacePath: (dirPath: string) => ipcRenderer.invoke('workspace:setPath', dirPath),

  // File
  file: {
    read: (path: string) => ipcRenderer.invoke('file:read', path),
    readBinary: (path: string) => ipcRenderer.invoke('file:readBinary', path),
    write: (path: string, content: string) => ipcRenderer.invoke('file:write', path, content),
    writeBinary: (path: string, data: Uint8Array) => ipcRenderer.invoke('file:writeBinary', path, data),
    exists: (path: string) => ipcRenderer.invoke('file:exists', path),
    readdir: (path: string) => ipcRenderer.invoke('file:readdir', path),
    stat: (path: string) => ipcRenderer.invoke('file:stat', path),
    create: (path: string, content?: string) => ipcRenderer.invoke('file:create', path, content),
    createDirectory: (path: string) => ipcRenderer.invoke('file:createDirectory', path),
    delete: (path: string, recursive?: boolean) => ipcRenderer.invoke('file:delete', path, recursive),
    rename: (oldPath: string, newPath: string) => ipcRenderer.invoke('file:rename', oldPath, newPath),
    copy: (sourcePath: string, destPath: string) => ipcRenderer.invoke('file:copy', sourcePath, destPath),
    search: (pattern: string, options?: any) => ipcRenderer.invoke('file:search', pattern, options),
    searchCode: (query: string, dirPath?: string, maxResults?: number) =>
      ipcRenderer.invoke('file:searchCode', query, dirPath, maxResults),
    addWorkspacePath: (path: string) => ipcRenderer.invoke('file:addWorkspacePath', path),
  },

  // Dialog
  openFileDialog: () => ipcRenderer.invoke('dialog:openFile'),
  saveFileDialog: () => ipcRenderer.invoke('dialog:saveFile'),
  openDirectoryDialog: () => ipcRenderer.invoke('dialog:openDirectory'),

  // Git
  git: {
    init: (repoPath: string) => ipcRenderer.invoke('git:init', repoPath),
    getConfig: (repoPath: string, key: string) => ipcRenderer.invoke('git:getConfig', repoPath, key),
    setConfig: (repoPath: string, key: string, value: string) =>
      ipcRenderer.invoke('git:setConfig', repoPath, key, value),
    getStatus: (repoPath: string) => ipcRenderer.invoke('git:getStatus', repoPath),
    add: (repoPath: string, files: string | string[]) => ipcRenderer.invoke('git:add', repoPath, files),
    remove: (repoPath: string, files: string | string[]) =>
      ipcRenderer.invoke('git:remove', repoPath, files),
    commit: (repoPath: string, message: string, author?: { name?: string; email?: string }) =>
      ipcRenderer.invoke('git:commit', repoPath, message, author),
    getLog: (repoPath: string, count?: number) => ipcRenderer.invoke('git:getLog', repoPath, count),
    getCurrentBranch: (repoPath: string) => ipcRenderer.invoke('git:getCurrentBranch', repoPath),
    getBranches: (repoPath: string) => ipcRenderer.invoke('git:getBranches', repoPath),
    createBranch: (repoPath: string, name: string) =>
      ipcRenderer.invoke('git:createBranch', repoPath, name),
    checkout: (repoPath: string, branch: string) =>
      ipcRenderer.invoke('git:checkout', repoPath, branch),
  },

  // LLM
  llm: {
    setAPIKey: (provider: string, config: string | Record<string, unknown>) =>
      ipcRenderer.invoke('llm:setAPIKey', provider, config),
    hasAPIKey: (provider: string) => ipcRenderer.invoke('llm:hasAPIKey', provider),
    getProviderConfig: (provider: string) => ipcRenderer.invoke('llm:getProviderConfig', provider),
    validateAPIKey: (provider: string) => ipcRenderer.invoke('llm:validateAPIKey', provider),
    generate: (provider: string, messages: any[], options?: any) =>
      ipcRenderer.invoke('llm:generate', provider, messages, options),
    cancel: (requestId: string) => ipcRenderer.invoke('llm:cancel', requestId),
    listModels: (provider: string) => ipcRenderer.invoke('llm:listModels', provider),
  },

  // Command（需审批后执行）
  command: {
    requestApproval: (command: string, cwd?: string) =>
      ipcRenderer.invoke('command:requestApproval', command, cwd),
    decideApproval: (nonce: string, approved: boolean) =>
      ipcRenderer.invoke('command:decideApproval', nonce, approved),
  },

  // IPC 通用方法
  send: (channel: string, ...args: any[]) => ipcRenderer.send(channel, ...args),

  // 事件监听（白名单）
  on: (channel: string, callback: (...args: any[]) => void) => {
    if (!ALLOWED_EVENTS.has(channel)) {
      console.warn(`Blocked event subscription: ${channel}`);
      return () => {};
    }
    const listener = (_event: unknown, ...args: any[]) => callback(...args);
    ipcRenderer.on(channel, listener);
    return () => ipcRenderer.removeListener(channel, listener);
  },
};

// 暴露给渲染进程
contextBridge.exposeInMainWorld('electronAPI', electronAPI);