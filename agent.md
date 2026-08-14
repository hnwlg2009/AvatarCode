# AvatarCode Agent Guide

## 项目概述
AvatarCode (分身Code) - AI原生代码编辑器，基于Electron+React+Monaco Editor

## 核心目录结构
```
src/                    # 渲染进程源码(React)
├── components/         # UI组件(editor/chat/settings/common)
├── features/           # 功能模块(terminal/git/plugins)
├── stores/             # Zustand状态管理
├── services/           # 服务层(LSP/FileSystem)
├── i18n/               # 国际化(en/zh)
└── types/              # TypeScript类型

electron/               # 主进程源码(Node.js)
├── main.ts             # 入口文件
├── ipc/                # IPC处理器
└── locales/            # 主进程语言资源

openspec/               # OpenSpec规格文档
├── specs/              # 功能规格
└── changes/            # 变更提案
```

## 关键配置文件
- `package.json` - 依赖和脚本
- `vite.config.ts` - Vite构建配置
- `electron-builder.yml` - 打包配置
- `tsconfig.json` - TypeScript配置

## 构建命令
```bash
npm run dev              # 开发模式
npm run build            # 构建渲染进程
npm run electron:dev     # Electron开发模式
npx electron-packager . AvatarCode --platform=win32 --arch=x64 --out=release
```

## 功能模块(Core Editor P0)
1. Monaco Editor集成
2. 文件系统服务
3. AI Chat面板
4. 终端集成
5. Git集成
6. 多语言支持(i18n)

## 当前状态
- v0.1.0 MVP版本
- 已实现:编辑器/文件管理/Chat/终端/Git/i18n/Logo/Agent Mode/Model Hub
- 所有模块任务已完成

## OpenSpec变更历史
- `add-i18n` - 多语言支持 (已完成)
- `add-logo-design` - Logo设计 (已完成)
- `add-agent-mode` - Agent模式 (已完成)

## 模块任务状态
- core-editor: 246/246 ✓
- ai-chat: 206/206 ✓
- model-hub: 172/172 ✓
- openspec-plugin: 164/164 ✓
- project-memory: 169/169 ✓
- agent-mode: 17/17 ✓
