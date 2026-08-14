## ADDED Requirements

### Requirement: Unified LLM Provider Interface
The system SHALL provide a single `LLMProvider` interface in `src/features/agent/llm/types.ts` used by chat, agent, and tool flow.

#### Scenario: All consumers use the same interface
- **WHEN** the agent core or chat invokes the LLM
- **THEN** it SHALL use the `LLMProvider` interface from `src/features/agent/llm/types.ts`
- **AND** `generateWithTools` SHALL accept `LLMTool[]` and return `LLMResponse` with `toolCalls`

### Requirement: IPCLLMProvider (main-process-backed)
The system SHALL provide an `IPCLLMProvider` that performs LLM requests through the main process via preload (`window.electronAPI.llm`), keeping API keys out of the renderer.

#### Scenario: Generate via IPC without exposing API key
- **WHEN** `ipcProvider.generate(messages, options)` is called
- **THEN** the request SHALL be forwarded to the main process (`llm:generate`)
- **AND** the renderer SHALL NOT read or hold any API key
- **AND** the resolved {{ value }} SHALL match `LLMResponse` (content, toolCalls, usage, model)

#### Scenario: Tool calls flow through the main process
- **WHEN** `ipcProvider.generateWithTools(messages, tools, options)` is called
- **THEN** the `tools` array SHALL be passed to the main process
- **AND** the response SHALL include parsed `toolCalls` (`name`, `arguments`)

#### Scenario: Errors are propagated with stable messages
- **WHEN** the main process returns an error (missing key, network, provider error)
- **THEN** a rejected promise SHALL contain the provider's error text
- **AND** the system SHALL retry up to 3 times with exponential backoff for transient failures

### Requirement: Mock Provider (dev / no-key mode)
The system SHALL provide a `MockProvider` usable when no API key is configured, to exercise the full Agent tool-calling loop in development.

#### Scenario: Mock provider simulates a tool-calling exchange
- **WHEN** `MockProvider.generateWithTools` receives a user message such as "read the file"
- **THEN** it SHALL first respond with a `read_file` tool call, the tool shall execute, and the next turn SHALL return a final answer
- **AND** all steps SHALL visible to UI as normal tool events (no special-casing)

#### Scenario: LLMFactory exposes mock creation
- **WHEN** `LLMFactory.createMockProvider()` is called
- **THEN** a usable `MockProvider` SHALL be returned without any API key

### Requirement: Main Process `llm:generate` tool support
The system SHALL extend `electron/ipc/llm-handlers.ts` to accept tools and return tool calls for both OpenAI and Anthropic.

#### Scenario: OpenAI call carries tools and returns tool_calls
- **WHEN** `llm:generate` is invoked with `{ provider: 'openai', messages, tools, options }`
- **THEN** the OpenAI API call SHALL include the `tools` array
- **AND** `tool_calls` from the response SHALL be returned as `{ id, name, arguments }`

#### Scenario: Anthropic call supports tools
- **WHEN** `llm:generate` is invoked with `{ provider: 'anthropic', messages, tools, options }`
- **THEN** the request SHALL include a valid `tools` payload for the Anthropic Messages API
- **AND** `stop_reason === 'toolUse'` SHALL map to `toolCalls` in the unified `LLMResponse` shape

#### Scenario: Unified response contract
- **WHEN** any provider call completes
- **THEN** the handler SHALL return `{ content, toolCalls?, usage, model }`
- **AND** this SHALL equal the `LLMResponse` type used by the renderer

### Requirement: Preload LLM channel alignment
The system SHALL align `electron/preload.ts` and `src/types/electron.d.ts` with the actual names handled by the main process.

#### Scenario: Renderer sees a working LLM API
- **WHEN** the renderer accesses `window.electronAPI.llm`
- **THEN** it SHALL contain `setAPIKey`, `hasAPIKey`, and `generate` (matching `llm-handlers.ts`)
- **AND** no channel SHALL be declared in preload that lacks a main-process handler

### Requirement: Streaming Preparation (non-blocking)
The interface SHALL allow streaming to be added without a breaking interface change.

#### Scenario: Optional stream hook exists
- **WHEN** a provider supports incremental output
- **THEN** `LLMProvider` SHALL expose an optional `stream` method
- **AND** its absence SHALL NOT break chat or agent flows (non-streaming fallback)