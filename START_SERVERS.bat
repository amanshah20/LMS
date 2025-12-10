@echo off
echo ========================================
echo   Starting LMS Servers
echo ========================================
echo.

echo Starting Backend Server...
start "Backend Server" cmd /k "cd /d %~dp0backend && node server.js"
timeout /t 3 /nobreak >nul

echo Starting Frontend Server...
start "Frontend Server" cmd /k "cd /d %~dp0frontend && npm start"

echo.
echo ========================================
echo   Servers are starting...
echo   Backend:  http://localhost:5000
echo   Frontend: http://localhost:3000
echo ========================================
echo.
echo Wait 30 seconds for frontend to compile.
echo Then open http://localhost:3000 in browser
echo.
pause
