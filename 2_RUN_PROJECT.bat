@echo off
title AlumniConnect - Running
color 0B

echo.
echo  ============================================
echo    ALUMNICONNECT - STARTING PROJECT
echo  ============================================
echo.

:: ── Pre-flight checks ────────────────────────────────────
echo  Checking setup...

IF NOT EXIST backend\venv\Scripts\activate.bat (
    echo  ERROR: Backend venv not found.
    echo  Please run  1_SETUP.bat  first!
    pause
    exit /b 1
)

IF NOT EXIST backend\.env (
    echo  ERROR: backend\.env not found.
    echo  Please run  1_SETUP.bat  first!
    pause
    exit /b 1
)

IF NOT EXIST frontend\node_modules (
    echo  ERROR: frontend\node_modules not found.
    echo  Please run  1_SETUP.bat  first!
    pause
    exit /b 1
)

echo  OK - All checks passed.
echo.

:: ── Start Backend in new window ──────────────────────────
echo  Starting Backend (FastAPI on port 8000)...
start "AlumniConnect - Backend" cmd /k "cd /d %~dp0backend && call venv\Scripts\activate.bat && echo. && echo  Backend starting... && echo  API Docs: http://localhost:8000/api/docs && echo. && uvicorn app.main:app --reload --port 8000"

:: Small delay so backend starts before frontend
timeout /t 3 /nobreak >nul

:: ── Start Frontend in new window ─────────────────────────
echo  Starting Frontend (React on port 5173)...
start "AlumniConnect - Frontend" cmd /k "cd /d %~dp0frontend && echo. && echo  Frontend starting... && echo  App: http://localhost:5173 && echo. && npm run dev"

:: ── Wait then open browser ───────────────────────────────
echo.
echo  Waiting for servers to be ready...
timeout /t 5 /nobreak >nul

echo  Opening browser...
start http://localhost:5173

:: ── Info panel ───────────────────────────────────────────
echo.
echo  ============================================
echo   ALUMNICONNECT IS RUNNING
echo  ============================================
echo.
echo   App         -^>  http://localhost:5173
echo   API Docs    -^>  http://localhost:8000/api/docs
echo   API Health  -^>  http://localhost:8000/health
echo.
echo  ============================================
echo   DEMO LOGIN CREDENTIALS
echo  ============================================
echo.
echo   Use any of these on the login page:
echo   (credentials panel is shown on the login page)
echo.
echo   demo@alumni.com    /  demo1234   ^<-- Master Admin
echo   priya@alumni.com   /  demo1234
echo   rahul@alumni.com   /  demo1234
echo   sneha@alumni.com   /  demo1234
echo   arjun@alumni.com   /  demo1234
echo.
echo   NOTE: Demo data is auto-seeded on first backend start.
echo         Two terminal windows are now open for backend
echo         and frontend. Close them to stop the app.
echo.
echo  ============================================
echo.
pause
