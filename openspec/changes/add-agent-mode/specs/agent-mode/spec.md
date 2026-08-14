## ADDED Requirements

### Requirement: Agent Panel
The system SHALL provide an Agent panel for interacting with AI agent.

#### Scenario: Open Agent panel
- **WHEN** user clicks Agent tab in the right panel
- **THEN** Agent panel SHALL be displayed
- **AND** show conversation history
- **AND** input is disabled while a task is executing

### Requirement: Agent Conversation
The system SHALL support multi-turn conversation with AI agent.

#### Scenario: Send message to agent
- **WHEN** user sends a message
- **THEN** the message SHALL be routed through the LLM provider
- **AND** the response SHALL be displayed in the conversation
- **AND** tool call cards SHALL be rendered (name/args/result/duration/status)

#### Scenario: Display agent response
- **WHEN** agent responds
- **THEN** response SHALL be displayed
- **AND** tool results and status badges SHALL be shown per tool call

### Requirement: LLM Provider
The system SHALL use the main process as the API-key holder and route calls over IPC.

#### Scenario: Call LLM through IPC
- **WHEN** a message is sent
- **THEN** the renderer SHALL call `window.electronAPI.llm.generate` (OpenAI or Anthropic)
- **AND** the main process SHALL return `{ content, toolCalls?, usage, model }`

#### Scenario: No API key configured
- **WHEN** no API key is configured
- **THEN** the system SHALL fall back to the MockProvider for the Agent panel
- **AND** the Chat panel SHALL show a configuration error message

### Requirement: Tool Calling
The system SHALL support tool calling for file operations via JSON Schema definitions.

#### Scenario: Agent calls file read tool
- **WHEN** agent needs to read a file
- **THEN** `read_file` SHALL be executed
- **AND** file content SHALL be returned to agent

#### Scenario: Agent calls file write tool
- **WHEN** agent needs to write a file
- **THEN** `write_file` SHALL be executed
- **AND** the file SHALL be created/updated

#### Scenario: Agent lists directory contents
- **WHEN** agent needs to inspect a directory
- **THEN** `list_files` / `read_dir` SHALL be executed
- **AND** directory entries SHALL be returned to agent

#### Scenario: Agent executes a command
- **WHEN** agent requests `execute_command`
- **THEN** an approval request SHALL be returned
- **AND** the command SHALL be executed via terminal IPC only after UI approval

### Requirement: Task Execution
The system SHALL support multi-stage task execution via the Agent Orchestrator.

#### Scenario: Execute task
- **WHEN** agent receives a task
- **THEN** the orchestrator SHALL run Explore/Plan/Execute/Review stages
- **AND** tool-calling loop SHALL be limited to 20 iterations
- **AND** progress SHALL be displayed (status badge + current task)

#### Scenario: Show task result
- **WHEN** the task completes or fails
- **THEN** the final answer SHALL be displayed
- **AND** success/failure status SHALL be shown

#### Scenario: Stop execution
- **WHEN** user stops the running task
- **THEN** the orchestrator SHALL abort via AbortController
