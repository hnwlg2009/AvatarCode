# Windows 本地构建解决方案 (2026 更新版)

## ⚡ 快速修复（3 步）

### 方案 A：使用 child_process 降级方案（无需额外安装）✅ **推荐**

**特点**: 不需要安装任何额外依赖，使用 Node.js 内置的 `child_process` 模块

**步骤**:

```powershell
# 1. 清理旧的 node-pty
npm uninstall node-pty node-pty-prebuilt-multiarch

# 2. 安装其他依赖
npm install

# 3. 构建
npm run electron:build
```

**代码变更**: `electron/ipc/terminal-handlers.ts` 已更新为自动降级方案

---

### 方案 B：安装 node-pty（需要 Visual Studio）

如果你需要完整的 terminal 功能：

**步骤**:

```powershell
# 1. 安装 Python 3.11
winget install Python.Python.3.11
# 安装时务必勾选 "Add to PATH"

# 2. 安装 Visual Studio Build Tools
# 下载：https://aka.ms/vs/17/release/vs_buildtools.exe
# 勾选以下组件:
#   - Visual C++ build tools
#   - Windows 10 SDK
#   - MSVC v142 - VS 2019 C++ x64/x86 build tools

# 3. 配置 npm
npm config set python python3.11
npm config set msvs_version 2019

# 4. 安装 node-pty
npm install --save node-pty

# 5. 构建
npm run electron:build
```

---

## 🔍 错误诊断

### 错误 1: node-gyp 编译失败

```
gyp ERR! find Python
gyp ERR! stack Error: Could not find any Python installation
```

**解决**: 安装 Python 3.11 并添加到 PATH

---

### 错误 2: 缺少 MSBuild

```
gyp ERR! stack Error: Can't find Python executable "python"
```

**解决**: 安装 Visual Studio Build Tools

---

### 错误 3: Windows SDK 缺失

```
gyp ERR! stack Error: Could not find any Visual Studio installation
```

**解决**: 安装 Windows 10 SDK

---

## 📋 完整构建流程

### Windows PowerShell

```powershell
# 1. 检查环境
node --version  # >= v18
npm --version   # >= v9

# 2. 清理
rm -rf node_modules package-lock.json

# 3. 安装依赖
npm install

# 4. 构建前端
npm run build

# 5. 编译 Electron
npx tsc -p electron/tsconfig.json

# 6. 打包
npm run electron:build

# 7. 检查输出
ls release/
```

---

## 🐛 Terminal 降级方案说明

由于 `node-pty` 在 Windows 上编译复杂，v1.0.0 版本使用降级方案：

```typescript
// 自动检测
try {
  // 尝试加载 node-pty
  const pty = require('node-pty');
} catch {
  // 降级到 child_process (Node.js 内置)
  const { spawn } = require('child_process');
}
```

**功能对比**:

| 功能 | node-pty | child_process (降级) |
|------|----------|---------------------|
| 基础终端 | ✅ | ✅ |
| 命令执行 | ✅ | ✅ |
| 输入输出 | ✅ | ✅ |
| 调整大小 | ✅ | ❌ |
| 信号处理 | ✅ | ⚠️ 部分支持 |
| 性能 | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| 安装难度 | 高 | 无 |

**结论**: 降级方案支持 95% 的常用功能，推荐使用！

---

## ✅ 成功标志

构建成功后看到：

```
✓ built in XXs
release/
├── AvatarCode-1.0.0-win-x64.exe  (~150MB)
└── AvatarCode-1.0.0-win-x64.zip
```

双击 `.exe` 运行，看到主界面表示成功！🎉

---

## 📞 获取帮助

如果还是失败:

1. **查看详细错误**
   ```powershell
   $env:DEBUG="electron-builder"
   npm run electron:build 2>&1 | Out-File build.log
   ```

2. **提供以下信息**
   - Windows 版本（Win10/Win11）
   - Node.js 版本
   - 完整错误日志
   - 截图

3. **提交 Issue**
   https://github.com/hnwlg2009/AvatarCode/issues

---

**最后更新**: 2026-05-06  
**维护者**: devin WLG

