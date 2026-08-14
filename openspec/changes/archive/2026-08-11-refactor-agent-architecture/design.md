## Context

AvatarCode Agent 模块现状：18 个 TS 编译错误、类型定义三套并存互相冲突、Orchestrator 与四个 Agent 均为占位、两套重复工具实现、LLM 渲染进程实现与主进程 IPC 脱节、AgentPanel 未挂载、preload 与主进程 IPC 通道不匹配。详细分析见 `docs/agent-refactor-plan.md`（v1.1）。

## Goals / Non-Goals

**Goals:**
- 使 Agent 功能真实可用（编译通过、面板可达、对话可跑通工具调用循环）
- 单一类型源、单一工具注册表、LLM 调用只在主进程
- 四类 Agent 全部基于 LLM（system prompt + 任务模板），不留占位

**Non-Goals:**
- 不实现多 Agent 并行协作（保持单 Agent + 工具调用模式）
- 不实现 Agent 记忆/持久化（二期）
- 不考虑流式 streaming（一期以整段返回为准，留接口）
- 不实施 API key 加密迁移（用 safeStorage 属二期，本次保持明文 JSON 并记录风险）

## Decisions

### 1. 类型系统：单一源
**选择**: 类型收敛到 `features/agent/types/agent.types.ts`（依赖 `llm/types.ts`），store 与 UI 仅 import。
**理由**: 消除三套漂移类型；`index.ts` 只导出真实存在的符号；删除 `AgentRole/TaskStep/ToolParameter/OrchestratorState/AgentConfig`（不存在或冗余）。

### 2. Agent 工具执行模型
**选择**: 单 Agent + LLM tool-calling 循环。
**理由**: 简单可靠、易于调试，符合项目阶段，可扩展多 Agent。

### 3. LLM 调用通道
**选择**: 统一走主进程 IPC。渲染进程 `LLMProvider` 抽象为 `IPCLLMProvider`（经 preload 调用）与 `MockProvider`（开发/无 key 模式）。
**理由**: API key 只存主进程（`userData/api-keys.json`），不暴露渲染进程；消除渲染进程两套 fetch 实现；TLS/跨域问题由主进程统一处理。

### 4. Orchestrator 职责
**选择**: Orchestrator 是 tool-calling 循环状态机，不直接写业务逻辑；`run(userInput)` 驱动 `生成 → 解析 tool_call → 执行 → 回填 → 再生成`，轮次上限 20，AbortController 可中断，事件经回调推给 store。
**理由**: 现有 executePlan 空转无法交付真实结果；状态机+事件驱动与 Zustand 天然配合。

### 5. Agent 实现
**选择**: 四类 Agent = 统一 `Agent` 基类（systemPrompt 不同）+ 可选结构化输出提示。Explore/Plan/Execute/Review 通过不同 system prompt 与任务模板实现。
**理由**: 消除 `getProjectStructure` 这类空壳与死代码，全部走 LLM 推理。

### 6. 工具层
**选择**: 删除 `services/AgentToolService.ts`；所有工具实现 `execute(args: Record<string, any>)`；`ToolManager` 提供 `toLLMToolSchema()`（`LLMTool[]`）。
**理由**: 单一注册表、与 LLM schema 无缝衔接；统一签名解决 TS2322。

### 7. 接线顺序
**选择**: 接线修复（App→MainLayout→AgentPanel、preload 通道、dialog 注册）作为前置步骤，先于类型重构。
**理由**: 功能可见是验收前提；IPC 通道不匹配会阻断一切 LLM 调用。

## 实施阶段（任务清单见 tasks.md）

Phase 1: 编译修复（18 错误）
Phase 2: 接线修复（App/MainLayout/preload/dialog/chatStore）
Phase 3: 类型收敛（agent-core types + index/agents/Orchestrator 解耦）
Phase 4: 工具层收敛（删 AgentToolService、修 ToolManager、补 schema 与真实实现）
Phase 5: LLM 层（IPCLLMProvider+MockProvider+主进程 llm:generate 扩展+preload 统一）
Phase 6: Orchestrator 循环 + store 打通 + UI 增强
Phase 7: 端到端验证 + 更新 add-agent-mode spec/task + 归档

## Risks / Trade-offs

| 风险 | 缓解措施 |
|------|----------|
| tool-calling 循环不收敛 | 轮次上限 20 + AbortController 用户中断 |
| 无 API key 无法演示 | MockProvider 模拟 tool_call 全链路 |
| IPC 通道改动破坏 Chat/设置 | 每步 tsc/vitest 验证；preload 与 electron.d.ts 同步更新 |
| OpenAI/Anthropic tools 格式差异 | 主进程 handler 内各自转换，统一返回 LLMResponse 形状 |
| 明文存 API key | 二期迁 safeStorage，接口先行（IPCLLMProvider 不依赖存储格式） |
| 工具执行安全 | execute_command 默认禁用+用户审批；write_file 限定 PathSecurity 允许路径 |
| `@xterm/xterm` 缺失 | 补装依赖或 feature-flag 降级终端面板 |