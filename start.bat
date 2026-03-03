@echo off
title Accounting System Launcher
color 0A

echo ================================================
echo   Accounting System - Starting up...
echo ================================================
echo.

:: ── Check Node is installed ──────────────────────
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed or not in PATH.
    echo         Download it from https://nodejs.org
    pause & exit /b 1
)

:: ── Check dotnet is installed ────────────────────
where dotnet >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] .NET SDK is not installed or not in PATH.
    echo         Download it from https://dotnet.microsoft.com
    pause & exit /b 1
)

:: ── Install frontend dependencies if needed ──────
if not exist "%~dp0web-system\node_modules" (
    echo [1/4] Installing frontend dependencies...
    cd /d "%~dp0web-system"
    call npm install
    if %errorlevel% neq 0 (
        echo [ERROR] npm install failed.
        pause & exit /b 1
    )
) else (
    echo [1/4] Frontend dependencies already installed. Skipping.
)

:: ── Build backend if needed ───────────────────────
echo [2/4] Building backend...
cd /d "%~dp0web-system\server\AccountingApi"
dotnet build --no-incremental -v quiet
if %errorlevel% neq 0 (
    echo [ERROR] Backend build failed.
    pause & exit /b 1
)

:: ── Seed legacy data ─────────────────────────────
echo [3/4] Seeding legacy data...
cd /d "%~dp0web-system"
call npm run seed:legacy
if %errorlevel% neq 0 (
    echo [WARNING] Legacy seed returned an error (may already be seeded - continuing).
)

:: ── Start backend in a new window ────────────────
echo [4/4] Starting backend and frontend...
cd /d "%~dp0web-system\server\AccountingApi"
start "Accounting API (Backend)" cmd /k "title Accounting API ^& dotnet run --no-build"

:: Small delay so backend gets a head start
timeout /t 3 /nobreak >nul

:: ── Start frontend in a new window ───────────────
cd /d "%~dp0web-system"
start "Accounting UI (Frontend)" cmd /k "title Accounting UI ^& npm run dev"

:: ── Wait then open browser ───────────────────────
echo.
echo    Backend  → http://localhost:5081
echo    Frontend → http://localhost:3000
echo.
echo    Both are starting in separate windows.
echo    Browser will open in 6 seconds...
echo.
timeout /t 6 /nobreak >nul
start http://localhost:3000

echo    Done! You can close this launcher window.
timeout /t 3 /nobreak >nul
