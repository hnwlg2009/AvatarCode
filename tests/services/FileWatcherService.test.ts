import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { FileWatcherService } from '../../src/services/FileWatcherService';
import chokidar from 'chokidar';

// Mock chokidar
vi.mock('chokidar', () => ({
  default: {
    watch: vi.fn(() => ({
      on: vi.fn().mockReturnThis(),
      close: vi.fn().mockResolvedValue(undefined),
      add: vi.fn(),
      unwatch: vi.fn(),
      getWatched: vi.fn().mockReturnValue({}),
    })),
  },
}));

describe('FileWatcherService', () => {
  let watcher: FileWatcherService;
  
  beforeEach(() => {
    watcher = new FileWatcherService();
    vi.clearAllMocks();
  });
  
  afterEach(async () => {
    await watcher.stop().catch(() => {});
  });
  
  describe('initialization', () => {
    it('should start with default config', async () => {
      const startedCallback = vi.fn();
      watcher.on('started', startedCallback);
      
      await watcher.watch('/test/path');
      
      expect(chokidar.watch).toHaveBeenCalledWith(
        '/test/path',
        expect.objectContaining({
          ignoreInitial: true,
          persistent: true,
        })
      );
      expect(startedCallback).toHaveBeenCalled();
      expect(watcher.isRunning()).toBe(true);
    });
    
    it('should use custom config', async () => {
      const customWatcher = new FileWatcherService({
        ignorePatterns: ['custom', 'patterns'],
        ignoreInitial: false,
        awaitWriteFinish: {
          stabilityThreshold: 200,
          pollInterval: 50,
        },
      });
      
      await customWatcher.watch('/test');
      
      expect(chokidar.watch).toHaveBeenCalledWith(
        '/test',
        expect.objectContaining({
          ignorePatterns: expect.arrayContaining([expect.any(RegExp)]),
          ignoreInitial: false,
        })
      );
    });
  });
  
  describe('file events', () => {
    beforeEach(async () => {
      await watcher.watch('/test/path');
    });
    
    it('should emit add event', () => {
      const changeCallback = vi.fn();
      watcher.on('change', changeCallback);
      
      // Simulate chokidar event
      (chokidar.watch as any).mock.results[0].value.on.mock.calls
        .find((call: any[]) => call[0] === 'add')[1]('/test/path/new.ts');
      
      expect(changeCallback).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'add',
          filePath: expect.stringContaining('new.ts'),
        })
      );
    });
    
    it('should emit change event', () => {
      const changeCallback = vi.fn();
      watcher.on('change', changeCallback);
      
      (chokidar.watch as any).mock.results[0].value.on.mock.calls
        .find((call: any[]) => call[0] === 'change')[1]('/test/path/file.ts');
      
      expect(changeCallback).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'change',
          filePath: expect.stringContaining('file.ts'),
        })
      );
    });
    
    it('should emit unlink event', () => {
      const changeCallback = vi.fn();
      watcher.on('change', changeCallback);
      
      (chokidar.watch as any).mock.results[0].value.on.mock.calls
        .find((call: any[]) => call[0] === 'unlink')[1]('/test/path/old.ts');
      
      expect(changeCallback).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'unlink',
          filePath: expect.stringContaining('old.ts'),
        })
      );
    });
    
    it('should emit error events', () => {
      const errorCallback = vi.fn();
      watcher.on('error', errorCallback);
      
      (chokidar.watch as any).mock.results[0].value.on.mock.calls
        .find((call: any[]) => call[0] === 'error')[1](new Error('Watch error'));
      
      expect(errorCallback).toHaveBeenCalledWith(new Error('Watch error'));
    });
  });
  
  describe('stop', () => {
    it('should stop watching', async () => {
      await watcher.watch('/test/path');
      
      const stoppedCallback = vi.fn();
      watcher.on('stopped', stoppedCallback);
      
      await watcher.stop();
      
      expect((chokidar.watch as any).mock.results[0].value.close).toHaveBeenCalled();
      expect(watcher.isRunning()).toBe(false);
      expect(stoppedCallback).toHaveBeenCalled();
    });
    
    it('should do nothing if already stopped', async () => {
      await watcher.watch('/test/path');
      await watcher.stop();
      
      const stoppedCallback = vi.fn();
      watcher.on('stopped', stoppedCallback);
      
      await watcher.stop();
      
      expect(stoppedCallback).not.toHaveBeenCalled();
    });
  });
  
  describe('path management', () => {
    beforeEach(async () => {
      await watcher.watch('/test/path');
    });
    
    it('should add watch path', async () => {
      await watcher.addPath('/new/path');
      
      expect((chokidar.watch as any).mock.results[0].value.add)
        .toHaveBeenCalledWith('/new/path');
    });
    
    it('should remove watch path', async () => {
      await watcher.unwatch('/test/path/sub');
      
      expect((chokidar.watch as any).mock.results[0].value.unwatch)
        .toHaveBeenCalledWith('/test/path/sub');
    });
    
    it('should get watched paths', () => {
      const paths = watcher.getWatchedPaths();
      expect(Array.isArray(paths)).toBe(true);
    });
  });
  
  describe('isRunning', () => {
    it('should return false initially', () => {
      expect(watcher.isRunning()).toBe(false);
    });
    
    it('should return true when watching', async () => {
      await watcher.watch('/test');
      expect(watcher.isRunning()).toBe(true);
    });
    
    it('should return false after stop', async () => {
      await watcher.watch('/test');
      await watcher.stop();
      expect(watcher.isRunning()).toBe(false);
    });
  });
});
