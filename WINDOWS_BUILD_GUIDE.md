# AvatarCode Windows 打包指南

AvatarCode v0.9.0 的 Windows 可执行文件需要在 **Windows 10/11** 环境下打包。

## 📋 前置要求

### 系统要求
- **操作系统**: Windows 10/11 (64 位)
- **Node.js**: v18.x 或更高版本
- **npm**: v9.x 或更高版本
- **磁盘空间**: 至少 2GB 可用空间

### 依赖安装
```powershell
# 1. 安装 Visual C++ Redistributable (必需)
# 下载：https://aka.ms/vs/17/release/vc_redist.x64.exe

# 2. 安装 Python (可选，用于原生模块编译)
winget install Python.Python.3.11
```

## 🚀 打包步骤

### 1. 克隆项目
```powershell
git clone https://github.com/hnwlg2009/AvatarCode.git
cd AvatarCode
git checkout 260429-feat-avatarcode-spec
```

### 2. 安装依赖
```powershell
npm install
```

### 3. 运行打包
```powershell
npm run electron:build
```

打包过程约需 **5-10 分钟**，完成后在 `release/` 目录生成以下文件：

## 📦 输出文件

| 文件名 | 大小 | 说明 |
|--------|------|------|
| `AvatarCode-0.9.0-win-x64.exe` | ~150MB | NSIS 安装程序（推荐） |
| `AvatarCode-0.9.0-win-x64.zip` | ~150MB | 绿色免安装版 |

## 🔧 安装与运行

### 安装程序版 (.exe)
1. 双击 `AvatarCode-0.9.0-win-x64.exe`
2. 选择安装路径（默认 `C:\Program Files\AvatarCode`）
3. 创建桌面快捷方式
4. 完成安装

### 绿色版 (.zip)
1. 解压到任意目录
2. 双击 `AvatarCode.exe` 运行

## ⚠️ 常见问题

### 1. node-pty 安装失败
```powershell
# 解决方法：手动安装
npm install --save node-pty-prebuilt-multiarch
npm rebuild node-pty-prebuilt-multiarch
```

### 2. electron-builder 报错
```powershell
# 清理缓存
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
npm run electron:build
```

### 3. 打包后程序无法启动
- 确保安装了 Visual C++ Redistributable
- 检查杀毒软件是否拦截
- 尝试以管理员身份运行

## 🎯 验证

成功运行后，你将看到：
- ✅ AvatarCode 主窗口
- ✅ Monaco 代码编辑器
- ✅ 底部 Terminal 面板
- ✅ 左侧文件管理器
- ✅ 右侧插件市场

## 📝 开发模式

如果需要调试运行（不打包）：
```powershell
npm run electron:dev
```

这会启动开发版本的 Electron 应用，支持热重载。

## 📞 支持

遇到问题请提交 Issue：
https://github.com/hnwlg2009/AvatarCode/issues

---

**最后更新**: 2026-05-06  
**版本**: AvatarCode v0.9.0
