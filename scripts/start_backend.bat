@echo off
setlocal

:: Navigate to the backend directory
cd /d "%~dp0..\backend"
if %errorlevel% neq 0 (
    echo [ERROR] Could not find backend directory at %~dp0..\backend
    pause
    exit /b 1
)

set "VENV_DIR=final_venv"

:: Check if Python is installed
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Python is not installed or not in PATH.
    pause
    exit /b 1
)

:: Check if virtual environment exists
if not exist "%VENV_DIR%" (
    echo [INFO] Creating virtual environment...
    python -m venv "%VENV_DIR%"
    if %errorlevel% neq 0 (
        echo [ERROR] Failed to create virtual environment.
        pause
        exit /b 1
    )
)

:: Activate virtual environment
echo [INFO] Activating virtual environment...
call "%VENV_DIR%\Scripts\activate"
if %errorlevel% neq 0 (
    echo [ERROR] Failed to activate virtual environment.
    pause
    exit /b 1
)

:: Install dependencies
echo [INFO] Installing dependencies...
python -m pip install --upgrade pip
if exist "requirements.txt" (
    pip install -r requirements.txt
    if %errorlevel% neq 0 (
        echo [ERROR] Failed to install dependencies.
        pause
        exit /b 1
    )
) else (
    echo [WARNING] requirements.txt not found.
)

:: Check MongoDB Connection
echo [INFO] Checking MongoDB connection...
python verify_db.py
if %errorlevel% neq 0 (
    echo [WARNING] MongoDB connection failed. Attempting to start MongoDB...
    
    :: Attempt to start MongoDB service if it exists, otherwise run mongod directly
    net start MongoDB >nul 2>&1
    if %errorlevel% neq 0 (
        echo [INFO] MongoDB service not found or access denied. Starting mongod.exe directly...
        if exist "D:\MongoDB\bin\mongod.exe" (
            start /b "" "D:\MongoDB\bin\mongod.exe" --config "D:\MongoDB\bin\mongod.cfg"
            echo [INFO] MongoDB started in background. Waiting for initialization...
            timeout /t 5 /nobreak >nul
        ) else (
            echo [ERROR] MongoDB executable not found at D:\MongoDB\bin\mongod.exe
            echo [HINT] Please ensure MongoDB is installed and the path is correct.
            pause
            exit /b 1
        )
    ) else (
        echo [INFO] MongoDB service started successfully.
        timeout /t 3 /nobreak >nul
    )

    :: Verify connection again
    echo [INFO] Verifying connection after startup attempt...
    python verify_db.py
    if errorlevel 1 (
        echo [ERROR] MongoDB startup/connection failed.
        echo [HINT] Ensure MONGO_URI is set correctly in backend/.env
        pause
        exit /b 1
    )
)

:: Start the server and open the browser
echo [INFO] Starting backend server...
start "" "http://localhost:5000/police/login"
python app.py

if %errorlevel% neq 0 (
    echo [ERROR] Backend server crashed.
    pause
    exit /b 1
)

pause
endlocal
