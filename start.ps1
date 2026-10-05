$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot

if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    throw "Node.js 20 or newer is required. Download it from https://nodejs.org/"
}

if (-not (Test-Path "node_modules\sharp\package.json")) {
    Write-Host "Installing dependencies..." -ForegroundColor Yellow
    & npm.cmd install
    if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
}

& node "src\tui.js" @args
exit $LASTEXITCODE
