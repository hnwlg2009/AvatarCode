# ui-layer Specification

## Purpose
TBD - created by archiving change refactor-agent-architecture. Update Purpose after archive.
## Requirements
### Requirement: Application Wiring
The system SHALL render the full IDE layout (activity bar, sidebar, editor, chat/agent panels) on startup.

#### Scenario: App mounts MainLayout
- **WHEN** the application starts
- **THEN** `src/App.tsx` SHALL render `MainLayout`
- **AND** `MainLayout` SHALL show the activity bar, sidebar, editor workspace, and the right-side panel

#### Scenario: Agent panel is reachable
- **WHEN** the user selects the Agent view (activity bar button or panel tab)
- **THEN** the `AgentPanel` SHALL be displayed with conversation history, tool cards, and input
- **AND** it SHALL be wired to `useAgentStore`

#### Scenario: Chat panel is reachable
- **WHEN** the right-side panel shows Chat
- **THEN** `ChatPanel` SHALL be mounted and its `sendMessage` SHALL call the LLM through the IPC provider
- **AND** it SHALL NOT emit a placeholder-only response

### Requirement: Agent Store Contract
The system SHALL expose a single `agentStore` (Zustand) with types imported from the core, supporting conversation, status, plan, and tool-state.

#### Scenario: Store types come from core
- **WHEN** the store defines `messages`, `tools`, `status`, `currentTask`
- **THEN** their types SHALL be imported from `src/features/agent/types/agent.types.ts`
- **AND** no parallel `AgentMessage`/`ToolCall`/`ToolResult`/`AgentTool` interface SHALL remain in `agentStore.ts`

#### Scenario: Conversation actions
- **WHEN** the user sends a message
- **THEN** `sendMessage(content)` SHALL add the user message, set status to `executing`, and invoke the orchestrator
- **AND** on completion it SHALL append the final assistant message and set status to `idle`
- **AND** on error it SHALL set `error` and status `error`

#### Scenario: Execution can be stopped
- **WHEN** the user presses stop while the agent is running
- **THEN** `stopExecution()` SHALL abort the current orchestrator loop
- **AND** the status SHALL return to `idle`

#### Scenario: Tool state tracked
- **WHEN** the orchestrator starts/finishes a tool
- **THEN** the store SHALL update `toolStatus` (running/done/error with args and duration)
- **AND** the store SHALL clear `toolStatus` when a new conversation starts

### Requirement: Agent Panel Experience
The system SHALL present agent activity with status, plan, and tool call details.

#### Scenario: Status and current task shown
- **WHEN** the agent is running
- **THEN** the panel SHALL display the current `status` badge and the `currentTask`/plan title
- **AND** all labels SHALL use i18n keys (`agent.*`)

#### Scenario: Tool call cards
- **WHEN** a tool call is executed
- **THEN** a tool card SHALL render the tool name, arguments (collapsible), result, duration, and status
- **AND** it SHALL reflect running / done / error states

#### Scenario: Empty and loading states
- **WHEN** there are no messages
- **THEN** the welcome hint SHALL be shown
- **WHEN** the agent is loading
- **THEN** an animated loading indicator SHALL be shown and the input SHALL be disabled

### Requirement: Preload / IPC Alignment (UI-facing)
The system SHALL expose only implemented IPC channels to the renderer.

#### Scenario: Electron API type declarations match preload
- **WHEN** `src/types/electron.d.ts` is compiled
- **THEN** its `llm` object SHALL match `electron/preload.ts` (setAPIKey, hasAPIKey, generate)
- **AND** `window.electronAPI` SHALL be typed, usable, and free of dead channels

#### Scenario: Dialog IPC registered correctly
- **WHEN** the user opens the file dialog
- **THEN** `dialog:openFile` / `dialog:saveFile` SHALL be registered inside `registerFileHandlers` (not dead code outside it)
- **AND** `FileSystemService.openFileDialog` SHALL succeed in Electron mode

