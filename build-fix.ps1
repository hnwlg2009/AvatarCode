#!/usr/bin/env pwsh
# AvatarCode 完整打包脚本
# 解决ESM/CommonJS冲突，确保所有依赖正确打包

param(
    [string]$OutputDir = "release",
    [switch]$Clean
)

$ErrorActionPreference = "Stop"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  AvatarCode 完整打包脚本 v2" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

# 清理旧版本
if ($Clean -or (Test-Path "$OutputDir\AvatarCode-win32-x64")) {
    Write-Host "`n[0/8] 清理旧版本..." -ForegroundColor Yellow
    Remove-Item -Path "$OutputDir\AvatarCode-win32-x64" -Recurse -Force -ErrorAction SilentlyContinue
    Write-Host "  ✓ 已清理" -ForegroundColor Green
}

# 检查dist目录
if (-not (Test-Path "dist")) {
    Write-Host "`n[1/8] 构建前端..." -ForegroundColor Yellow
    npm run build
    if ($LASTEXITCODE -ne 0) { throw "构建失败" }
    Write-Host "  ✓ 构建完成" -ForegroundColor Green
} else {
    Write-Host "`n[1/8] 使用现有dist目录..." -ForegroundColor Yellow
}

# 编译Electron TypeScript
Write-Host "`n[1.5/8] 编译Electron TypeScript..." -ForegroundColor Yellow
npx tsc -p electron/tsconfig.json
if ($LASTEXITCODE -ne 0) { throw "Electron编译失败" }
Write-Host "  ✓ Electron编译完成" -ForegroundColor Green

# 创建输出目录
if (-not (Test-Path $OutputDir)) {
    New-Item -ItemType Directory -Path $OutputDir -Force | Out-Null
}

$appDir = "$OutputDir\AvatarCode-win32-x64"
Write-Host "`n[2/8] 创建应用目录..." -ForegroundColor Yellow
New-Item -ItemType Directory -Path $appDir -Force | Out-Null
New-Item -ItemType Directory -Path "$appDir\resources" -Force | Out-Null
New-Item -ItemType Directory -Path "$appDir\resources\app" -Force | Out-Null
Write-Host "  ✓ 目录创建完成" -ForegroundColor Green

Write-Host "`n[3/8] 复制前端文件..." -ForegroundColor Yellow
Copy-Item -Path "dist\*" -Destination "$appDir\resources\app\dist" -Recurse -Force
Write-Host "  ✓ 前端文件已复制" -ForegroundColor Green

Write-Host "`n[4/8] 复制Electron文件..." -ForegroundColor Yellow
if (-not (Test-Path "$appDir\resources\app\electron")) {
    New-Item -ItemType Directory -Path "$appDir\resources\app\electron" -Force | Out-Null
}
# 复制编译后的JavaScript文件
Copy-Item -Path "electron\dist\*" -Destination "$appDir\resources\app\electron" -Recurse -Force
Write-Host "  ✓ Electron文件已复制" -ForegroundColor Green

Write-Host "`n[5/8] 复制Electron可执行文件..." -ForegroundColor Yellow
Copy-Item -Path "node_modules\electron\dist\electron.exe" -Destination "$appDir\AvatarCode.exe" -Force
# 复制Electron运行时文件
$electronFiles = @(
    "chrome_100_percent.pak",
    "chrome_200_percent.pak",
    "d3dcompiler_47.dll",
    "ffmpeg.dll",
    "icudtl.dat",
    "libEGL.dll",
    "libGLESv2.dll",
    "LICENSE.electron.txt",
    "LICENSES.chromium.html",
    "resources.pak",
    "snapshot_blob.bin",
    "v8_context_snapshot.bin",
    "vk_swiftshader_icd.json",
    "vk_swiftshader.dll",
    "vulkan-1.dll"
)
foreach ($file in $electronFiles) {
    $src = "node_modules\electron\dist\$file"
    if (Test-Path $src) {
        Copy-Item -Path $src -Destination "$appDir\$file" -Force
    }
}
# 复制locales目录
if (Test-Path "node_modules\electron\dist\locales") {
    Copy-Item -Path "node_modules\electron\dist\locales" -Destination "$appDir\locales" -Recurse -Force
}
Write-Host "  ✓ Electron可执行文件和运行时已复制" -ForegroundColor Green

Write-Host "`n[6/8] 创建package.json（修复ESM/CommonJS冲突）..." -ForegroundColor Yellow
$packageJson = @{
    name = "avatarcode"
    version = "0.2.0"
    description = "AI-Native Code Editor - Next-generation intelligent development environment"
    main = "electron/main.js"
    type = "commonjs"
    scripts = @{
        start = "electron ."
    }
    dependencies = @{
        "@monaco-editor/react" = "^4.7.0"
        "@xterm/xterm" = "^6.0.0"
        "chokidar" = "^3.5.3"
        "commander" = "^11.1.0"
        "fs-extra" = "^11.2.0"
        "i18next" = "^26.2.0"
        "i18next-browser-languagedetector" = "^8.2.1"
        "isomorphic-git" = "^1.25.0"
        "js-yaml" = "^4.1.0"
        "monaco-editor" = "^0.45.0"
        "openai" = "^4.20.0"
        "react" = "^18.2.0"
        "react-dom" = "^18.2.0"
        "react-i18next" = "^17.0.8"
        "ws" = "^8.14.2"
        "zod" = "^3.22.4"
        "zustand" = "^4.4.7"
    }
}
$packageJson | ConvertTo-Json -Depth 10 | Set-Content "$appDir\resources\app\package.json" -Encoding UTF8
Write-Host "  ✓ package.json已创建（type: commonjs）" -ForegroundColor Green

Write-Host "`n[7/8] 安装生产依赖..." -ForegroundColor Yellow
Push-Location "$appDir\resources\app"
try {
    npm install --omit=dev 2>&1 | Out-Null
    if ($LASTEXITCODE -eq 0) {
        $depCount = (Get-ChildItem -Path "node_modules" -Directory -ErrorAction SilentlyContinue).Count
        Write-Host "  ✓ 已安装 $depCount 个依赖" -ForegroundColor Green
    } else {
        Write-Host "  ⚠ 依赖安装可能有问题" -ForegroundColor Yellow
    }
} catch {
    Write-Host "  ⚠ 依赖安装失败: $_" -ForegroundColor Yellow
} finally {
    Pop-Location
}

Write-Host "`n[8/8] 创建启动脚本..." -ForegroundColor Yellow
$launchScript = @"
@echo off
cd /d "%~dp0"
start AvatarCode.exe
"@
$launchScript | Set-Content "$appDir\启动AvatarCode.bat" -Encoding ASCII

# 创建版本信息文件
$versionInfo = @"
AvatarCode v0.2.0
=================
版本: 0.2.0
发布日期: 2026-05-18
主要功能: 多语言支持（中英文）

使用方法:
1. 双击 AvatarCode.exe 启动
2. 或运行 启动AvatarCode.bat

功能特性:
- 中英文界面切换
- Electron菜单多语言
- 语言设置持久化
- 即时语言切换

技术栈:
- Electron 30.x
- React 18.x
- TypeScript 5.x
- Monaco Editor 0.45.x
"@
$versionInfo | Set-Content "$appDir\版本说明.txt" -Encoding UTF8

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  ✅ 打包完成!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "`n📦 输出目录: $appDir" -ForegroundColor White
Write-Host "🚀 运行: $appDir\AvatarCode.exe" -ForegroundColor Yellow
Write-Host "`n⚠️  注意事项:" -ForegroundColor Red
Write-Host "  1. package.json已设置为type: commonjs（解决ESM冲突）" -ForegroundColor White
Write-Host "  2. 所有生产依赖已安装" -ForegroundColor White
Write-Host "  3. 如果仍有问题，请检查electron/main.js是否正确编译" -ForegroundColor White
Write-Host ""
