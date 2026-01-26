
#include "ParkingRequest.h"

#include <iostream>

ParkingRequest::ParkingRequest(int requestId,
                               const std::string& vehicleId,
                               int requestedZone,
                               int requestTime,
                               State initialState)
    : requestId(requestId),
      vehicleId(vehicleId),
      requestedZone(requestedZone),
      requestTime(requestTime),
      currentState(initialState)
{
}

int ParkingRequest::getRequestId() const
{
    return requestId;
}

const std::string& ParkingRequest::getVehicleId() const
{
    return vehicleId;
}

int ParkingRequest::getRequestedZone() const
{
    return requestedZone;
}

int ParkingRequest::getRequestTime() const
{
    return requestTime;
}

ParkingRequest::State ParkingRequest::getCurrentState() const
{
    return currentState;
}

void ParkingRequest::setCurrentState(State state)
{
    currentState = state;
}

bool ParkingRequest::changeState(State newState)
{
    bool isValid = false;

    switch (currentState)
    {
    case State::REQUESTED:
        if (newState == State::ALLOCATED ||
            newState == State::CANCELLED)
        {
            isValid = true;
        }
        break;

    case State::ALLOCATED:
        if (newState == State::OCCUPIED ||
            newState == State::CANCELLED)
        {
            isValid = true;
        }
        break;

    case State::OCCUPIED:
        if (newState == State::RELEASED)
        {
            isValid = true;
        }
        break;

    case State::RELEASED:
    case State::CANCELLED:
        // Terminal states: no further transitions allowed
        isValid = false;
        break;
    }

    if (!isValid)
    {
        std::cerr << "Invalid state transition from "
                  << static_cast<int>(currentState)
                  << " to "
                  << static_cast<int>(newState)
                  << std::endl;
        return false;
    }

    currentState = newState;
    return true;
}

