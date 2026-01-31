@echo off
setlocal

echo ===================================================
echo       SMART PARKING SYSTEM - LAUNCHER
echo ===================================================
echo.

REM Check if server executable exists
if not exist "smart_parking_server.exe" (
    echo [SETUP] Server executable not found.
    echo [SETUP] Starting build process...
    call build_server.bat
    if %ERRORLEVEL% NEQ 0 (
        echo [ERROR] Build failed. Cannot start application.
        pause
        exit /b 1
    )
) else (
    echo [SETUP] Server executable found.
)

REM Kill existing server instance if running
taskkill /F /IM smart_parking_server.exe >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo [SETUP] Stopped previous server instance.
)

REM Start the server in a new minimized window
echo [SETUP] Starting backend server...
start /MIN "Smart Parking Server" cmd /k "smart_parking_server.exe"

REM Wait a moment for server to initialize
echo [SETUP] Waiting for server to initialize...
timeout /t 2 /nobreak >nul

REM Open the frontend in default browser
echo [SETUP] Launching frontend interface...
start "" "frontend\index.html"

echo.
echo [SUCCESS] Application launched successfully!
echo.
echo Press any key to close this launcher (Server will keep running)...
pause >nul
