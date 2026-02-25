@echo off
setlocal

:: Navigate to the frontend directory
cd /d "%~dp0..\frontend"
if %errorlevel% neq 0 (
    echo [ERROR] Could not find frontend directory at %~dp0..\frontend
    pause
    exit /b 1
)

:: Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed or not in PATH.
    pause
    exit /b %errorlevel%
)

echo Starting Frontend...
start "Frontend" npm run dev
:: Launch a parallel process that waits for port 5173 then opens the browser
start "" /B powershell -Command "$i=0; while (!(Test-NetConnection localhost -Port 5173 -WarningAction SilentlyContinue).TcpTestSucceeded) { Start-Sleep -Seconds 2; $i++; if ($i -gt 30) { break } }; if ($i -le 30) { Start-Process 'http://localhost:5173/' }"
if %errorlevel% neq 0 (
    echo [ERROR] npm run dev failed.
    pause
    exit /b 1
)

pause