# AvatarCode 快速开始指南

> AI-Native 代码编辑器 - 下一代智能开发环境

[![Node.js](https://img.shields.io/badge/Node.js-v22.22.0-green.svg)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3.3-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18.2.0-61dafb.svg)](https://reactjs.org/)
[![Electron](https://img.shields.io/badge/Electron-30.0.0-47848F.svg)](https://www.electronjs.org/)

---

## ⚡ 一键部署 (推荐)

### 使用部署脚本

```bash
# 克隆仓库
git clone https://github.com/hnwlg2009/AvatarCode.git
cd AvatarCode

# 一键部署 (自动安装 Node.js + 依赖)
./setup.sh
```

### 手动部署

```bash
# 1. 安装 Node.js 22.22.0
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 22.22.0
nvm use 22.22.0

# 2. 安装项目依赖
npm install --legacy-peer-deps

# 3. 验证安装
npm run typecheck
npm test
```

---

## 🚀 开发命令

```bash
# 启动开发服务器
npm run dev

# 构建生产版本
npm run build

# 运行测试
npm test

# 测试监视模式
npm run test:watch

# 生成测试覆盖率报告
npm run test:coverage

# 代码检查
npm run lint

# 代码格式化
npm run format

# TypeScript 类型检查
npm run typecheck

# Electron 开发模式
npm run electron:dev

# Electron 打包构建
npm run electron:build
```

---

## 📋 系统要求

### 最低配置

- **操作系统**: Debian 12 / Ubuntu 20.04+
- **CPU**: 2 核心
- **内存**: 4GB RAM
- **存储**: 20GB 可用空间

### 推荐配置

- **操作系统**: Debian 12 / Ubuntu 22.04+
- **CPU**: 4 核心
- **内存**: 8GB RAM
- **存储**: 50GB 可用空间

---

## 📦 核心技术栈

- **运行时**: Node.js 22.22.0, Electron 30.0.0
- **前端框架**: React 18.2.0 + TypeScript 5.3.3
- **构建工具**: Vite 5.0.10
- **编辑器内核**: Monaco Editor 0.45.0
- **状态管理**: Zustand 4.4.7
- **测试框架**: Vitest 1.6.1
- **代码规范**: ESLint + Prettier (阿里巴巴规范)

---

## 📚 文档

- [环境配置详解](./ENVIRONMENT_SETUP.md) - 完整的开发环境配置文档
- [规格说明](./SPEC.md) - 项目技术规格说明
- [项目文档](./.monkeycode/docs/) - 详细开发和设计文档

---

## 🤝 贡献

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

---

## 📄 许可证

MIT License - 详见 [LICENSE](./LICENSE) 文件

---

## 👤 作者

**devin WLG**
- GitHub: [@hnwlg2009](https://github.com/hnwlg2009)
- Email: devinWLG@users.noreply.github.com

---

## 🙏 致谢

- [Monaco Editor](https://microsoft.github.io/monaco-editor/) - VS Code 同款编辑器
- [Electron](https://www.electronjs.org/) - 跨平台桌面应用框架
- [Vite](https://vitejs.dev/) - 下一代前端构建工具
- [TypeScript](https://www.typescriptlang.org/) - 类型安全的 JavaScript

---

**最后更新**: 2026-05-05
