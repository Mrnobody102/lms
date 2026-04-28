# Validation script for AI Agent Work (Windows/PowerShell)
# Purpose: Run before handoff or commit to mirror the CI fast checks.

$ErrorActionPreference = "Stop"

Write-Host "--- AI Validation Gate Started ---" -ForegroundColor Cyan

Write-Host "[1/5] Checking frozen install..." -ForegroundColor Yellow
pnpm install --frozen-lockfile
if ($LASTEXITCODE -ne 0) { Write-Error "Frozen install failed"; exit 1 }

Write-Host "[2/5] Running typecheck..." -ForegroundColor Yellow
pnpm run typecheck
if ($LASTEXITCODE -ne 0) { Write-Error "Typecheck failed"; exit 1 }

Write-Host "[3/5] Running lint..." -ForegroundColor Yellow
pnpm run lint
if ($LASTEXITCODE -ne 0) { Write-Error "Lint failed"; exit 1 }

Write-Host "[4/5] Running tests..." -ForegroundColor Yellow
pnpm run test
if ($LASTEXITCODE -ne 0) { Write-Error "Tests failed"; exit 1 }

Write-Host "[5/5] Running production build..." -ForegroundColor Yellow
pnpm run build
if ($LASTEXITCODE -ne 0) { Write-Error "Build failed"; exit 1 }

Write-Host "--- ALL CHECKS PASSED. SYSTEM STABLE. ---" -ForegroundColor Green
