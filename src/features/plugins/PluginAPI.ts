/**
 * 插件 API 实现
 * 提供给插件使用的 API
 */

import { PluginAPI, LanguageContribution, CommandContribution, StatusBarItem, OutputChannel } from './types';
import fileSystemService from '../../services/FileSystemService';

export function createPluginAPI(): PluginAPI {
  return {
    editor: {
      registerLanguage(language: LanguageContribution) {
        console.log('注册语言:', language);
        // 实际实现应该注册到 Monaco Editor
      },
      
      registerCommand(command: CommandContribution, handler: () => void) {
        console.log('注册命令:', command);
        // 实际实现应该注册到命令系统
      },
      
      getActiveEditor() {
        return null; // TODO: 返回当前活跃的编辑器
      },
    },
    
    workspace: {
      async openFile(path: string) {
        const content = await fileSystemService.readFile(path);
        return { path, content };
      },
      
      async saveFile(path: string, content: string) {
        await fileSystemService.writeFile(path, content);
      },
      
      getWorkspaceFolders() {
        // TODO: 从 workspace store 获取
        return [];
      },
    },
    
    ui: {
      createStatusBarItem(): StatusBarItem {
        const item = {
          text: '',
          tooltip: '',
          command: '',
          show() { console.log('Status bar item shown'); },
          hide() { console.log('Status bar item hidden'); },
          dispose() { console.log('Status bar item disposed'); },
        };
        return item;
      },
      
      createOutputChannel(name: string): OutputChannel {
        return {
          append(value: string) { console.log(`[${name}]`, value); },
          appendLine(value: string) { console.log(`[${name}]`, value); },
          clear() { console.log(`[${name}] cleared`); },
          show() { console.log(`[${name}] shown`); },
          dispose() { console.log(`[${name}] disposed`); },
        };
      },
      
      async showInformationMessage(message: string) {
        alert(message);
        return undefined;
      },
      
      async showWarningMessage(message: string) {
        alert(`⚠️ ${message}`);
        return undefined;
      },
      
      async showErrorMessage(message: string) {
        alert(`❌ ${message}`);
        return undefined;
      },
    },
  };
}

export default createPluginAPI;
