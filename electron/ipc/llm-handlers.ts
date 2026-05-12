import { ipcMain, safeStorage, app } from 'electron';
import path from 'path';

interface APIKeys {
  openai?: string;
  anthropic?: string;
}

class APIKeyManager {
  private keys: APIKeys = {};
  private readonly storagePath: string;

  constructor() {
    this.storagePath = path.join(app.getPath('userData'), 'api-keys.json');
    this.loadKeys();
  }

  private async loadKeys() {
    try {
      const fs = await import('fs/promises');
      const exists = await fs
        .access(this.storagePath)
        .then(() => true)
        .catch(() => false);
      if (exists) {
        const content = await fs.readFile(this.storagePath, 'utf-8');
        this.keys = JSON.parse(content);
      }
    } catch (error) {
      console.error('加载 API Keys 失败:', error);
    }
  }

  private async saveKeys() {
    try {
      const fs = await import('fs/promises');
      await fs.writeFile(this.storagePath, JSON.stringify(this.keys, null, 2), 'utf-8');
    } catch (error) {
      console.error('保存 API Keys 失败:', error);
      throw error;
    }
  }

  async setKey(provider: string, key: string): Promise<void> {
    if (provider === 'openai') {
      this.keys.openai = key;
    } else if (provider === 'anthropic') {
      this.keys.anthropic = key;
    }
    await this.saveKeys();
  }

  getKey(provider: string): string | undefined {
    if (provider === 'openai') {
      return this.keys.openai;
    } else if (provider === 'anthropic') {
      return this.keys.anthropic;
    }
    return undefined;
  }

  hasKey(provider: string): boolean {
    return !!this.getKey(provider);
  }
}

const keyManager = new APIKeyManager();

export function setupLLMIpcHandlers(): void {
  // 设置 API Key
  ipcMain.handle('llm:setAPIKey', async (event, provider: string, key: string) => {
    await keyManager.setKey(provider, key);
    return { success: true };
  });

  // 检查 API Key 是否存在
  ipcMain.handle('llm:hasAPIKey', async (event, provider: string) => {
    return keyManager.hasKey(provider);
  });

  // 获取 API Key（仅用于内部验证，不返回给 renderer）
  ipcMain.handle('llm:validateAPIKey', async (event, provider: string) => {
    const key = keyManager.getKey(provider);
    if (!key) {
      throw new Error(`${provider} API Key 未配置`);
    }
    return { valid: true };
  });

  // 调用 LLM（使用主进程的 API Key）
  ipcMain.handle(
    'llm:generate',
    async (event, provider: string, messages: any[], options?: any) => {
      const apiKey = keyManager.getKey(provider);
      if (!apiKey) {
        throw new Error(`${provider} API Key 未配置`);
      }

      try {
        if (provider === 'openai') {
          const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${apiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              model: 'gpt-4',
              messages,
              ...options,
            }),
          });

          if (!response.ok) {
            const error: any = await response.json();
            throw new Error(`OpenAI API 错误：${error.error?.message || 'Unknown error'}`);
          }

          const data: any = await response.json();
          return {
            content: data.choices[0].message.content,
            usage: data.usage,
          };
        } else if (provider === 'anthropic') {
          const response = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
              'x-api-key': apiKey,
              'Content-Type': 'application/json',
              'anthropic-version': '2023-06-01',
            } as any,
            body: JSON.stringify({
              model: 'claude-3-sonnet-20240229',
              max_tokens: 2048,
              messages,
            }),
          });

          if (!response.ok) {
            const error: any = await response.json();
            throw new Error(`Anthropic API 错误：${error.error?.message || 'Unknown error'}`);
          }

          const data: any = await response.json();
          return {
            content: data.content[0].text,
            usage: data.usage,
          };
        } else {
          throw new Error(`不支持的 LLM 提供商：${provider}`);
        }
      } catch (error: any) {
        throw new Error(`LLM 请求失败：${error.message}`);
      }
    }
  );
}

export default keyManager;
