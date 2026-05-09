# AvatarCode 完整修复脚本 - Windows 版
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  AvatarCode 完整构建修复工具" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 1. 清理环境
Write-Host "[Step 1/8] 清理旧环境..." -ForegroundColor Yellow
if (Test-Path "node_modules") { Remove-Item -Recurse -Force node_modules }
if (Test-Path "package-lock.json") { Remove-Item -Force package-lock.json }
if (Test-Path "dist") { Remove-Item -Recurse -Force dist }
if (Test-Path "electron/dist") { Remove-Item -Recurse -Force electron/dist }
if (Test-Path "release") { Remove-Item -Recurse -Force release }
Write-Host "✅ 清理完成" -ForegroundColor Green

# 2. 安装依赖
Write-Host ""
Write-Host "[Step 2/8] 安装依赖..." -ForegroundColor Yellow
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ 依赖安装失败" -ForegroundColor Red
    exit 1
}
Write-Host "✅ 依赖安装完成" -ForegroundColor Green

# 3. 构建前端
Write-Host ""
Write-Host "[Step 3/8] 构建前端 (vite build)..." -ForegroundColor Yellow
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "⚠️  前端构建失败，继续尝试..." -ForegroundColor Yellow
}

# 4. 编译 Electron
Write-Host ""
Write-Host "[Step 4/8] 编译 Electron TypeScript..." -ForegroundColor Yellow
Set-Location electron
npx tsc -p tsconfig.json
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Electron 编译失败" -ForegroundColor Red
    Set-Location ..
    exit 1
}
Set-Location ..
Write-Host "✅ Electron 编译完成" -ForegroundColor Green

# 5. 打包
Write-Host ""
Write-Host "[Step 5/8] 开始打包 (electron-builder)..." -ForegroundColor Yellow
npm run electron:build
if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "  ✅ 构建成功！" -ForegroundColor Green
    Write-Host "  输出目录：release/" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Get-ChildItem release/
} else {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Red
    Write-Host "  ❌ 打包失败" -ForegroundColor Red
    Write-Host "  请检查上面的错误信息" -ForegroundColor Red
    Write-Host "========================================" -ForegroundColor Red
}

Write-Host ""
Write-Host "按任意键退出..." -ForegroundColor Cyan
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
