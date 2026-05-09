# 构建与发布贡献指南

**适用对象**: 所有贡献者  
**版本**: v1.0.0

---

## 📋 提交规范

### 提交信息格式

```
<type>(<scope>): <subject>

<body>

<footer>
```

### 类型定义

| Type | Scope | 说明 |
|------|-------|------|
| feat | core-editor, agent-mode | 新功能 |
| fix | terminal, file-system | Bug 修复 |
| docs | README, USER_GUIDE | 文档 |
| refactor | * | 重构 |
| test | * | 测试 |
| chore | build, ci | 构建/CI |
| release | * | 发版 |

### 示例

```bash
feat(agent-mode): 实现 Multi-Agent 协作系统

- 添加 Plan Agent 任务规划功能
- 集成 RAG 向量化索引
- 支持并行执行多个子任务

Closes #123
Refs #456
```

---

## 🌿 分支策略

```
main (受保护)
  ↓ develop
    ↓ feature/xxx
    ↓ bugfix/xxx
    ↓ hotfix/xxx
    ↓ release/v1.1.0
```

### 分支命名

| 类型 | 命名格式 | 示例 |
|------|----------|------|
| 功能 | feature/description | feature/multi-agent |
| Bug 修复 | bugfix/description | bugfix/login-error |
| 热修复 | hotfix/description | hotfix/crash-fix |
| 发布 | release/version | release/v1.1.0 |

---

## 🧪 测试要求

- 单元测试覆盖率 >50%
- 关键路径必须测试
- 集成测试覆盖核心流程
- E2E 测试关键用户路径

---

## 📤 Pull Request 流程

1. Fork & Clone
2. 创建功能分支
3. 开发并提交
4. 创建 PR
5. CI 自动检查
6. Code Review
7. Merge to main

---

**详细文档**: [CICD_SOP.md](../.monkeycode/docs/CICD_SOP.md)

