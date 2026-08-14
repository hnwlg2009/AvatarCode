## ADDED Requirements

### Requirement: Unified Type System
The system SHALL provide a single source of truth for Agent and Tool types under `src/features/agent/types/agent.types.ts`, imported by store and UI layers (no re-definition).

#### Scenario: Type contract is consistent
- **WHEN** `src/stores/agentStore.ts` or components import `AgentMessage`, `ToolCall`, `ToolResult`, `Tool`
- **THEN** the imported symbol SHALL resolve to the single definition in `src/features/agent/types/agent.types.ts`
- **AND** re-definition of these interfaces SHALL NOT exist elsewhere

#### Scenario: Public barrel exports only real symbols
- **WHEN** another module imports from `src/features/agent/index.ts`
- **THEN** every exported symbol SHALL exist in the target modules
- **AND** `Agent`, `AgentRole`, `TaskStep`, `ToolParameter`, `OrchestratorState`, `AgentConfig` SHALL NOT be exported (they do not exist or are redundant)
- **AND** the public export of tools SHALL use actual names (`fileTool`, `searchTool`)

### Requirement: Agent Tool Schema Compatibility
The system SHALL represent Tool parameters in the JSON Schema shape consumed by LLM providers.

#### Scenario: Tool schema round-trips to LLM
- **WHEN** a Tool is registered
- **THEN** its `parameters` SHALL be of shape `LLMTool['parameters']` (`type: 'object', properties, required`)
- **AND** `ToolManager.toLLMToolSchema()` SHALL return an array usable directly by an LLM provider's tool-calling API

### Requirement: Agent Execution Loop
The system SHALL provide an `AgentOrchestrator` that drives an LLM tool-calling loop.

#### Scenario: Run ends when LLM answers without tool calls
- **WHEN** user invokes `orchestrator.run(input)`
- **THEN** messages SHALL be sent to the LLM provider (with registered tool schema)
- **AND** if the response contains NO tool calls SHALL the loop terminate
- **AND** the final content SHALL be emitted as an assistant message

#### Scenario: Tool call results feed back to the LLM
- **WHEN** the LLM response contains one or more tool calls
- **THEN** each tool call SHALL be executed via `ToolManager`
- **AND** each execution result SHALL be appended to the message history as a `tool` role message
- **AND** the LLM SHALL be invoked again with the enriched history

#### Scenario: Loop is bounded and interruptible
- **WHEN** tool calls keep recurring
- **THEN** the loop SHALL stop after at most 20 iterations
- **AND** a caller-provided `AbortSignal` SHALL terminate the loop on abort
- **AND** termination SHALL be reported via `AgentState` (`EXECUTING` / `COMPLETED` / `ERROR`)

#### Scenario: Runtime events are streamed to UI
- **WHEN** the orchestrator transitions state or tools run
- **THEN** it SHALL emit events (`stateChanged`, `toolStarted`, `toolFinished`, `messageGathered`)
- **AND** `AgentContext.onMessage` SHALL receive each user/assistant/tool message for store persistence

### Requirement: Agent Base Class and Agent Kinds
The system SHALL provide a base `Agent` class and derive Explore/Plan/Execute/Review from it, driven by LLM (no hard-coded stubs).

#### Scenario: ExploreAgent analyzes the project via LLM
- **WHEN** `Agent.run(context, input)` is called with an Explore agent
- **THEN** the agent SHALL use its system prompt to analyze the project (structure, dependencies)
- **AND** MAY use tools (`search_code`, `read_file`) to gather context
- **AND** SHALL return a text summary

#### Scenario: `PlanAgent` decomposes a request into tasks
- **WHEN** a user describes a multi-step requirement
- **THEN** the Plan agent SHALL return a structured task breakdown driven by the LLM (not a fixed single placeholder)

#### Scenario: `ExecuteAgent` completes a task using tools
- **WHEN** a task is dispatched to Execute
- **THEN** the agent SHALL run the task through tool calls and return a completion report

#### Scenario: `ReviewAgent` reviews code
- **WHEN** code is presented to Review
- **THEN** the agent SHALL return concrete issues, suggestions and a score derived from the LLM

#### Scenario: No orphan/stub methods remain
- **WHEN** `AgentOrchestrator` or an Agent references a method
- **THEN** every referenced method SHALL exist (e.g. `ExploreAgent` uses `getStructure`, not a missing `getProjectStructure`)