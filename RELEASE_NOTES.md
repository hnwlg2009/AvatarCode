# AvatarCode Release Notes

## 版本履历管理

---

### v0.2.0 (2026-05-18) - 多语言支持

#### 发布信息
| 项目 | 详情 |
|------|------|
| **版本号** | 0.2.0 |
| **发布日期** | 2026-05-18 |
| **平台** | Windows 11 x64 |
| **构建工具** | electron-packager + 自定义构建脚本 |
| **Electron版本** | 30.5.1 |

#### 新增功能

##### 1. 多语言支持 (i18n)
- ✅ **中英文界面切换**：支持中文和英文两种语言
- ✅ **Electron菜单多语言**：主进程菜单随语言设置动态更新
- ✅ **语言设置持久化**：用户语言选择保存到localStorage
- ✅ **即时语言切换**：切换语言后无需重启应用
- ✅ **IPC通信同步**：渲染进程与主进程语言状态同步
- ✅ **翻译回退机制**：翻译缺失时自动回退到英文

##### 2. 完整翻译覆盖
- **渲染进程组件**：所有UI组件支持多语言
  - Workspace（工作区）
  - ChatPanel（AI对话）
  - AgentPanel（AI代理）
  - PluginPanel（插件市场）
  - GitPanel（Git管理）
  - SettingsPanel（设置面板）
  - EditorSettings（编辑器设置）
  - GeneralSettings（通用设置）
  - GitSettings（Git设置）
  - AppearanceSettings（外观设置）
  - MainLayout（主布局）
  - FileTree（文件树）
  - TerminalPanel（终端）
  - APISettings（API设置）

- **主进程组件**：菜单和对话框支持多语言
  - File菜单
  - Edit菜单
  - View菜单
  - Window菜单
  - Help菜单

##### 3. 翻译文件结构
```
src/i18n/
├── index.ts              # i18n配置
└── locales/
    ├── en.json           # 英文翻译（140+ 个翻译key）
    └── zh.json           # 中文翻译（140+ 个翻译key）

electron/
├── i18n.ts               # 主进程i18n管理器
└── locales/
    ├── en.json           # 菜单英文翻译
    └── zh.json           # 菜单中文翻译
```

#### 技术改进

##### 1. SDD开发流程
- **SPEC文档**：`SPEC_i18n.md` - 多语言功能规格说明
- **DESIGN文档**：`DESIGN_i18n.md` - 多语言功能设计文档
- **完整的需求分析和设计文档**

##### 2. 代码质量提升
- 修复了TypeScript类型定义
- 完善了ElectronAPI接口类型
- 添加了缺失的模块导出
- 优化了组件导入结构

##### 3. 架构优化
- 主进程与渲染进程语言状态同步机制
- IPC通信通道扩展（send方法）
- 模块化的i18n管理器设计

#### 文件变更

##### 新增文件
- `electron/i18n.ts` - 主进程i18n管理器
- `electron/locales/en.json` - 菜单英文翻译
- `electron/locales/zh.json` - 菜单中文翻译
- `src/features/agent/tools/index.ts` - 工具类导出
- `SPEC_i18n.md` - 多语言功能规格说明
- `DESIGN_i18n.md` - 多语言功能设计文档

##### 修改文件
- `package.json` - 版本号更新到0.2.0
- `electron/menu.ts` - 菜单使用i18n翻译
- `electron/main.ts` - 添加语言变更IPC监听
- `electron/preload.ts` - 暴露send方法
- `src/types/electron.d.ts` - 添加send方法类型定义
- `src/i18n/locales/en.json` - 完善英文翻译
- `src/i18n/locales/zh.json` - 完善中文翻译
- `src/components/settings/GeneralSettings.tsx` - 添加IPC通知
- `src/components/settings/SettingsPanel.tsx` - 修复导入问题

#### 使用说明

##### 切换语言
1. 打开设置面板（Settings）
2. 选择"通用"（General）选项卡
3. 在语言区域选择"中文"或"English"
4. 界面和菜单将立即切换语言

##### 语言设置
- 语言选择自动保存到浏览器localStorage
- 下次启动应用时自动使用上次选择的语言
- 如果翻译缺失，自动回退到英文显示

#### 已知功能
- ✅ 中英文界面切换
- ✅ Electron菜单多语言
- ✅ 语言设置持久化
- ✅ 即时语言切换
- ✅ 翻译回退机制
- ✅ 完整翻译覆盖

#### 已知限制
- ⚠️ 目前仅支持中文和英文两种语言
- ⚠️ 部分第三方库的文本未翻译
- ⚠️ 控制台日志信息仍为英文

#### 下一步计划
- [ ] 添加更多语言支持（日语、韩语等）
- [ ] 完善第三方库文本翻译
- [ ] 添加语言包动态加载功能
- [ ] 支持用户自定义翻译

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
| v0.2.0 | 2026-05-18 | Windows x64 | ✅ 当前 | 多语言支持，中英文界面切换 |
| v0.1.0 | 2026-05-08 | Windows x64 | ✅ 历史 | 首次公开发布，修复所有已知打包问题 |

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

### v0.3.0 (规划中)
- [ ] macOS支持
- [ ] Linux支持
- [ ] 自动更新功能
- [ ] 代码签名
- [ ] 安装程序(NSIS)
- [ ] 更多语言支持（日语、韩语等）

### v1.0.0 (目标)
- [ ] 多平台完整支持
- [ ] AI功能完善
- [ ] 插件市场
- [ ] 云同步功能

---

**维护者：** devin WLG  
**仓库地址：** https://github.com/hnwlg2009/AvatarCode  
**许可证：** MIT License
