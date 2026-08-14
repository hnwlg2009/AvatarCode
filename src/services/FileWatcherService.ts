import chokidar, { FSWatcher } from 'chokidar';
import { EventEmitter } from 'events';
import * as path from 'path';

export interface FileChangeEvent {
  type: 'add' | 'change' | 'unlink' | 'addDir' | 'unlinkDir';
  filePath: string;
  timestamp: number;
}

export interface FileWatcherConfig {
  ignorePatterns?: string[];
  persistent?: boolean;
  ignoreInitial?: boolean;
  awaitWriteFinish?: {
    stabilityThreshold: number;
    pollInterval: number;
  };
}

/**
 * 文件监听服务
 * 基于 chokidar 实现
 */
export class FileWatcherService extends EventEmitter {
  private watcher: FSWatcher | null = null;
  private config: FileWatcherConfig;
  private isWatching: boolean = false;

  constructor(config: FileWatcherConfig = {}) {
    super();
    this.config = {
      ignorePatterns: ['node_modules', '.git', 'dist', 'build'],
      persistent: true,
      ignoreInitial: true,
      awaitWriteFinish: {
        stabilityThreshold: 100,
        pollInterval: 100,
      },
      ...config,
    };
  }

  /**
   * 开始监听目录
   */
  async watch(dirPath: string): Promise<void> {
    if (this.isWatching) {
      console.log('File watcher is already running');
      return;
    }

    try {
      this.watcher = chokidar.watch(dirPath, {
        ignored: this.config.ignorePatterns?.map((p) => new RegExp(p)),
        persistent: this.config.persistent,
        ignoreInitial: this.config.ignoreInitial,
        awaitWriteFinish: this.config.awaitWriteFinish,
      });

      this.watcher
        .on('add', (filePath) => {
          this.emit('change', {
            type: 'add',
            filePath: path.resolve(filePath),
            timestamp: Date.now(),
          } as FileChangeEvent);
        })
        .on('change', (filePath) => {
          this.emit('change', {
            type: 'change',
            filePath: path.resolve(filePath),
            timestamp: Date.now(),
          } as FileChangeEvent);
        })
        .on('unlink', (filePath) => {
          this.emit('change', {
            type: 'unlink',
            filePath: path.resolve(filePath),
            timestamp: Date.now(),
          } as FileChangeEvent);
        })
        .on('addDir', (dirPath) => {
          this.emit('change', {
            type: 'addDir',
            filePath: path.resolve(dirPath),
            timestamp: Date.now(),
          } as FileChangeEvent);
        })
        .on('unlinkDir', (dirPath) => {
          this.emit('change', {
            type: 'unlinkDir',
            filePath: path.resolve(dirPath),
            timestamp: Date.now(),
          } as FileChangeEvent);
        })
        .on('error', (error) => {
          this.emit('error', error);
        });

      this.isWatching = true;
      this.emit('started');

      this.watcher.on('ready', () => {
        this.isWatching = true;
        console.log(`File watcher ready for: ${dirPath}`);
      });
    } catch (error) {
      this.emit('error', error);
      throw error;
    }
  }

  /**
   * 停止监听
   */
  async stop(): Promise<void> {
    if (!this.watcher || !this.isWatching) {
      return;
    }

    try {
      await this.watcher.close();
      this.watcher = null;
      this.isWatching = false;
      this.emit('stopped');
      console.log('File watcher stopped');
    } catch (error) {
      this.emit('error', error);
      throw error;
    }
  }

  /**
   * 添加监听路径
   */
  async addPath(filePath: string): Promise<void> {
    if (this.watcher) {
      this.watcher.add(filePath);
    }
  }

  /**
   * 移除监听路径
   */
  async unwatch(filePath: string): Promise<void> {
    if (this.watcher) {
      this.watcher.unwatch(filePath);
    }
  }

  /**
   * 获取监听的路径列表
   */
  getWatchedPaths(): string[] {
    return this.watcher?.getWatched() ? Object.keys(this.watcher.getWatched()) : [];
  }

  /**
   * 检查是否在监听
   */
  isRunning(): boolean {
    return this.isWatching;
  }
}

export default FileWatcherService;
