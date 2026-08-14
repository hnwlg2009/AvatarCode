## Why

AvatarCode需要Agent Mode功能来实现多智能体协作，让用户可以通过自然语言指令完成复杂的编程任务。这是AI原生代码编辑器的核心功能。

## What Changes

- 实现Agent面板UI组件
- 集成LLM API进行任务规划（主进程 key 安全模型，IPC 通道）
- 实现多Agent编排（Explore/Plan/Execute/Review）
- 实现工具调用机制（文件操作、代码搜索、命令执行审批、目录列举等）
- 实现任务执行和结果展示

## Capabilities

### New Capabilities
- `agent-mode`: 智能体模式，支持多轮对话、工具调用、多阶段任务执行

### Modified Capabilities
- `chat`: Chat 面板接入同一 LLM IPC 通道

## Impact

- **新增文件**: `src/components/agent/`, `src/stores/agentStore.ts`, `src/features/agent/`
- **修改文件**: `electron/ipc/llm-handlers.ts`, `electron/preload.ts`, `src/types/electron.d.ts`, `src/stores/chatStore.ts`
- **依赖**: 需要LLM API支持（OpenAI / Anthropic 兼容端点）
