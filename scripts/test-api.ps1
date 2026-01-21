# PowerShell Testing Script for API

Write-Host "=== API Testing Script ===" -ForegroundColor Cyan
Write-Host ""

# Test 1: Create Tenant (via SQL)
Write-Host "Step 1: Creating Test Tenant..." -ForegroundColor Yellow
docker exec -it lms_postgres psql -U postgres -d lms_platform -c "INSERT INTO \"Tenant\" (id, name, slug, settings) VALUES ('test-tenant-123', 'Test Learning Center', 'test-center', '{}') ON CONFLICT (id) DO NOTHING;"

Write-Host ""
Write-Host "Step 2: Registering User..." -ForegroundColor Yellow

$registerBody = @{
    email = "test@example.com"
    password = "Test12345"
    fullName = "Nguyen Van Test"
    phoneNumber = "+84901234567"
    tenantId = "test-tenant-123"
} | ConvertTo-Json

$headers = @{
    "Content-Type" = "application/json"
    "x-tenant-id" = "test-tenant-123"
}

try {
    $response = Invoke-RestMethod -Uri "http://localhost:4000/api/auth/register" -Method Post -Body $registerBody -Headers $headers
    Write-Host "✅ Registration successful!" -ForegroundColor Green
    Write-Host ""
    Write-Host "User ID: $($response.data.user.id)" -ForegroundColor White
    Write-Host "Email: $($response.data.user.email)" -ForegroundColor White
    Write-Host "Role: $($response.data.user.role)" -ForegroundColor White
    Write-Host ""
    Write-Host "🔑 Token (save this):" -ForegroundColor Cyan
    Write-Host $response.data.token -ForegroundColor White
    
    # Save token to variable for next tests
    $global:token = $response.data.token
    
    Write-Host ""
    Write-Host "Token saved to `$token variable" -ForegroundColor Green
    
} catch {
    Write-Host "❌ Registration failed!" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
}

Write-Host ""
Write-Host "Step 3: Testing Login..." -ForegroundColor Yellow

$loginBody = @{
    email = "test@example.com"
    password = "Test12345"
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "http://localhost:4000/api/auth/login" -Method Post -Body $loginBody -Headers $headers
    Write-Host "✅ Login successful!" -ForegroundColor Green
    $global:token = $response.data.token
    Write-Host "New token saved to `$token" -ForegroundColor Green
} catch {
    Write-Host "❌ Login failed!" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
}

Write-Host ""
Write-Host "Step 4: Getting User Profile..." -ForegroundColor Yellow

$authHeaders = @{
    "Authorization" = "Bearer $token"
    "x-tenant-id" = "test-tenant-123"
}

try {
    $response = Invoke-RestMethod -Uri "http://localhost:4000/api/users/me" -Method Get -Headers $authHeaders
    Write-Host "✅ Profile retrieved!" -ForegroundColor Green
    Write-Host ($response.data | ConvertTo-Json -Depth 3)
} catch {
    Write-Host "❌ Get profile failed!" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
}

Write-Host ""
Write-Host "=== Testing Complete ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "Token is saved in variable: `$token" -ForegroundColor Yellow
Write-Host ""
Write-Host "You can now run manual tests, e.g.:" -ForegroundColor White
Write-Host '  Invoke-RestMethod -Uri "http://localhost:4000/api/users/me" -Headers @{"Authorization"="Bearer $token"; "x-tenant-id"="test-tenant-123"}' -ForegroundColor Gray
