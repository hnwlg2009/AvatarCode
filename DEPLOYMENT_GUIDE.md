# AvatarCode 部署指南

本文档提供多种部署方式，选择适合你的方式进行快速部署。

---

## 📌 方式一：一键脚本部署 (最简单)

适用于：Linux 系统，首次部署

```bash
# 克隆仓库
git clone https://github.com/hnwlg2009/AvatarCode.git
cd AvatarCode

# 运行一键部署脚本
chmod +x setup.sh
./setup.sh
```

脚本会自动完成：
- ✅ 系统依赖安装 (curl, git, python3, build-essential 等)
- ✅ Node.js 22.22.0 安装 (通过 nvm)
- ✅ npm 依赖安装
- ✅ 全局工具安装 (typescript, typescript-language-server)
- ✅ 运行测试验证

---

## 📌 方式二：手动逐步部署

适用于：需要精确控制安装过程

### Step 1: 安装系统依赖

```bash
# Debian/Ubuntu
sudo apt-get update
sudo apt-get install -y \
  curl git python3 python3-pip \
  build-essential \
  libxss1 libgdk-pixbuf2.0-0 libgtk-3-0 \
  libnotify4 libnss3 libxrandr2 libasound2 libxtst6
```

### Step 2: 安装 Node.js

```bash
# 使用 nvm (推荐)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

# 安装 Node.js 22.22.0
nvm install 22.22.0
nvm use 22.22.0
nvm alias default 22.22.0

# 验证
node --version  # v22.22.0
npm --version   # 10.9.4
```

### Step 3: 安装项目依赖

```bash
cd /path/to/AvatarCode
npm install --legacy-peer-deps
```

### Step 4: 验证安装

```bash
# TypeScript 类型检查
npm run typecheck

# 运行测试
npm test

# 启动开发服务器
npm run dev
```

---

## 📌 方式三：Docker 部署

适用于：需要隔离环境或 CI/CD

### 使用 Dockerfile

```bash
# 构建镜像
docker build -t avatarcode .

# 运行容器
docker run -p 3000:3000 -v $(pwd):/app avatarcode
```

### 使用 docker-compose

创建 `docker-compose.yml`:

```yaml
version: '3.8'

services:
  avatarcode:
    build: .
    ports:
      - "3000:3000"
    volumes:
      - .:/app
      - node_modules:/app/node_modules
    environment:
      - NODE_ENV=development
    command: npm run dev

volumes:
  node_modules:
```

运行:

```bash
docker-compose up -d
```

---

## 📌 方式四：DevContainer 部署 (VS Code)

适用于：使用 VS Code Remote 开发

创建 `.devcontainer/devcontainer.json`:

```json
{
  "name": "AvatarCode",
  "image": "mcr.microsoft.com/devcontainers/typescript-node:22-bookworm",
  "features": {
    "git": "os-provided",
    "python": "3.11"
  },
  "forwardPorts": [3000],
  "postCreateCommand": "npm install --legacy-peer-deps",
  "customizations": {
    "vscode": {
      "extensions": [
        "dbaeumer.vscode-eslint",
        "esbenp.prettier-vscode",
        "bradlc.vscode-tailwindcss"
      ]
    }
  }
}
```

在 VS Code 中：
1. Command + Shift + P
2. 选择 "Dev Containers: Reopen in Container"

---

## 📌 方式五：WSL2 部署 (Windows)

适用于：Windows 用户

### Step 1: 安装 WSL2

```powershell
# 在 PowerShell (管理员) 中运行
wsl --install -d Debian
```

### Step 2: 在 WSL 中部署

```bash
# 进入 WSL
wsl

# 安装 Node.js
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
nvm install 22.22.0

# 克隆并安装
git clone https://github.com/hnwlg2009/AvatarCode.git
cd AvatarCode
npm install --legacy-peer-deps
```

---

## 🔧 故障排查

### 问题 1: npm install 卡住

```bash
# 使用淘宝镜像
npm config set registry https://registry.npmmirror.com

# 清除缓存重试
npm cache clean --force
npm install --legacy-peer-deps
```

### 问题 2: Electron 下载失败

```bash
# 设置 Electron 镜像
export ELECTRON_MIRROR="https://npmmirror.com/mirrors/electron/"
npm install electron
```

### 问题 3: 权限错误

```bash
# 修复 npm 权限
mkdir ~/.npm-global
npm config set prefix '~/.npm-global'
echo 'export PATH=~/.npm-global/bin:$PATH' >> ~/.bashrc
source ~/.bashrc
```

### 问题 4: 内存不足

```bash
# 设置 Node.js 内存限制
export NODE_OPTIONS="--max-old-space-size=4096"
```

---

## ✅ 验证清单

部署完成后，确认以下项目：

- [ ] `node --version` 显示 v22.22.0
- [ ] `npm --version` 显示 10.9.4
- [ ] `git --version` 显示 git version 2.39.5+
- [ ] `npm run typecheck` 无错误
- [ ] `npm test` 通过基础测试
- [ ] `npm run dev` 成功启动开发服务器 (http://localhost:3000)

---

## 📞 支持

如遇到问题，请：

1. 查看 [ENVIRONMENT_SETUP.md](./ENVIRONMENT_SETUP.md) 获取详细配置
2. 查看常见问题章节
3. 提交 Issue: https://github.com/hnwlg2009/AvatarCode/issues

---

**文档版本**: 2026.05.05
**维护者**: devin WLG <devinWLG@users.noreply.github.com>
