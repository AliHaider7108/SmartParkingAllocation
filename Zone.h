#ifndef ZONE_H
#define ZONE_H

#include <vector>

#include "ParkingArea.h"

class Zone
{
private:
    static const int MAX_ADJACENT_ZONES = 10;

    int zoneId;
    std::vector<ParkingArea> parkingAreas;
    int adjacentZones[MAX_ADJACENT_ZONES];
    int adjacentCount;

public:
    Zone(int zoneId);

    int getZoneId() const;

    void addParkingArea(const ParkingArea& area);

    // Returns pointer to first available slot within this zone, or nullptr if none
    ParkingSlot* findAvailableSlotInZone();
};

#endif  // ZONE_H
