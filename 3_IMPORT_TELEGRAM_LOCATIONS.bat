@echo off
setlocal

cd /d "%~dp0app"

echo ===============================================
echo Import stores from Telegram channel to the app
echo ===============================================
echo.
echo Source channel: https://t.me/lokasiyasirnayalavka
echo.

node scripts/import-telegram-channel.mjs
if errorlevel 1 (
  echo.
  echo Import failed. Please check error above.
  pause
  exit /b 1
)

echo.
echo Import completed successfully.
echo Report: ..\docs\LOCATION_PLATFORM_AUDIT.md
echo.
pause
