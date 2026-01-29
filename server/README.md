# Smart Parking Allocation API Server

This directory contains the REST API server implementation for the Smart Parking Allocation System using the Crow C++ web framework.

## Features

- RESTful API endpoints for all parking system operations
- JSON request/response format
- CORS support for web frontend integration
- Multithreaded HTTP server
- Comprehensive error handling

## API Endpoints

### Zone Management
- `POST /api/zones` - Create a new parking zone
- `GET /api/zones` - Get all parking zones
- `GET /api/zones/{id}` - Get specific zone details
- `GET /api/zones/{id}/availability` - Get zone availability

### Vehicle Management
- `POST /api/vehicles` - Register a vehicle
- `GET /api/vehicles/{id}` - Get vehicle information

### Parking Requests
- `POST /api/parking/requests` - Create parking request
- `GET /api/parking/requests/{id}` - Get request status
- `PUT /api/parking/requests/{id}/cancel` - Cancel request
- `PUT /api/parking/requests/{id}/allocate` - Allocate parking
- `PUT /api/parking/requests/{id}/release` - Release parking
- `PUT /api/parking/requests/{id}/occupy` - Mark as occupied

### System Operations
- `POST /api/system/rollback` - Rollback allocations

### Analytics
- `GET /api/analytics/zones/utilization` - Zone utilization stats
- `GET /api/analytics/cancellations` - Cancellation statistics
- `GET /api/analytics/peak-usage` - Peak usage analytics

## Dependencies

- Crow C++ web framework (header-only)
- CMake 3.10+
- C++17 compatible compiler
- Threads library

## Building

### Using CMake (Recommended)

```bash
# Create build directory
mkdir build
cd build

# Configure and build
cmake ../server
make

# Or on Windows with Visual Studio
cmake ../server -G "Visual Studio 16 2019"
cmake --build . --config Release
```

### Manual Compilation

If CMake is not available, you can compile manually:

```bash
g++ -std=c++17 -pthread -I. -I.. \
    server.cpp ApiController.cpp \
    ../ParkingSystem.cpp ../Zone.cpp ../ParkingArea.cpp \
    ../ParkingSlot.cpp ../Vehicle.cpp ../ParkingRequest.cpp \
    ../AllocateEngine.cpp ../RollBackManager.cpp \
    -o parking_server
```

## Running the Server

```bash
./parking_server
```

The server will start on `http://localhost:8080`

## Testing

### Health Check
```bash
curl http://localhost:8080/api/health
```

### Create a Parking Request
```bash
curl -X POST http://localhost:8080/api/parking/requests \
  -H "Content-Type: application/json" \
  -d '{"vehicleId": "ABC123", "requestedZoneId": 1}'
```

### Get Zone Availability
```bash
curl http://localhost:8080/api/zones/1/availability
```

## Architecture Notes

- The `ApiController` class wraps the existing `ParkingSystem` without modifying its core logic
- Analytics are tracked at the API level (some features are simplified due to ParkingSystem encapsulation)
- CORS is enabled for web frontend integration
- All responses are JSON formatted with consistent error handling

## Limitations

- Some analytics features are simplified due to ParkingSystem's encapsulation
- Rollback functionality is not fully exposed by ParkingSystem
- Manual allocation and occupy operations need ParkingSystem extensions
- Current implementation uses sample data for some queries

## Web Frontend Integration

The server includes CORS headers to allow web browsers to make cross-origin requests. Point your web frontend to `http://localhost:8080` for API calls.