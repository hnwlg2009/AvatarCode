import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import fileSystemService from '../services/FileSystemService';

export interface EditorSettings {
  fontSize: number;
  fontFamily: string;
  tabSize: number;
  wordWrap: boolean;
  minimap: boolean;
  lineNumbers: boolean;
  autoSave: boolean;
  autoSaveDelay: number;
  formatOnSave: boolean;
}

export interface AppearanceSettings {
  theme: 'light' | 'dark' | 'system';
  colorCustomizations: Record<string, string>;
  iconTheme: string;
}

export interface GitSettings {
  userName: string;
  userEmail: string;
}

export interface WorkspaceSettingsRaw {
  general?: Partial<GeneralSettings>;
  editor?: Partial<EditorSettings>;
  appearance?: Partial<AppearanceSettings>;
  git?: Partial<GitSettings>;
}

export interface GeneralSettings {
  language: string;
  autoSave: boolean;
  autoSaveDelay: number;
}

export interface Settings {
  general: GeneralSettings;
  editor: EditorSettings;
  appearance: AppearanceSettings;
  git: GitSettings;
}

const defaultSettings: Settings = {
  general: {
    language: 'zh',
    autoSave: false,
    autoSaveDelay: 1000,
  },
  editor: {
    fontSize: 14,
    fontFamily: '"JetBrains Mono", "Cascadia Code", "Fira Code", Consolas, monospace',
    tabSize: 2,
    wordWrap: false,
    minimap: true,
    lineNumbers: true,
    autoSave: false,
    autoSaveDelay: 1000,
    formatOnSave: false,
  },
  appearance: {
    theme: 'system',
    colorCustomizations: {},
    iconTheme: 'default',
  },
  git: {
    userName: '',
    userEmail: '',
  },
};

interface SettingsState {
  settings: Settings;
  workspacePath: string | null;
  workspaceSettings: WorkspaceSettingsRaw;
  isLoading: boolean;

  setSettings: (settings: Partial<Settings>) => void;
  setGeneralSettings: (settings: Partial<GeneralSettings>) => void;
  setEditorSettings: (settings: Partial<EditorSettings>) => void;
  setAppearanceSettings: (settings: Partial<AppearanceSettings>) => void;
  setGitSettings: (settings: Partial<GitSettings>) => void;
  setWorkspacePath: (path: string | null) => void;
  setWorkspaceSettings: (settings: WorkspaceSettingsRaw) => void;
  loadWorkspaceSettings: () => Promise<void>;
  saveWorkspaceSettings: () => Promise<void>;
  getEffectiveSettings: () => Settings;
}

async function readWorkspaceConfig(workspacePath: string): Promise<WorkspaceSettingsRaw> {
  try {
    const configPath = `${workspacePath}/.avatarcode/settings.json`;
    const exists = await fileSystemService.exists(configPath);
    if (!exists) {
      return {};
    }
    const content = await fileSystemService.readFile(configPath);
    return JSON.parse(content);
  } catch (error) {
    console.error('读取工作区配置失败:', error);
    return {};
  }
}

async function writeWorkspaceConfig(
  workspacePath: string,
  settings: WorkspaceSettingsRaw
): Promise<void> {
  try {
    const configDir = `${workspacePath}/.avatarcode`;
    const configPath = `${configDir}/settings.json`;

    const dirExists = await fileSystemService.exists(configDir);
    if (!dirExists) {
      await fileSystemService.createDirectory(configDir);
    }

    await fileSystemService.writeFile(configPath, JSON.stringify(settings, null, 2));
  } catch (error) {
    console.error('写入工作区配置失败:', error);
    throw error;
  }
}

function mergeSettings(base: Settings, override: WorkspaceSettingsRaw): Settings {
  return {
    general: {
      ...base.general,
      ...override.general,
    },
    editor: {
      ...base.editor,
      ...override.editor,
    },
    appearance: {
      ...base.appearance,
      ...override.appearance,
      colorCustomizations: {
        ...base.appearance.colorCustomizations,
        ...override.appearance?.colorCustomizations,
      },
    },
    git: {
      ...base.git,
      ...override.git,
    },
  };
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      settings: defaultSettings,
      workspacePath: null,
      workspaceSettings: {},
      isLoading: false,

      setSettings: (newSettings) => {
        set((state) => ({
          settings: { ...state.settings, ...newSettings },
        }));
      },

      setGeneralSettings: (generalSettings) => {
        set((state) => ({
          settings: {
            ...state.settings,
            general: { ...state.settings.general, ...generalSettings },
          },
        }));
      },

      setEditorSettings: (editorSettings) => {
        set((state) => ({
          settings: {
            ...state.settings,
            editor: { ...state.settings.editor, ...editorSettings },
          },
        }));
      },

      setAppearanceSettings: (appearanceSettings) => {
        set((state) => ({
          settings: {
            ...state.settings,
            appearance: { ...state.settings.appearance, ...appearanceSettings },
          },
        }));
      },

      setGitSettings: (gitSettings) => {
        set((state) => ({
          settings: {
            ...state.settings,
            git: { ...state.settings.git, ...gitSettings },
          },
        }));
      },

      setWorkspacePath: (workspacePath) => {
        set({ workspacePath });
        if (workspacePath) {
          get().loadWorkspaceSettings();
        }
      },

      setWorkspaceSettings: (workspaceSettings) => {
        set({ workspaceSettings });
      },

      loadWorkspaceSettings: async () => {
        const { workspacePath } = get();
        if (!workspacePath) {
          return;
        }

        set({ isLoading: true });
        try {
          const config = await readWorkspaceConfig(workspacePath);
          set({ workspaceSettings: config, isLoading: false });
        } catch (error) {
          console.error('加载工作区配置失败:', error);
          set({ isLoading: false });
        }
      },

      saveWorkspaceSettings: async () => {
        const { workspacePath, workspaceSettings } = get();
        if (!workspacePath) {
          throw new Error('未设置工作区路径');
        }

        await writeWorkspaceConfig(workspacePath, workspaceSettings);
      },

      getEffectiveSettings: () => {
        const { settings, workspaceSettings } = get();
        return mergeSettings(settings, workspaceSettings);
      },
    }),
    {
      name: 'avatarcode-settings',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        settings: state.settings,
      }),
    }
  )
);

export default useSettingsStore;
