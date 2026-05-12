"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupLLMIpcHandlers = setupLLMIpcHandlers;
const electron_1 = require("electron");
const path_1 = __importDefault(require("path"));
class APIKeyManager {
    constructor() {
        this.keys = {};
        this.storagePath = path_1.default.join(electron_1.app.getPath('userData'), 'api-keys.json');
        this.loadKeys();
    }
    async loadKeys() {
        try {
            const fs = await Promise.resolve().then(() => __importStar(require('fs/promises')));
            const exists = await fs
                .access(this.storagePath)
                .then(() => true)
                .catch(() => false);
            if (exists) {
                const content = await fs.readFile(this.storagePath, 'utf-8');
                this.keys = JSON.parse(content);
            }
        }
        catch (error) {
            console.error('加载 API Keys 失败:', error);
        }
    }
    async saveKeys() {
        try {
            const fs = await Promise.resolve().then(() => __importStar(require('fs/promises')));
            await fs.writeFile(this.storagePath, JSON.stringify(this.keys, null, 2), 'utf-8');
        }
        catch (error) {
            console.error('保存 API Keys 失败:', error);
            throw error;
        }
    }
    async setKey(provider, key) {
        if (provider === 'openai') {
            this.keys.openai = key;
        }
        else if (provider === 'anthropic') {
            this.keys.anthropic = key;
        }
        await this.saveKeys();
    }
    getKey(provider) {
        if (provider === 'openai') {
            return this.keys.openai;
        }
        else if (provider === 'anthropic') {
            return this.keys.anthropic;
        }
        return undefined;
    }
    hasKey(provider) {
        return !!this.getKey(provider);
    }
}
const keyManager = new APIKeyManager();
function setupLLMIpcHandlers() {
    // 设置 API Key
    electron_1.ipcMain.handle('llm:setAPIKey', async (event, provider, key) => {
        await keyManager.setKey(provider, key);
        return { success: true };
    });
    // 检查 API Key 是否存在
    electron_1.ipcMain.handle('llm:hasAPIKey', async (event, provider) => {
        return keyManager.hasKey(provider);
    });
    // 获取 API Key（仅用于内部验证，不返回给 renderer）
    electron_1.ipcMain.handle('llm:validateAPIKey', async (event, provider) => {
        const key = keyManager.getKey(provider);
        if (!key) {
            throw new Error(`${provider} API Key 未配置`);
        }
        return { valid: true };
    });
    // 调用 LLM（使用主进程的 API Key）
    electron_1.ipcMain.handle('llm:generate', async (event, provider, messages, options) => {
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
                    const error = await response.json();
                    throw new Error(`OpenAI API 错误：${error.error?.message || 'Unknown error'}`);
                }
                const data = await response.json();
                return {
                    content: data.choices[0].message.content,
                    usage: data.usage,
                };
            }
            else if (provider === 'anthropic') {
                const response = await fetch('https://api.anthropic.com/v1/messages', {
                    method: 'POST',
                    headers: {
                        'x-api-key': apiKey,
                        'Content-Type': 'application/json',
                        'anthropic-version': '2023-06-01',
                    },
                    body: JSON.stringify({
                        model: 'claude-3-sonnet-20240229',
                        max_tokens: 2048,
                        messages,
                    }),
                });
                if (!response.ok) {
                    const error = await response.json();
                    throw new Error(`Anthropic API 错误：${error.error?.message || 'Unknown error'}`);
                }
                const data = await response.json();
                return {
                    content: data.content[0].text,
                    usage: data.usage,
                };
            }
            else {
                throw new Error(`不支持的 LLM 提供商：${provider}`);
            }
        }
        catch (error) {
            throw new Error(`LLM 请求失败：${error.message}`);
        }
    });
}
exports.default = keyManager;
