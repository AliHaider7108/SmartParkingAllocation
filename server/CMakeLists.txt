cmake_minimum_required(VERSION 3.10)
project(SmartParkingAPIServer)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

# Add executable
add_executable(parking_server
    server.cpp
    ApiController.cpp
    ../ParkingSystem.cpp
    ../Zone.cpp
    ../ParkingArea.cpp
    ../ParkingSlot.cpp
    ../Vehicle.cpp
    ../ParkingRequest.cpp
    ../AllocateEngine.cpp
    ../RollBackManager.cpp
)

# Include directories
target_include_directories(parking_server PRIVATE
    .
    ..
)

# Find required packages
find_package(Threads REQUIRED)

# Link libraries
target_link_libraries(parking_server
    Threads::Threads
)

# Crow framework (header-only, included via include path)
# In production, you might want to use find_package(Crow) or add_subdirectory
# For now, assuming Crow headers are available in the system include path

# Compiler flags
if(MSVC)
    target_compile_options(parking_server PRIVATE /W4)
else()
    target_compile_options(parking_server PRIVATE -Wall -Wextra -pedantic)
endif()

# Installation (optional)
install(TARGETS parking_server
    RUNTIME DESTINATION bin
)