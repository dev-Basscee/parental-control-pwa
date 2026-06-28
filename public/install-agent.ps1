# install-agent.ps1
# Guardian Parental Control — One-Click Agent Installer
# Downloads, installs, and registers the enforcement agent as a Windows service.
# Must be run as Administrator.
#
# Usage (right-click → Run with PowerShell as Administrator):
#   irm https://knoxs.vercel.app/install-agent.ps1 | iex

$ErrorActionPreference = "Stop"

# ── Config ─────────────────────────────────────────────────────────────────────
$REPO_URL    = "https://github.com/dev-Basscee/parental-control-pwa/archive/refs/heads/main.zip"
$INSTALL_DIR = "C:\ParentalControl"
$SERVICE_NAME = "ParentalControlAgent"
$SERVER_NAME  = "ParentalControlServer"
$NODE_MIN_VER = 18

# ── Helpers ────────────────────────────────────────────────────────────────────
function Write-Banner($text, $color = "Cyan") {
    Write-Host ""
    Write-Host "  $text" -ForegroundColor $color
    Write-Host ""
}

function Write-Step($n, $text) {
    Write-Host "  [$n] $text" -ForegroundColor Yellow
}

function Write-OK($text) {
    Write-Host "      OK  $text" -ForegroundColor Green
}

function Write-Fail($text) {
    Write-Host "      ERR $text" -ForegroundColor Red
}

# ── Admin check ────────────────────────────────────────────────────────────────
$me = [Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()
if (-not $me.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
    Write-Host ""
    Write-Host "  This script must be run as Administrator." -ForegroundColor Red
    Write-Host "  Right-click PowerShell -> 'Run as administrator', then try again." -ForegroundColor Red
    Write-Host ""
    pause
    exit 1
}

Clear-Host
Write-Host ""
Write-Host "  ╔══════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "  ║       Guardian  |  Parental Control Installer        ║" -ForegroundColor Cyan
Write-Host "  ╚══════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""
Write-Host "  This will install the Guardian enforcement agent on this PC." -ForegroundColor Gray
Write-Host "  The agent runs silently in the background and starts on every boot." -ForegroundColor Gray
Write-Host ""

# ── Step 1: Check Node.js ──────────────────────────────────────────────────────
Write-Step 1 "Checking Node.js..."
try {
    $nodeVer = node --version 2>$null
    $major   = [int]($nodeVer -replace "v(\d+)\..*", '$1')
    if ($major -lt $NODE_MIN_VER) {
        Write-Fail "Node.js $nodeVer found but v$NODE_MIN_VER+ required."
        Write-Host "  Download from: https://nodejs.org/en/download/" -ForegroundColor Cyan
        pause; exit 1
    }
    Write-OK "Node.js $nodeVer"
} catch {
    Write-Fail "Node.js not found."
    Write-Host ""
    Write-Host "  Installing Node.js via winget..." -ForegroundColor Yellow
    try {
        winget install OpenJS.NodeJS.LTS --accept-source-agreements --accept-package-agreements -h
        # Refresh PATH
        $env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
        Write-OK "Node.js installed. Please restart and run this script again."
        pause; exit 0
    } catch {
        Write-Fail "Could not auto-install Node.js. Please install manually from https://nodejs.org"
        pause; exit 1
    }
}

# ── Step 2: Create install directory ──────────────────────────────────────────
Write-Step 2 "Preparing install directory: $INSTALL_DIR"
if (Test-Path $INSTALL_DIR) {
    Write-Host "      Directory exists — updating in place..." -ForegroundColor Gray
} else {
    New-Item -ItemType Directory -Path $INSTALL_DIR -Force | Out-Null
}
Write-OK $INSTALL_DIR

# ── Step 3: Download repo ─────────────────────────────────────────────────────
Write-Step 3 "Downloading Guardian from GitHub..."
$zipPath = Join-Path $env:TEMP "parental-control.zip"
$extractPath = Join-Path $env:TEMP "parental-control-extracted"

try {
    Invoke-WebRequest -Uri $REPO_URL -OutFile $zipPath -UseBasicParsing
    Write-OK "Downloaded"
} catch {
    Write-Fail "Download failed: $_"
    pause; exit 1
}

# ── Step 4: Extract ───────────────────────────────────────────────────────────
Write-Step 4 "Extracting files..."
if (Test-Path $extractPath) { Remove-Item $extractPath -Recurse -Force }
Expand-Archive -Path $zipPath -DestinationPath $extractPath -Force
# GitHub archives have a top-level folder named repo-branch
$innerDir = Get-ChildItem $extractPath | Select-Object -First 1 -ExpandProperty FullName
Copy-Item -Path "$innerDir\*" -Destination $INSTALL_DIR -Recurse -Force
Remove-Item $zipPath -Force -ErrorAction SilentlyContinue
Remove-Item $extractPath -Recurse -Force -ErrorAction SilentlyContinue
Write-OK "Files extracted to $INSTALL_DIR"

# ── Step 5: Install root dependencies ─────────────────────────────────────────
Write-Step 5 "Installing backend dependencies..."
Push-Location $INSTALL_DIR
try {
    npm install --omit=dev --silent
    Write-OK "Root dependencies installed"
} catch {
    Write-Fail "npm install failed: $_"
    Pop-Location; pause; exit 1
}
Pop-Location

# ── Step 6: Install agent dependencies ────────────────────────────────────────
Write-Step 6 "Installing agent dependencies..."
Push-Location (Join-Path $INSTALL_DIR "agent")
try {
    npm install --omit=dev --silent
    Write-OK "Agent dependencies installed"
} catch {
    Write-Fail "npm install failed in agent/: $_"
    Pop-Location; pause; exit 1
}
Pop-Location

# ── Step 7: Create Windows services via node-windows ─────────────────────────────────
Write-Step 7 "Registering Windows services (auto-start on boot)..."

Push-Location (Join-Path $INSTALL_DIR "agent")
try {
    # Run the existing install-service.js which uses node-windows for the agent
    node scripts/install-service.js
    Write-OK "Agent Service registered via node-windows"
    
    # Run the install-server-service.js which uses node-windows for the server
    node scripts/install-server-service.js
    Write-OK "Server Service registered via node-windows"
} catch {
    Write-Fail "Failed to register services: $_"
    Pop-Location; pause; exit 1
}
Pop-Location

# ── Step 8: Verify services ────────────────────────────────────────────────────
Write-Step 8 "Verifying services..."

Start-Sleep -Seconds 3

$agentRunning  = (sc.exe query $SERVICE_NAME) -match "RUNNING"
$serverRunning = (sc.exe query $SERVER_NAME)  -match "RUNNING"

if ($agentRunning)  { Write-OK "ParentalControlAgent running" }
else                { Write-Host "      WARN: Agent may still be starting..." -ForegroundColor Yellow }
if ($serverRunning) { Write-OK "ParentalControlServer running" }
else                { Write-Host "      WARN: Server may still be starting..." -ForegroundColor Yellow }

# ── Done ──────────────────────────────────────────────────────────────────────
Write-Host ""
Write-Host "  ╔══════════════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "  ║  Installation complete!                              ║" -ForegroundColor Green
Write-Host "  ╚══════════════════════════════════════════════════════╝" -ForegroundColor Green
Write-Host ""
Write-Host "  Guardian is now running and will start automatically on every boot." -ForegroundColor White
Write-Host ""
Write-Host "  Open your browser and visit:" -ForegroundColor Gray
Write-Host "    https://parental-control-pwa.vercel.app" -ForegroundColor Cyan
Write-Host ""
Write-Host "  To uninstall:" -ForegroundColor Gray
Write-Host "    sc.exe stop  ParentalControlAgent ; sc.exe delete ParentalControlAgent" -ForegroundColor Gray
Write-Host "    sc.exe stop  ParentalControlServer ; sc.exe delete ParentalControlServer" -ForegroundColor Gray
Write-Host ""
pause
