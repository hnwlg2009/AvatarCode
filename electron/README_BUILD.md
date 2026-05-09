# Electron 构建说明

## 目录结构

```
electron/
├── main.ts          ← TypeScript 源码
├── preload.ts
├── menu.ts
├── types.ts
├── ipc/
│   └── *.ts
├── dist/            ← 编译输出（需要打包时复制）
│   ├── main.js
│   ├── preload.js
│   ├── menu.js
│   └── ipc/
└── tsconfig.json
```

## 构建流程

### 1. 编译 TypeScript

```bash
npx tsc -p electron/tsconfig.json
```

这会生成 `electron/dist/` 目录

### 2. 打包

```bash
npm run electron:build
```

electron-builder 会读取 `electron/dist/` 中的文件

## 注意事项

- `electron/dist/` 已被 .gitignore 忽略
- 打包前必须先编译 TypeScript
- 确保 `dist/main.js` 存在

## 完整命令

```bash
# 完整流程
npm run build              # 构建前端
npx tsc -p electron/       # 编译 Electron
npm run electron:build     # 打包
```

