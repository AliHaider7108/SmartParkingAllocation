#!/bin/bash

echo "Building Smart Parking Server..."
echo

# Check if g++ is available
if ! command -v g++ &> /dev/null; then
    echo "ERROR: g++ compiler not found"
    echo "Please install g++ (sudo apt-get install g++ on Ubuntu/Debian)"
    exit 1
fi

echo "Compiling Server.cpp with all dependencies..."
g++ -std=c++17 \
    Server.cpp \
    ParkingSystem.cpp \
    Zone.cpp \
    ParkingArea.cpp \
    ParkingSlot.cpp \
    ParkingRequest.cpp \
    Vehicle.cpp \
    AllocateEngine.cpp \
    RollBackManager.cpp \
    -Iserver/Crow-master/include \
    -Iserver/asio-master/asio/include \
    -Iserver/asio-master/include \
    -o smart_parking_server \
    -pthread

if [ $? -eq 0 ]; then
    echo
    echo "Build successful! Executable: ./smart_parking_server"
    echo
    echo "To run the server:"
    echo "  ./smart_parking_server"
    echo
else
    echo
    echo "Build failed! Check errors above."
    exit 1
fi
