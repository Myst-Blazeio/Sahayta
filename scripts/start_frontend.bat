@echo off
setlocal EnableDelayedExpansion

title Sahayta — Frontend Dev Server

:: Navigate to the frontend directory
cd /d "%~dp0..\frontend"
if !errorlevel! neq 0 (
    echo [ERROR] Cannot find frontend directory at %~dp0..\frontend
    pause & exit /b 1
)

echo.
echo  =========================================================
echo   Sahayta Frontend — React + Vite (dev server)
echo  =========================================================
echo.

:: ── Check Node.js ─────────────────────────────────────────────────────────────
node --version >nul 2>&1
if !errorlevel! neq 0 (
    echo [ERROR] Node.js is not installed or not in PATH.
    echo         Download from https://nodejs.org/
    pause & exit /b 1
)

:: ── Install node_modules if missing ──────────────────────────────────────────
if not exist "node_modules" (
    echo [1/2] Installing npm packages...
    npm install
    if !errorlevel! neq 0 (
        echo [ERROR] npm install failed.
        pause & exit /b 1
    )
) else (
    echo [1/2] node_modules found.
)

echo [2/2] Starting Vite dev server on http://localhost:5173
echo        Press Ctrl+C to stop.
echo.

:: Launch browser once port 5173 is ready
start "" /B powershell -NoProfile -Command ^
  "$i=0; while (!(Test-NetConnection localhost -Port 5173 -WarningAction SilentlyContinue).TcpTestSucceeded) ^
  { Start-Sleep 2; $i++; if ($i -gt 30) { break } }; ^
  if ($i -le 30) { Start-Process 'http://localhost:5173/' }"

npm run dev

if !errorlevel! neq 0 (
    echo [ERROR] npm run dev failed.
    pause & exit /b 1
)
endlocal