import { Tool, ToolResult } from '../types/agent.types';
import fileSystemService from '../../../services/FileSystemService';

export class FileTool implements Tool {
  name = 'file_operation';
  description = '执行文件操作（读、写、创建、删除、移动）';
  parameters = {
    type: 'object' as const,
    properties: {
      action: {
        type: 'string',
        description: '操作类型：read/write/create/delete/move',
        enum: ['read', 'write', 'create', 'delete', 'move'],
      },
      path: {
        type: 'string',
        description: '文件路径',
      },
      content: {
        type: 'string',
        description: '文件内容（写/创建操作需要）',
      },
      newPath: {
        type: 'string',
        description: '新路径（移动操作需要）',
      },
    },
    required: ['action', 'path'] as string[],
  };

  async execute(params: Record<string, any>): Promise<ToolResult> {
    try {
      const { action, path, content, newPath } = params;

      switch (action) {
        case 'read': {
          const data = await fileSystemService.readFile(path);
          return {
            success: true,
            data: { content: data },
            message: `成功读取 ${path}`,
          };
        }

        case 'write': {
          await fileSystemService.writeFile(path, content);
          return {
            success: true,
            message: `成功写入 ${path}`,
          };
        }

        case 'create': {
          await fileSystemService.createFile(path, content || '');
          return {
            success: true,
            message: `成功创建 ${path}`,
          };
        }

        case 'delete': {
          await fileSystemService.delete(path);
          return {
            success: true,
            message: `成功删除 ${path}`,
          };
        }

        case 'move': {
          await fileSystemService.rename(path, newPath);
          return {
            success: true,
            message: `成功移动 ${path} -> ${newPath}`,
          };
        }

        default:
          return {
            success: false,
            error: `未知操作：${action}`,
          };
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
  }
}
