# AvatarCode Release Notes

## 版本履历管理

---

### v0.1.0 (2026-05-08) - Windows 首次发布

#### 发布信息
| 项目 | 详情 |
|------|------|
| **版本号** | 0.1.0 |
| **发布日期** | 2026-05-08 |
| **平台** | Windows 11 x64 |
| **构建工具** | electron-packager + 自定义构建脚本 |
| **Electron版本** | 30.5.1 |

#### 发布文件
```
release/
├── AvatarCode-win32-x64/          # 主程序目录（推荐）
│   ├── AvatarCode.exe             # 可执行文件
│   ├── resources/
│   │   └── app/                   # 应用代码
│   │       ├── dist/              # 前端构建产物
│   │       ├── electron/dist/     # Electron主进程
│   │       └── node_modules/      # 运行时依赖
│   └── [运行时DLL]
├── AvatarCode-Portable-Windows-x64.zip  # 便携版ZIP包
├── AvatarCode-0.1.0-win.zip              # 标准版ZIP包
├── builder-debug.yml                     # 构建调试信息
└── builder-effective-config.yaml         # 构建配置
```

#### 修复的关键问题

##### 1. ESM/CommonJS模块冲突
**错误：** `ReferenceError: exports is not defined in ES module scope`
**原因：** package.json中`"type": "module"`导致Node.js将CommonJS的.js文件当作ESM处理
**解决方案：** 将打包后的package.json中的type改为`"commonjs"`

##### 2. IPC处理器文件缺失
**错误：** `Cannot find module './ipc/git-handlers'`
**原因：** electron-packager打包时遗漏了git-handlers.js
**解决方案：** 手动复制缺失的IPC处理器文件到正确位置

##### 3. npm依赖缺失
**错误：** `Cannot find module 'isomorphic-git'`
**原因：** 打包时排除了node_modules目录
**解决方案：** 在打包后执行`npm install --omit=dev`安装生产依赖

#### 构建命令
```powershell
# 使用可靠构建脚本（推荐）
.\build-windows-reliable.ps1

# 或手动构建
npm run build:web          # 1. 构建前端
npm run build:electron     # 2. 编译Electron
npx electron-packager . AvatarCode --platform=win32 --arch=x64  # 3. 打包
# 4. 修复ESM问题、复制IPC文件、安装依赖
```

#### 系统要求
- **操作系统：** Windows 10/11 x64
- **内存：** 建议 8GB 以上
- **磁盘空间：** 500MB 可用空间

#### 已知功能
- ✅ Monaco Editor代码编辑器
- ✅ 文件树和标签页管理
- ✅ Git集成（isomorphic-git）
- ✅ 终端模拟器
- ✅ AI聊天面板（OpenAI/Anthropic）
- ✅ 插件系统基础架构
- ✅ 设置管理界面

#### 已知限制
- ⚠️ 仅支持Windows平台
- ⚠️ 未配置代码签名
- ⚠️ 无自动更新功能
- ⚠️ 首次启动可能需要几秒初始化时间

#### 技术栈
| 组件 | 技术 | 版本 |
|------|------|------|
| 框架 | Electron | 30.5.1 |
| 前端 | React | 18.2.0 |
| 语言 | TypeScript | 5.3.3 |
| 编辑器 | Monaco Editor | 0.45.0 |
| 构建 | Vite | 5.0.10 |
| 包管理 | npm + electron-packager | - |

---

## 版本历史

| 版本 | 日期 | 平台 | 状态 | 说明 |
|------|------|------|------|------|
| v0.1.0 | 2026-05-08 | Windows x64 | ✅ 当前 | 首次公开发布，修复所有已知打包问题 |

---

## 发布检查清单

每个版本发布前必须确认：

- [ ] 前端构建成功 (`npm run build:web`)
- [ ] Electron编译成功 (`npm run build:electron`)
- [ ] 所有IPC处理器文件已包含
- [ ] 生产依赖已安装 (`npm install --omit=dev`)
- [ ] package.json type设置为commonjs
- [ ] 应用可正常启动无报错
- [ ] ZIP包创建完成
- [ ] RELEASE_NOTES.md已更新
- [ ] Git提交并推送到GitHub

---

## 下一步计划

### v0.2.0 (规划中)
- [ ] macOS支持
- [ ] Linux支持
- [ ] 自动更新功能
- [ ] 代码签名
- [ ] 安装程序(NSIS)

### v1.0.0 (目标)
- [ ] 多平台完整支持
- [ ] AI功能完善
- [ ] 插件市场
- [ ] 云同步功能

---

**维护者：** devin WLG  
**仓库地址：** https://github.com/hnwlg2009/AvatarCode  
**许可证：** MIT License
