## 1. Agent状态管理

- [x] 1.1 创建 agentStore.ts
- [x] 1.2 定义 AgentMessage 接口
- [x] 1.3 定义 AgentTool 接口
- [x] 1.4 实现消息管理 actions

## 2. Agent UI组件

- [x] 2.1 创建 AgentPanel.tsx 组件
- [x] 2.2 创建 AgentMessage.tsx 组件
- [x] 2.3 创建 AgentInput.tsx 组件
- [x] 2.4 创建 AgentToolResult.tsx 组件

## 3. 工具调用实现

- [x] 3.1 定义工具 Schema
- [x] 3.2 实现 read_file 工具
- [x] 3.3 实现 write_file 工具
- [x] 3.4 实现 execute_command 工具
- [x] 3.5 实现 search_code 工具

## 4. LLM集成

- [x] 4.1 更新 llm-handlers.ts 支持工具调用
- [x] 4.2 实现流式响应处理
- [x] 4.3 实现错误处理和重试

## 5. 测试与打包

- [x] 5.1 测试Agent对话功能
- [x] 5.2 测试工具调用功能
- [x] 5.3 重新打包Windows版本
