# AvatarCode (分身Code) - 功能规格说明书 (SPEC)

**版本**: 1.0  
**状态**: 草案  
**作者**: devin WLG  
**日期**: 2026-04-29

---

## 1. 概述

### 1.1 项目背景
企业在日常研发中需要频繁使用多种大语言模型（LLM）、接入外部工具（MCP服务器）和安装各种可插拔技能（Skills）。但这些能力分散在不同平台，缺乏统一管理入口，密钥明文存储风险高，配置复杂且无法编排。AvatarCode 旨在提供一个一站式 CLI 工具，像管理代码依赖一样管理 AI 代理的"分身能力"。

### 1.2 目标用户
- **开发者**：希望在终端中快速切换模型、调用技能、接入工具链。
- **DevOps/SRE**：需要批量配置、自动化脚本集成、加密存储凭证。
- **技术团队**：统一团队内的 AI 工具链和配置规范。

### 1.3 核心价值
- **统一入口**：一个命令管理 Skills、MCP 和模型。
- **安全第一**：密钥加密存储，传输安全。
- **可编排**：支持多模型协同、技能管道。
- **跨平台**：支持 Linux、macOS、Windows。

---

## 2. 总体架构

### 2.1 CLI 框架
推荐使用 **Python (Click/Typer)** 或 **Rust (Clap)**，优先选择生态丰富、易于扩展的语言。本 Spec 以 Python + Click 为例。

### 2.2 插件机制
- **Skills**：通过 Python 包或容器化沙箱加载，遵循标准接口（如 `run(input) -> output`）。
- **MCP**：实现 MCP 客户端协议，与外部服务器通过 HTTP/SSE 通信。
- **模型**：统一适配 OpenAI API 兼容格式，内部通过适配器模式支持多提供商。

### 2.3 总体流程
```
用户输入 → CLI 解析 → 认证管理器（密钥解密） → 服务调度（技能/MCP/模型） → 结果输出
```

---

## 3. 命令树与完整 CLI 接口定义

### 3.1 顶级命令
```bash
fenshen [OPTIONS] COMMAND [ARGS]...
```

全局选项：
- `--profile <name>` ：选择配置 profile（默认 default）。
- `--output (text|json|yaml)` ：输出格式，默认 text。
- `--verbose / -v` ：详细日志。
- `--help` ：帮助。

### 3.2 Skills 广场命令

#### 搜索技能
```bash
fenshen skills search [OPTIONS] <keyword>
```
- **输入**: 关键词字符串
- **输出**: 表格形式显示 名称、版本、描述、作者
- **示例**:
  ```
  $ fenshen skills search web
  Name              Version   Description
  web-scraper       0.1.0     Extract content from web pages
  web-search        1.2.0     Search the web using Bing API
  ```

#### 安装技能
```bash
fenshen skills install [OPTIONS] <skill-name>
```
- **选项**: `--version <ver>` 指定版本，默认最新。
- **输出**: 进度指示，安装完成确认。
- **示例**:
  ```
  $ fenshen skills install web-scraper
  ⠋ Downloading... 100%
  ✓ Installed web-scraper v0.1.0
  ```

#### 列出已安装
```bash
fenshen skills list
```
- **输出**: 已安装技能列表，含版本和状态。

#### 更新技能
```bash
fenshen skills update [OPTIONS] <skill-name>
```
- **选项**: `--all` 更新全部。
- **输出**: 更新日志。

#### 卸载技能
```bash
fenshen skills uninstall <skill-name>
```
- **输出**: 确认提示，卸载完成。

#### 查看详情
```bash
fenshen skills info <skill-name>
```
- **输出**: 名称、版本、作者、描述、依赖、所需权限、配置说明。

### 3.3 MCP 广场命令

#### 搜索 MCP 服务器
```bash
fenshen mcp search <keyword>
```
- **输出**: 名称、URL、描述、认证方式。

#### 添加服务器
```bash
fenshen mcp add <url> [--name <alias>] [--auth (oauth|api-key)] [--key <value>]
```
- **示例**:
  ```
  $ fenshen mcp add https://tools.example.com --name my-tools --auth api-key --key sk-xxx
  ✓ MCP server 'my-tools' added and configured.
  ```

#### 列出服务器
```bash
fenshen mcp list
```
- **输出**: 别名、URL、状态（连通性）、认证方式。

#### 移除服务器
```bash
fenshen mcp remove <name>
```

#### 连通性测试
```bash
fenshen mcp test <name>
```
- **输出**: 延迟、协议版本、可用工具列表。

#### 查看详情
```bash
fenshen mcp info <name>
```

### 3.4 模型管理命令

#### 添加模型提供商
```bash
fenshen model add <provider> [OPTIONS]
```
- **选项**:
  - `--api-key <key>`: API 密钥
  - `--endpoint <url>`: 自定义端点（如 Ollama）
  - `--default-model <model>`: 该提供商的默认模型
- **支持的提供商别名**: openai, anthropic, cohere, gemini, deepseek, ollama, vllm, localai 等。

#### 列出模型
```bash
fenshen model list
```
- **输出**: 名称、提供商、默认标记。

#### 设置默认模型
```bash
fenshen model set-default <model-identifier>
```
- **示例**: `fenshen model set-default openai:gpt-4o`

#### 删除模型配置
```bash
fenshen model remove <model-identifier>
```

#### 测试连通性
```bash
fenshen model test <model-identifier>
```

#### 高级配置（可选）
```bash
fenshen model config <model-identifier> [--temperature 0.7] [--max-tokens 4096] [--system-prompt "You are helpful..."]
```

---

## 4. 交互设计

- **彩色输出**：使用 Rich (Python) 或类似库，状态用 ✓ ✗，分类用颜色区分（绿色成功，红色错误，黄色警告）。
- **进度指示**：安装、测试等长时间任务显示动态进度条或旋转图标。
- **机器可读**：`--output json` 或 `-o yaml` 输出结构化数据，便于脚本集成。
- **帮助文档**：每个命令均有详细帮助，`fenshen COMMAND --help`。

---

## 5. 配置管理

### 5.1 全局配置文件
路径：`~/.avatarcode/config.yaml`

结构示例：
```yaml
default_model: openai:gpt-4o
profiles:
  default:
    mcp_servers:
      - my-tools
    skills_auto_update: true
  work:
    mcp_servers:
      - corp-tools
```

### 5.2 环境变量映射
- `AVATARCODE_DEFAULT_MODEL`
- `AVATARCODE_API_KEY_OPENAI`
- `AVATARCODE_MCP_TIMEOUT`
- `AVATARCODE_PROFILE` (等同于 `--profile`)
环境变量优先级高于配置文件。

### 5.3 多 Profile 支持
通过 `--profile` 或环境变量切换不同配置上下文，实现工作/个人环境隔离。

---

## 6. 安全与权限

### 6.1 API 密钥管理
- 存储：加密存储于 `~/.avatarcode/credentials.enc`。
- 加密方式：AES-256-GCM，主密钥来自系统密钥环（Keychain/macOS, libsecret/Linux, Credential Manager/Windows）或通过主密码派生。
- 运行时：仅在需要时解密，不记录明文日志。

### 6.2 Skills 权限模型
- Skills 需声明所需权限（如网络、文件系统）。
- 安装时展示权限清单，用户确认。
- 运行时可选沙箱（如 Docker 容器或 gVisor）。

### 6.3 MCP 传输安全
- 强制 HTTPS/TLS 连接。
- 支持 OAuth 2.0 和静态 API Key，密钥加密存储。
- 可选 mTLS 双向认证。

---

## 7. 错误处理与离线降级

- 网络错误：明确提示超时或连接失败，支持重试配置。
- 密钥缺失：引导用户添加 API Key。
- MCP 不可用：降级为本地 Skills 或模型直连，记录告警。
- 离线模式：本地已安装 Skills 和已缓存模型配置可继续使用。

---

## 8. 目录与文件结构

```
安装目录 (如 /usr/local/lib/avatarcode)：
├── core/
├── adapters/
└── cli.py

用户数据目录 (~/.avatarcode/)：
├── config.yaml
├── credentials.enc
├── skills/                 # 已安装技能代码
│   ├── web-scraper/
│   └── ...
├── mcp-servers.json        # MCP 配置
└── models.json             # 模型提供商及密钥引用
```

---

## 9. 非功能性需求

- **性能**：命令响应 < 100ms 无网络操作，安装 Skills 支持并行下载。
- **可扩展性**：技能和模型适配器遵循接口规范，可第三方贡献。
- **跨平台**：Linux (glibc/musl), macOS (Apple Silicon & Intel), Windows (MSVC)。
- **日志**：结构化日志，可输出到文件。

---

## 10. 未来扩展考虑

- **GUI 适配**：提供 TUI（终端图形界面）或桌面应用。
- **团队协作**：共享 Skills 和 MCP 配置仓库。
- **Skills 沙箱**：强制执行安全策略。
- **用量统计与成本分析**：记录 Token 用量，按模型/技能计算成本。
- **Skills 市场**：公共注册中心，实现 `fenshen skills publish`。

---

## 附录：典型使用场景

### 场景 1：代码审查自动化
```bash
fenshen model add openai --api-key=sk-xxx
fenshen skills install code-review
fenshen chat --skill code-review --model openai:gpt-4o
```

### 场景 2：多模型对比
```bash
fenshen model add anthropic --api-key=...
fenshen model add deepseek --api-key=...
fenshen chat --compare anthropic:claude-3 deepseek:chat
```

---

> **文档维护说明**：本 SPEC 为 AvatarCode 的核心设计基线，开发过程中如有变更需更新本文档及相应 API 参考。
