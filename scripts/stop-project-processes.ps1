param(
  [int[]]$Ports = @(3000, 3001, 3002, 3100, 4000),
  [switch]$Quiet
)

$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path.ToLowerInvariant()
$stoppedProcessIds = New-Object 'System.Collections.Generic.HashSet[int]'

function Write-Info {
  param([string]$Message)

  if (-not $Quiet) {
    Write-Host $Message
  }
}

foreach ($port in $Ports) {
  $connections = @(Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue)

  if (-not $connections -or $connections.Count -eq 0) {
    Write-Info "Port ${port}: free"
    continue
  }

  foreach ($connection in ($connections | Sort-Object OwningProcess -Unique)) {
    $process = Get-CimInstance Win32_Process -Filter "ProcessId = $($connection.OwningProcess)" -ErrorAction SilentlyContinue

    if (-not $process) {
      Write-Info "Port ${port}: process $($connection.OwningProcess) no longer exists"
      continue
    }

    $commandLine = ''
    if ($process.CommandLine) {
      $commandLine = $process.CommandLine.ToLowerInvariant()
    }

    $isRepoProcess = $commandLine.Contains($repoRoot)

    if (-not $isRepoProcess) {
      Write-Info "Port ${port}: skipped PID $($process.ProcessId) ($($process.Name)) because it is not owned by this repo"
      continue
    }

    if ($stoppedProcessIds.Contains($process.ProcessId)) {
      Write-Info "Port ${port}: PID $($process.ProcessId) already stopped"
      continue
    }

    try {
      Stop-Process -Id $process.ProcessId -Force -ErrorAction Stop
      $null = $stoppedProcessIds.Add($process.ProcessId)
      Write-Info "Port ${port}: stopped PID $($process.ProcessId) ($($process.Name))"
    } catch {
      Write-Info "Port ${port}: failed to stop PID $($process.ProcessId) ($($process.Name)) - $($_.Exception.Message)"
      throw
    }
  }
}
