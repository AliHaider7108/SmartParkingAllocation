#!/bin/bash

# Smart Parking API Test Script
# This script tests basic API functionality

API_BASE="http://localhost:8080/api"

echo "Testing Smart Parking Allocation API"
echo "====================================="
echo

# Test 1: Health check
echo "1. Testing health check..."
response=$(curl -s -w "\n%{http_code}" "$API_BASE/health")
http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | head -n -1)

if [ "$http_code" -eq 200 ]; then
    echo "✓ Health check passed"
else
    echo "✗ Health check failed (HTTP $http_code)"
fi
echo

# Test 2: Get zones
echo "2. Testing get zones..."
response=$(curl -s -w "\n%{http_code}" "$API_BASE/zones")
http_code=$(echo "$response" | tail -n1)

if [ "$http_code" -eq 200 ]; then
    echo "✓ Get zones passed"
else
    echo "✗ Get zones failed (HTTP $http_code)"
fi
echo

# Test 3: Create parking request
echo "3. Testing create parking request..."
request_data='{"vehicleId": "TEST123", "requestedZoneId": 1}'
response=$(curl -s -w "\n%{http_code}" -X POST \
    -H "Content-Type: application/json" \
    -d "$request_data" \
    "$API_BASE/parking/requests")
http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | head -n -1)

if [ "$http_code" -eq 201 ]; then
    echo "✓ Create parking request passed"
    # Extract request ID for next test
    request_id=$(echo "$body" | grep -o '"requestId":[0-9]*' | cut -d':' -f2)
else
    echo "✗ Create parking request failed (HTTP $http_code)"
    echo "Response: $body"
fi
echo

# Test 4: Get zone availability
echo "4. Testing zone availability..."
response=$(curl -s -w "\n%{http_code}" "$API_BASE/zones/1/availability")
http_code=$(echo "$response" | tail -n1)

if [ "$http_code" -eq 200 ]; then
    echo "✓ Zone availability passed"
else
    echo "✗ Zone availability failed (HTTP $http_code)"
fi
echo

# Test 5: Register vehicle
echo "5. Testing vehicle registration..."
vehicle_data='{"vehicleId": "VEHICLE001", "preferredZone": 1}'
response=$(curl -s -w "\n%{http_code}" -X POST \
    -H "Content-Type: application/json" \
    -d "$vehicle_data" \
    "$API_BASE/vehicles")
http_code=$(echo "$response" | tail -n1)

if [ "$http_code" -eq 201 ]; then
    echo "✓ Vehicle registration passed"
else
    echo "✗ Vehicle registration failed (HTTP $http_code)"
fi
echo

# Test 6: Analytics
echo "6. Testing analytics..."
response=$(curl -s -w "\n%{http_code}" "$API_BASE/analytics/cancellations")
http_code=$(echo "$response" | tail -n1)

if [ "$http_code" -eq 200 ]; then
    echo "✓ Analytics passed"
else
    echo "✗ Analytics failed (HTTP $http_code)"
fi
echo

echo "API testing completed!"
echo "Make sure the server is running on localhost:8080"
echo
echo "To start the server:"
echo "  cd build && ./parking_server"
echo
echo "Or manually:"
echo "  g++ -std=c++17 -pthread server.cpp ApiController.cpp ../*.cpp -o parking_server && ./parking_server"