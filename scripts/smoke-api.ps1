param(
  [switch]$SkipContainerCheck
)

$ErrorActionPreference = 'Stop'

$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$baseUrl = 'http://127.0.0.1:4000/api'
$tenantHint = 'trung-tam-demo'
$studentEmail = 'student@lms.com'
$studentPassword = 'admin123'
$apiProcess = $null

function Invoke-RepoCommand {
  param([string]$Command)

  Push-Location $repoRoot
  try {
    Invoke-Expression $Command
    if ($LASTEXITCODE -ne 0) {
      throw "Command failed: $Command"
    }
  } finally {
    Pop-Location
  }
}

function Free-RepoPorts {
  param([int[]]$Ports)

  & powershell -ExecutionPolicy Bypass -File (Join-Path $repoRoot 'scripts/stop-project-processes.ps1') -Ports $Ports -Quiet
  if ($LASTEXITCODE -ne 0) {
    throw "Failed to free repo ports: $($Ports -join ', ')"
  }
}

function Assert-ContainerRunning {
  param(
    [string]$ContainerName,
    [string]$Description
  )

  $status = (docker inspect -f "{{.State.Running}}" $ContainerName 2>$null)
  if (-not $status -or $status.Trim().ToLowerInvariant() -ne 'true') {
    throw "$Description container '$ContainerName' is not running"
  }
}

function Wait-ForApiHealth {
  param([int]$TimeoutSeconds = 90)

  $deadline = (Get-Date).AddSeconds($TimeoutSeconds)
  while ((Get-Date) -lt $deadline) {
    try {
      $health = Invoke-RestMethod -Uri "$baseUrl/health/ready" -TimeoutSec 5
      if ($health.status -eq 'ok' -and $health.checks.database.status -eq 'up') {
        return $health
      }
    } catch {
    }

    Start-Sleep -Seconds 2
  }

  throw 'API health check did not become ready in time'
}

function Get-CsrfToken {
  param([Microsoft.PowerShell.Commands.WebRequestSession]$Session)

  $cookies = $Session.Cookies.GetCookies($baseUrl)
  $csrfCookie = $cookies | Where-Object { $_.Name -eq 'csrf_token' } | Select-Object -First 1
  if (-not $csrfCookie -or -not $csrfCookie.Value) {
    throw 'CSRF cookie was not set after login'
  }

  return $csrfCookie.Value
}

try {
  if (-not $SkipContainerCheck) {
    Write-Host 'Checking Docker services...'
    Assert-ContainerRunning -ContainerName 'lms_postgres' -Description 'Postgres'
    Assert-ContainerRunning -ContainerName 'lms_redis' -Description 'Redis'

    $redisPing = (docker exec lms_redis redis-cli ping 2>$null)
    if (-not $redisPing -or $redisPing.Trim().ToUpperInvariant() -ne 'PONG') {
      throw 'Redis ping failed'
    }
  } else {
    Write-Host 'Skipped checking Docker services (SkipContainerCheck is $true)'
  }

  Write-Host 'Preparing database...'
  Invoke-RepoCommand 'pnpm db:seed'

  Write-Host 'Freeing API port if an older repo process is still running...'
  Free-RepoPorts -Ports @(4000)

  Write-Host 'Building api-server...'
  Invoke-RepoCommand 'pnpm --filter api-server build'

  Write-Host 'Starting api-server...'
  $apiProcess = Start-Process -FilePath 'cmd.exe' `
    -ArgumentList '/d', '/s', '/c', 'pnpm --filter api-server start' `
    -WorkingDirectory $repoRoot `
    -PassThru `
    -WindowStyle Hidden

  $health = Wait-ForApiHealth
  $live = Invoke-RestMethod -Uri "$baseUrl/health/live" -TimeoutSec 5
  if ($live.status -ne 'ok') {
    throw 'API liveness check failed'
  }

  Write-Host "Health OK: database latency ${($health.checks.database.latencyMs)}ms"

  $session = New-Object Microsoft.PowerShell.Commands.WebRequestSession
  $loginBody = @{
    email = $studentEmail
    password = $studentPassword
  } | ConvertTo-Json

  $loginResponse = Invoke-RestMethod `
    -Method Post `
    -Uri "$baseUrl/auth/login" `
    -Headers @{ 'x-tenant-id' = $tenantHint } `
    -ContentType 'application/json' `
    -Body $loginBody `
    -WebSession $session `
    -TimeoutSec 10

  if (-not $loginResponse.user -or $loginResponse.user.email -ne $studentEmail) {
    throw 'Login smoke test failed'
  }
  $csrfToken = Get-CsrfToken -Session $session

  $me = Invoke-RestMethod `
    -Method Get `
    -Uri "$baseUrl/users/me" `
    -Headers @{ 'x-tenant-id' = $tenantHint } `
    -WebSession $session `
    -TimeoutSec 10

  $coursesResponse = Invoke-RestMethod `
    -Method Get `
    -Uri "$baseUrl/courses?page=1&limit=10" `
    -Headers @{ 'x-tenant-id' = $tenantHint } `
    -WebSession $session `
    -TimeoutSec 10

  $courses = @()
  if ($coursesResponse.data) {
    $courses = @($coursesResponse.data)
  } elseif ($coursesResponse -is [System.Array]) {
    $courses = @($coursesResponse)
  }

  if ($courses.Count -eq 0) {
    throw 'No courses returned from smoke test'
  }

  $courseId = $courses[0].id
  $courseDetail = Invoke-RestMethod `
    -Method Get `
    -Uri "$baseUrl/courses/$courseId" `
    -Headers @{ 'x-tenant-id' = $tenantHint } `
    -WebSession $session `
    -TimeoutSec 10

  if (-not $courseDetail.lessons -or $courseDetail.lessons.Count -eq 0) {
    throw 'Course detail did not include lessons'
  }

  $lessonId = $courseDetail.lessons[0].id
  $progressUpdateBody = @{
    lessonId = $lessonId
    status = 'COMPLETED'
  } | ConvertTo-Json

  $progressUpdate = Invoke-RestMethod `
    -Method Post `
    -Uri "$baseUrl/progress/update" `
    -Headers @{ 'x-tenant-id' = $tenantHint; 'x-csrf-token' = $csrfToken } `
    -ContentType 'application/json' `
    -Body $progressUpdateBody `
    -WebSession $session `
    -TimeoutSec 10

  $progressList = Invoke-RestMethod `
    -Method Get `
    -Uri "$baseUrl/progress/course/$courseId" `
    -Headers @{ 'x-tenant-id' = $tenantHint } `
    -WebSession $session `
    -TimeoutSec 10

  if (-not $progressUpdate -or -not $progressList) {
    throw 'Progress smoke test failed'
  }

  Invoke-RestMethod `
    -Method Post `
    -Uri "$baseUrl/auth/logout" `
    -Headers @{ 'x-tenant-id' = $tenantHint; 'x-csrf-token' = $csrfToken } `
    -WebSession $session `
    -TimeoutSec 10 | Out-Null

  Write-Host "Smoke OK: $($me.email), courses=$($courses.Count), firstCourse=$courseId, firstLesson=$lessonId"
} finally {
  if ($apiProcess -and -not $apiProcess.HasExited) {
    try {
      Stop-Process -Id $apiProcess.Id -Force -ErrorAction SilentlyContinue
    } catch {
    }
  }

  try {
    Free-RepoPorts -Ports @(4000)
  } catch {
  }
}
