#include "Zone.h"

Zone::Zone(int zoneId)
    : zoneId(zoneId), adjacentCount(0)
{
    for (int i = 0; i < MAX_ADJACENT_ZONES; ++i)
    {
        adjacentZones[i] = -1;
    }
}

int Zone::getZoneId() const
{
    return zoneId;
}

void Zone::addParkingArea(const ParkingArea& area)
{
    parkingAreas.push_back(area);
}

ParkingSlot* Zone::findAvailableSlotInZone()
{
    for (auto& area : parkingAreas)
    {
        ParkingSlot* slot = area.getFirstAvailableSlot();
        if (slot != nullptr)
        {
            return slot;
        }
    }

    return nullptr;
}