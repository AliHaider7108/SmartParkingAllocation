
#include "ParkingSlot.h"

ParkingSlot::ParkingSlot(int slotId, int zoneId)
    : slotId(slotId), zoneId(zoneId), isAvailable(true)
{
}

int ParkingSlot::getSlotId() const
{
    return slotId;
}

void ParkingSlot::setSlotId(int slotId)
{
    this->slotId = slotId;
}

int ParkingSlot::getZoneId() const
{
    return zoneId;
}

void ParkingSlot::setZoneId(int zoneId)
{
    this->zoneId = zoneId;
}

bool ParkingSlot::getIsAvailable() const
{
    return isAvailable;
}

void ParkingSlot::setIsAvailable(bool isAvailable)
{
    this->isAvailable = isAvailable;
}

