## ADDED Requirements

### Requirement: Single Tool Registry (ToolManager)
The system SHALL register all Agent tools through one `ToolManager` in `src/features/agent/ToolManager.ts`, with no parallel service.

#### Scenario: Tool registration and retrieval
- **WHEN** a tool module exports a `Tool` and calls `toolManager.registerTool(tool)`
- **THEN** the tool SHALL be retrievable via `getTool(name)` and listed by `getAllTools()`
- **AND** re-registration SHALL replace (not duplicate) the existing tool

#### Scenario: Removal service is retired
- **WHEN** the system boots the Agent feature
- **THEN** `src/services/AgentToolService.ts` SHALL NOT exist or be imported
- **AND** all file, search, editor, terminal tool capabilities SHALL live under `src/features/agent/tools/`

#### Scenario: Tool schema converter
- **WHEN** tools are registered
- **THEN** `ToolManager.toLLMToolSchema()` SHALL return `LLMTool[]` mapping name+description+parameters from each tool
- **AND** `getToolsSchema()` SHALL use `Array.from(map.values())` (no `.map` on a `MapIterator`)

### Requirement: Uniform Tool Executable Signature
The system SHALL define tool `execute(args: Record<string, any>)` with validation inside each implementation.

#### Scenario: Every tool accepts a generic arg record
- **WHEN** any tool's `execute` is defined
- **THEN** its parameter type SHALL be `Record<string, any>`
- **AND** the tool SHALL validate required fields and reject with a stable error message if missing

#### Scenario: Tool execution result contract
- **WHEN** a tool completes
- **THEN** it SHALL return `ToolExecutionResult` (`success`, `result`, optional `error`)
- **AND** failures SHALL set `success: false` with an `error` message and no thrown unhandled rejection

### Requirement: Real Tool Implementations
The system SHALL implement the file, search, edit, and terminal tools with real behavior (no placeholders).

#### Scenario: File tools (read / write)
- **WHEN** `read_file` is called with a valid path
- **THEN** it SHALL return the file content via `FileSystemService`
- **WHEN** `write_file` is called with a path and content
- **THEN** it SHALL persist content and return a success message
- **AND** both SHALL respect workspace path restrictions (via `PathSecurity`/`FileSystemService`)

#### Scenario: Search tool finds code
- **WHEN** `search_code` runs with a query and optional directory
- **THEN** it SHALL perform a real recursive search over matching source files
- **AND** return a list of `{ path, line, snippet }` matches (not a "not implemented" stub)

#### Scenario: Editor tool drives editor state
- **WHEN** `editor_action` runs (`open` / `focus`)
- **THEN** it SHALL call `editorStore`/`tabManagerStore` to open or focus the given file path
- **AND** return success only when the action is applied

#### Scenario: Terminal tool requires approval
- **WHEN** `execute_command` is invoked
- **THEN** it SHALL NOT run shell commands implicitly
- **AND** it SHALL return a request object that the UI can approve or deny before executing through the terminal IPC bridge

### Requirement: Tool State Visibility
The system SHALL expose tool runtime state to the UI without extra plumbing.

#### Scenario: Tool progress observable from store
- **WHEN** a tool starts and finishes
- **THEN** the store SHALL record `{ name, args, status: 'running'|'done'|'error', duration }`
- **AND** the UI SHALL render it as a tool card