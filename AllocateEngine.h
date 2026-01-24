
#ifndef ALLOCATION_ENGINE_H
#define ALLOCATION_ENGINE_H

#include "ParkingSlot.h"
#include "Zone.h"

class AllocationEngine
{
public:
    // Attempts to allocate a parking slot for the given requested zone.
    // Preference:
    // 1. First available slot in the requested zone.
    // 2. If none, first available slot in any other zone (cross-zone allocation).
    //
    // Parameters:
    // - requestedZoneId: ID of the preferred zone.
    // - zones: array of Zone objects to search.
    // - zoneCount: number of zones in the array.
    //
    // Returns:
    // - Pointer to allocated ParkingSlot, or nullptr if none available.
    ParkingSlot* allocateSlot(int requestedZoneId, Zone* zones, int zoneCount);
};

#endif  // ALLOCATION_ENGINE_H

