param(
  [string]$ProjectRoot = "C:\Users\99893\Documents\Pinbox alternative",
  [string]$TaskName = "Pinbox-Railway-Night-Deploy"
)

# (Re)registers the nightly Railway deploy task from the in-repo XML definition
# (scripts/pinbox-night-deploy-task.xml), which fixes the two reasons the task
# silently skipped nights:
#   - DisallowStartIfOnBatteries/StopIfGoingOnBatteries were true  -> now false
#   - no WakeToRun                                                 -> now true
#
# Uses native schtasks.exe (NOT the Get-/Register-ScheduledTask CIM cmdlets,
# which hang on this machine). schtasks requires the XML to be UTF-16, so we
# transcode the UTF-8 repo file to a temp UTF-16 copy first.
#
# Run once:  powershell -NoProfile -ExecutionPolicy Bypass -File scripts\register-night-deploy-task.ps1
# If it prints "Access is denied", re-run from an elevated PowerShell.

$ErrorActionPreference = "Stop"

$xmlSrc = Join-Path $ProjectRoot "scripts\pinbox-night-deploy-task.xml"
if (-not (Test-Path -LiteralPath $xmlSrc)) { throw "Task XML not found: $xmlSrc" }

# Transcode UTF-8 -> UTF-16 (and fix the encoding declaration) for schtasks.
$xml = Get-Content -LiteralPath $xmlSrc -Raw
$xml = $xml -replace 'encoding="UTF-8"', 'encoding="UTF-16"'
$tmp = Join-Path $env:TEMP "pinbox-night-deploy-task-u16.xml"
Set-Content -LiteralPath $tmp -Value $xml -Encoding Unicode

Write-Output "Registering '$TaskName' from $xmlSrc ..."
& schtasks.exe /create /tn $TaskName /xml $tmp /f
if ($LASTEXITCODE -ne 0) { throw "schtasks /create failed with exit code $LASTEXITCODE" }

Remove-Item -LiteralPath $tmp -ErrorAction SilentlyContinue

Write-Output ""
Write-Output "Verifying battery/wake settings now applied:"
& schtasks.exe /query /tn $TaskName /xml |
  Select-String -Pattern "DisallowStartIfOnBatteries|StopIfGoingOnBatteries|WakeToRun|StartBoundary|Command"
