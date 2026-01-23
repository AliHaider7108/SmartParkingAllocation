
#include "ParkingArea.h"

ParkingArea::ParkingArea(int areaId)
    : areaId(areaId)
{
}

int ParkingArea::getAreaId() const
{
    return areaId;
}

void ParkingArea::addParkingSlot(const ParkingSlot& slot)
{
    slots.push_back(slot);
}

ParkingSlot* ParkingArea::getFirstAvailableSlot()
{
    for (auto& slot : slots)
    {
        if (slot.getIsAvailable())
        {
            return &slot;
        }
    }

    return nullptr;
}

