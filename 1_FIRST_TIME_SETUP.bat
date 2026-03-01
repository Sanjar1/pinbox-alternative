@echo off
setlocal

echo ==========================================
echo Pinbox Alternative - First Time Setup
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

echo [1/3] Installing dependencies...
call npm install
if errorlevel 1 goto :fail

echo.
echo [2/3] Applying database migrations...
call npx prisma migrate dev
if errorlevel 1 goto :fail

echo.
echo [3/3] Seeding demo account...
call npm run db:seed
if errorlevel 1 goto :fail

echo.
echo Setup complete.
echo Login: admin@demo.com
echo Password: change-me
echo.
popd
pause
exit /b 0

:fail
echo.
echo [ERROR] Setup failed.
popd
pause
exit /b 1

