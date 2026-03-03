@echo off
setlocal EnableDelayedExpansion

title Sahayta — Backend Server

:: Navigate to the backend directory (relative to this script's location)
cd /d "%~dp0..\backend"

echo.
echo  =========================================================
echo   Sahayta Backend — Flask + ML Service
echo  =========================================================
echo.

:: ── Virtual environment ──────────────────────────────────────────────────────
if not exist "final_venv" (
    echo [1/3] Creating virtual environment...
    python -m venv final_venv
    if !errorlevel! neq 0 (
        echo [ERROR] Failed to create virtual environment. Is Python 3.10+ installed?
        pause & exit /b 1
    )
) else (
    echo [1/3] Virtual environment found.
)

call final_venv\Scripts\activate

:: ── Dependencies ─────────────────────────────────────────────────────────────
echo [2/3] Installing / verifying dependencies...
pip install -r requirements.txt -q
if !errorlevel! neq 0 (
    echo [ERROR] pip install failed.
    pause & exit /b 1
)

:: ── Build ML indexes if pkl files are missing ─────────────────────────────────
echo [3/3] Checking ML indexes...
if not exist "assets\models\bns\bns_bm25.pkl" (
    echo   bns_bm25.pkl not found — rebuilding BNS indexes...
    python scripts\build_bns_index.py
    if !errorlevel! neq 0 (
        echo [WARN] BNS index build failed. BNS suggestions may be unavailable.
    )
) else (
    echo   ML indexes OK.
)

echo.
echo  Starting backend on http://localhost:5000
echo  Press Ctrl+C to stop.
echo.

:: Launch browser once port 5000 is ready
start "" /B powershell -NoProfile -Command ^
  "$i=0; while (!(Test-NetConnection localhost -Port 5000 -WarningAction SilentlyContinue).TcpTestSucceeded) ^
  { Start-Sleep 2; $i++; if ($i -gt 30) { break } }; ^
  if ($i -le 30) { Start-Process 'http://localhost:5000/' }"

:: Start Flask
python app.py

if !errorlevel! neq 0 (
    echo.
    echo [ERROR] Backend crashed (exit code !errorlevel!).
    pause
)
endlocal