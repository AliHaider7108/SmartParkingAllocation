@echo off
echo Building Smart Parking Server...
echo.

REM Check if g++ is available
where g++ >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: g++ compiler not found in PATH
    echo Please install MinGW-w64 or add g++ to your PATH
    pause
    exit /b 1
)

echo Compiling Server.cpp with all dependencies...
g++ -std=c++17 ^
    Server.cpp ^
    ParkingSystem.cpp ^
    Zone.cpp ^
    ParkingArea.cpp ^
    ParkingSlot.cpp ^
    ParkingRequest.cpp ^
    Vehicle.cpp ^
    AllocateEngine.cpp ^
    RollBackManager.cpp ^
    -Iserver/Crow-master/include ^
    -I"server\\asio-master\\include" ^
    -o smart_parking_server.exe ^
    -pthread ^
    -lws2_32 -lmswsock

if %ERRORLEVEL% EQU 0 (
    echo.
    echo Build successful! Executable: smart_parking_server.exe
    echo.
    echo To run the server:
    echo   smart_parking_server.exe
    echo.
) else (
    echo.
    echo Build failed! Check errors above.
    echo.
    pause
    exit /b 1
)

pause
