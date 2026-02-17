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
start "Frontend" npm run dev -- --open
if %errorlevel% neq 0 (
    echo Error: npm run dev failed
    pause
    exit /b %errorlevel%
)
pause
