
#include "AllocationEngine.h"

ParkingSlot* AllocationEngine::allocateSlot(int requestedZoneId, Zone* zones, int zoneCount)
{
    if (zones == nullptr || zoneCount <= 0)
    {
        return nullptr;
    }

    // 1. Try to allocate in the requested zone first
    for (int i = 0; i < zoneCount; ++i)
    {
        if (zones[i].getZoneId() == requestedZoneId)
        {
            ParkingSlot* slot = zones[i].findAvailableSlotInZone();
            if (slot != nullptr)
            {
                return slot;
            }
        }
    }

    // 2. Fall back to any other zone (cross-zone allocation)
    for (int i = 0; i < zoneCount; ++i)
    {
        if (zones[i].getZoneId() == requestedZoneId)
        {
            // Already checked this zone above
            continue;
        }

        ParkingSlot* slot = zones[i].findAvailableSlotInZone();
        if (slot != nullptr)
        {
            return slot;
        }
    }

    // No available slots in any zone
    return nullptr;
}

