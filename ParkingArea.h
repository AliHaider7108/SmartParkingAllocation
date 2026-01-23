
#ifndef PARKING_AREA_H
#define PARKING_AREA_H

#include <vector>

#include "ParkingSlot.h"

class ParkingArea
{
private:
    int areaId;
    std::vector<ParkingSlot> slots;

public:
    ParkingArea(int areaId);

    int getAreaId() const;

    void addParkingSlot(const ParkingSlot& slot);
    ParkingSlot* getFirstAvailableSlot();
};

#endif  // PARKING_AREA_H

