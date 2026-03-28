# start.ps1
# Script to start the Edge Patient Monitoring System (Backend + Frontend)

$ErrorActionPreference = "Stop"
$ProjectRoot = "$PSScriptRoot"

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host " Starting Edge Patient Monitoring System  " -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan

# Check if Python is available
if (-Not (Get-Command "python" -ErrorAction SilentlyContinue)) {
    Write-Host "Error: Python is not installed or not in PATH." -ForegroundColor Red
    exit 1
}

# Check if Node is available
if (-Not (Get-Command "npm" -ErrorAction SilentlyContinue)) {
    Write-Host "Error: Node.js/npm is not installed or not in PATH." -ForegroundColor Red
    exit 1
}

# Install Frontend dependencies if node_modules is missing
$FrontendDir = Join-Path $ProjectRoot "frontend"
if (-Not (Test-Path (Join-Path $FrontendDir "node_modules"))) {
    Write-Host "`n[1/3] Installing Frontend Dependencies..." -ForegroundColor Yellow
    Set-Location $FrontendDir
    npm install
    Set-Location $ProjectRoot
} else {
    Write-Host "`n[1/3] Frontend Dependencies Found. Skipping install." -ForegroundColor Green
}

Write-Host "`n[2/3] Starting FastAPI Backend..." -ForegroundColor Yellow
# Using Start-Process to keep it in a separate window or background
$BackendProcess = Start-Process -FilePath "python" -ArgumentList "-m uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload" -WorkingDirectory $ProjectRoot -PassThru -WindowStyle Minimized

Start-Sleep -Seconds 2

Write-Host "`n[3/3] Starting Vite Frontend..." -ForegroundColor Yellow
Set-Location $FrontendDir
$FrontendProcess = Start-Process -FilePath "npm" -ArgumentList "run dev" -WorkingDirectory $FrontendDir -PassThru -WindowStyle Minimized

Write-Host "`n==========================================" -ForegroundColor Cyan
Write-Host " System is now running!                   " -ForegroundColor Green
Write-Host " Backend API: http://localhost:8000/      " -ForegroundColor Magenta
Write-Host " Frontend UI: http://localhost:5173/      " -ForegroundColor Magenta
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Press any key to stop both services..." -ForegroundColor Yellow

$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

Write-Host "`nStopping services..." -ForegroundColor Yellow
Stop-Process -Id $BackendProcess.Id -Force
Stop-Process -Id $FrontendProcess.Id -Force
Write-Host "Services stopped. Goodbye!" -ForegroundColor Green
