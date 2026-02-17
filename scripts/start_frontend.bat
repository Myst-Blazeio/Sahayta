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
    exit /b 1
)

:: Check if node_modules exists to avoid reinstalling every time
if not exist "node_modules" (
    echo [INFO] node_modules not found. Installing dependencies...
    call npm install
    if %errorlevel% neq 0 (
        echo [ERROR] npm install failed.
        pause
        exit /b 1
    )
) else (
    echo [INFO] node_modules found. Skipping install.
)

:: Start the frontend development server
echo [INFO] Starting Frontend...
call npm run dev
if %errorlevel% neq 0 (
    echo [ERROR] npm run dev failed.
    pause
    exit /b 1
)

pause
endlocal