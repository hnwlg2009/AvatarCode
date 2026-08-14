# Tasks: refactor-agent-architecture

## Phase 1: Compilation Fixes

- [x] 1.1 Fix `src/features/agent/index.ts` exports (remove nonexistent Agent/AgentRole/TaskStep/ToolParameter/OrchestratorState/AgentConfig; export fileTool/searchTool by actual names)
- [x] 1.2 Fix `src/features/agent/tools/index.ts` exports (fileTool, searchTool)
- [x] 1.3 Fix `ToolManager.getToolsSchema()` (use Array.from instead of .map on MapIterator)
- [x] 1.4 Fix `ExploreAgent.analyzeProject` (use `getStructure`, remove missing `getProjectStructure` call)
- [x] 1.5 Unify `Tool.execute` signature to `(args: Record<string, any>)` across all tools (FileTool/SearchTool/EditorTool/TerminalTool)
- [x] 1.6 Install `@xterm/xterm` dependency (or gate TerminalPanel behind feature flag)
- [x] 1.7 Verify `npx tsc --noEmit` passes with 0 errors

## Phase 2: Wiring Fixes

- [x] 2.1 Update `src/App.tsx` to render `MainLayout`
- [x] 2.2 Add Agent view entry in `MainLayout` (activity bar button or right-panel tab) mounting `AgentPanel`
- [x] 2.3 Align `electron/preload.ts` LLM channels: `setAPIKey`, `hasAPIKey`, `generate` (matching llm-handlers)
- [x] 2.4 Align `src/types/electron.d.ts` with preload contract
- [x] 2.5 Move `dialog:openFile`/`dialog:saveFile` registration inside `registerFileHandlers`
- [x] 2.6 Wire `chatStore.sendMessage` to LLM via IPC provider (remove placeholder response)

## Phase 3: Agent Core (agent-core)

- [x] 3.1 Refactor `src/features/agent/types/agent.types.ts` to import from `llm/types.ts` (single source of truth)
- [x] 3.2 Remove redundant type definitions from `agentStore.ts` (import from core instead)
- [x] 3.3 Add `AgentContext` interface (rootPath, llm, toolManager, onMessage)
- [x] 3.4 Add base `Agent` class with `systemPrompt` and `run(context, input)`
- [x] 3.5 Rewrite `AgentOrchestrator` as tool-calling loop state machine (max 20 iterations, AbortSignal support)
- [x] 3.6 Implement orchestrator events (stateChanged, toolStarted, toolFinished, messageGathered) to AgentContext.onMessage
- [x] 3.7 Rewrite `ExploreAgent` via LLM (structure + dependency analysis through tools)
- [x] 3.8 Rewrite `PlanAgent` via LLM (task decomposition, no fixed placeholder)
- [x] 3.9 Rewrite `ExecuteAgent` via LLM (task execution with tools, completion report)
- [x] 3.10 Rewrite `ReviewAgent` via LLM (issues/suggestions/score)
- [x] 3.11 Verify no orphan/stub methods remain (getStructure etc.)

## Phase 4: Tool Layer (tool-layer)

- [x] 4.1 Delete `src/services/AgentToolService.ts` and all imports
- [x] 4.2 Add `ToolManager.toLLMToolSchema(): LLMTool[]`
- [x] 4.3 Implement `search_code` real recursive search (via FileSystemService-based GrepService)
- [x] 4.4 Implement `editor_action` (open/focus via tabManagerStore)
- [x] 4.5 Implement `execute_command` approval flow (return request, UI approve/deny, execute via terminal IPC)
- [x] 4.6 Ensure all tools validate required args and return `ToolExecutionResult` contract
- [x] 4.7 Add `list_files` / `read_dir` tools (optional phase-2 tool)

## Phase 5: LLM Layer (llm-layer)

- [x] 5.1 Add `IPCLLMProvider` implementing `LLMProvider` via `window.electronAPI.llm`
- [x] 5.2 Add `MockProvider` (simulates tool-calling exchange, no API key required)
- [x] 5.3 Add `LLMFactory.createMockProvider()`
- [x] 5.4 Extend `electron/ipc/llm-handlers.ts` `llm:generate` to accept `tools` and return toolCalls (OpenAI + Anthropic)
- [x] 5.5 Unify main process return contract `{ content, toolCalls?, usage, model }`
- [x] 5.6 Add retry (3x exponential backoff) for transient LLM failures in IPCLLMProvider
- [x] 5.7 Add optional `stream` method to `LLMProvider` interface (non-breaking)

## Phase 6: UI Layer (ui-layer)

- [x] 6.1 Refactor `agentStore`: import types from core, add `plan`/`activeTask`/`toolStatus`
- [x] 6.2 Add `sendMessage(content)` action calling orchestrator with event subscription
- [x] 6.3 Add `stopExecution()` action (AbortController)
- [x] 6.4 Add tool call cards to `AgentMessage` component (name/args/result/duration/status)
- [x] 6.5 Add status badge and current-task display to `AgentPanel`
- [x] 6.6 Add empty/loading/error states and input disable during execution
- [x] 6.7 Add i18n keys for new UI labels (`agent.*`)
- [x] 6.8 Verify AgentPanel is reachable from MainLayout and usable end-to-end

## Phase 7: Verification & Alignment

- [x] 7.1 Run `npx tsc --noEmit` - 0 errors
- [x] 7.2 Run vitest suite - all pass
- [x] 7.3 End-to-end check: start app, open Agent panel, run a natural-language request with MockProvider, observe tool cards and final answer
- [x] 7.4 End-to-end check: Chat panel produces real LLM response (IPC)
- [x] 7.5 Update `openspec/changes/add-agent-mode` spec and tasks to match implementation reality
- [x] 7.6 Validate this change: `openspec validate refactor-agent-architecture`
- [x] 7.7 Archive plan approved by user (optional, after review)
