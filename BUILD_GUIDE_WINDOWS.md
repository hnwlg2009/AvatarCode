# AvatarCode Windows 构建指南

## 快速构建 (推荐)

```powershell
# 1. 拉取最新代码
git pull origin 260429-feat-avatarcode-spec

# 2. 清理环境 (可选，如果之前失败过)
Remove-Item -Recurse -Force -ErrorAction SilentlyContinue node_modules
Remove-Item -Force -ErrorAction SilentlyContinue package-lock.json
Remove-Item -Recurse -Force -ErrorAction SilentlyContinue dist
Remove-Item -Recurse -Force -ErrorAction SilentlyContinue electron/dist
Remove-Item -Recurse -Force -ErrorAction SilentlyContinue release

# 3. 安装依赖
npm install

# 4. 构建前端
npm run build:web

# 5. 编译 Electron
npm run build:electron

# 6. 测试 Electron (可选)
npm run electron:dev

# 7. 打包
npm run electron:build

# 8. 查看输出
ls release/
```

## 成功标志

```
release/
├── AvatarCode-0.1.0-win.zip    (~150MB)
└── win-unpacked/               (解压即可用)
```

## 解压运行

1. 解压 `AvatarCode-0.1.0-win.zip`
2. 双击 `AvatarCode.exe`
3. 选择工作空间目录，开始使用！

## 常见问题

### 1. npm install 失败

```powershell
# 清理缓存
npm cache clean --force
# 重试
npm install --legacy-peer-deps
```

### 2. electron:build 卡住

耐心等待，首次打包需要 10-15 分钟下载 Electron

### 3. 找不到 main.js

确保已执行：
```powershell
npm run build:electron
```

检查输出：
```powershell
ls electron/dist/main.js
```

### 4. TypeScript 编译错误

```powershell
# 查看详细错误
npx tsc -p electron/tsconfig.json --listFiles
```

## 最小化测试

如果打包失败，先测试能否运行：

```powershell
npm run build:web
npm run build:electron
npm run electron:dev
```

应该能看到 AvatarCode 窗口打开！

