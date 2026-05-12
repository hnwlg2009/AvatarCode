export interface ElectronAPI {
    getVersion: () => Promise<string>;
    getPlatform: () => Promise<NodeJS.Platform>;
    readFile: (path: string) => Promise<string>;
    writeFile: (path: string, content: string) => Promise<void>;
    fileExists: (path: string) => Promise<boolean>;
    showOpenDialog: (options?: Electron.OpenDialogOptions) => Promise<Electron.OpenDialogReturnValue>;
    showSaveDialog: (options?: Electron.SaveDialogOptions) => Promise<Electron.SaveDialogReturnValue>;
}
//# sourceMappingURL=preload.d.ts.map