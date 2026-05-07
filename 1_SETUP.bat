@echo off
title AlumniConnect - Setup
color 0A

echo.
echo  ============================================
echo    ALUMNICONNECT - FULL SETUP
echo  ============================================
echo.

:: ── Check Python ────────────────────────────────────────
echo [1/6] Checking Python...
python --version >nul 2>&1
IF %ERRORLEVEL% NEQ 0 (
    echo  ERROR: Python not found.
    echo  Download from https://www.python.org/downloads/
    echo  Make sure to check "Add Python to PATH" during install.
    pause
    exit /b 1
)
python --version
echo  OK - Python found.
echo.

:: ── Check Node.js ───────────────────────────────────────
echo [2/6] Checking Node.js...
node --version >nul 2>&1
IF %ERRORLEVEL% NEQ 0 (
    echo  ERROR: Node.js not found.
    echo  Download from https://nodejs.org/
    pause
    exit /b 1
)
node --version
echo  OK - Node.js found.
echo.

:: ── Check PostgreSQL ────────────────────────────────────
echo [3/6] Checking PostgreSQL...
psql --version >nul 2>&1
IF %ERRORLEVEL% NEQ 0 (
    echo  WARNING: psql not found in PATH.
    echo  Make sure PostgreSQL is installed and running.
    echo  Download from https://www.postgresql.org/download/windows/
    echo.
    echo  Skipping auto database creation.
    echo  Please create the database manually:
    echo    psql -U postgres -c "CREATE DATABASE alumni_network;"
    echo.
) ELSE (
    psql --version
    echo  OK - PostgreSQL found.
    echo.
    echo  Creating database alumni_network...
    psql -U postgres -c "CREATE DATABASE alumni_network;" >nul 2>&1
    IF %ERRORLEVEL% NEQ 0 (
        echo  NOTE: Database may already exist - continuing.
    ) ELSE (
        echo  OK - Database created.
    )
)
echo.

:: ── Backend Setup ────────────────────────────────────────
echo [4/6] Setting up Backend (FastAPI)...
cd backend

echo  Creating Python virtual environment...
python -m venv venv
IF %ERRORLEVEL% NEQ 0 (
    echo  ERROR: Failed to create virtual environment.
    pause
    exit /b 1
)

echo  Activating virtual environment...
call venv\Scripts\activate.bat

echo  Installing Python dependencies...
pip install -r requirements.txt --quiet
IF %ERRORLEVEL% NEQ 0 (
    echo  ERROR: pip install failed. Check requirements.txt
    pause
    exit /b 1
)

echo  Creating backend .env file...
IF NOT EXIST .env (
    copy .env.example .env >nul
    echo  OK - .env created from .env.example
) ELSE (
    echo  NOTE: .env already exists, skipping.
)

echo  Creating upload directories...
IF NOT EXIST uploads\profiles mkdir uploads\profiles
IF NOT EXIST uploads\resumes  mkdir uploads\resumes
echo  OK - Upload folders ready.

call venv\Scripts\deactivate.bat
cd ..
echo  OK - Backend setup complete.
echo.

:: ── Frontend Setup ───────────────────────────────────────
echo [5/6] Setting up Frontend (React)...
cd frontend

echo  Installing Node.js dependencies (this may take a minute)...
call npm install
IF %ERRORLEVEL% NEQ 0 (
    echo  ERROR: npm install failed.
    pause
    exit /b 1
)

echo  Creating frontend .env file...
IF NOT EXIST .env (
    copy .env.example .env >nul
    echo  OK - .env created from .env.example
) ELSE (
    echo  NOTE: .env already exists, skipping.
)

cd ..
echo  OK - Frontend setup complete.
echo.

:: ── Final Instructions ───────────────────────────────────
echo [6/6] Setup Complete!
echo.
echo  ============================================
echo   IMPORTANT: Configure your .env file
echo  ============================================
echo.
echo  Open  backend\.env  and set:
echo.
echo    DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/alumni_network
echo    SECRET_KEY=any-random-32-character-string-here
echo.
echo  Everything else is pre-configured for local development.
echo.
echo  ============================================
echo   DEMO ACCOUNTS (auto-created on first run)
echo  ============================================
echo.
echo   Email                  Password    Role
echo   ---------------------  ----------  -------------------
echo   demo@alumni.com        demo1234    Master Admin
echo   priya@alumni.com       demo1234    Data Scientist
echo   rahul@alumni.com       demo1234    Startup Founder
echo   sneha@alumni.com       demo1234    Product Manager
echo   arjun@alumni.com       demo1234    Mechanical Engineer
echo.
echo  Demo data is seeded automatically when the backend starts.
echo.
echo  ============================================
echo   NEXT STEP: Run  2_RUN_PROJECT.bat
echo  ============================================
echo.
pause
