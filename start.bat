@echo off
echo Starting Bangladesh Edu Site...
echo.
echo [1/3] Starting Python backend (port 8000)...
start "Backend" cmd /k "cd /d %~dp0backend && python -m uvicorn main:app --host 0.0.0.0 --port 8000"
timeout /t 3 /nobreak >nul
echo [2/3] Starting Java analytics (port 8090)...
start "Java" cmd /k "cd /d %~dp0java-service && java AnalyticsServer"
timeout /t 2 /nobreak >nul
echo [3/3] Starting React frontend (port 5173)...
start "Frontend" cmd /k "cd /d %~dp0frontend && npm run dev"
timeout /t 3 /nobreak >nul
echo.
echo All services started!
echo   Frontend:  http://localhost:5173
echo   Backend:   http://localhost:8000  (docs: http://localhost:8000/docs)
echo   Java:      http://localhost:8090
echo.
pause