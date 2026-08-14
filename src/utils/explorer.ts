import fileSystemService from '../services/FileSystemService';
import type { IFileNode } from '../components/common/FileTree';

export const EXCLUDED_DIRS = new Set(['node_modules', '.git', 'dist', 'build', 'out', '.avatarcode']);
const MAX_DEPTH = 4;

export async function buildFileTree(
  rootPath: string,
  depth = 0
): Promise<IFileNode[]> {
  if (depth > MAX_DEPTH) return [];

  let entries;
  try {
    entries = await fileSystemService.readdir(rootPath);
  } catch {
    return [];
  }

  const nodes: IFileNode[] = [];
  for (const entry of entries) {
    if (entry.type === 'directory') {
      if (EXCLUDED_DIRS.has(entry.name)) continue;
      nodes.push({
        name: entry.name,
        path: entry.path,
        isDirectory: true,
        children: await buildFileTree(entry.path, depth + 1),
      });
    } else {
      nodes.push({
        name: entry.name,
        path: entry.path,
        isDirectory: false,
      });
    }
  }

  nodes.sort((a, b) => {
    if (a.isDirectory !== b.isDirectory) return a.isDirectory ? -1 : 1;
    return a.name.localeCompare(b.name);
  });

  return nodes;
}
