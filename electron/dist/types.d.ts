export interface IpcChannel {
    'app:version': () => string;
    'app:platform': () => NodeJS.Platform;
    'file:read': (path: string) => Promise<string>;
    'file:write': (path: string, content: string) => Promise<void>;
    'file:exists': (path: string) => Promise<boolean>;
    'fs:stat': (path: string) => Promise<import('fs').Stats>;
    'fs:readdir': (path: string) => Promise<string[]>;
    'dialog:open': (options?: Electron.OpenDialogOptions) => Promise<Electron.OpenDialogReturnValue>;
    'dialog:save': (options?: Electron.SaveDialogOptions) => Promise<Electron.SaveDialogReturnValue>;
    'lsp:start': (config: LSPConfig) => Promise<void>;
    'lsp:stop': (id: string) => Promise<void>;
    'lsp:request': <T>(id: string, method: string, params?: unknown) => Promise<T>;
}
export interface LSPConfig {
    id: string;
    language: string;
    command: string;
    args: string[];
    rootPath: string;
}
export interface AppStore {
    version: string;
    platform: NodeJS.Platform;
    configPath: string;
    workspacePath?: string;
}
//# sourceMappingURL=types.d.ts.map