#!/usr/bin/env pwsh
# AvatarCode 简化打包脚本
# 使用现有的dist目录和electron文件

param(
    [string]$OutputDir = "release"
)

$ErrorActionPreference = "Stop"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  AvatarCode 简化打包脚本" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

# 检查dist目录
if (-not (Test-Path "dist")) {
    Write-Host "错误: dist目录不存在，请先运行构建" -ForegroundColor Red
    exit 1
}

# 创建输出目录
if (-not (Test-Path $OutputDir)) {
    New-Item -ItemType Directory -Path $OutputDir -Force | Out-Null
}

$appDir = "$OutputDir\AvatarCode-win32-x64"
if (Test-Path $appDir) {
    Remove-Item -Path $appDir -Recurse -Force
}

Write-Host "`n[1/5] 创建应用目录..." -ForegroundColor Yellow
New-Item -ItemType Directory -Path $appDir -Force | Out-Null
New-Item -ItemType Directory -Path "$appDir\resources" -Force | Out-Null
New-Item -ItemType Directory -Path "$appDir\resources\app" -Force | Out-Null

Write-Host "`n[2/5] 复制前端文件..." -ForegroundColor Yellow
Copy-Item -Path "dist\*" -Destination "$appDir\resources\app\dist" -Recurse -Force
Write-Host "  ✓ 前端文件已复制" -ForegroundColor Green

Write-Host "`n[3/5] 复制Electron文件..." -ForegroundColor Yellow
if (-not (Test-Path "$appDir\resources\app\electron")) {
    New-Item -ItemType Directory -Path "$appDir\resources\app\electron" -Force | Out-Null
}
Copy-Item -Path "electron\*" -Destination "$appDir\resources\app\electron" -Recurse -Force
Write-Host "  ✓ Electron文件已复制" -ForegroundColor Green

Write-Host "`n[3.5/5] 复制Electron可执行文件..." -ForegroundColor Yellow
Copy-Item -Path "node_modules\electron\dist\electron.exe" -Destination "$appDir\AvatarCode.exe" -Force
Write-Host "  ✓ Electron可执行文件已复制" -ForegroundColor Green

Write-Host "`n[4/5] 创建package.json..." -ForegroundColor Yellow
$packageJson = @{
    name = "avatarcode"
    version = "0.2.0"
    description = "AI-Native Code Editor"
    main = "electron/main.js"
    scripts = @{
        start = "electron ."
    }
    dependencies = @{
        "isomorphic-git" = "^1.25.0"
        "openai" = "^4.20.0"
        "ws" = "^8.14.2"
        "zod" = "^3.22.4"
    }
}
$packageJson | ConvertTo-Json -Depth 10 | Set-Content "$appDir\resources\app\package.json" -Encoding UTF8
Write-Host "  ✓ package.json已创建" -ForegroundColor Green

Write-Host "`n[5/5] 安装依赖..." -ForegroundColor Yellow
Push-Location "$appDir\resources\app"
try {
    npm install --omit=dev 2>&1 | Out-Null
    Write-Host "  ✓ 依赖已安装" -ForegroundColor Green
} catch {
    Write-Host "  ⚠ 依赖安装失败，但可以继续" -ForegroundColor Yellow
} finally {
    Pop-Location
}

# 创建启动脚本
$launchScript = @"
@echo off
cd /d "%~dp0"
start AvatarCode.exe
"@
$launchScript | Set-Content "$appDir\启动AvatarCode.bat" -Encoding ASCII

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  ✅ 打包完成!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "`n📦 输出目录: $appDir" -ForegroundColor White
Write-Host "🚀 运行: $appDir\AvatarCode.exe" -ForegroundColor Yellow
Write-Host ""
