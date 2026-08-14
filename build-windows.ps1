# AvatarCode Windows Build Script
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "AvatarCode Windows Build Script" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Clean old build
Write-Host "[1/4] Cleaning old build..." -ForegroundColor Yellow
if (Test-Path "release\win-unpacked") {
    Remove-Item -Recurse -Force "release\win-unpacked"
}
Write-Host "Done!" -ForegroundColor Green

# Step 2: Build renderer
Write-Host ""
Write-Host "[2/4] Building renderer..." -ForegroundColor Yellow
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "Build failed!" -ForegroundColor Red
    exit 1
}
Write-Host "Done!" -ForegroundColor Green

# Step 3: Build electron main process
Write-Host ""
Write-Host "[3/4] Building electron main process..." -ForegroundColor Yellow
npx tsc -p electron/tsconfig.json
if ($LASTEXITCODE -ne 0) {
    Write-Host "Build failed!" -ForegroundColor Red
    exit 1
}
Write-Host "Done!" -ForegroundColor Green

# Step 4: Package for Windows
Write-Host ""
Write-Host "[4/4] Packaging for Windows..." -ForegroundColor Yellow
npx electron-builder --win --config electron-builder.yml
if ($LASTEXITCODE -ne 0) {
    Write-Host "Package failed!" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Build complete!" -ForegroundColor Green
Write-Host "Output: release\win-unpacked\AvatarCode.exe" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
