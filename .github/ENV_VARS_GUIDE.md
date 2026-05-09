# CI/CD 环境变量指南

**版本**: v1.0.0  
**生效日期**: 2026-05-06

---

## 🌍 全局环境变量

定义在 `.github/workflows/` 的 `env:` 块：

```yaml
env:
  NODE_VERSION: '20'
  ELECTRON_VERSION: '30'
  CI: 'true'
```

## 📦 构建环境变量

### Frontend 构建

```bash
NODE_ENV=production
VITE_APP_VERSION=1.0.0-20260506
VITE_GIT_COMMIT=$(git rev-parse HEAD)
```

### Electron 构建

```bash
ELECTRON_MIRROR=https://dl.nwjs.io/v${ELECTRON_VERSION}/
ELECTRON_BUILDER_CONFIG=build/package.json
```

## 🛠️ 平台特定变量

### Windows

```powershell
$env:WIN_CSC_LINK="${{ secrets.WIN_CSC_LINK }}"
$env:WIN_CSC_KEY_PASSWORD="${{ secrets.WIN_CSC_KEY_PASSWORD }}"
```

### macOS

```bash
export CSC_LINK="${{ secrets.APPLE_CERT_BASE64 }}"
export CSC_KEY_PASSWORD="${{ secrets.APPLE_CERT_PASSWORD }}"
export APPLE_ID="${{ secrets.APPLE_ID }}"
export APPLE_TEAM_ID="${{ secrets.APPLE_TEAM_ID }}"
```

### Linux

```bash
export USE_SYSTEM_FPM=true
```

## 📊 性能优化变量

```yaml
env:
  # NPM 加速
  NPM_CONFIG_REGISTRY: https://registry.npmjs.org
  NPM_CONFIG_AUDIT: 'false'
  
  # 构建优化
  VITE_CJS_TRACE: 'false'
  NODE_OPTIONS: --max-old-space-size=4096
```

## 🔍 调试变量

```yaml
env:
  DEBUG: electron-builder
  VITE_DEBUG_BUILD: 'true'
  LOG_LEVEL: verbose
```

---

**维护者**: devin WLG  
**更新周期**: 按需更新

