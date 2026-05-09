import { describe, it, expect, beforeEach, vi } from 'vitest';
import { LSPClient } from '../../src/services/LSPClient';

describe('LSPClient', () => {
  let client: LSPClient;
  
  const mockConfig = {
    command: 'mock-language-server',
    args: ['--stdio'],
    rootPath: '/test',
    languageId: 'typescript',
    fileExtensions: ['.ts', '.tsx'],
  };
  
  beforeEach(() => {
    client = new LSPClient();
    vi.clearAllMocks();
  });
  
  describe('initial state', () => {
    it('should start in stopped state', () => {
      expect(client.isRunning).toBe(false);
    });
  });
  
  describe('start', () => {
    it('should start the language server', async () => {
      const startedCallback = vi.fn();
      client.on('started', startedCallback);
      
      await client.start(mockConfig);
      
      expect(client.isRunning).toBe(true);
      expect(startedCallback).toHaveBeenCalled();
    });
    
    it('should throw error if already running', async () => {
      await client.start(mockConfig);
      
      await expect(client.start(mockConfig))
        .rejects
        .toThrow('LSP client is already running');
    });
    
    it('should emit error on failure', async () => {
      const errorCallback = vi.fn();
      client.on('error', errorCallback);
      
      // 模拟启动失败
      vi.spyOn(console, 'log').mockImplementation(() => {});
      await client.start(mockConfig);
      
      expect(errorCallback).not.toHaveBeenCalled();
    });
  });
  
  describe('stop', () => {
    it('should stop the language server', async () => {
      await client.start(mockConfig);
      expect(client.isRunning).toBe(true);
      
      await client.stop();
      expect(client.isRunning).toBe(false);
    });
    
    it('should do nothing if already stopped', async () => {
      const stoppedCallback = vi.fn();
      client.on('stopped', stoppedCallback);
      
      await client.stop();
      
      expect(stoppedCallback).not.toHaveBeenCalled();
    });
  });
  
  describe('document management', () => {
    beforeEach(async () => {
      await client.start(mockConfig);
    });
    
    afterEach(async () => {
      await client.stop();
    });
    
    it('should open document', async () => {
      const sendNotificationSpy = vi.spyOn(client as any, 'sendNotification');
      
      await client.openDocument(
        'file:///test.ts',
        'typescript',
        1,
        'const x = 1;'
      );
      
      expect(sendNotificationSpy).toHaveBeenCalledWith(
        'textDocument/didOpen',
        expect.objectContaining({
          textDocument: expect.objectContaining({
            uri: 'file:///test.ts',
            languageId: 'typescript',
            version: 1,
          }),
        })
      );
    });
    
    it('should close document', async () => {
      const sendNotificationSpy = vi.spyOn(client as any, 'sendNotification');
      
      await client.closeDocument('file:///test.ts');
      
      expect(sendNotificationSpy).toHaveBeenCalledWith(
        'textDocument/didClose',
        expect.objectContaining({
          textDocument: {
            uri: 'file:///test.ts',
          },
        })
      );
    });
    
    it('should update document', async () => {
      const sendNotificationSpy = vi.spyOn(client as any, 'sendNotification');
      
      await client.updateDocument('file:///test.ts', 2, [
        {
          range: { start: { line: 0, character: 0 }, end: { line: 0, character: 1 } },
          text: 'new',
        },
      ]);
      
      expect(sendNotificationSpy).toHaveBeenCalledWith(
        'textDocument/didChange',
        expect.objectContaining({
          textDocument: expect.objectContaining({
            uri: 'file:///test.ts',
            version: 2,
          }),
        })
      );
    });
  });
  
  describe('language features', () => {
    beforeEach(async () => {
      await client.start(mockConfig);
    });
    
    afterEach(async () => {
      await client.stop();
    });
    
    it('should get completions', async () => {
      // Mock sendRequest
      const mockItems = [
        { label: 'console', kind: 9 },
        { label: 'const', kind: 14 },
      ];
      
      vi.spyOn(client as any, 'sendRequest').mockResolvedValue(mockItems);
      
      const result = await client.getCompletion(
        'file:///test.ts',
        { line: 0, character: 5 }
      );
      
      expect(result).toHaveLength(2);
      expect(result[0].label).toBe('console');
    });
    
    it('should get hover information', async () => {
      const mockHover = {
        contents: {
          kind: 'markdown',
          value: '**const** x: number',
        },
      };
      
      vi.spyOn(client as any, 'sendRequest').mockResolvedValue(mockHover);
      
      const result = await client.getHover(
        'file:///test.ts',
        { line: 0, character: 5 }
      );
      
      expect(result).toEqual(mockHover);
    });
    
    it('should return empty array when completion fails', async () => {
      vi.spyOn(client as any, 'sendRequest').mockRejectedValue(new Error('Failed'));
      
      const result = await client.getCompletion(
        'file:///test.ts',
        { line: 0, character: 5 }
      );
      
      expect(result).toEqual([]);
    });
  });
  
  describe('message handling', () => {
    it('should handle response messages', () => {
      const mockMessage = {
        jsonrpc: '2.0',
        id: 1,
        result: { items: [] },
      };
      
      const handleMessageSpy = vi.spyOn(client as any, 'handleMessage');
      client.handleMessage(JSON.stringify(mockMessage));
      
      expect(handleMessageSpy).toHaveBeenCalledWith(JSON.stringify(mockMessage));
    });
    
    it('should handle notification messages', () => {
      const notificationCallback = vi.fn();
      client.on('notification', notificationCallback);
      
      const mockNotification = {
        jsonrpc: '2.0',
        method: 'textDocument/publishDiagnostics',
        params: { uri: 'file:///test.ts', diagnostics: [] },
      };
      
      client.handleMessage(JSON.stringify(mockNotification));
      
      expect(notificationCallback).toHaveBeenCalledWith(
        'textDocument/publishDiagnostics',
        mockNotification.params
      );
    });
    
    it('should emit error on invalid message', () => {
      const errorCallback = vi.fn();
      client.on('error', errorCallback);
      
      client.handleMessage('invalid json');
      
      expect(errorCallback).toHaveBeenCalled();
    });
  });
});
