@echo off
setlocal EnableDelayedExpansion

title Sahayta — Build ML Models

cd /d "%~dp0..\backend"

echo.
echo  =========================================================
echo   Sahayta — Rebuild ML Indexes
echo  =========================================================
echo.

:: Activate venv
if not exist "final_venv\Scripts\activate" (
    echo [ERROR] Virtual environment not found. Run start_backend.bat first.
    pause & exit /b 1
)
call final_venv\Scripts\activate

echo [1/2] Rebuilding BNS search indexes (TF-IDF + BM25)...
python scripts\build_bns_index.py
if !errorlevel! neq 0 (
    echo [ERROR] BNS index build failed.
    pause & exit /b 1
)

echo [2/2] Done. Both indexes saved to assets\models\bns\
echo.
echo  bns_tfidf.pkl  — TF-IDF fallback index
echo  bns_bm25.pkl   — BM25 primary index
echo.
pause
endlocal
