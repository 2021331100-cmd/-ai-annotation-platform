@echo off
cd /d "%~dp0frontend"
echo Starting frontend development server...
echo.
call npm run dev
pause
