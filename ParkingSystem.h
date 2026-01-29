// Restored header declarations for ParkingSystem.
// Note: This file only declares the class interface and members used by ParkingSystem.cpp.
// No business logic is implemented here.

#ifndef PARKING_SYSTEM_H
#define PARKING_SYSTEM_H

#include <string>
#include <vector>

#include "AllocationEngine.h"
#include "RollBackManager.h"
#include "ParkingRequest.h"
#include "Vehicle.h"
#include "Zone.h"

class ParkingSystem {
private:
    std::vector<Zone> zones;
    std::vector<Vehicle> vehicles;
    std::vector<ParkingRequest> requests;
    AllocationEngine allocationEngine;
    RollbackManager rollbackManager;

public:
    ParkingSystem();

    void addZone(const Zone& zone);

    // Creates a request and allocates a slot immediately (if available).
    // Returns requestId on success, or -1 on failure.
    int requestParking(const std::string& vehicleId, int requestedZoneId);

    bool cancelRequest(int requestId);
    bool releaseSlot(int requestId);
};

#endif  // PARKING_SYSTEM_H

