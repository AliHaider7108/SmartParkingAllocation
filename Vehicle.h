
#ifndef VEHICLE_H
#define VEHICLE_H

#include <string>

class Vehicle
{
private:
    std::string vehicleId;
    int preferredZone;

public:
    Vehicle(const std::string& vehicleId, int preferredZone);

    const std::string& getVehicleId() const;
    int getPreferredZone() const;
};

#endif  // VEHICLE_H

