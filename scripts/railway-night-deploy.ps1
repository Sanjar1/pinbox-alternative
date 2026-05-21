param(
  [string]$ProjectRoot = "C:\Users\99893\Documents\Pinbox alternative",
  [string]$LogDir = "C:\Users\99893\Documents\Pinbox alternative\logs"
)

$ErrorActionPreference = "Stop"

# Railway CLI must run from the app/ subdirectory because railway.json lives there.
# Deploying from the repo root uses the wrong railway.json path and fails silently.
$AppDir = Join-Path $ProjectRoot "app"
if (-not (Test-Path -LiteralPath $AppDir)) {
  throw "App directory not found: $AppDir"
}

if (-not (Test-Path -LiteralPath $LogDir)) {
  New-Item -ItemType Directory -Path $LogDir | Out-Null
}

$timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
$logFile = Join-Path $LogDir "railway-night-deploy-$timestamp.log"

Push-Location $AppDir
try {
  "[$(Get-Date -Format s)] Starting Railway deploy from $AppDir ..." | Tee-Object -FilePath $logFile -Append | Out-Null
  railway up --service web --environment production --detach 2>&1 | Tee-Object -FilePath $logFile -Append | Out-Null
  "[$(Get-Date -Format s)] Deploy command finished." | Tee-Object -FilePath $logFile -Append | Out-Null
}
finally {
  Pop-Location
}
