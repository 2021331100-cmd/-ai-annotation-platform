@echo off
echo ============================================
echo   AI Annotation Platform - Starting Servers
echo ============================================
echo.

cd /d "%~dp0"

echo Starting Backend Server...
start "Backend Server" cmd /k "cd backend && python main.py"
timeout /t 5 /nobreak >nul

echo Starting Frontend Server...
start "Frontend Server" cmd /k "cd frontend && npm run dev"

echo.
echo ============================================
echo   Servers are starting!
echo   Backend: http://localhost:8000
echo   Frontend: http://localhost:3000
echo ============================================
echo.
pause
