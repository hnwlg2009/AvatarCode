## Context

AvatarCode已实现基础的AI Chat功能，现在需要扩展为Agent Mode，支持多轮对话、工具调用和任务执行。

## Goals / Non-Goals

**Goals:**
- 实现Agent对话界面
- 支持工具调用（文件读写、代码执行等）
- 实现任务规划和执行
- 展示执行结果

**Non-Goals:**
- 不实现多Agent协作
- 不实现Agent记忆系统

## Decisions

### 1. Agent架构

**选择**: 多Agent编排（Orchestrator 状态机）

**理由**:
- `AgentOrchestrator` 以工具调用循环驱动多阶段 Agent（Explore → Plan → Execute → Review），每阶段一个 LLM 驱动的 Agent
- 单次任务最多 20 轮迭代，支持 AbortSignal 中断
- 事件通过 `onMessage` 上报（stateChanged / toolStarted / toolFinished / messageGathered）

### 2. 工具调用机制

**选择**: 基于 JSON Schema 定义工具，LLM 返回工具调用指令

**工具列表**:
- `read_file`: 读取文件内容
- `write_file`: 写入文件内容
- `execute_command`: 执行命令（审批流：返回 request，UI approve/deny 后经 terminal IPC 执行）
- `search_code`: 递归搜索代码（基于 FileSystemService 的 GrepService）
- `editor_action`: 打开/聚焦文件（tabManagerStore）
- `list_files`: 列出目录内容
- `read_dir`: 读取目录结构

所有工具统一 `execute(args)` 签名，返回 `ToolExecutionResult` 契约。

### 3. LLM 通道与状态管理

**选择**: 主进程持有 API Key（key 安全模型），渲染层经 IPC 调用；Zustand store 管理 Agent 状态

- LLM: `IPCLLMProvider`（IPC 通道，3 次指数退避重试）；无 key 时自动回退 `MockProvider`（模拟工具调用链路）
- 主进程 `llm:generate` 支持 OpenAI + Anthropic，统一返回 `{ content, toolCalls?, usage, model }`
- 状态: messages / status / plan / activeTask / toolStatus

## Risks / Trade-offs

| 风险 | 缓解措施 |
|------|----------|
| LLM响应不稳定 | IPCLLMProvider 重试机制（3x 指数退避）+ 错误处理 |
| 工具调用失败 | 工具返回 ToolExecutionResult 统一契约，失败信息回传给 LLM |
| 执行超时 | Orchestrator 20 轮迭代上限 + AbortController 中断 |
