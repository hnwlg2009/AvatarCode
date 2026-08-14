import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { ProductionLSPClient } from '../../src/services/ProductionLSPClient';
import { spawn } from 'child_process';

// Mock child_process
const { mockSpawn, autoRespond } = vi.hoisted(() => {
  const state = { enabled: true, shutdownOnly: false };
  const respond = (id: number, dataCallbacks: Array<(buf: Buffer) => void>) => {
    setTimeout(() => {
      const body = JSON.stringify({ jsonrpc: '2.0', id, result: {} });
      const framed = `Content-Length: ${Buffer.byteLength(body)}\r\n\r\n${body}`;
      dataCallbacks.forEach((cb) => cb(Buffer.from(framed)));
    }, 10);
  };
  return {
    mockSpawn: vi.fn(() => {
      const dataCallbacks: Array<(buf: Buffer) => void> = [];
      return {
        stdout: {
          on: vi.fn((event: string, cb: (buf: Buffer) => void) => {
            if (event === 'data') {
              dataCallbacks.push(cb);
            }
          }),
        },
        stderr: {
          on: vi.fn(),
        },
        on: vi.fn((event: string, cb: (code: number) => void) => {
          // 仅注册回调，不主动触发 error，避免 start() 立即失败
          if (event === 'exit') {
            cb(0);
          }
        }),
        stdin: {
          write: vi.fn((data: Buffer | string) => {
            if (!state.enabled) return;
            const content = data.toString().split('\r\n\r\n')[1];
            if (!content) return;
            try {
              const req = JSON.parse(content);
              if (req.id !== undefined) {
                if (!state.shutdownOnly || req.method === 'shutdown') {
                  respond(req.id, dataCallbacks);
                }
              }
            } catch {
              // 非 JSON-RPC 请求，忽略
            }
          }),
        },
        kill: vi.fn(),
      };
    }),
    autoRespond: {
      set: (value: boolean) => {
        state.enabled = value;
      },
      setShutdownOnly: (value: boolean) => {
        state.shutdownOnly = value;
      },
    },
  };
});

function wrap(body: object): string {
  const json = JSON.stringify(body);
  return `Content-Length: ${Buffer.byteLength(json)}\r\n\r\n${json}`;
}

vi.mock('child_process', () => ({
  spawn: mockSpawn,
  default: { spawn: mockSpawn },
}));

describe('ProductionLSPClient', () => {
  let client: ProductionLSPClient;
  
  const mockConfig = {
    command: 'typescript-language-server',
    args: ['--stdio'],
    rootPath: '/test',
    languageId: 'typescript',
    fileExtensions: ['.ts', '.tsx'],
  };
  
  beforeEach(() => {
    client = new ProductionLSPClient();
    vi.clearAllMocks();
    autoRespond.set(true);
    autoRespond.setShutdownOnly(false);
  });
  
  afterEach(async () => {
    autoRespond.set(true);
    autoRespond.setShutdownOnly(false);
    await client.stop().catch(() => {});
  });
  
  describe('initialization', () => {
    it('should start with stdio', async () => {
      const startedCallback = vi.fn();
      client.on('started', startedCallback);
      
      await client.start(mockConfig);
      
      expect(spawn).toHaveBeenCalledWith(
        'typescript-language-server',
        ['--stdio'],
        expect.objectContaining({
          cwd: '/test',
        })
      );
      expect(startedCallback).toHaveBeenCalled();
      expect(client.isRunning).toBe(true);
    });
    
    it('should throw error if already running', async () => {
      await client.start(mockConfig);
      
      await expect(client.start(mockConfig))
        .rejects
        .toThrow('LSP client is already running');
    });
    
    it('should send initialize request', async () => {
      await client.start(mockConfig);
      
      // Verify initialize was sent
      expect(client['process']?.stdin?.write).toHaveBeenCalled();
    });
  });
  
  describe('stop', () => {
    it('should stop gracefully', async () => {
      await client.start(mockConfig);

      const stoppedCallback = vi.fn();
      client.on('stopped', stoppedCallback);

      const proc = client['process'];
      await client.stop();

      expect(proc?.kill).toHaveBeenCalled();
      expect(client.isRunning).toBe(false);
      expect(stoppedCallback).toHaveBeenCalled();
    });
    
    it('should clean up pending requests', async () => {
      await client.start(mockConfig);

      // 只对 shutdown 自动响应，completion 请求保持 pending
      autoRespond.setShutdownOnly(true);

      // Start a request but don't resolve it
      const completionPromise = client.getCompletion('file:///test.ts', { line: 0, character: 0 });

      // Stop client
      await client.stop();

      // Request should be rejected
      await expect(completionPromise).rejects.toThrow('LSP client stopped');
    });
  });
  
  describe('document management', () => {
    beforeEach(async () => {
      await client.start(mockConfig);
      vi.clearAllMocks();
    });
    
    it('should send didOpen notification', async () => {
      await client.openDocument('file:///test.ts', 'typescript', 1, 'const x = 1;');
      
      expect(client['process']?.stdin?.write).toHaveBeenCalledWith(
        expect.stringContaining('textDocument/didOpen')
      );
    });
    
    it('should send didClose notification', async () => {
      await client.closeDocument('file:///test.ts');
      
      expect(client['process']?.stdin?.write).toHaveBeenCalledWith(
        expect.stringContaining('textDocument/didClose')
      );
    });
    
    it('should send didChange notification', async () => {
      await client.updateDocument('file:///test.ts', 2, [
        {
          range: { start: { line: 0, character: 0 }, end: { line: 0, character: 1 } },
          text: 'new',
        },
      ]);
      
      expect(client['process']?.stdin?.write).toHaveBeenCalledWith(
        expect.stringContaining('textDocument/didChange')
      );
    });
  });
  
  describe('language features', () => {
    beforeEach(async () => {
      await client.start(mockConfig);
      vi.clearAllMocks();
    });
    
    it('should get completions', async () => {
      // Mock response
      const mockResponse = {
        jsonrpc: '2.0',
        id: 2,
        result: {
          items: [
            { label: 'console', kind: 9 },
            { label: 'const', kind: 14 },
          ],
        },
      };
      
      // Simulate response
      setTimeout(() => {
        client['handleData'](wrap(mockResponse));
      }, 10);
      
      const result = await client.getCompletion('file:///test.ts', { line: 0, character: 5 });
      
      expect(result).toHaveLength(2);
      expect(result[0].label).toBe('console');
    });
    
    it('should handle timeout', { timeout: 15000 }, async () => {
      // 关闭自动响应 - 请求应该超时（sendRequest 默认 10s 超时）
      autoRespond.set(false);
      await expect(
        client.getCompletion('file:///test.ts', { line: 0, character: 5 })
      ).rejects.toThrow('Request timeout');
    });
    
    it('should handle errors', async () => {
      const mockError = {
        jsonrpc: '2.0',
        id: 2,
        error: {
          code: -32600,
          message: 'Invalid Request',
        },
      };
      
      setTimeout(() => {
        client['handleData'](wrap(mockError));
      }, 10);
      
      await expect(
        client.getCompletion('file:///test.ts', { line: 0, character: 5 })
      ).rejects.toThrow('Invalid Request');
    });
  });
  
  describe('message handling', () => {
    it('should parse LSP messages correctly', () => {
      const mockMessage = {
        jsonrpc: '2.0',
        id: 1,
        result: { capabilities: {} },
      };
      
      const header = `Content-Length: ${Buffer.byteLength(JSON.stringify(mockMessage))}\r\n\r\n`;
      const data = header + JSON.stringify(mockMessage);
      
      client['handleData'](data);
      
      // Message should be processed
      expect(client['pendingRequests'].has(1)).toBe(false);
    });
    
it('should handle incomplete messages', () => {
      const mockMessage = {
        jsonrpc: '2.0',
        id: 1,
        result: {},
      };

      const header = `Content-Length: ${Buffer.byteLength(JSON.stringify(mockMessage))}\r\n\r\n`;
      const data = header + JSON.stringify(mockMessage);

      // Send partial data (header complete, body incomplete)
      client['handleData'](data.substring(0, header.length + 5));
      expect(client['contentLength']).toBeGreaterThan(0);

      // Send rest
      client['handleData'](data.substring(header.length + 5));
      expect(client['contentLength']).toBe(-1);
    });
    
    it('should emit notification events', () => {
      const notificationCallback = vi.fn();
      client.on('notification', notificationCallback);
      
      const mockNotification = {
        jsonrpc: '2.0',
        method: 'textDocument/publishDiagnostics',
        params: { uri: 'file:///test.ts', diagnostics: [] },
      };
      
      client['handleData'](wrap(mockNotification));
      
      expect(notificationCallback).toHaveBeenCalledWith(
        'textDocument/publishDiagnostics',
        mockNotification.params
      );
    });
  });
});
