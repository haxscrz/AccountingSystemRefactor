@echo off
title Accounting System Launcher
color 0A

echo ================================================
echo   Accounting System - Starting up...
echo ================================================
echo.

:: Set base directory to wherever this bat file lives
set "BASE=%~dp0"
set "BACKEND=%BASE%web-system\server\AccountingApi"
set "FRONTEND=%BASE%web-system"

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
if not exist "%FRONTEND%\node_modules" (
    echo [1/4] Installing frontend dependencies...
    cd /d "%FRONTEND%"
    call npm install
    if %errorlevel% neq 0 (
        echo [ERROR] npm install failed.
        pause & exit /b 1
    )
) else (
    echo [1/4] Frontend dependencies already installed. Skipping.
)

:: ── Build backend ───────────────────────────────
echo [2/4] Building backend...
cd /d "%BACKEND%"
dotnet build -v minimal
if %errorlevel% neq 0 (
    echo.
    echo [ERROR] Backend build failed. See errors above.
    pause & exit /b 1
)

:: ── Seed legacy data ─────────────────────────────
echo [3/4] Seeding legacy data...
cd /d "%FRONTEND%"
call npm run seed:legacy 2>nul
echo     (seed step done - continuing)

:: ── Start backend in a new window ────────────────
echo [4/4] Launching backend and frontend windows...
start "Accounting API (Backend)" /d "%BACKEND%" cmd /k "title Accounting API (port 5081) && dotnet run && pause"

:: Give the backend time to initialise
timeout /t 4 /nobreak >nul

:: ── Start frontend in a new window ───────────────
start "Accounting UI (Frontend)" /d "%FRONTEND%" cmd /k "title Accounting UI (port 3000) && npm run dev && pause"

:: ── Wait then open browser ───────────────────────
echo.
echo    Backend  → http://localhost:5081
echo    Frontend → http://localhost:3000
echo.
echo    Both are starting in separate windows.
echo    Browser will open in 8 seconds...
echo    (Keep the Backend and Frontend windows open while using the app)
echo.
timeout /t 8 /nobreak >nul
start http://localhost:3000

echo.
echo    Launcher done. You can close this window.
timeout /t 2 /nobreak >nul
