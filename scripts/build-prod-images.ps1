param(
  [string[]]$Services = @('api', 'migrate', 'web-student', 'web-sales', 'web-admin', 'super-portal'),
  [string]$ComposeFile = 'deployment/production/docker-compose.prod.yml',
  [switch]$NoCache
)

$ErrorActionPreference = 'Stop'

function Set-BuildDefaultEnv {
  param(
    [string]$Name,
    [string]$Value
  )

  if (-not [Environment]::GetEnvironmentVariable($Name, 'Process')) {
    [Environment]::SetEnvironmentVariable($Name, $Value, 'Process')
  }
}

Set-BuildDefaultEnv 'POSTGRES_PASSWORD' 'local_build_only_password'
Set-BuildDefaultEnv 'JWT_SECRET' 'local_build_only_jwt_secret_at_least_32_chars'
Set-BuildDefaultEnv 'CORS_ORIGINS' 'http://localhost:3000,http://localhost:3001,http://localhost:3002,http://localhost:3003'
Set-BuildDefaultEnv 'NEXT_PUBLIC_API_URL' 'http://localhost:4000'
Set-BuildDefaultEnv 'NEXT_PUBLIC_WEB_STUDENT_URL' 'http://localhost:3000'
Set-BuildDefaultEnv 'NEXT_PUBLIC_WEB_SALES_URL' 'http://localhost:3003'
Set-BuildDefaultEnv 'NEXT_PUBLIC_TENANT_ID' ''

$buildArgs = @('compose', '-f', $ComposeFile, 'build')
if ($NoCache) {
  $buildArgs += '--no-cache'
}

foreach ($service in $Services) {
  Write-Host "Building $service..."
  docker @buildArgs $service
}
