# Agent 架构重构方案（修订版 v1.1）

> 状态：草案（仅分析，未实施）
> 日期：2026-08-06
> 范围：Agent 核心层 / LLM 接入层 / 工具层 / UI 层 / 接线层

---

## 1. 现状分析

### 1.1 模块任务状态

OpenSpec 当前仅有 1 个 active change：`add-agent-mode`（19/19 任务完成，status: complete）。
其余变更（add-i18n、add-logo-design）已归档。`.monkeycode/specs/` 下所有模块任务均标记完成（合计 974 个 task）。

**问题：任务完成状态与代码实际质量严重不符。** agent 模块存在 18 个 TypeScript 编译错误，多处实现为占位空壳，多个组件未接线。

### 1.2 编译错误清单（`npx tsc --noEmit`，共 18 处）

| 位置 | 错误 | 类型 |
|------|------|------|
| `features/agent/index.ts` | 导出 `Agent`/`AgentRole`/`TaskStep`/`ToolParameter`/`OrchestratorState`/`AgentConfig` 但 types 中不存在 | 类型定义漂移 |
| `features/agent/index.ts` | 从 `./tools/FileTool` 导出 `FileTool`，实际导出名是 `fileTool` | 命名不一致 |
| `features/agent/tools/index.ts` | 同上，`SearchTool` vs `searchTool` | 命名不一致 |
| `ToolManager.ts:23` | `MapIterator` 上调用 `.map` | 语法错误 |
| `ExploreAgent.ts:10` | 调用不存在的 `getProjectStructure`（应改为 `getStructure`） | 空壳占位 |
| `tools/FileTool.ts`、`SearchTool.ts`、`EditorTool.ts`、`TerminalTool.ts` | `Tool.execute` 参数类型 `Record<string, any>` 与具体参数类型不兼容 | 类型体系缺陷 |
| `TerminalPanel.tsx:4` | 找不到 `@xterm/xterm` 模块 | 依赖缺失 |

### 1.3 接线层问题（原方案遗漏，v1.1 新增）

| 问题 | 位置 | 影响 |
|------|------|------|
| **AgentPanel 从未被挂载** | `src/App.tsx` 仅渲染 `<Workspace />`；`MainLayout` 未在 App 中使用 | Agent 功能 UI 完全不可达 |
| **ChatPanel 挂在 MainLayout 但 MainLayout 未被使用** | `src/App.tsx:8` | Chat 面板同样不可达 |
| **chatStore 是占位** | `src/stores/chatStore.ts:85-93`（`TODO: 调用实际的 LLM API`） | 即使挂载也只是假回复 |
| **preload 与主进程 IPC 通道不匹配** | `electron/preload.ts:33-39`（`llm:chat`/`llm:chat:stream`/`llm:setConfig`）vs `electron/ipc/llm-handlers.ts`（`llm:generate`/`llm:setAPIKey`/`llm:hasAPIKey`/`llm:validateAPIKey`） | 调用 `electronAPI.llm.chat()` 会报 "No handler registered" |
| **API key 存储与访问模型** | key 存主进程 `userData/api-keys.json`（`llm-handlers.ts`），无 getter 暴露给渲染进程 | 渲染进程 provider 无法直接 fetch（无 key） |
| **dialog 注册位置错误** | `file-handlers.ts:181-192` 的 `dialog:openFile`/`dialog:saveFile` 在函数体外（不可达代码） | 对话框 IPC 实际未注册 |

### 1.4 架构性问题

#### A. 类型定义三套并存、互相冲突

```
agent.types.ts  ←→  agentStore.ts（重新定义 AgentMessage/ToolCall/ToolResult/AgentTool）
        ↕
  llm/types.ts（LLMMessage/LLMTool/LLMToolCall/LLMResponse）
```

三处对 `AgentMessage`、`ToolCall`、`Tool` 等核心概念的命名与字段定义不一致。`agent.types.ts` 的 `Tool.execute` 返回 `ToolExecutionResult`，而 LLM 层用 `LLMTool`——两套工具 schema 表示法。

#### B. Orchestrator 是空壳

`AgentOrchestrator.executePlan()`（`AgentOrchestrator.ts:67-79`）仅推进 task 的 `status` 字段，**无任何实际执行逻辑**，未调用 LLM、Agent 或工具。`Agent` 基类缺失——`index.ts` 声明的 `Agent` 类型不存在。

#### C. 四个 Agent 全是占位

- `ExploreAgent.analyzeProject` 返回空结构；`getProjectStructure` 方法不存在
- `PlanAgent.decomposeTasks` 固定返回单个占位任务
- `ExecuteAgent.executeTask` 直接返回 `"Executed: xxx"`
- `ReviewAgent.reviewCode` 返回空 issues + score 100

**没有任何一个 Agent 接入 LLM。**

#### D. 工具实现重复、与 LLM 脱节

- `features/agent/tools/`（fileTool/searchTool/editorTool/terminalTool，经 ToolManager 注册）
- `services/AgentToolService.ts`（独立 switch-case 实现）

两套功能重叠；`execute_command`/`search_code` 均为占位。工具 schema 与 `LLMTool` 格式不同，无法直接传给 `generateWithTools`。

#### E. LLM 实现重复、且与主进程脱节（v1.1 重点修订）

存在**两套独立 LLM 调用实现**：

| 层 | 位置 | 内容 |
|----|------|------|
| 主进程 | `electron/ipc/llm-handlers.ts` | key 管理（safeStorage 未用，明文 JSON）+ `llm:generate`（fetch OpenAI/Anthropic） |
| 渲染进程 | `src/features/agent/llm/` | `LLMFactory`/`OpenAIProvider`/`AnthropicProvider`（fetch，需 apiKey 但拿不到） |

**决策变更**：渲染进程的 `features/agent/llm` 不应直接 fetch（拿不到 key、跨域、key 暴露风险）。LLM 调用统一走主进程 IPC——主进程持 key、发起请求。渲染进程保留 provider 抽象但改为 **IPC 适配器实现**（`IPCLLMProvider`），并保留 `MockProvider` 用于开发/无 key 模式。

#### F. Store 与核心层重复

`agentStore.ts` 重复定义整套类型；UI 直接消费 store 类型，两处必然漂移（已发生）。

---

## 2. 目标架构

```
┌─────────────────────────────────────────────────┐
│  UI 层 (components/)                             │
│  MainLayout ── AgentPanel ── ChatPanel(复用)     │
│         │                                        │
│         ▼                                        │
│  Store 层 (stores/)                              │
│  agentStore / chatStore（类型从核心层 import）    │
│         │                                        │
│         ▼                                        │
│  Agent 核心层 (features/agent)                   │
│  AgentOrchestrator (tool-calling 循环状态机)      │
│  Agent(基类) + Explore/Plan/Execute/Review       │
│  ToolManager（单一注册表 + toLLMToolSchema）     │
│         │                    │                   │
│         ▼                    ▼                   │
│  LLM 接入层 (features/agent/llm)                 │
│  LLMProvider 接口                                │
│  IPCLLMProvider（主进程 fetch）  MockProvider     │
│         │                                        │
│         ▼                                        │
│  Electron 主进程 (electron/)                     │
│  llm-handlers（key 管理 + fetch + tool schema）  │
│  preload（IPC 通道统一）                          │
└─────────────────────────────────────────────────┘
```

### 2.1 核心原则（v1.1 修订）

1. **单一类型源**：所有 Agent/LLM 类型收敛到 `features/agent/types/` 与 `features/agent/llm/types.ts`，store/UI 只 import，禁止重复定义。
2. **一个工具注册表**：删除 `services/AgentToolService.ts`；所有工具经 `ToolManager` 注册；`ToolManager` 提供 `toLLMToolSchema()`。
3. **LLM 调用只在主进程**：API key 不出主进程；渲染进程通过 IPC 调用，抽象为 `LLMProvider` 接口 + `IPCLLMProvider` 实现。
4. **Orchestrator 驱动 tool-calling 循环**：`发送消息 → 解析 tool_call → ToolManager 执行 → 回填 → 再次请求`，设轮次上限 + 可中断。
5. **Agent 只做规划/拆解**：四类 Agent 全部基于 LLM（system prompt + 任务模板），不硬编码占位。
6. **接线优先**：App → MainLayout → AgentPanel 挂载、preload 通道与主进程 handler 对齐，是一切功能可见的前提。

---

## 3. 分模块重构设计

### 3.0 接线修复（新增，前置步骤）

| # | 内容 | 文件 |
|---|------|------|
| 1 | `App.tsx` 渲染 `MainLayout`（而非直接 `Workspace`） | `src/App.tsx` |
| 2 | `MainLayout` 增加 Agent 面板（活动栏切换 agent 视图，或在 Chat 面板旁增加 Agent tab） | `src/components/layout/MainLayout.tsx` |
| 3 | 统一 preload LLM 通道：`llm:generate`（含 tools 参数）、`llm:setAPIKey`、`llm:hasAPIKey`、`llm:stream`（新增） | `electron/preload.ts` + `src/types/electron.d.ts` |
| 4 | 修复 `dialog:openFile`/`dialog:saveFile` 注册位置（移入 `registerFileHandlers`） | `electron/ipc/file-handlers.ts` |
| 5 | `chatStore.sendMessage` 接 `window.electronAPI.llm.generate`（或复用 agent 的 IPC provider） | `src/stores/chatStore.ts` |

### 3.1 Agent 核心层（features/agent）

#### 类型系统统一（types/agent.types.ts）

以 `llm/types.ts` 为底层基础重构：

```ts
import type { LLMTool, LLMToolCall } from '../llm/types';

export enum AgentState { IDLE='idle', PLANNING='planning', EXECUTING='executing', REVIEWING='reviewing', COMPLETED='completed', ERROR='error' }

export interface AgentMessage {
  id: string;
  role: 'user' | 'assistant' | 'system' | 'tool';
  content: string;
  timestamp: number;
  toolCalls?: LLMToolCall[];
  toolResult?: ToolResult;
  agentType?: AgentType;
}

export interface Tool {
  name: string;
  description: string;
  parameters: LLMTool['parameters'];           // 与 LLM schema 一致
  execute: (args: Record<string, any>) => Promise<ToolExecutionResult>;
}

export interface AgentContext {
  rootPath: string;
  llm: LLMProvider;                            // 来自 llm/types
  toolManager: ToolManager;
  onMessage: (msg: AgentMessage) => void;      // 事件回调连接 store
}

export interface Agent {
  type: AgentType;
  systemPrompt: string;
  run(context: AgentContext, input: string): Promise<string>;
}

// 删除：AgentRole / TaskStep / ToolParameter / OrchestratorState / AgentConfig
// （index.ts 同步修正导出；工具命名统一 fileTool/searchTool/editorTool/terminalTool）
```

#### Orchestrator 重构（AgentOrchestrator.ts）

职责改为：**对话驱动的 LLM tool-calling 循环状态机**。

```
run(userInput, context):
  ├─ state=EXECUTING，emit 事件
  ├─ loop (max 20 轮):
  │   ├─ resp = llm.generateWithTools(messages, toolManager.toLLMToolSchema())
  │   ├─ resp.toolCalls 为空 → 输出最终回复，结束
  │   └─ for each toolCall:
  │       ├─ emit("tool_start", toolCall)         → UI 展示调用中
  │       ├─ result = toolManager.executeTool(name, args)
  │       └─ messages.append({role:'tool', content: result})
  ├─ state=COMPLETED / ERROR
  └─ 支持 AbortController 中断（用户停止）
```

原 `createPlan/approvePlan/executePlan` 计划逻辑下沉为可选功能（PlanAgent 拆解、Orchestrator 推进）。

### 3.2 LLM 接入层（features/agent/llm）—— v1.1 重写

| 项 | 现状 | 重构 |
|----|------|------|
| 调用通道 | 渲染进程直接 fetch（无 key 可用） | **统一走主进程 IPC** |
| Provider 结构 | OpenAI/Anthropic 双实现 | 保留接口 `LLMProvider`；新增 `IPCLLMProvider`（经 preload 调用 `llm:generate`）；保留 `MockProvider`（开发模式） |
| `generateWithTools` | 仅 OpenAI 实现 | IPCLLMProvider 实现（主进程 `llm:generate` 增加 tools 参数透传）；MockProvider 模拟 tool_call 流程 |
| Streaming | 无 | 主进程新增 `llm:stream`（`ipcRenderer.on` 事件流）或二期实现；一期以整段返回为准 |
| 错误处理 | 单次失败即抛错 | IPC 层重试（指数退避 3 次）+ 统一错误消息 |
| 配置来源 | 硬编码 | `settingsStore` 存 provider 选择；apiKey 始终存主进程 |
| LLMFactory | 校验 apiKey 后缓存 | `createProvider()` 返回 IPCLLMProvider（始终可用）；`createMockProvider()` 供开发/无 key 时使用 |

**主进程 `llm:generate` 扩展**（llm-handlers.ts）：
- 入参增加 `{ provider, messages, options, tools? }`
- OpenAI 分支已有 tools 支持雏形；补全 `tools` 字段透传与 `tool_calls` 解析返回
- Anthropic 分支补 `tools` API 支持（anthropic-version 2023-06-01+）
- 返回统一为 `{ content, toolCalls?, usage, model }`（与 `LLMResponse` 对齐）

### 3.3 工具层（tools/）

- **删除** `services/AgentToolService.ts`，收敛到 `features/agent/tools/`。
- **统一执行签名**：所有工具 `execute(args: Record<string, any>)`，内部自行校验（解决 TS2322）。
- **ToolManager 修复**：`getToolsSchema()` 用 `Array.from(this.tools.values())`；新增 `toLLMToolSchema(): LLMTool[]`。
- **补齐真实实现**：
  - `search_code`：接入基于 `FileSystemService` 的递归搜索 + 关键字匹配
  - `execute_command`：默认禁用（安全），经 `electron/ipc/terminal-handlers` 桥接，支持用户审批
  - `editor_action`：桥接 `editorStore`（打开/聚焦/修改文件）
- **新工具**（可选，二期）：`list_files`、`read_dir`、`git_status`、`apply_patch`

### 3.4 UI 层（components/agent + stores/agentStore.ts）

- **agentStore 类型收敛**：改为 `import type { ... } from '../features/agent/types'`，删除重复定义。
- **store 新增**：
  - `plan` / `activeTask`（展示规划）
  - `toolStatus: { name, status: 'running'|'done'|'error', args, duration }[]`
  - `sendMessage(content)`：调用 Orchestrator.run 并订阅事件回填
  - `stopExecution()`：AbortController 中断
- **AgentPanel**：
  - 顶部 status 徽章 + 当前任务（i18n `agent.state.*` 键已存在）
  - `AgentMessage` 新增 tool call 卡片（工具名/参数/结果/耗时/状态）
  - streaming 时增量渲染（若二期做流式）
- **MainLayout 接线**：活动栏新增 Agent 入口，或 Chat 面板 tab 化（Chat/Agent 共用面板区域）

### 3.5 编译修复（先行）

1. 修正 `features/agent/index.ts`、`tools/index.ts` 导出
2. 修正 `ToolManager.getToolsSchema`（`Array.from`）
3. 修正 `ExploreAgent.getProjectStructure` → `getStructure`
4. 安装 `@xterm/xterm`（或标注可选依赖 + 降级 UI）
5. 统一 `Tool.execute` 签名

---

## 4. 实施步骤（修订：接线前置）

| # | 步骤 | 产出 | 依赖 |
|---|------|------|------|
| 1 | 修复 18 个编译错误（3.5） | `tsc --noEmit` 通过 | 无 |
| 2 | 接线修复（3.0）：App→MainLayout→AgentPanel、preload 通道对齐、dialog 注册修复 | 面板可见、IPC 可用 | #1 |
| 3 | 统一类型系统（3.1 types/） | `agent.types.ts` 重构 + index 修正 | #1 |
| 4 | 收敛工具层（3.3）：删 AgentToolService、修复 ToolManager、补 toLLMToolSchema | 单一工具注册表 | #3 |
| 5 | LLM 层重构（3.2）：IPCLLMProvider + MockProvider + 主进程 llm:generate 扩展 + preload 统一 | provider 全接口就绪 | #2 #3 |
| 6 | Orchestrator 重写为 tool-calling 循环（3.1） | run() 可驱动真实 LLM 对话 | #4 #5 |
| 7 | agentStore 类型收敛 + 新 action（3.4） | store 与核心层打通 | #3 #6 |
| 8 | UI 增强：tool call 卡片、状态徽章、AgentPanel 接入 MainLayout（3.4） | 完整体验 | #6 #7 |
| 9 | chatStore 接入 LLM（3.0 #5） | Chat 面板可用 | #5 |
| 10 | 真实工具实现：search_code / execute_command 审批 / editor_action（3.3） | 工具可用 | #6 |
| 11 | 端到端验证 + 更新 openspec `add-agent-mode` 任务与 spec | 验收通过 | 全部 |

---

## 5. 风险与权衡

| 风险 | 影响 | 缓解 |
|------|------|------|
| LLM tool-calling 循环不收敛 | 卡死/费用 | 轮次上限（20）+ 用户可中断（AbortController） |
| 无 API key 无法演示 | 功能不可见 | MockProvider（模拟 tool_call 流程，可演示完整链路） |
| IPC 通道改动破坏 Chat/设置 | 回归 | 步骤化实施 + 每步 `tsc`/`vitest` 验证 |
| OpenAI/Anthropic tools API 格式差异 | 适配复杂 | 主进程 handler 内各自转换，统一返回 `LLMResponse` 形状 |
| API key 明文存 userData JSON | 安全隐患 | 后续换 `safeStorage` 加密（接口不变，二期） |
| 工具执行安全（写文件/命令） | 误操作 | execute_command 默认禁用 + 用户审批；write_file 限制工作区（`PathSecurity` 已有） |
| `@xterm/xterm` 缺失 | 终端面板编译失败 | 安装依赖或 feature-flag 降级 |
| `dialog:openFile` 未注册（不可达代码） | 文件打开对话框失效 | 接线步骤修复 |

---

## 6. 验收标准

1. `npx tsc --noEmit` 无错误
2. `npm run test`（vitest）通过
3. 应用启动：MainLayout 渲染，活动栏可切换到 Agent 面板与 Chat 面板
4. Agent 面板可发起真实对话：输入自然语言 → LLM 返回工具调用 → 工具执行 → 结果回填 → 最终回复（MockProvider 或真实 key 均可）
5. 工具调用过程 UI 实时可见（调用中/成功/失败）
6. 无 key 时使用 MockProvider 给出明确提示（引导去设置页）
7. `openspec/changes/add-agent-mode` 的 spec 与任务清单更新为与实际实现一致

---

## 7. 变更记录

| 版本 | 日期 | 变更 |
|------|------|------|
| v1.0 | 2026-08-06 | 初版：核心层/LLM/工具/UI 四层重构方案 |
| v1.1 | 2026-08-06 | 新增接线层问题（AgentPanel 未挂载、IPC 通道不匹配、dialog 注册错误、chatStore 占位）；LLM 层改为统一走主进程 IPC（key 安全模型）；实施步骤增加接线前置与 chatStore 接入 |
