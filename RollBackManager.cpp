
#include "RollbackManager.h"

void RollbackManager::recordAllocation(ParkingSlot* slot,
                                       bool previousAvailability,
                                       ParkingRequest* request,
                                       ParkingRequest::State previousRequestState)
{
    AllocationRecord record;
    record.slot = slot;
    record.previousAvailability = previousAvailability;
    record.request = request;
    record.previousRequestState = previousRequestState;

    history.push(record);
}

void RollbackManager::rollback(int k)
{
    while (k > 0 && !history.empty())
    {
        AllocationRecord record = history.top();
        history.pop();

        if (record.slot != nullptr)
        {
            record.slot->setIsAvailable(record.previousAvailability);
        }

        if (record.request != nullptr)
        {
            record.request->setCurrentState(record.previousRequestState);
        }

        --k;
    }
}

