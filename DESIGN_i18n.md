# AvatarCode 多语言功能模块设计文档

**版本**: 1.0  
**状态**: 草案  
**日期**: 2026-05-18

---

## 1. 概述

### 1.1 背景
AvatarCode 项目已实现基础的多语言支持框架（i18next + react-i18next），但存在以下问题：
- Electron 主进程菜单硬编码英文字符串
- 多个 React 组件硬编码英文/中文字符串
- 翻译文件缺少部分 UI 文本的翻译 key
- 部分组件未正确使用 i18n 翻译函数

### 1.2 目标
- 实现完整的多语言支持（中英文）
- Electron 主进程与渲染进程语言同步
- 所有 UI 文本可翻译
- 语言切换即时生效
- 遵循 SDD（规范驱动开发）流程

---

## 2. 技术架构

### 2.1 现有架构
```
渲染进程 (React)
├── i18next 配置 (src/i18n/index.ts)
├── 翻译文件 (src/i18n/locales/{lang}.json)
└── 组件使用 useTranslation hook

主进程 (Electron)
└── menu.ts (硬编码英文)
```

### 2.2 目标架构
```
渲染进程 (React)
├── i18next 配置 (src/i18n/index.ts)
├── 翻译文件 (src/i18n/locales/{lang}.json)
├── 组件使用 useTranslation hook
└── IPC 通信：语言变更通知主进程

主进程 (Electron)
├── i18n 管理器 (electron/i18n.ts)
├── 菜单翻译文件 (electron/locales/{lang}.json)
└── IPC 通信：接收语言变更，更新菜单

语言切换流程：
用户选择语言 → 渲染进程更新 i18n → localStorage 存储 → 
IPC 通知主进程 → 主进程更新菜单语言
```

---

## 3. 实现方案

### 3.1 Electron 主进程多语言支持

#### 3.1.1 主进程 i18n 管理器
创建 `electron/i18n.ts`：
```typescript
import { app } from 'electron';
import * as fs from 'fs';
import * as path from 'path';

class ElectronI18n {
  private currentLang: string = 'en';
  private translations: Record<string, any> = {};

  constructor() {
    this.loadTranslations(this.currentLang);
  }

  loadTranslations(lang: string) {
    const localePath = path.join(__dirname, 'locales', `${lang}.json`);
    if (fs.existsSync(localePath)) {
      this.translations = JSON.parse(fs.readFileSync(localePath, 'utf-8'));
      this.currentLang = lang;
    }
  }

  t(key: string): string {
    const keys = key.split('.');
    let value: any = this.translations;
    for (const k of keys) {
      value = value?.[k];
    }
    return value || key;
  }

  getLanguage(): string {
    return this.currentLang;
  }
}

export const electronI18n = new ElectronI18n();
```

#### 3.1.2 菜单翻译文件
创建 `electron/locales/en.json` 和 `electron/locales/zh.json`：
```json
{
  "menu": {
    "file": "File",
    "edit": "Edit",
    "view": "View",
    "window": "Window",
    "help": "Help",
    "openFile": "Open File...",
    "save": "Save",
    "newFile": "New File",
    "toggleSidebar": "Toggle Sidebar",
    "documentation": "Documentation",
    "reportIssue": "Report Issue",
    "about": "About AvatarCode"
  }
}
```

#### 3.1.3 菜单动态更新
修改 `electron/menu.ts`，使用 i18n 管理器：
```typescript
import { electronI18n } from './i18n';

// 使用翻译函数
label: electronI18n.t('menu.file')
```

#### 3.1.4 IPC 通信
在 `electron/main.ts` 中添加 IPC 监听：
```typescript
import { ipcMain } from 'electron';

ipcMain.on('language-changed', (event, lang) => {
  electronI18n.loadTranslations(lang);
  createMenu(mainWindow); // 重建菜单
});
```

### 3.2 渲染进程多语言支持

#### 3.2.1 完善翻译文件
在 `src/i18n/locales/en.json` 和 `zh.json` 中添加缺失的翻译 key：
```json
{
  "mainLayout": {
    "explorer": "Explorer",
    "sourceControl": "Source Control",
    "search": "Search",
    "settings": "Settings",
    "comingSoon": "Coming soon..."
  },
  "fileTree": {
    "noFiles": "No files"
  },
  "terminal": {
    "welcome": "Welcome to AvatarCode Terminal!",
    "workingDirectory": "Working directory:",
    "name": "Terminal"
  },
  "apiSettings": {
    "titleOpenAI": "OpenAI API Key",
    "titleAnthropic": "Anthropic API Key",
    "hintOpenAI": "Get your API Key from OpenAI platform",
    "hintAnthropic": "Get your API Key from Anthropic console",
    "saved": "API Keys saved successfully",
    "saveFailed": "Save failed: ",
    "saveBtn": "Save API Keys",
    "saving": "Saving..."
  }
}
```

#### 3.2.2 组件 i18n 改造
需要改造的组件列表：
1. `EditorSettings.tsx` - 使用已有的翻译 key
2. `GitSettings.tsx` - 使用已有的翻译 key
3. `AppearanceSettings.tsx` - 使用已有的翻译 key
4. `MainLayout.tsx` - 添加 useTranslation，使用新翻译 key
5. `APISettings.tsx` - 添加 useTranslation，使用新翻译 key
6. `FileTree.tsx` - 添加 useTranslation，使用新翻译 key
7. `TerminalPanel.tsx` - 添加 useTranslation，使用新翻译 key
8. `TabBar.tsx` - 添加 useTranslation，使用已有的 common.close
9. `Workspace.tsx` - 添加新翻译 key
10. `ChatPanel.tsx` - 使用已有的 chat.aiRole

#### 3.2.3 语言切换 IPC 通知
在 `GeneralSettings.tsx` 的 `handleLanguageChange` 函数中添加 IPC 通知：
```typescript
const handleLanguageChange = (lang: string) => {
  i18n.changeLanguage(lang);
  localStorage.setItem('avatarcode-language', lang);
  
  // 通知主进程更新菜单语言
  if (window.electronAPI) {
    window.electronAPI.send('language-changed', lang);
  }
};
```

### 3.3 语言同步机制

#### 3.3.1 启动时同步
应用启动时，渲染进程从 localStorage 读取语言设置，并通知主进程：
```typescript
// src/i18n/index.ts
const savedLanguage = localStorage.getItem('avatarcode-language') || 'en';

// 初始化后通知主进程
if (window.electronAPI) {
  window.electronAPI.send('language-changed', savedLanguage);
}
```

#### 3.3.2 运行时同步
用户切换语言时，立即通知主进程更新菜单。

---

## 4. 文件结构

```
src/
├── i18n/
│   ├── index.ts              # i18n 配置
│   └── locales/
│       ├── en.json           # 英文翻译
│       └── zh.json           # 中文翻译
└── components/
    └── settings/
        └── GeneralSettings.tsx  # 语言切换组件

electron/
├── i18n.ts                   # 主进程 i18n 管理器
├── menu.ts                   # 菜单（使用 i18n）
├── main.ts                   # 主进程（IPC 监听）
└── locales/
    ├── en.json               # 菜单英文翻译
    └── zh.json               # 菜单中文翻译
```

---

## 5. 开发流程

### 5.1 阶段一：SPEC 编写
- [x] 分析现有问题
- [ ] 编写多语言功能规格说明

### 5.2 阶段二：设计文档
- [x] 编写设计文档（本文档）

### 5.3 阶段三：实现
- [ ] 创建 Electron i18n 管理器
- [ ] 创建菜单翻译文件
- [ ] 修改菜单使用翻译
- [ ] 添加 IPC 通信
- [ ] 完善渲染进程翻译文件
- [ ] 改造硬编码组件
- [ ] 测试语言切换功能

### 5.4 阶段四：验证
- [ ] 测试中英文切换
- [ ] 测试菜单语言更新
- [ ] 测试组件语言更新
- [ ] 测试语言持久化

---

## 6. 注意事项

1. **字体支持**：确保中文字体正确显示
2. **性能**：语言切换应即时生效，无需重启应用
3. **回退机制**：如果翻译 key 不存在，回退到英文
4. **编码**：JSON 文件使用 UTF-8 编码
5. **测试**：添加多语言相关的单元测试

---

## 7. 参考资料

- [i18next 官方文档](https://www.i18next.com/)
- [react-i18next 官方文档](https://react.i18next.com/)
- [Electron IPC 文档](https://www.electronjs.org/docs/latest/api/ipc-main)
