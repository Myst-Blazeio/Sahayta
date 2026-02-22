@echo off
cd /d "%~dp0..\frontend"
if %errorlevel% neq 0 (
    echo Error: Could not change directory to frontend
    pause
    exit /b %errorlevel%
)

echo Installing dependencies...
call npm install
if %errorlevel% neq 0 (
    echo Error: npm install failed
    pause
    exit /b %errorlevel%
)

echo Starting Frontend...
start "Frontend" npm run dev
:: Launch a parallel process that waits for port 5173 then opens the browser
start "" /B powershell -Command "$i=0; while (!(Test-NetConnection localhost -Port 5173 -WarningAction SilentlyContinue).TcpTestSucceeded) { Start-Sleep -Seconds 2; $i++; if ($i -gt 30) { break } }; if ($i -le 30) { Start-Process 'http://localhost:5173/' }"
if %errorlevel% neq 0 (
    echo Error: npm run dev failed
    pause
    exit /b %errorlevel%
)
pause