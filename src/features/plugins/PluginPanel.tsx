import React, { useState, useEffect } from 'react';
import useSettingsStore from '../../stores/settingsStore';
import fileSystemService from '../../services/FileSystemService';
import styles from './PluginPanel.module.css';

interface PluginInfo {
  name: string;
  displayName: string;
  version: string;
  description: string;
  installed: boolean;
  enabled: boolean;
}

export const PluginPanel: React.FC = () => {
  const [plugins, setPlugins] = useState<PluginInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const { workspacePath } = useSettingsStore();

  useEffect(() => {
    loadPlugins();
  }, [workspacePath]);

  async function loadPlugins() {
    setIsLoading(true);
    try {
      // 模拟加载插件列表
      const mockPlugins: PluginInfo[] = [
        {
          name: 'avatarcode-python',
          displayName: 'Python Language Support',
          version: '1.0.0',
          description: 'Python 语言支持：语法高亮、智能补全',
          installed: true,
          enabled: true,
        },
        {
          name: 'avatarcode-react',
          displayName: 'React Snippets',
          version: '2.1.0',
          description: 'React 代码片段和模板',
          installed: false,
          enabled: false,
        },
      ];
      setPlugins(mockPlugins);
    } catch (error) {
      console.error('加载插件失败:', error);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleInstall(plugin: PluginInfo) {
    console.info('安装插件:', plugin.name);
    // TODO: 实现安装逻辑
    setPlugins(
      plugins.map((p) => (p.name === plugin.name ? { ...p, installed: true, enabled: true } : p))
    );
  }

  async function handleToggle(plugin: PluginInfo) {
    console.info('切换插件状态:', plugin.name);
    setPlugins(plugins.map((p) => (p.name === plugin.name ? { ...p, enabled: !p.enabled } : p)));
  }

  const filteredPlugins = plugins.filter((p) =>
    p.displayName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className={styles.pluginPanel}>
      <div className={styles.header}>
        <h2>插件市场</h2>
        <input
          type="text"
          placeholder="搜索插件..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className={styles.searchInput}
        />
      </div>

      <div className={styles.content}>
        {isLoading && <div className={styles.loading}>加载中...</div>}

        <div className={styles.pluginList}>
          {filteredPlugins.map((plugin) => (
            <div
              key={plugin.name}
              className={`${styles.pluginCard} ${!plugin.enabled ? styles.disabled : ''}`}
            >
              <div className={styles.pluginHeader}>
                <h3>{plugin.displayName}</h3>
                <span className={styles.version}>v{plugin.version}</span>
              </div>
              <p className={styles.description}>{plugin.description}</p>
              <div className={styles.actions}>
                {plugin.installed ? (
                  <button
                    className={`${styles.actionBtn} ${plugin.enabled ? styles.enabled : styles.disabled}`}
                    onClick={() => handleToggle(plugin)}
                  >
                    {plugin.enabled ? '已启用' : '已禁用'}
                  </button>
                ) : (
                  <button
                    className={`${styles.actionBtn} ${styles.install}`}
                    onClick={() => handleInstall(plugin)}
                  >
                    安装
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PluginPanel;
