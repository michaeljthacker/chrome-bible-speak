#!/usr/bin/env pwsh
# Build script for Bible Name Aid Chrome Extension
# Creates a clean dist/ folder with only files needed for Chrome Web Store

Write-Host "Building Bible Name Aid extension..." -ForegroundColor Cyan

# Step 1: Validate manual pronunciations
Write-Host "`n[Step 1/3] Validating manual_pronunciations.json..." -ForegroundColor Cyan
$validationResult = & python scripts\validate_manual_pronunciations.py
if ($LASTEXITCODE -ne 0) {
    Write-Host "`n✗ Build failed: manual_pronunciations.json validation errors" -ForegroundColor Red
    Write-Host "  Fix validation errors before building" -ForegroundColor Yellow
    exit 1
}
Write-Host ""

# Step 2: Clean and create dist directory
Write-Host "[Step 2/3] Preparing dist/ folder..." -ForegroundColor Cyan
if (Test-Path "dist") {
    Write-Host "Cleaning existing dist/ folder..." -ForegroundColor Yellow
    Remove-Item -Recurse -Force "dist"
}
New-Item -ItemType Directory -Path "dist" | Out-Null

# Copy required extension files
Write-Host "Copying extension files..." -ForegroundColor Green

Copy-Item "manifest.json" "dist/"
Copy-Item "background.js" "dist/"
Copy-Item "content.js" "dist/"
Copy-Item "popup.html" "dist/"
Copy-Item "popup.js" "dist/"
Copy-Item "styles.css" "dist/"
Copy-Item "names_pronunciations.json" "dist/"
Copy-Item "manual_pronunciations.json" "dist/"

# Copy icons directory
Copy-Item -Recurse "icons" "dist/icons"

Write-Host "[OK] Files copied to dist/" -ForegroundColor Green

# Step 3: Create ZIP for Chrome Web Store upload
Write-Host "`n[Step 3/3] Creating ZIP archive..." -ForegroundColor Cyan

$zipPath = "bible-name-aid-dist.zip"
if (Test-Path $zipPath) {
    Remove-Item $zipPath
}

# PowerShell 5.1+ has Compress-Archive
Compress-Archive -Path "dist\*" -DestinationPath $zipPath

Write-Host "[OK] Created $zipPath" -ForegroundColor Green
Write-Host ""
Write-Host "Build complete! Package ready for Chrome Web Store:" -ForegroundColor Cyan
Write-Host "  >> $zipPath" -ForegroundColor White
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "  1. Test the extension by loading dist/ folder as unpacked in Chrome" -ForegroundColor Gray
Write-Host "  2. Upload $zipPath to Chrome Web Store Developer Dashboard" -ForegroundColor Gray
