"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
// electronAPI 对象
const electronAPI = {
    // App
    getVersion: () => electron_1.ipcRenderer.invoke('app:version'),
    getPlatform: () => electron_1.ipcRenderer.invoke('app:platform'),
    // File
    readFile: (path) => electron_1.ipcRenderer.invoke('file:read', path),
    writeFile: (path, content) => electron_1.ipcRenderer.invoke('file:write', path, content),
    fileExists: (path) => electron_1.ipcRenderer.invoke('file:exists', path),
    // Dialog
    openFileDialog: () => electron_1.ipcRenderer.invoke('dialog:openFile'),
    saveFileDialog: () => electron_1.ipcRenderer.invoke('dialog:saveFile'),
    openDirectoryDialog: () => electron_1.ipcRenderer.invoke('dialog:openDirectory'),
    // Git
    git: {
        init: (repoPath) => electron_1.ipcRenderer.invoke('git:init', repoPath),
        getConfig: (key) => electron_1.ipcRenderer.invoke('git:getConfig', key),
        setConfig: (key, value) => electron_1.ipcRenderer.invoke('git:setConfig', key, value),
        getStatus: () => electron_1.ipcRenderer.invoke('git:getStatus'),
        add: (files) => electron_1.ipcRenderer.invoke('git:add', files),
        commit: (message) => electron_1.ipcRenderer.invoke('git:commit', message),
        getLog: (count) => electron_1.ipcRenderer.invoke('git:getLog', count),
        getCurrentBranch: () => electron_1.ipcRenderer.invoke('git:getCurrentBranch'),
        selectRepo: () => electron_1.ipcRenderer.invoke('git:selectRepo'),
    },
    // LLM
    llm: {
        setConfig: (provider, config) => electron_1.ipcRenderer.invoke('llm:setConfig', provider, config),
        chat: (messages, config) => electron_1.ipcRenderer.invoke('llm:chat', messages, config),
        chatStream: (messages, config) => electron_1.ipcRenderer.invoke('llm:chat:stream', messages, config),
    },
};
// 暴露给渲染进程
electron_1.contextBridge.exposeInMainWorld('electronAPI', electronAPI);
