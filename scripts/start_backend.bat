@echo off
setlocal

:: Navigate to the backend directory
cd /d "%~dp0..\backend"

if not exist "final_venv" (
    echo Creating virtual environment...
    python -m venv final_venv
)

call final_venv\Scripts\activate

echo Installing dependencies...
pip install -r requirements.txt

echo.
echo Starting Backend Server...
echo The browser will launch automatically once the server is ready (listening on port 5000).
echo.

:: Launch a parallel process that waits for port 5000 then opens the browser
:: Checks every 2 seconds, times out after 60 seconds
start "" /B powershell -Command "$i=0; while (!(Test-NetConnection localhost -Port 5000 -WarningAction SilentlyContinue).TcpTestSucceeded) { Start-Sleep -Seconds 2; $i++; if ($i -gt 30) { break } }; if ($i -le 30) { Start-Process 'http://localhost:5000/' }"

:: Run the server in the foreground so logs are visible
python app.py

if %errorlevel% neq 0 (
    echo.
    echo Backend server crashed with error code %errorlevel%.
    pause
)
pause