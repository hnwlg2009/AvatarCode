# AvatarCode Windows 完整构建脚本
# 用法: PowerShell -ExecutionPolicy Bypass -File build-windows-final.ps1

$ErrorActionPreference = "Stop"

Write-Host "======================================" -ForegroundColor Cyan
Write-Host "  AvatarCode Windows Build Script" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan
Write-Host ""

# 设置环境变量
$env:ELECTRON_MIRROR = "https://cdn.npmmirror.com/binaries/electron/"
$env:ELECTRON_BUILDER_CACHE = "$PWD\electron-cache"
$env:ELECTRON_BUILDER_BINARIES_CACHE = "$PWD\electron-cache"

Write-Host "[1/4] Cleaning previous builds..." -ForegroundColor Yellow
if (Test-Path "release") {
    Remove-Item -Recurse -Force "release" -ErrorAction SilentlyContinue
}
if (Test-Path "dist") {
    Remove-Item -Recurse -Force "dist" -ErrorAction SilentlyContinue
}
if (Test-Path "electron\dist") {
    Remove-Item -Recurse -Force "electron\dist" -ErrorAction SilentlyContinue
}

Write-Host "[2/4] Building web frontend (Vite)..." -ForegroundColor Yellow
npm run build:web
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Web build failed!" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Web build successful!" -ForegroundColor Green

Write-Host "[3/4] Building Electron main process..." -ForegroundColor Yellow
npm run build:electron
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Electron build failed!" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Electron build successful!" -ForegroundColor Green

Write-Host "[4/4] Packaging with electron-builder..." -ForegroundColor Yellow
npx electron-builder --win --x64 --publish never
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Packaging failed!" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Packaging successful!" -ForegroundColor Green

Write-Host ""
Write-Host "======================================" -ForegroundColor Cyan
Write-Host "  ✅ Build Complete!" -ForegroundColor Green
Write-Host "======================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Output files:" -ForegroundColor White
Get-ChildItem -Path "release" -Recurse -Include "*.exe","*.zip","*.nsis" | ForEach-Object {
    $size = [math]::Round($_.Length / 1MB, 2)
    Write-Host "  📦 $($_.FullName) ($size MB)" -ForegroundColor White
}
Write-Host ""
Write-Host "To run the application:" -ForegroundColor White
Write-Host "  cd release\win-unpacked" -ForegroundColor Gray
Write-Host "  .\AvatarCode.exe" -ForegroundColor Gray
