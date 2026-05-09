# AvatarCode 开发环境配置文档

> 本文档用于记录开发环境的完整配置，便于在新设备上快速重现相同的开发环境。

---

## 📋 目录

- [系统环境](#系统环境)
- [核心工具](#核心工具)
- [项目依赖](#项目依赖)
- [开发工具链](#开发工具链)
- [配置文件](#配置文件)
- [一键部署脚本](#一键部署脚本)
- [常见问题](#常见问题)

---

## 系统环境

### 操作系统

```bash
# 推荐系统
Debian GNU/Linux 12 (bookworm)
```

### 系统资源要求

```bash
# 最低配置
- CPU: 2 核心
- 内存：4GB RAM
- 存储：20GB 可用空间

# 推荐配置
- CPU: 4 核心
- 内存：8GB RAM
- 存储：50GB 可用空间
```

### 当前环境资源

```
文件系统：20GB (已用 23%, 可用 15GB)
内存：7.8GB (已用 7.5GB, 可用 263MB)
Swap: 0B
```

---

## 核心工具

### Node.js 环境

```bash
# Node.js 版本
v22.22.0

# npm 版本
10.9.4

# 安装方式 (使用 nvm 推荐)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 22.22.0
nvm use 22.22.0
nvm alias default 22.22.0
```

### Python

```bash
# Python 版本
Python 3.11.2

# 安装方式
apt-get update && apt-get install -y python3 python3-pip python3-venv
```

### Git

```bash
# Git 版本
git version 2.39.5

# 安装方式
apt-get update && apt-get install -y git
```

### SSH 配置

```bash
# SSH 密钥位置
~/.ssh/id_ed25519 (私钥)
~/.ssh/id_ed25519.pub (公钥)
~/.ssh/config (SSH 配置)
~/.ssh/known_hosts (已知主机)

# 权限要求
chmod 700 ~/.ssh
chmod 600 ~/.ssh/id_ed25519
chmod 644 ~/.ssh/id_ed25519.pub
chmod 644 ~/.ssh/known_hosts
chmod 600 ~/.ssh/config
```

---

## 项目依赖

### 生产依赖 (package.json)

```json
{
  "dependencies": {
    "chokidar": "^3.5.3",
    "chromadb": "^1.8.0",
    "commander": "^11.1.0",
    "fs-extra": "^11.2.0",
    "handlebars": "^4.7.8",
    "isomorphic-git": "^1.25.0",
    "js-yaml": "^4.1.0",
    "langchain": "^0.1.0",
    "monaco-editor": "^0.45.0",
    "node-fetch": "^3.3.2",
    "openai": "^4.20.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "tree-sitter": "^0.20.4",
    "ws": "^8.14.2",
    "zod": "^3.22.4",
    "zustand": "^4.4.7"
  }
}
```

### 开发依赖 (package.json)

```json
{
  "devDependencies": {
    "@testing-library/jest-dom": "^6.9.1",
    "@testing-library/react": "^16.3.2",
    "@types/node": "^20.10.0",
    "@types/react": "^18.2.45",
    "@types/react-dom": "^18.2.18",
    "@typescript-eslint/eslint-plugin": "^6.15.0",
    "@typescript-eslint/parser": "^6.15.0",
    "@vitejs/plugin-react": "^4.2.1",
    "concurrently": "^8.2.2",
    "electron": "^30.0.0",
    "electron-builder": "^24.9.1",
    "eslint": "^8.56.0",
    "eslint-config-prettier": "^9.1.0",
    "eslint-import-resolver-typescript": "^3.6.1",
    "eslint-plugin-import": "^2.29.1",
    "eslint-plugin-react": "^7.33.2",
    "eslint-plugin-react-hooks": "^4.6.0",
    "husky": "^8.0.3",
    "jsdom": "^29.1.1",
    "prettier": "^3.1.1",
    "typescript": "^5.3.3",
    "vite": "^5.0.10",
    "vite-plugin-electron": "^0.28.1",
    "vitest": "^1.6.1"
  }
}
```

### 全局 NPM 包

```bash
npm list -g --depth=0
# ├── corepack@0.34.0
# └── npm@10.9.4
```

---

## 开发工具链

### 语言服务器 (LSP)

项目支持以下语言服务器（需单独安装）：

```bash
# TypeScript (推荐)
npm install -g typescript typescript-language-server

# Python
pip install pyright

# Go
go install golang.org/x/tools/gopls@latest

# Rust
rustup component add rust-analyzer

# Java
# 需要安装 Java Language Server (JDTLS)
```

### 构建工具

```bash
# Vite (前端构建)
npm install -g vite

# TypeScript
npm install -g typescript

# Electron
npm install -g electron
```

### 代码质量工具

```bash
# ESLint (代码检查)
npm install -g eslint

# Prettier (代码格式化)
npm install -g prettier
```

### 测试工具

```bash
# Vitest (单元测试框架)
npm install -g vitest

# 覆盖率工具
npm install -g c8
```

---

## 配置文件

### 项目结构

```
/workspace/
├── .editorconfig          # 编辑器配置
├── .eslintrc.cjs          # ESLint 配置
├── .gitignore             # Git 忽略规则
├── .prettierrc            # Prettier 配置
├── .husky/                # Git hooks
├── .monkeycode/           # 项目文档和规格
├── electron/              # Electron 主进程
├── src/                   # 源代码
├── tests/                 # 测试文件
├── package.json           # 项目配置
├── tsconfig.json          # TypeScript 配置
├── vite.config.ts         # Vite 配置
└── vitest.config.ts       # Vitest 配置
```

### TypeScript 配置 (tsconfig.json)

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "useDefineForClassFields": true,
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "noImplicitAny": true,
    "noImplicitThis": true,
    "strictNullChecks": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"],
      "@components/*": ["src/components/*"],
      "@services/*": ["src/services/*"],
      "@stores/*": ["src/stores/*"],
      "@config/*": ["src/config/*"]
    }
  }
}
```

### Vite 配置 (vite.config.ts)

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@components': path.resolve(__dirname, './src/components'),
      '@services': path.resolve(__dirname, './src/services'),
      '@stores': path.resolve(__dirname, './src/stores'),
    },
  },
  base: './',
  server: {
    port: 3000,
    strictPort: true,
  },
});
```

### ESLint 配置 (.eslintrc.cjs)

关键配置项：
- Parser: `@typescript-eslint/parser`
- 插件：`@typescript-eslint/eslint-plugin`, `eslint-plugin-react`, `eslint-plugin-react-hooks`
- 规则：阿里巴巴编码规范
- 支持：TypeScript 严格模式

### Prettier 配置 (.prettierrc)

```json
{
  "singleQuote": true,
  "trailingComma": "es5",
  "tabWidth": 2,
  "semi": true,
  "printWidth": 100
}
```

---

## 一键部署脚本

### 系统依赖安装脚本

```bash
#!/bin/bash
# setup-system-dependencies.sh

set -e

echo "🚀 开始安装系统依赖..."

# 更新包管理器
sudo apt-get update

# 安装基础工具
sudo apt-get install -y \
  curl \
  git \
  python3 \
  python3-pip \
  python3-venv \
  build-essential \
  libxss1 \
  libgdk-pixbuf2.0-0 \
  libgtk-3-0 \
  libnotify4 \
  libnss3 \
  libxrandr2 \
  libasound2 \
  libxtst6 \
  xdg-utils

echo "✅ 系统依赖安装完成"
```

### Node.js 安装脚本

```bash
#!/bin/bash
# setup-node.sh

set -e

echo "📦 安装 Node.js..."

# 使用 nvm 安装 Node.js
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

nvm install 22.22.0
nvm use 22.22.0
nvm alias default 22.22.0

echo "✅ Node.js 安装完成: $(node --version)"
echo "✅ npm 版本：$(npm --version)"
```

### 项目依赖安装脚本

```bash
#!/bin/bash
# setup-project.sh

set -e

echo "🔧 设置项目环境..."

# 安装项目依赖
npm install --legacy-peer-deps

# 安装全局工具
npm install -g typescript typescript-language-server

# 设置 Git hooks
npm run prepare

echo "✅ 项目依赖安装完成"
```

### 完整一键部署脚本

```bash
#!/bin/bash
# one-click-setup.sh

set -e

echo "🌟 AvatarCode 一键部署脚本"
echo "=========================="

# 1. 系统依赖
echo "Step 1/4: 安装系统依赖..."
sudo apt-get update
sudo apt-get install -y \
  curl git python3 python3-pip build-essential \
  libxss1 libgdk-pixbuf2.0-0 libgtk-3-0 libnotify4 \
  libnss3 libxrandr2 libasound2 libxtst6 xdg-utils

# 2. Node.js
echo "Step 2/4: 安装 Node.js..."
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
nvm install 22.22.0
nvm use 22.22.0

# 3. 项目依赖
echo "Step 3/4: 安装项目依赖..."
npm install --legacy-peer-deps

# 4. 验证安装
echo "Step 4/4: 验证安装..."
echo "Node.js: $(node --version)"
echo "npm: $(npm --version)"
echo "Git: $(git --version)"

# 运行类型检查
npm run typecheck

# 运行测试
npm test

echo ""
echo "🎉 部署完成!"
echo ""
echo "启动开发服务器:"
echo "  npm run dev"
echo ""
echo "运行测试:"
echo "  npm test"
echo ""
echo "构建 Electron 应用:"
echo "  npm run electron:build"
```

### Docker 部署 (可选)

```dockerfile
# Dockerfile
FROM node:22.22.0-bookworm

# 安装系统依赖
RUN apt-get update && apt-get install -y \
  git \
  python3 \
  build-essential \
  libxss1 libgtk-3-0 libnotify4 libnss3 \
  && rm -rf /var/lib/apt/lists/*

# 设置工作目录
WORKDIR /app

# 复制 package 文件
COPY package*.json ./

# 安装依赖
RUN npm install --legacy-peer-deps

# 复制源代码
COPY . .

# 暴露端口
EXPOSE 3000

# 默认命令
CMD ["npm", "run", "dev"]
```

```bash
# 构建和运行 Docker 容器
docker build -t avatarcode .
docker run -p 3000:3000 -v $(pwd):/app avatarcode
```

---

## 常见问题

### 1. npm install 失败

```bash
# 清除 npm 缓存
npm cache clean --force

# 使用 legacy-peer-deps
npm install --legacy-peer-deps

# 或使用 yarn
yarn install
```

### 2. Electron 安装失败

```bash
# 设置 Electron 镜像
export ELECTRON_MIRROR="https://npmmirror.com/mirrors/electron/"
npm install electron
```

### 3. TypeScript 编译错误

```bash
# 清除构建缓存
rm -rf node_modules/.cache
npm run typecheck
```

### 4. 测试运行失败

```bash
# 确保安装测试依赖
npm install -D jsdom @testing-library/react @testing-library/jest-dom

# 使用特定配置运行
npx vitest run --config vitest.node.config.ts
```

### 5. ESLint 报错

```bash
# 添加 parserOptions.project 到 .eslintrc.cjs
parserOptions: {
  project: './tsconfig.json',
}

# 或禁用需要类型信息的规则
'@typescript-eslint/prefer-nullish-coalescing': 'off'
```

### 6. Monaco Editor 无法加载

```bash
# 确保 monaco-editor 正确安装
npm install monaco-editor@^0.45.0

# 或使用 CDN 加载
// 在 vite.config.ts 中配置
optimizeDeps: {
  exclude: ['monaco-editor'],
}
```

### 7. Git Submodule 问题

```bash
# 初始化 submodule
git submodule update --init --recursive --depth 1
```

### 8. SSH 密钥权限问题

```bash
# 修复 SSH 权限
chmod 700 ~/.ssh
chmod 600 ~/.ssh/id_ed25519
chmod 644 ~/.ssh/id_ed25519.pub
```

---

## 环境变量配置

### 开发环境变量 (.env.example)

```bash
# OpenAI API
VITE_OPENAI_API_KEY=your_openai_api_key

# Anthropic API
VITE_ANTHROPIC_API_KEY=your_anthropic_api_key

# 本地模型
VITE_OLLAMA_BASE_URL=http://localhost:11434

# 后端 API
VITE_BACKEND_URL=http://localhost:3001
```

---

## 开发服务器配置

### 端口配置

```bash
# 前端开发服务器
PORT=3000

# 后端 API 服务器
BACKEND_PORT=3001

# Vite 预览服务器
PREVIEW_PORT=4173
```

### 代理配置

开发环境下，Vite 配置了反向代理：

```typescript
server: {
  proxy: {
    '/api': {
      target: 'http://localhost:3001',
      changeOrigin: true,
    },
  },
}
```

---

## 性能优化建议

### 1. 内存优化

```bash
# 增加 Node.js 内存限制
export NODE_OPTIONS="--max-old-space-size=4096"
```

### 2. 构建优化

```bash
# 使用 SWC 替代 Babel (更快)
npm install -D @vitejs/plugin-react-swc

# 在 vite.config.ts 中切换
import react from '@vitejs/plugin-react-swc';
```

### 3. 依赖优化

```bash
# 使用 pnpm (更快更节省空间)
npm install -g pnpm
pnpm install
```

---

## 验证清单

部署完成后，运行以下检查：

```bash
# ✅ Node.js 版本
node --version  # 应显示 v22.22.0

# ✅ npm 版本
npm --version  # 应显示 10.9.4

# ✅ Git 版本
git --version  # 应显示 git version 2.39.5

# ✅ Python 版本
python3 --version  # 应显示 Python 3.11.2

# ✅ 项目依赖
npm list --depth=0  # 应显示所有依赖

# ✅ TypeScript 编译
npm run typecheck  # 应无错误

# ✅ 测试运行
npm test  # 应通过测试

# ✅ ESLint 检查
npm run lint  # 应无错误

# ✅ 代码格式化
npm run format:check  # 应通过检查
```

---

## 资源链接

- [项目仓库](https://github.com/hnwlg2009/AvatarCode)
- [Node.js 官方文档](https://nodejs.org/)
- [Vite 官方文档](https://vitejs.dev/)
- [TypeScript 官方文档](https://www.typescriptlang.org/)
- [Electron 官方文档](https://www.electronjs.org/)
- [Monaco Editor 文档](https://microsoft.github.io/monaco-editor/)

---

## 更新日志

### v2026.05.05 (当前版本)

- Debian 12 (bookworm)
- Node.js v22.22.0
- npm 10.9.4
- Python 3.11.2
- Git 2.39.5
- TypeScript 5.3.3
- Vite 5.0.10
- React 18.2.0
- Electron 30.0.0
- Monaco Editor 0.45.0

### 维护说明

- 定期更新 `package.json` 中的版本号
- 记录重大依赖变更
- 更新已验证的配置项

---

**文档生成时间**: 2026-05-05
**最后更新**: 2026-05-05
**维护者**: devin WLG <devinWLG@users.noreply.github.com>
