/**
 * 插件注册表
 * 管理插件的安装、激活、停用、卸载
 */

import { PluginManifest, PluginInstance, PluginState } from './types';

export class PluginRegistry {
  private plugins: Map<string, PluginInstance> = new Map();
  private readonly pluginsDir: string;

  constructor(pluginsDir: string) {
    this.pluginsDir = pluginsDir;
  }

  /**
   * 安装插件
   */
  async install(pluginPath: string): Promise<PluginManifest> {
    try {
      const manifest = await this.loadManifest(pluginPath);
      this.validateManifest(manifest);

      const instance: PluginInstance = {
        manifest,
        path: pluginPath,
        state: PluginState.INSTALLED,
        exports: null,
      };

      this.plugins.set(manifest.name, instance);
      return manifest;
    } catch (error: any) {
      throw new Error(`安装插件失败：${error.message}`);
    }
  }

  /**
   * 激活插件
   */
  async activate(pluginId: string): Promise<void> {
    const instance = this.plugins.get(pluginId);
    if (!instance) {
      throw new Error(`插件不存在：${pluginId}`);
    }

    if (instance.state === PluginState.ACTIVATED) {
      return; // 已经激活
    }

    try {
      // 加载插件代码
      const module = await import(instance.path);
      instance.exports = module;

      // 调用 activate 函数
      if (module.activate) {
        await module.activate();
      }

      instance.state = PluginState.ACTIVATED;
      console.info(`插件已激活：${pluginId}`);
    } catch (error: any) {
      instance.state = PluginState.ERROR;
      throw new Error(`激活插件失败：${error.message}`);
    }
  }

  /**
   * 停用插件
   */
  async deactivate(pluginId: string): Promise<void> {
    const instance = this.plugins.get(pluginId);
    if (!instance) {
      throw new Error(`插件不存在：${pluginId}`);
    }

    if (instance.state === PluginState.INSTALLED) {
      return; // 未激活
    }

    try {
      // 调用 deactivate 函数
      if (instance.exports?.deactivate) {
        await instance.exports.deactivate();
      }

      instance.state = PluginState.INSTALLED;
      console.info(`插件已停用：${pluginId}`);
    } catch (error: any) {
      throw new Error(`停用插件失败：${error.message}`);
    }
  }

  /**
   * 卸载插件
   */
  async uninstall(pluginId: string): Promise<void> {
    const instance = this.plugins.get(pluginId);
    if (!instance) {
      throw new Error(`插件不存在：${pluginId}`);
    }

    if (instance.state === PluginState.ACTIVATED) {
      await this.deactivate(pluginId);
    }

    this.plugins.delete(pluginId);
    console.info(`插件已卸载：${pluginId}`);
  }

  /**
   * 加载插件清单
   */
  private async loadManifest(pluginPath: string): Promise<PluginManifest> {
    const manifestPath = `${pluginPath}/package.json`;
    const module = await import(manifestPath);
    return module as PluginManifest;
  }

  /**
   * 验证插件清单
   */
  private validateManifest(manifest: PluginManifest): void {
    if (!manifest.name) {
      throw new Error('插件缺少 name 字段');
    }
    if (!manifest.version) {
      throw new Error('插件缺少 version 字段');
    }
    if (!manifest.main) {
      throw new Error('插件缺少 main 字段');
    }
  }

  /**
   * 获取已安装的插件
   */
  getPlugins(): PluginInstance[] {
    return Array.from(this.plugins.values());
  }

  /**
   * 获取插件
   */
  getPlugin(pluginId: string): PluginInstance | undefined {
    return this.plugins.get(pluginId);
  }
}

export default PluginRegistry;
