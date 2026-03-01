@echo off
setlocal

echo ==========================================
echo Pinbox Alternative - Setup + Start
echo ==========================================
echo.

call "%~dp01_FIRST_TIME_SETUP.bat"
if errorlevel 1 (
  echo Setup failed, app was not started.
  exit /b 1
)

call "%~dp02_START_APP.bat"
exit /b %errorlevel%

