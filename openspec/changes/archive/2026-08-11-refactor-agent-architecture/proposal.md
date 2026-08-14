## Why

AvatarCode 的 Agent 模块存在 18 个 TypeScript 编译错误、三套重复类型定义、Orchestrator 与四个 Agent 均为占位空壳、两套重复工具实现、LLM 层与主进程 IPC 脱节，且 AgentPanel 从未被挂载到布局中。任务清单虽标记完成，但功能实际不可用。需要系统性重构 Agent 架构与开发模型，使 Agent 功能真实可用。

## What Changes

- 修复全部 TypeScript 编译错误（18 处）
- 统一类型系统：单一类型源，删除 store 与 index 中的重复/漂移定义
- 重写 AgentOrchestrator 为 LLM tool-calling 循环状态机（轮次上限 + 可中断）
- 四类 Agent（Explore/Plan/Execute/Review）全部基于 LLM 实现
- LLM 调用统一走主进程 IPC（API key 不暴露渲染进程），新增 IPCLLMProvider 与 MockProvider
- 删除 AgentToolService，工具统一经 ToolManager 注册，支持 toLLMToolSchema 转换
- 接线修复：App→MainLayout→AgentPanel 挂载、preload 与主进程 IPC 通道对齐、dialog 注册修复、chatStore 接入 LLM
- UI 增强：tool call 卡片、状态徽章、计划展示、可中断执行

## Capabilities

### New Capabilities
- `agent-core`: Agent 核心层（类型系统、Orchestrator、Agent 基类与四类 Agent）
- `llm-layer`: LLM 接入层（IPCLLMProvider、MockProvider、主进程工具调用支持）
- `tool-layer`: 工具注册与执行层（ToolManager、真实工具实现）
- `ui-layer`: Agent UI 与接线层（store 收敛、面板增强、布局挂载、IPC 通道对齐）

### Modified Capabilities
- `agent-mode`: 原 add-agent-mode 能力，重构后其 spec 与任务将与实际实现一致

## Impact

- **新增文件**: `src/features/agent/llm/IPCLLMProvider.ts`, `src/features/agent/llm/MockProvider.ts`, `src/services/GrepService.ts`（或等价搜索服务）
- **修改文件**: `src/App.tsx`, `src/components/layout/MainLayout.tsx`, `src/components/agent/*`, `src/stores/agentStore.ts`, `src/stores/chatStore.ts`, `src/features/agent/types/agent.types.ts`, `src/features/agent/AgentOrchestrator.ts`, `src/features/agent/ToolManager.ts`, `src/features/agent/agents/*`, `src/features/agent/tools/*`, `src/features/agent/index.ts`, `electron/preload.ts`, `electron/ipc/llm-handlers.ts`, `electron/ipc/file-handlers.ts`, `src/types/electron.d.ts`
- **删除文件**: `src/services/AgentToolService.ts`
- **依赖**: `@xterm/xterm`（补装或降级标注）
