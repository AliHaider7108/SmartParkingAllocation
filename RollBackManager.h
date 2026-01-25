
#ifndef ROLLBACK_MANAGER_H
#define ROLLBACK_MANAGER_H

#include <stack>

#include "ParkingSlot.h"
#include "ParkingRequest.h"

class RollbackManager
{
private:
    struct AllocationRecord
    {
        ParkingSlot* slot;
        bool previousAvailability;
        ParkingRequest* request;
        ParkingRequest::State previousRequestState;
    };

    std::stack<AllocationRecord> history;

public:
    // Record an allocation operation so it can be undone later.
    void recordAllocation(ParkingSlot* slot,
                          bool previousAvailability,
                          ParkingRequest* request,
                          ParkingRequest::State previousRequestState);

    // Roll back the last k allocation operations.
    // If k is greater than the number of recorded operations,
    // roll back as many as possible.
    void rollback(int k);
};

#endif  // ROLLBACK_MANAGER_H

