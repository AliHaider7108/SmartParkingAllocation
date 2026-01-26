#include "ParkingSystem.h"

#include <algorithm>

ParkingSystem::ParkingSystem()
{
}

void ParkingSystem::addZone(const Zone& zone)
{
    zones.push_back(zone);
}

int ParkingSystem::requestParking(const std::string& vehicleId, int requestedZoneId)
{
    // Ensure the vehicle exists or create it
    auto vehicleIt = std::find_if(
        vehicles.begin(), vehicles.end(),
        [&vehicleId](const Vehicle& v) { return v.getVehicleId() == vehicleId; });

    if (vehicleIt == vehicles.end())
    {
        vehicles.emplace_back(vehicleId, requestedZoneId);
        vehicleIt = vehicles.end() - 1;
    }

    // Create a new parking request in REQUESTED state
    int requestId = static_cast<int>(requests.size());
    ParkingRequest request(requestId,
                           vehicleId,
                           requestedZoneId,
                           /*requestTime*/ 0,
                           ParkingRequest::State::REQUESTED);

    // Try to allocate a slot
    if (zones.empty())
    {
        return -1;
    }

    ParkingSlot* slot = allocationEngine.allocateSlot(requestedZoneId,
                                                      zones.data(),
                                                      static_cast<int>(zones.size()));

    if (slot == nullptr)
    {
        // No slot available, do not store the request
        return -1;
    }

    // Record previous states for rollback
    bool prevAvailability = slot->getIsAvailable();
    ParkingRequest::State prevState = request.getCurrentState();

    // Update current state and slot
    slot->setIsAvailable(false);
    request.changeState(ParkingRequest::State::ALLOCATED);

    // Persist the request
    requests.push_back(request);

    // Record allocation in rollback manager
    rollbackManager.recordAllocation(slot,
                                     prevAvailability,
                                     &requests.back(),
                                     prevState);

    return requestId;
}

bool ParkingSystem::cancelRequest(int requestId)
{
    if (requestId < 0 || requestId >= static_cast<int>(requests.size()))
    {
        return false;
    }

    ParkingRequest& request = requests[requestId];

    ParkingRequest::State current = request.getCurrentState();
    if (current == ParkingRequest::State::RELEASED ||
        current == ParkingRequest::State::CANCELLED)
    {
        // Already in a terminal state
        return false;
    }

    // Change state via normal transition rules
    if (!request.changeState(ParkingRequest::State::CANCELLED))
    {
        return false;
    }

    // Roll back the last operation affecting this request/slot
    rollbackManager.rollback(1);

    return true;
}

bool ParkingSystem::releaseSlot(int requestId)
{
    if (requestId < 0 || requestId >= static_cast<int>(requests.size()))
    {
        return false;
    }

    ParkingRequest& request = requests[requestId];

    // Must be in ALLOCATED or OCCUPIED to be released
    ParkingRequest::State state = request.getCurrentState();
    if (state != ParkingRequest::State::ALLOCATED &&
        state != ParkingRequest::State::OCCUPIED)
    {
        return false;
    }

    // Attempt normal state transition to RELEASED
    if (!request.changeState(ParkingRequest::State::RELEASED))
    {
        return false;
    }

    // Roll back one allocation to free the slot and restore previous state
    rollbackManager.rollback(1);

    return true;
}