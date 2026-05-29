param(
  [string]$ProjectRoot = "C:\Users\99893\Documents\Pinbox alternative",
  [string]$LogDir = "C:\Users\99893\Documents\Pinbox alternative\logs",
  [int]$MaxAttempts = 2
)

# Nightly Railway deploy (local fallback to the GitHub Actions deploy).
#
# History: from 2026-05-24 this silently failed every night — `railway up`
# crashed at "Indexing..." (Rust out-of-memory) before uploading, and the old
# script had no detection, no retry, and no alert, so the bot ran stale code
# for days. This version detects failure, retries once, and pings Telegram so a
# silent failure can never happen again.
#
# Railway CLI MUST run from the app/ subdirectory (railway.json lives there).

$ErrorActionPreference = "Stop"

$AppDir = Join-Path $ProjectRoot "app"
if (-not (Test-Path -LiteralPath $AppDir)) { throw "App directory not found: $AppDir" }
if (-not (Test-Path -LiteralPath $LogDir)) { New-Item -ItemType Directory -Path $LogDir | Out-Null }

$timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
$logFile = Join-Path $LogDir "railway-night-deploy-$timestamp.log"

function Write-Log {
  param([string]$Message)
  $line = "[$(Get-Date -Format s)] $Message"
  # UTF-8 so the logs are greppable (the old Tee-Object default wrote UTF-16).
  Add-Content -LiteralPath $logFile -Value $line -Encoding utf8
  Write-Output $line
}

# Reads a single KEY=VALUE from app/.env (used only to send the failure alert).
function Get-EnvValue {
  param([string]$Key)
  $envFile = Join-Path $AppDir ".env"
  if (-not (Test-Path -LiteralPath $envFile)) { return $null }
  foreach ($raw in Get-Content -LiteralPath $envFile) {
    $l = $raw.Trim()
    if ($l.StartsWith("#") -or -not $l.Contains("=")) { continue }
    $k = $l.Substring(0, $l.IndexOf("=")).Trim()
    if ($k -eq $Key) {
      $v = $l.Substring($l.IndexOf("=") + 1).Trim()
      return $v.Trim('"').Trim("'")
    }
  }
  return $null
}

function Send-FailureAlert {
  param([string]$Detail)
  try {
    $token = Get-EnvValue "TELEGRAM_BOT_TOKEN"
    $chat = Get-EnvValue "TELEGRAM_CHAT_ID"
    if (-not $token -or -not $chat) {
      Write-Log "No Telegram creds in app/.env — cannot send failure alert."
      return
    }
    $text = "[ALERT] Nightly Railway deploy FAILED on $env:COMPUTERNAME ($timestamp).`n`n$Detail`n`nLive site is still on the previous deployment. Fix: deploy via the Railway dashboard, or rely on the GitHub Actions nightly deploy."
    $body = @{ chat_id = $chat; text = $text } | ConvertTo-Json -Compress
    Invoke-RestMethod -Method Post -Uri "https://api.telegram.org/bot$token/sendMessage" `
      -ContentType "application/json; charset=utf-8" `
      -Body ([System.Text.Encoding]::UTF8.GetBytes($body)) -TimeoutSec 30 | Out-Null
    Write-Log "Failure alert sent to Telegram."
  } catch {
    Write-Log "Failed to send Telegram alert: $($_.Exception.Message)"
  }
}

# A run "succeeded" only if the CLI uploaded the snapshot — i.e. it got past
# "Indexing..." to "Uploading..." AND printed a Build Logs URL. Exit code alone
# is not trusted because the Rust OOM can abort oddly.
function Test-DeploySucceeded {
  param([string]$Output, [int]$ExitCode)
  if ($ExitCode -ne 0) { return $false }
  return ($Output -match "Uploading") -and ($Output -match "Build Logs|build logs|railway\.com/project")
}

Push-Location $AppDir
try {
  $finalOutput = ""
  $deployed = $false

  for ($attempt = 1; $attempt -le $MaxAttempts; $attempt++) {
    Write-Log "Attempt $attempt/$MaxAttempts: railway up --service web --environment production --detach (cwd=$AppDir)"
    $raw = & railway up --service web --environment production --detach 2>&1 | Out-String
    $code = $LASTEXITCODE
    $finalOutput = $raw
    Add-Content -LiteralPath $logFile -Value $raw -Encoding utf8

    if (Test-DeploySucceeded -Output $raw -ExitCode $code) {
      Write-Log "Attempt $attempt SUCCEEDED (exit=$code, upload confirmed)."
      $deployed = $true
      break
    }

    $oom = if ($raw -match "memory allocation of \d+ bytes failed") { " [Rust out-of-memory during Indexing]" } else { "" }
    Write-Log "Attempt $attempt FAILED (exit=$code)$oom."
    if ($attempt -lt $MaxAttempts) { Start-Sleep -Seconds 20 }
  }

  if (-not $deployed) {
    $tail = ($finalOutput -split "`n" | Select-Object -Last 6) -join "`n"
    Write-Log "All $MaxAttempts attempts failed. Sending alert."
    Send-FailureAlert -Detail "Last output:`n$tail"
    exit 1
  }

  Write-Log "Deploy command finished (success)."
  exit 0
}
finally {
  Pop-Location
}
