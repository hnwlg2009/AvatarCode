/**
 * 插件系统类型定义
 */

/** 插件清单 */
export interface PluginManifest {
  name: string;
  displayName: string;
  version: string;
  description: string;
  author: string;
  publisher?: string;
  main: string;
  engines: {
    avatarcode: string;
  };
  activationEvents?: string[];
  contributes?: PluginContributions;
  dependencies?: Record<string, string>;
}

/** 插件贡献 */
export interface PluginContributions {
  languages?: LanguageContribution[];
  commands?: CommandContribution[];
  configuration?: ConfigurationContribution;
  themes?: ThemeContribution[];
}

/** 语言贡献 */
export interface LanguageContribution {
  id: string;
  extensions: string[];
  aliases: string[];
  configuration?: string;
}

/** 命令贡献 */
export interface CommandContribution {
  command: string;
  title: string;
  category?: string;
  icon?: string;
}

/** 配置贡献 */
export interface ConfigurationContribution {
  title: string;
  properties: Record<string, ConfigurationProperty>;
}

/** 配置属性 */
export interface ConfigurationProperty {
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  description: string;
  default?: any;
}

/** 主题贡献 */
export interface ThemeContribution {
  label: string;
  path: string;
  uiTheme: 'vs' | 'vs-dark' | 'hc-black';
}

/** 插件状态 */
export enum PluginState {
  INSTALLED = 'installed',
  ACTIVATED = 'activated',
  DEACTIVATED = 'deactivated',
  ERROR = 'error',
}

/** 插件实例 */
export interface PluginInstance {
  manifest: PluginManifest;
  path: string;
  state: PluginState;
  exports: any | null;
}

/** 插件 API */
export interface PluginAPI {
  /** 编辑器 API */
  editor: {
    registerLanguage(language: LanguageContribution): void;
    registerCommand(command: CommandContribution, handler: () => void): void;
    getActiveEditor(): any | null;
  };

  /** 工作空间 API */
  workspace: {
    openFile(path: string): Promise<any>;
    saveFile(path: string, content: string): Promise<void>;
    getWorkspaceFolders(): string[];
  };

  /** UI API */
  ui: {
    createStatusBarItem(): StatusBarItem;
    createOutputChannel(name: string): OutputChannel;
    showInformationMessage(message: string, ...items: string[]): Promise<string | undefined>;
    showWarningMessage(message: string, ...items: string[]): Promise<string | undefined>;
    showErrorMessage(message: string, ...items: string[]): Promise<string | undefined>;
  };
}

/** 状态栏Item */
export interface StatusBarItem {
  text: string;
  tooltip?: string;
  command?: string;
  show(): void;
  hide(): void;
  dispose(): void;
}

/** 输出通道 */
export interface OutputChannel {
  append(value: string): void;
  appendLine(value: string): void;
  clear(): void;
  show(): void;
  dispose(): void;
}
