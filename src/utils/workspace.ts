import fileSystemService from '../services/FileSystemService';
import { useTabManagerStore } from '../stores/tabManagerStore';

let untitledCounter = 0;

export async function openFileInWorkspace(filePath: string): Promise<void> {
  const store = useTabManagerStore.getState();
  const existing = store.getTabByPath(filePath);
  if (existing) {
    store.activateTab(existing.id);
    return;
  }

  const content = await fileSystemService.readFile(filePath);
  const name = filePath.split(/[\\/]/).pop() || filePath;
  store.addTab({
    path: filePath,
    name,
    language: fileSystemService.getFileLanguage(filePath),
    content,
    isDirty: false,
    isLoading: false,
    config: { theme: 'vs-dark' } as const,
    id: '',
  });
}

export async function saveActiveTab(): Promise<boolean> {
  const store = useTabManagerStore.getState();
  const activeTab = store.getActiveTab();
  if (!activeTab) return false;

  let targetPath = activeTab.path;

  // 未命名文件（虚拟路径）→ 弹另存为对话框，落盘后更新 tab 信息
  if (targetPath.startsWith('Untitled-')) {
    const savedPath = await fileSystemService.saveFileDialog();
    if (!savedPath) return false;
    const name = savedPath.split(/[\\/]/).pop() || savedPath;
    store.updateTabInfo(activeTab.id, {
      path: savedPath,
      name,
      language: fileSystemService.getFileLanguage(savedPath),
    });
    targetPath = savedPath;
  }

  try {
    await fileSystemService.writeFile(targetPath, activeTab.content);
    store.markAsSaved(activeTab.id);
    return true;
  } catch (error) {
    console.error('Failed to save file:', error);
    return false;
  }
}

export function createUntitledTab(): void {
  const store = useTabManagerStore.getState();
  untitledCounter += 1;
  const name = `Untitled-${untitledCounter}`;
  store.addTab({
    path: name,
    name,
    language: 'plaintext',
    content: '',
    isDirty: false,
    isLoading: false,
    config: { theme: 'vs-dark' } as const,
    id: '',
  });
}
