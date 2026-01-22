#ifndef PARKING_REQUEST_H
#define PARKING_REQUEST_H

#include <string>

class ParkingRequest
{
public:
    enum class State
    {
        REQUESTED,
        ALLOCATED,
        OCCUPIED,
        RELEASED,
        CANCELLED
    };

private:
    int requestId;
    std::string vehicleId;
    int requestedZone;
    int requestTime;
    State currentState;

public:
    ParkingRequest(int requestId,
                   const std::string& vehicleId,
                   int requestedZone,
                   int requestTime,
                   State initialState);

    int getRequestId() const;
    const std::string& getVehicleId() const;
    int getRequestedZone() const;
    int getRequestTime() const;
    State getCurrentState() const;

    bool changeState(State newState);

    // Used by rollback mechanisms to restore a previous state directly.
    void setCurrentState(State state);
};

#endif  // PARKING_REQUEST_H