# AvatarCode Windows 构建修复脚本
# 使用方法：powershell -ExecutionPolicy Bypass -File fix-windows-build.ps1

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  AvatarCode Windows 构建修复工具" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 1. 检查 Node.js
Write-Host "[1/6] 检查 Node.js 环境..." -ForegroundColor Yellow
$nodeVersion = node --version
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Node.js 未安装，请先安装 Node.js v18+" -ForegroundColor Red
    Write-Host "下载地址：https://nodejs.org/" -ForegroundColor Yellow
    exit 1
}
Write-Host "✅ Node.js 版本：$nodeVersion" -ForegroundColor Green

# 2. 检查 npm
Write-Host "[2/6] 检查 npm..." -ForegroundColor Yellow
$npmVersion = npm --version
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ npm 未安装" -ForegroundColor Red
    exit 1
}
Write-Host "✅ npm 版本：$npmVersion" -ForegroundColor Green

# 3. 清理旧依赖
Write-Host "[3/6] 清理旧依赖..." -ForegroundColor Yellow
if (Test-Path "node_modules") {
    Write-Host "删除 node_modules..." -ForegroundColor Gray
    Remove-Item -Recurse -Force node_modules
}
if (Test-Path "package-lock.json") {
    Write-Host "删除 package-lock.json..." -ForegroundColor Gray
    Remove-Item -Force package-lock.json
}
Write-Host "✅ 清理完成" -ForegroundColor Green

# 4. 安装预编译依赖
Write-Host "[4/6] 安装预编译依赖..." -ForegroundColor Yellow
npm install --save node-pty-prebuilt-multiarch
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ 依赖安装失败" -ForegroundColor Red
    exit 1
}
Write-Host "✅ 依赖安装完成" -ForegroundColor Green

# 5. 安装其他依赖
Write-Host "[5/6] 安装项目依赖..." -ForegroundColor Yellow
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ 项目依赖安装失败" -ForegroundColor Red
    exit 1
}
Write-Host "✅ 所有依赖安装完成" -ForegroundColor Green

# 6. 测试构建
Write-Host "[6/6] 测试构建..." -ForegroundColor Yellow
Write-Host "提示：完整构建需要较长时间，是否继续？(Y/N)" -ForegroundColor Cyan
$continue = Read-Host
if ($continue -eq 'Y' -or $continue -eq 'y') {
    npm run electron:build
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "========================================" -ForegroundColor Green
        Write-Host "  ✅ 构建成功！" -ForegroundColor Green
        Write-Host "  输出目录：release/" -ForegroundColor Green
        Write-Host "========================================" -ForegroundColor Green
    } else {
        Write-Host ""
        Write-Host "========================================" -ForegroundColor Red
        Write-Host "  ❌ 构建失败，请查看详细错误信息" -ForegroundColor Red
        Write-Host "========================================" -ForegroundColor Red
    }
} else {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Yellow
    Write-Host "  ⏭️  跳过构建测试" -ForegroundColor Yellow
    Write-Host "  手动运行：npm run electron:build" -ForegroundColor Yellow
    Write-Host "========================================" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "修复完成！按任意键退出..." -ForegroundColor Cyan
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
