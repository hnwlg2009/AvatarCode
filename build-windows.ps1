Write-Host "=============================================" -ForegroundColor Cyan
Write-Host "  AvatarCode Windows 一键构建脚本" -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host ""

$ErrorActionPreference = "Stop"

# Step 1: 清理
Write-Host "[1/5] 清理旧构建..." -ForegroundColor Yellow
if (Test-Path "dist") { Remove-Item -Recurse -Force dist }
if (Test-Path "electron/dist") { Remove-Item -Recurse -Force electron/dist }
if (Test-Path "release") { Remove-Item -Recurse -Force release }

# Step 2: 安装依赖
Write-Host "[2/5] 安装依赖 (这可能需要几分钟)..." -ForegroundColor Yellow
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ npm install 失败" -ForegroundColor Red
    exit 1
}

# Step 3: 构建前端
Write-Host "[3/5] 构建前端..." -ForegroundColor Yellow
npm run build:web
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ 前端构建失败" -ForegroundColor Red
    exit 1
}

# Step 4: 编译 Electron
Write-Host "[4/5] 编译 Electron..." -ForegroundColor Yellow
npm run build:electron
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Electron 编译失败" -ForegroundColor Red
    exit 1
}

# Step 5: 打包
Write-Host "[5/5] 开始打包 (这可能需要 10-15 分钟)..." -ForegroundColor Yellow
npm run electron:build
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ 打包失败" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "=============================================" -ForegroundColor Green
Write-Host "  ✅ 构建成功！" -ForegroundColor Green
Write-Host "=============================================" -ForegroundColor Green
Write-Host ""
Write-Host "输出目录：release/" -ForegroundColor Cyan
Get-ChildItem release/ | Select-Object Name, Length | Format-Table

Write-Host ""
Write-Host "提示：解压 win-unpacked/AvatarCode.exe 即可运行！" -ForegroundColor Cyan
