# Validate AI Work Script for LMS Platform (Windows PowerShell)

$ErrorActionPreference = "Stop"
$Success = $true

Write-Host "--- Starting AI Work Validation ---" -ForegroundColor Cyan

# 1. Linting Check
Write-Host "[1/4] Running Linting..." -ForegroundColor Yellow
try {
    pnpm lint
} catch {
    Write-Host "X Linting failed!" -ForegroundColor Red
    $Success = $false
}

# 2. Type Checking
Write-Host "[2/4] Running Type Check..." -ForegroundColor Yellow
try {
    pnpm run typecheck
} catch {
    Write-Host "X Type check failed!" -ForegroundColor Red
    $Success = $false
}

# 3. Response Shape Grep (Heuristic)
Write-Host "[3/4] Checking for direct response objects (potential bypass of TransformInterceptor)..." -ForegroundColor Yellow
# Tìm các controller không trả về DTO hoặc trả về object literal mà không có wrapper (tỷ lệ cao là sai)
$Controllers = Get-ChildItem -Path "apps/api-server/src" -Filter "*.controller.ts" -Recurse
foreach ($file in $Controllers) {
    $content = Get-Content $file.FullName
    if ($content -match 'return \{' -and $content -notmatch 'success:') {
        # Note: Đây chỉ là cảnh báo, vì có thể họ trả về data để interceptor wrap. 
        # Nhưng nếu họ tự viết { success: true } trong controller là SAI (duplicate)
        if ($content -match 'success:') {
            Write-Host "X Warning: Found manual 'success' key in $($file.Name). Interceptor handles this!" -ForegroundColor Red
            $Success = $false
        }
    }
}

# 4. Unused Code / Any Check
Write-Host "[4/4] Checking for forbidden 'any' types..." -ForegroundColor Yellow
$AnyMatches = Select-String -Path "apps/api-server/src/**/*.ts", "apps/web-*/**/*.ts" -Pattern ": any" -Exclude "*.spec.ts", "node_modules"
if ($AnyMatches) {
    Write-Host "X Forbidden 'any' usage found:" -ForegroundColor Red
    $AnyMatches | ForEach-Object { Write-Host "  $($_.FileName):$($_.LineNumber) - $($_.Line)" }
    $Success = $false
}

if ($Success) {
    Write-Host "--- Validation PASSED ---" -ForegroundColor Green
    exit 0
} else {
    Write-Host "--- Validation FAILED ---" -ForegroundColor Red
    exit 1
}
