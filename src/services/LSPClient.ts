import { EventEmitter } from 'events';
import {
  LSPConfig,
  CompletionItem,
  Diagnostic,
  Hover,
  Position,
  TextDocumentIdentifier,
} from '../types/lsp.types';

/**
 * LSP 客户端
 * 负责与语言服务器通信 (JSON-RPC over stdio)
 */
export class LSPClient extends EventEmitter {
  private config: LSPConfig | null = null;
  private isRunning: boolean = false;
  private messageId: number = 0;
  private pendingRequests: Map<
    number,
    { resolve: (data: any) => void; reject: (error: Error) => void }
  > = new Map();

  // Node.js ChildProcess (语言服务器进程)
  private process: any = null;
  private buffer: string = '';

  constructor() {
    super();
  }

  /**
   * 启动语言服务器
   */
  async start(config: LSPConfig): Promise<void> {
    if (this.isRunning) {
      throw new Error('LSP client is already running');
    }

    this.config = config;

    try {
      // 在 Electron 中，需要通过 IPC 启动进程
      // 这里模拟启动流程
      this.isRunning = true;
      this.emit('started');

      console.log(`LSP client started for ${config.languageId}`);
    } catch (error) {
      this.emit('error', error);
      throw error;
    }
  }

  /**
   * 停止语言服务器
   */
  async stop(): Promise<void> {
    if (!this.isRunning) {
      return;
    }

    try {
      // 发送 shutdown 请求
      await this.sendRequest('shutdown', {});

      // 发送 exit 通知
      this.sendNotification('exit');

      // 清理进程
      if (this.process) {
        this.process.kill();
        this.process = null;
      }

      this.isRunning = false;
      this.pendingRequests.clear();
      this.buffer = '';

      this.emit('stopped');
      console.log('LSP client stopped');
    } catch (error) {
      this.emit('error', error);
    }
  }

  /**
   * 打开文档 (通知语言服务器)
   */
  async openDocument(
    uri: string,
    languageId: string,
    version: number,
    text: string
  ): Promise<void> {
    this.sendNotification('textDocument/didOpen', {
      textDocument: {
        uri,
        languageId,
        version,
        text,
      },
    });
  }

  /**
   * 关闭文档
   */
  async closeDocument(uri: string): Promise<void> {
    this.sendNotification('textDocument/didClose', {
      textDocument: {
        uri,
      },
    });
  }

  /**
   * 更新文档内容
   */
  async updateDocument(
    uri: string,
    version: number,
    changes: Array<{
      range: { start: Position; end: Position };
      text: string;
    }>
  ): Promise<void> {
    this.sendNotification('textDocument/didChange', {
      textDocument: {
        uri,
        version,
      },
      contentChanges: changes,
    });
  }

  /**
   * 代码补全
   */
  async getCompletion(uri: string, position: Position): Promise<CompletionItem[]> {
    const result = await this.sendRequest('textDocument/completion', {
      textDocument: { uri },
      position,
    });

    if (!result) {
      return [];
    }

    // 处理 CompletionList 或直接数组
    const items = Array.isArray(result) ? result : result.items || [];
    return items as CompletionItem[];
  }

  /**
   * 悬停信息
   */
  async getHover(uri: string, position: Position): Promise<Hover | null> {
    return await this.sendRequest('textDocument/hover', {
      textDocument: { uri },
      position,
    });
  }

  /**
   * 跳转到定义
   */
  async getDefinition(uri: string, position: Position): Promise<any> {
    return await this.sendRequest('textDocument/definition', {
      textDocument: { uri },
      position,
    });
  }

  /**
   * 签名帮助
   */
  async getSignatureHelp(uri: string, position: Position): Promise<any> {
    return await this.sendRequest('textDocument/signatureHelp', {
      textDocument: { uri },
      position,
    });
  }

  /**
   * 获取诊断信息
   */
  getDiagnostics(uri: string): Diagnostic[] {
    // 诊断通过 notification 接收，需要缓存
    return [];
  }

  /**
   * 发送 JSON-RPC 请求
   */
  private async sendRequest(method: string, params: any): Promise<any> {
    const id = ++this.messageId;

    return new Promise((resolve, reject) => {
      this.pendingRequests.set(id, { resolve, reject });

      const message = {
        jsonrpc: '2.0',
        id,
        method,
        params,
      };

      this.sendMessage(message);

      // 设置超时
      setTimeout(() => {
        if (this.pendingRequests.has(id)) {
          this.pendingRequests.delete(id);
          reject(new Error(`Request timeout: ${method}`));
        }
      }, 10000);
    });
  }

  /**
   * 发送 JSON-RPC 通知
   */
  private sendNotification(method: string, params?: any): void {
    const message = {
      jsonrpc: '2.0',
      method,
      params: params || {},
    };

    this.sendMessage(message);
  }

  /**
   * 发送消息 (模拟)
   */
  private sendMessage(message: any): void {
    const content = JSON.stringify(message);
    const header = `Content-Length: ${Buffer.byteLength(content)}\r\n\r\n`;

    // 实际实现中，这里会写入到 stdin
    console.log('LSP Send:', header + content);
  }

  /**
   * 处理接收到的消息
   */
  private handleMessage(data: string): void {
    try {
      const message = JSON.parse(data);

      if (message.id !== undefined) {
        // 响应
        const pending = this.pendingRequests.get(message.id);
        if (pending) {
          this.pendingRequests.delete(message.id);
          if (message.error) {
            pending.reject(new Error(message.error.message));
          } else {
            pending.resolve(message.result);
          }
        }
      } else if (message.method) {
        // 通知
        this.emit('notification', message.method, message.params);
      }
    } catch (error) {
      this.emit('error', error);
    }
  }
}

export default LSPClient;
