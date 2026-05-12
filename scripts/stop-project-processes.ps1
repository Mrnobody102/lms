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

function Get-ListeningProcessIds {
  param([int]$Port)

  if ($IsWindows -or $PSVersionTable.PSEdition -eq 'Desktop') {
    $connections = @(Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue)
    return @($connections | Select-Object -ExpandProperty OwningProcess -Unique)
  }

  $lsof = Get-Command lsof -ErrorAction SilentlyContinue
  if ($lsof) {
    $ids = @(& $lsof.Source -nP "-iTCP:$Port" '-sTCP:LISTEN' '-t' 2>$null)
    return @($ids | Where-Object { $_ -match '^\d+$' } | ForEach-Object { [int]$_ } | Select-Object -Unique)
  }

  $ss = Get-Command ss -ErrorAction SilentlyContinue
  if ($ss) {
    $output = @(& $ss.Source -ltnp "sport = :$Port" 2>$null)
    return @(
      $output |
        Select-String -Pattern 'pid=(\d+)' -AllMatches |
        ForEach-Object { $_.Matches } |
        ForEach-Object { [int]$_.Groups[1].Value } |
        Select-Object -Unique
    )
  }

  Write-Info "Port ${Port}: cannot inspect listening processes because neither lsof nor ss is available"
  return @()
}

function Get-ProcessCommandLine {
  param([int]$ProcessId)

  if ($IsWindows -or $PSVersionTable.PSEdition -eq 'Desktop') {
    $process = Get-CimInstance Win32_Process -Filter "ProcessId = $ProcessId" -ErrorAction SilentlyContinue
    if (-not $process) {
      return $null
    }

    return @{
      ProcessId = $process.ProcessId
      Name = $process.Name
      CommandLine = if ($process.CommandLine) { $process.CommandLine } else { '' }
    }
  }

  $processInfo = Get-Process -Id $ProcessId -ErrorAction SilentlyContinue
  if (-not $processInfo) {
    return $null
  }

  $commandLine = ''
  $cmdlinePath = "/proc/$ProcessId/cmdline"
  if (Test-Path $cmdlinePath) {
    $bytes = [System.IO.File]::ReadAllBytes($cmdlinePath)
    $commandLine = [System.Text.Encoding]::UTF8.GetString($bytes).Replace([char]0, ' ').Trim()
  }

  return @{
    ProcessId = $processInfo.Id
    Name = $processInfo.ProcessName
    CommandLine = $commandLine
  }
}

foreach ($port in $Ports) {
  $processIds = @(Get-ListeningProcessIds -Port $port)

  if (-not $processIds -or $processIds.Count -eq 0) {
    Write-Info "Port ${port}: free"
    continue
  }

  foreach ($processId in ($processIds | Sort-Object -Unique)) {
    $process = Get-ProcessCommandLine -ProcessId $processId

    if (-not $process) {
      Write-Info "Port ${port}: process $processId no longer exists"
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
