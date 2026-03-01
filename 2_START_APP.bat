@echo off
setlocal

echo ==========================================
echo Pinbox Alternative - Start App
echo ==========================================
echo.

where npm >nul 2>nul
if errorlevel 1 (
  echo [ERROR] npm is not installed or not in PATH.
  echo Install Node.js LTS first: https://nodejs.org/
  pause
  exit /b 1
)

pushd "%~dp0app" || (
  echo [ERROR] Cannot open app folder.
  pause
  exit /b 1
)

echo Starting dev server...
echo Open: http://localhost:3000
echo.
call npm run dev

popd
exit /b 0

