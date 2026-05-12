import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { ProductionLSPClient } from '../../src/services/ProductionLSPClient';
import { spawn } from 'child_process';

// Mock child_process
vi.mock('child_process', () => ({
  spawn: vi.fn(() => ({
    stdout: {
      on: vi.fn((event, cb) => {
        if (event === 'data') {
          // 模拟 initialize 响应
          setTimeout(() => {
            cb(Buffer.from(JSON.stringify({
              jsonrpc: '2.0',
              id: 1,
              result: { capabilities: {} },
            })));
          }, 10);
        }
      }),
    },
    stderr: {
      on: vi.fn(),
    },
    on: vi.fn((event, cb) => {
      if (event === 'exit') {
        cb(0);
      }
      if (event === 'error') {
        cb(new Error('Mock error'));
      }
    }),
    stdin: {
      write: vi.fn(),
    },
    kill: vi.fn(),
  })),
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
  });
  
  afterEach(async () => {
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
      
      await client.stop();
      
      expect(client['process']?.kill).toHaveBeenCalled();
      expect(client.isRunning).toBe(false);
      expect(stoppedCallback).toHaveBeenCalled();
    });
    
    it('should clean up pending requests', async () => {
      await client.start(mockConfig);
      
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
        client['handleData'](JSON.stringify(mockResponse));
      }, 10);
      
      const result = await client.getCompletion('file:///test.ts', { line: 0, character: 5 });
      
      expect(result).toHaveLength(2);
      expect(result[0].label).toBe('console');
    });
    
    it('should handle timeout', async () => {
      // Don't mock response - should timeout
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
        client['handleData'](JSON.stringify(mockError));
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
      
      // Send partial data
      client['handleData'](data.substring(0, 10));
      expect(client['contentLength']).toBeGreaterThan(0);
      
      // Send rest
      client['handleData'](data.substring(10));
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
      
      client['handleData'](JSON.stringify(mockNotification));
      
      expect(notificationCallback).toHaveBeenCalledWith(
        'textDocument/publishDiagnostics',
        mockNotification.params
      );
    });
  });
});
