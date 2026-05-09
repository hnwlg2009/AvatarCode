#!/usr/bin/env pwsh
# AvatarCode Windows Build Script (完善版)
# 自动解决所有已知问题：ESM冲突、IPC文件遗漏、依赖缺失

param(
    [switch]$Clean,
    [switch]$SkipBuild,
    [string]$OutputDir = "release"
)

$ErrorActionPreference = "Stop"
$ProgressPreference = "SilentlyContinue"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  AvatarCode Windows Build Script v2" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

$TotalSteps = 7
$CurrentStep = 0

function Write-Step([string]$Message) {
    $script:CurrentStep++
    Write-Host "`n[$script:CurrentStep/$TotalSteps] $Message" -ForegroundColor Yellow
}

# 1. 清理旧版本
if ($Clean -or (Test-Path "$OutputDir\AvatarCode-win32-x64")) {
    Write-Step "Cleaning old builds..."
    Remove-Item -Path "$OutputDir\AvatarCode-win32-x64" -Recurse -Force -ErrorAction SilentlyContinue
    Remove-Item -Path "$OutputDir\AvatarCode-*-Portable-*.zip" -Force -ErrorAction SilentlyContinue
    Write-Host "  ✓ Cleaned" -ForegroundColor Green
}

if (-not $SkipBuild) {
    # 2. 构建前端
    Write-Step "Building frontend (Vite)..."
    npm run build:web
    if ($LASTEXITCODE -ne 0) { throw "Frontend build failed" }
    Write-Host "  ✓ Frontend built" -ForegroundColor Green

    # 3. 编译Electron主进程
    Write-Step "Compiling Electron main process..."
    npm run build:electron
    if ($LASTEXITCODE -ne 0) { throw "Electron compilation failed" }
    Write-Host "  ✓ Electron compiled" -ForegroundColor Green
}

# 4. 打包应用（使用electron-packager）
Write-Step "Packaging application (electron-packager)..."
npx electron-packager . AvatarCode `
    --platform=win32 `
    --arch=x64 `
    --out=$OutputDir `
    --overwrite `
    --ignore="node_modules" `
    --ignore=".git" `
    --ignore="src" `
    --ignore="electron/tsconfig" `
    --ignore="\\.md$" `
    --ignore=".husky" `
    --ignore="tests" `
    --ignore="scripts" `
    --prune=true

if ($LASTEXITCODE -ne 0) { throw "Packaging failed" }
Write-Host "  ✓ Packaged" -ForegroundColor Green

# 5. 修复ESM/CommonJS模块冲突
Write-Step "Fixing ESM/CommonJS module conflict..."

$packageJsonPath = "$OutputDir\AvatarCode-win32-x64\resources\app\package.json"
if (Test-Path $packageJsonPath) {
    $packageJson = Get-Content $packageJsonPath -Raw | ConvertFrom-Json
    if ($packageJson.type -eq "module") {
        $packageJson.type = "commonjs"
        $packageJson | ConvertTo-Json -Depth 10 | Set-Content $packageJsonPath -Encoding UTF8
        Write-Host "  ✓ Changed type to 'commonjs'" -ForegroundColor Green
    } else {
        Write-Host "  ✓ type already correct" -ForegroundColor DarkGray
    }
}

# 6. 确保所有IPC处理器文件存在
Write-Step "Verifying IPC handlers..."

$ipcDestDir = "$OutputDir\AvatarCode-win32-x64\resources\app\electron\dist\ipc"
$ipcSourceDir = "electron\dist\ipc"

if (Test-Path $ipcSourceDir) {
    if (-not (Test-Path $ipcDestDir)) {
        New-Item -ItemType Directory -Path $ipcDestDir -Force | Out-Null
    }
    
    $copiedCount = 0
    Get-ChildItem -Path $ipcSourceDir -Filter "*.js" | ForEach-Object {
        Copy-Item $_.FullName (Join-Path $ipcDestDir $_.Name) -Force
        $copiedCount++
        
        @("$($_.BaseName).d.ts", "$($_.Name).map") | ForEach-Object {
            $srcMap = Join-Path $ipcSourceDir $_
            if (Test-Path $srcMap) {
                Copy-Item $srcMap (Join-Path $ipcDestDir $_) -Force
            }
        }
    }
    Write-Host "  ✓ Verified $copiedCount IPC handler(s)" -ForegroundColor Green
}

# 7. 安装生产依赖（关键！electron-packager排除了node_modules）
Write-Step "Installing production dependencies..."

$appDir = "$OutputDir\AvatarCode-win32-x64\resources\app"
Push-Location $appDir
try {
    npm install --omit=dev --omit=optional 2>&1 | Out-Null
    if ($LASTEXITCODE -eq 0) {
        $depCount = (Get-ChildItem -Path "node_modules" -Directory).Count
        Write-Host "  ✓ Installed $depCount dependencies" -ForegroundColor Green
    } else {
        Write-Host "  ⚠ npm install had issues" -ForegroundColor Red
    }
} finally {
    Pop-Location
}

# 创建便携版ZIP
Write-Host "`nCreating portable ZIP..." -ForegroundColor Yellow
Compress-Archive -Path "$OutputDir\AvatarCode-win32-x64\*" `
    -DestinationPath "$OutputDir\AvatarCode-Portable-Windows-x64.zip" `
    -Force
Write-Host "  ✓ ZIP created" -ForegroundColor Green

# 输出结果
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  ✅ BUILD SUCCESSFUL!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "`n📦 Output:" -ForegroundColor White
Write-Host "   App: $OutputDir\AvatarCode-win32-x64\AvatarCode.exe" -ForegroundColor Cyan
Write-Host "   ZIP: $OutputDir\AvatarCode-Portable-Windows-x64.zip" -ForegroundColor Cyan
Write-Host "`n🚀 Run:" -ForegroundColor White
Write-Host "   .\$OutputDir\AvatarCode-win32-x64\AvatarCode.exe" -ForegroundColor Yellow
Write-Host ""
