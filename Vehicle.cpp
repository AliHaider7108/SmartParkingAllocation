
#include "Vehicle.h"

Vehicle::Vehicle(const std::string& vehicleId, int preferredZone)
    : vehicleId(vehicleId), preferredZone(preferredZone)
{
}

const std::string& Vehicle::getVehicleId() const
{
    return vehicleId;
}

int Vehicle::getPreferredZone() const
{
    return preferredZone;
}

