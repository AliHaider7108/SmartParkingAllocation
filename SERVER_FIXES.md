# Server.cpp - Critical Bugs Fixed

## ✅ Bugs Found and Fixed

### 1. **CRITICAL: JSON Escaping Bug** (FIXED)
**Problem**: Lines 46-48 had wrong escape sequences (`'\\\\'` instead of `'\\'`), producing malformed JSON that browsers couldn't parse.

**Fix**: Corrected all escape sequences in `jsonEscape()` function:
- `'\\\\'` → `'\\'` (single backslash)
- `'\\\"'` → `'\"'` (escaped quote)
- Added `#include <iomanip>` for proper Unicode escaping

### 2. **CRITICAL: JSON Output Bug** (FIXED)
**Problem**: JSON strings were built with literal `\n` and `\"` characters instead of actual newlines and quotes, making responses invalid JSON.

**Fix**: Changed all JSON building from:
```cpp
out << "{\\n  \\\"zones\\\": [";
```
to:
```cpp
out << "{\n  \"zones\": [";
```

### 3. **OPTIONS Handling** (FIXED)
**Problem**: OPTIONS requests were handled inside GET handlers, causing confusion.

**Fix**: Separated OPTIONS into a catch-all route that handles all CORS preflight requests.

### 4. **Error Handling** (ADDED)
**Added**: Try-catch blocks in `main()` to catch and report startup failures.

### 5. **Build Scripts** (ADDED)
**Added**: 
- `build_server.bat` (Windows)
- `build_server.sh` (Linux/Mac)

## 🚀 How to Build and Run

### Windows:
```bash
build_server.bat
smart_parking_server.exe
```

### Linux/Mac:
```bash
chmod +x build_server.sh
./build_server.sh
./smart_parking_server
```

### Manual Build:
```bash
g++ -std=c++17 Server.cpp ParkingSystem.cpp Zone.cpp ParkingArea.cpp ParkingSlot.cpp ParkingRequest.cpp Vehicle.cpp AllocateEngine.cpp RollBackManager.cpp -Iserver/Crow-master/include -o smart_parking_server -pthread -lws2_32
```

## ✅ Verification Steps

1. **Build the server** using one of the methods above
2. **Run the server** - you should see:
   ```
   Server started at http://localhost:8080
   Endpoints:
     GET  /api/zones
     GET  /api/dashboard
   ```
3. **Test in browser**: Open `http://localhost:8080/api/zones`
   - Should see valid JSON (not "site can't be reached")
   - JSON should be properly formatted with newlines
4. **Test frontend**: Open `frontend/index.html`
   - Dashboard should load without `ERR_CONNECTION_REFUSED`
   - Stats should display correctly

## 📋 Current Endpoints

- `GET /api/zones` - Returns zones with slot counts and utilization
- `GET /api/dashboard` - Returns dashboard statistics
- `OPTIONS /*` - Handles CORS preflight for all routes

## 🔍 What Was Wrong Before

1. **JSON was malformed** - browsers rejected it → `ERR_CONNECTION_REFUSED` (actually parse error)
2. **Server might not have compiled** - missing includes/errors
3. **Server might not have been running** - no clear build instructions

## 🎯 Next Steps

Once server is running:
1. Frontend will connect automatically
2. Add more endpoints as needed (POST /api/zones, POST /api/parking/requests, etc.)
3. Add request validation and error responses
