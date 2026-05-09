import { ChildProcess, spawn } from 'child_process';
import { EventEmitter } from 'events';
import * as net from 'net';
import * as path from 'path';
import { LSPConfig, CompletionItem, Diagnostic, Hover, Position } from '../types/lsp.types';

/**
 * 生产级 LSP 客户端
 * 支持：stdio + socket 连接方式
 */
export class ProductionLSPClient extends EventEmitter {
  private config: LSPConfig | null = null;
  private isRunning: boolean = false;
  private messageId: number = 0;
  private pendingRequests: Map<
    number,
    {
      resolve: (data: any) => void;
      reject: (error: Error) => void;
      timeoutId?: NodeJS.Timeout;
    }
  > = new Map();

  private process: ChildProcess | null = null;
  private socket: net.Socket | null = null;
  private buffer: string = '';
  private contentLength: number = -1;

  constructor() {
    super();
  }

  /**
   * 启动语言服务器 (stdio 方式)
   */
  async start(config: LSPConfig): Promise<void> {
    if (this.isRunning) {
      throw new Error('LSP client is already running');
    }

    this.config = config;

    try {
      // 启动语言服务器进程
      this.process = spawn(config.command, config.args, {
        cwd: config.rootPath,
        env: { ...process.env },
        stdio: ['pipe', 'pipe', 'pipe'],
      });

      this.process.stdout?.on('data', (data: Buffer) => {
        this.handleData(data.toString());
      });

      this.process.stderr?.on('data', (data: Buffer) => {
        console.error('LSP Server Error:', data.toString());
      });

      this.process.on('exit', (code) => {
        console.log(`LSP Server exited with code ${code}`);
        this.isRunning = false;
        this.emit('stopped');
      });

      this.process.on('error', (error) => {
        console.error('LSP Server Error:', error);
        this.emit('error', error);
      });

      this.isRunning = true;

      // 发送 initialize 请求
      await this.sendRequest('initialize', {
        processId: process.pid,
        clientInfo: {
          name: 'AvatarCode',
          version: '0.1.0',
        },
        rootUri: `file://${config.rootPath}`,
        capabilities: {
          textDocument: {
            synchronization: {
              dynamicRegistration: false,
              willSave: false,
              willSaveWaitUntil: false,
              didSave: true,
            },
            completion: {
              dynamicRegistration: false,
              completionItem: {
                snippetSupport: true,
                commitCharactersSupport: true,
              },
            },
            hover: {
              dynamicRegistration: false,
              contentFormat: ['markdown', 'plaintext'],
            },
            definition: {
              dynamicRegistration: false,
            },
            publishDiagnostics: {
              relatedInformation: true,
            },
          },
        },
      });

      // 发送 initialized 通知
      this.sendNotification('initialized', {});

      this.emit('started');
      console.log(`LSP client started: ${config.command}`);
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
      // 优雅关闭
      await this.sendRequest('shutdown', {});
      this.sendNotification('exit');

      // 清理进程
      if (this.process) {
        this.process.kill();
        this.process = null;
      }

      // 清理 socket
      if (this.socket) {
        this.socket.destroy();
        this.socket = null;
      }

      this.isRunning = false;

      // 清理 pending 请求
      for (const [id, pending] of this.pendingRequests.entries()) {
        if (pending.timeoutId) {
          clearTimeout(pending.timeoutId);
        }
        pending.reject(new Error('LSP client stopped'));
      }
      this.pendingRequests.clear();

      this.buffer = '';
      this.contentLength = -1;

      this.emit('stopped');
      console.log('LSP client stopped');
    } catch (error) {
      this.emit('error', error);
      throw error;
    }
  }

  /**
   * 处理接收到的数据
   */
  private handleData(data: string): void {
    this.buffer += data;

    while (this.buffer.length > 0) {
      if (this.contentLength === -1) {
        // 读取 Content-Length 头
        const headerEnd = this.buffer.indexOf('\r\n\r\n');
        if (headerEnd === -1) {
          return;
        }

        const header = this.buffer.substring(0, headerEnd);
        const match = header.match(/Content-Length: (\d+)/);
        if (!match) {
          console.error('Invalid LSP header:', header);
          this.buffer = this.buffer.substring(headerEnd + 4);
          continue;
        }

        this.contentLength = parseInt(match[1], 10);
        this.buffer = this.buffer.substring(headerEnd + 4);
      }

      if (this.buffer.length < this.contentLength) {
        return; // 等待更多数据
      }

      const content = this.buffer.substring(0, this.contentLength);
      this.buffer = this.buffer.substring(this.contentLength);
      this.contentLength = -1;

      this.handleMessage(content);
    }
  }

  /**
   * 处理 JSON-RPC 消息
   */
  private handleMessage(data: string): void {
    try {
      const message = JSON.parse(data);

      if (message.id !== undefined) {
        // 响应
        const pending = this.pendingRequests.get(message.id);
        if (pending) {
          this.pendingRequests.delete(message.id);
          if (pending.timeoutId) {
            clearTimeout(pending.timeoutId);
          }

          if (message.error) {
            pending.reject(new Error(message.error.message));
          } else {
            pending.resolve(message.result);
          }
        }
      } else if (message.method) {
        // 通知 (如 diagnostics)
        this.emit('notification', message.method, message.params);
      }
    } catch (error) {
      this.emit('error', error);
    }
  }

  /**
   * 发送 JSON-RPC 请求
   */
  private async sendRequest(method: string, params: any): Promise<any> {
    const id = ++this.messageId;

    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        this.pendingRequests.delete(id);
        reject(new Error(`Request timeout: ${method}`));
      }, 10000);

      this.pendingRequests.set(id, { resolve, reject, timeoutId });

      const message = {
        jsonrpc: '2.0',
        id,
        method,
        params,
      };

      this.sendMessage(message);
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
   * 发送消息
   */
  private sendMessage(message: any): void {
    const content = JSON.stringify(message);
    const header = `Content-Length: ${Buffer.byteLength(content)}\r\n\r\n`;
    const data = header + content;

    if (this.process?.stdin) {
      this.process.stdin.write(data);
    } else if (this.socket) {
      this.socket.write(data);
    } else {
      console.error('No LSP connection available');
    }
  }

  // 继承基础方法 (openDocument, closeDocument, 等)
  async openDocument(
    uri: string,
    languageId: string,
    version: number,
    text: string
  ): Promise<void> {
    this.sendNotification('textDocument/didOpen', {
      textDocument: { uri, languageId, version, text },
    });
  }

  async closeDocument(uri: string): Promise<void> {
    this.sendNotification('textDocument/didClose', { textDocument: { uri } });
  }

  async updateDocument(
    uri: string,
    version: number,
    changes: Array<{ range: any; text: string }>
  ): Promise<void> {
    this.sendNotification('textDocument/didChange', {
      textDocument: { uri, version },
      contentChanges: changes,
    });
  }

  async getCompletion(uri: string, position: Position): Promise<CompletionItem[]> {
    const result = await this.sendRequest('textDocument/completion', {
      textDocument: { uri },
      position,
    });
    return result ? (Array.isArray(result) ? result : result.items || []) : [];
  }

  async getHover(uri: string, position: Position): Promise<Hover | null> {
    return await this.sendRequest('textDocument/hover', {
      textDocument: { uri },
      position,
    });
  }

  async getDefinition(uri: string, position: Position): Promise<any> {
    return await this.sendRequest('textDocument/definition', {
      textDocument: { uri },
      position,
    });
  }
}

export default ProductionLSPClient;
