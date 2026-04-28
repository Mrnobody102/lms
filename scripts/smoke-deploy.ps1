param(
  [string]$ApiUrl = "http://localhost:4000",
  [string]$WebStudentUrl = "http://localhost:3000",
  [string]$WebAdminUrl = "http://localhost:3001",
  [string]$SuperPortalUrl = "http://localhost:3002",
  [switch]$SkipWeb
)

$ErrorActionPreference = "Stop"

function Invoke-SmokeRequest {
  param(
    [string]$Name,
    [string]$Url,
    [int[]]$AllowedStatusCodes = @(200)
  )

  Write-Host "Checking ${Name}: $Url"
  try {
    $response = Invoke-WebRequest -Uri $Url -UseBasicParsing -TimeoutSec 20
  } catch {
    if ($_.Exception.Response -and $_.Exception.Response.StatusCode) {
      $statusCode = [int]$_.Exception.Response.StatusCode
      if ($AllowedStatusCodes -contains $statusCode) {
        return $_.Exception.Response
      }
    }

    throw
  }

  if ($AllowedStatusCodes -notcontains [int]$response.StatusCode) {
    throw "$Name returned HTTP $($response.StatusCode), expected one of: $($AllowedStatusCodes -join ', ')"
  }

  return $response
}

$apiBase = $ApiUrl.TrimEnd("/")

$ready = Invoke-SmokeRequest -Name "API readiness" -Url "$apiBase/api/health/ready"
$readyJson = $ready.Content | ConvertFrom-Json
if ($readyJson.status -ne "ok") {
  throw "API readiness status is '$($readyJson.status)'"
}

$metrics = Invoke-SmokeRequest -Name "API Prometheus metrics" -Url "$apiBase/api/health/metrics/prometheus"
$requiredMetrics = @(
  "lms_http_requests_total",
  "lms_health_readiness_checks_total",
  "lms_health_dependency_status"
)

foreach ($metricName in $requiredMetrics) {
  if ($metrics.Content -notmatch [regex]::Escape($metricName)) {
    throw "Prometheus output is missing metric '$metricName'"
  }
}

if (-not $SkipWeb) {
  Invoke-SmokeRequest -Name "Student web" -Url $WebStudentUrl -AllowedStatusCodes @(200, 307, 308) | Out-Null
  Invoke-SmokeRequest -Name "Admin web" -Url $WebAdminUrl -AllowedStatusCodes @(200, 307, 308) | Out-Null
  Invoke-SmokeRequest -Name "Super portal" -Url $SuperPortalUrl -AllowedStatusCodes @(200, 307, 308) | Out-Null
}

Write-Host "Deployment smoke checks passed."
