
#ifndef PARKING_SLOT_H
#define PARKING_SLOT_H

class ParkingSlot
{
private:
    int slotId;
    int zoneId;
    bool isAvailable;

public:
    ParkingSlot(int slotId, int zoneId);

    int getSlotId() const;
    void setSlotId(int slotId);

    int getZoneId() const;
    void setZoneId(int zoneId);

    bool getIsAvailable() const;
    void setIsAvailable(bool isAvailable);
};

#endif  
