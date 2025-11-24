@echo off
echo ========================================
echo AI Data Annotation Platform - Startup
echo ========================================
echo.

REM Start Backend
echo [1/2] Starting Backend API Server...
cd backend
start "Backend API" cmd /k "python --version && pip install -r requirements.txt && echo. && echo Backend API running at: http://localhost:8000 && echo API Documentation: http://localhost:8000/docs && echo. && python main.py"

REM Wait for backend to start
timeout /t 5 /nobreak >nul

REM Start Frontend
cd ..
echo [2/2] Starting Frontend Development Server...
cd frontend
start "Frontend UI" cmd /k "echo Installing frontend dependencies... && npm install && echo. && echo Frontend running at: http://localhost:3000 && echo. && npm run dev"

echo.
echo ========================================
echo   STARTUP COMPLETE
echo ========================================
echo Backend:  http://localhost:8000
echo Frontend: http://localhost:3000
echo API Docs: http://localhost:8000/docs
echo ========================================
echo.
echo Both servers are running in separate windows.
echo Close the terminal windows to stop the servers.
echo.
pause
