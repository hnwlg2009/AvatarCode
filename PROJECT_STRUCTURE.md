# AvatarCode 项目结构指南

## 一、源码目录

### 1. 渲染进程 (src/)
```
src/
├── components/           # UI组件
│   ├── editor/           # 编辑器组件
│   ├── chat/             # AI聊天组件
│   ├── settings/         # 设置面板组件
│   ├── common/           # 通用组件(FileTree/Workspace/TabBar)
│   ├── agent/            # Agent面板组件
│   └── layout/           # 布局组件
├── features/             # 功能模块
│   ├── terminal/         # 终端功能
│   ├── git/              # Git集成功能
│   └── plugins/          # 插件功能
├── stores/               # Zustand状态管理
│   ├── editorStore.ts    # 编辑器状态
│   ├── chatStore.ts      # 聊天状态
│   ├── settingsStore.ts  # 设置状态
│   ├── tabManagerStore.ts# Tab管理状态
│   ├── terminalStore.ts  # 终端状态
│   └── lspStore.ts       # LSP状态
├── services/             # 服务层
│   ├── LSPClient.ts      # LSP客户端
│   ├── ProductionLSPClient.ts
│   └── FileSystemService.ts
├── i18n/                 # 国际化
│   ├── index.ts          # i18n配置
│   └── locales/          # 语言资源(en/zh)
├── hooks/                # 自定义Hooks
├── types/                # TypeScript类型定义
├── config/               # 配置文件
└── styles/               # 全局样式
```

### 2. 主进程 (electron/)
```
electron/
├── main.ts               # 主进程入口
├── preload.ts            # 预加载脚本
├── menu.ts               # 菜单配置
├── i18n.ts               # 主进程国际化
├── ipc/                  # IPC处理器
│   ├── file-handlers.ts  # 文件操作处理
│   ├── terminal-handlers.ts
│   ├── git-handlers.ts   # Git操作处理
│   └── llm-handlers.ts   # LLM接口处理
├── locales/              # 主进程语言资源
└── dist/                 # 编译输出
```

## 二、配置文件

### 核心配置
- `package.json` - 项目依赖和脚本
- `tsconfig.json` - TypeScript配置
- `vite.config.ts` - Vite构建配置
- `electron-builder.yml` - Electron打包配置

### 开发工具配置
- `.eslintrc.cjs` - ESLint代码规范
- `.prettierrc` - Prettier格式化
- `.editorconfig` - 编辑器配置
- `vitest.*.config.ts` - 测试配置(多个)

## 三、文档目录

### 项目文档 (根目录)
- `README.md` - 项目说明
- `agent.md` - Agent快速指南
- `PROJECT_STRUCTURE.md` - 本文档

### 规格文档 (.monkeycode/specs/)
```
.specs/
├── core-editor/          # 核心编辑器规格
├── ai-chat/              # AI聊天规格
├── terminal/             # 终端规格
├── file-system/          # 文件系统规格
├── settings-config/      # 设置配置规格
├── agent-mode/           # Agent模式规格
├── model-hub/            # 模型中心规格
├── skills-hub/           # 技能中心规格
├── mcp-hub/              # MCP中心规格
├── plugin-system/        # 插件系统规格
└── ... (20+模块)
```

### OpenSpec文档 (openspec/)
```
openspec/
├── specs/                # 功能规格
└── changes/              # 变更提案
    ├── add-i18n/         # i18n变更(已完成)
    └── archive/          # 归档变更
```

### 设计文档
- `SPEC.md` - 总体规格说明
- `DESIGN_i18n.md` - i18n设计文档
- `SPEC_i18n.md` - i18n规格文档
- `ROADMAP_V0.3.0.md` - v0.3.0路线图

### 部署文档
- `DEPLOYMENT_GUIDE.md` - 部署指南
- `ENVIRONMENT_SETUP.md` - 环境设置
- `RELEASE_NOTES.md` - 发布说明

## 四、构建输出

### 开发构建
- `dist/` - 渲染进程构建输出
- `electron/dist/` - 主进程编译输出

### 打包输出
- `release/` - Electron打包输出
  - `AvatarCode-win32-x64/` - Windows版本
  - `AvatarCode-0.1.0-win/` - 旧版本

### 测试
- `tests/` - 测试文件
  - `components/` - 组件测试
  - `stores/` - 状态测试
  - `services/` - 服务测试
  - `i18n/` - i18n测试

## 五、脚本目录

### 构建脚本
- `build-windows.ps1` - Windows构建脚本
- `build-windows-reliable.ps1` - 可靠构建脚本
- `simple-build.ps1` - 简单构建脚本
- `build-fix.ps1` - 构建修复脚本
- `setup.sh` - 环境设置脚本

### 工具脚本 (scripts/)
- `update-task-progress.sh` - 更新任务进度

## 六、智能体配置

### .trae/
- `skills/` - AI技能配置
  - `openspec-propose/` - 提案技能
  - `openspec-apply/` - 应用技能
  - `openspec-archive/` - 归档技能

### .monkeycode/
- `specs/` - 功能规格文档
- `rules/` - 开发规则
- `docs/` - 补充文档
- `MEMORY.md` - Agent记忆
- `module-overview.md` - 模块概览

## 七、快速参考

### 开发命令
```bash
npm run dev              # 启动开发服务器
npm run build            # 构建渲染进程
npm run electron:dev     # Electron开发模式
npm test                 # 运行测试
npm run lint             # 代码检查
```

### 打包命令
```bash
npx electron-packager . AvatarCode --platform=win32 --arch=x64 --out=release
```

### 当前版本
- 版本: v0.1.0
- 状态: MVP开发中
- 已完成: Core Editor, i18n
