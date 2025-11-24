@echo off
echo ==========================================
echo Starting Frontend Development Server
echo ==========================================
echo.
cd frontend
call npm install
if %errorlevel% neq 0 (
    echo Failed to install dependencies
    pause
    exit /b 1
)
echo.
echo Starting Vite dev server...
echo Frontend will be available at: http://localhost:5173
echo.
call npm run dev
pause
