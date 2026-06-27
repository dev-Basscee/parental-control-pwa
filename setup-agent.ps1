# setup-agent.ps1
# One-shot setup script for the Parental Control Agent.
# Must be run as Administrator.

param(
    [switch]$Uninstall
)

$ErrorActionPreference = "Stop"
$AgentDir = Join-Path $PSScriptRoot "agent"

function Check-Admin {
    $currentUser = [Security.Principal.WindowsIdentity]::GetCurrent()
    $principal   = New-Object Security.Principal.WindowsPrincipal($currentUser)
    if (-not $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
        Write-Error "This script must be run as Administrator. Right-click → Run as administrator."
        exit 1
    }
}

Check-Admin

if ($Uninstall) {
    Write-Host "► Uninstalling Parental Control Agent service..." -ForegroundColor Yellow
    Push-Location $AgentDir
    node scripts/uninstall-service.js
    Pop-Location
    Write-Host "Done." -ForegroundColor Green
    exit 0
}

# ── Install ────────────────────────────────────────────────────────────────────
Write-Host ""
Write-Host "╔══════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║   Parental Control Agent — Setup             ║" -ForegroundColor Cyan
Write-Host "╚══════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# 1. Install agent dependencies
Write-Host "► Installing agent dependencies..." -ForegroundColor Yellow
Push-Location $AgentDir
npm install --omit=dev
if ($LASTEXITCODE -ne 0) { Write-Error "npm install failed"; exit 1 }
Pop-Location
Write-Host "  ✓ Dependencies installed" -ForegroundColor Green

# 2. Register the Windows service
Write-Host "► Registering Windows service..." -ForegroundColor Yellow
Push-Location $AgentDir
node scripts/install-service.js
if ($LASTEXITCODE -ne 0) { Write-Error "Service installation failed"; exit 1 }
Pop-Location

Write-Host ""
Write-Host "╔══════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║  ✅ Setup complete!                          ║" -ForegroundColor Green
Write-Host "╚══════════════════════════════════════════════╝" -ForegroundColor Green
Write-Host ""
Write-Host "The agent is now running as the 'ParentalControlAgent' Windows service."
Write-Host "It will start automatically on every boot."
Write-Host ""
Write-Host "API: http://127.0.0.1:3001/api"
Write-Host "Token: $(Get-Content (Join-Path $AgentDir 'data\api-token.txt') -ErrorAction SilentlyContinue)"
Write-Host ""
Write-Host "To uninstall, run:  .\setup-agent.ps1 -Uninstall"
