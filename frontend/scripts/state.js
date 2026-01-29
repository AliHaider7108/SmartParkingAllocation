// Application state and domain logic (no DOM access here).
// This keeps UI concerns separated from core logic.

/**
 * @typedef {Object} Vehicle
 * @property {string} id
 * @property {string} ownerName
 * @property {string} plate
 */

/**
 * @typedef {Object} Slot
 * @property {string} id
 * @property {number} number
 * @property {Vehicle|null} vehicle
 */

/**
 * @typedef {Object} Zone
 * @property {string} id
 * @property {string} name
 * @property {Slot[]} slots
 */

/**
 * @typedef {Object} AllocationAction
 * @property {"allocate"|"deallocate"} type
 * @property {string} zoneId
 * @property {string} slotId
 * @property {Vehicle|null} vehicleBefore
 * @property {Vehicle|null} vehicleAfter
 */

/**
 * Creates an isolated state container so no globals are leaked.
 * Consumers receive a small, explicit API surface.
 */
export function createParkingState() {
  /** @type {Zone[]} */
  let zones = [];

  /** @type {AllocationAction[]} */
  let history = [];

  /** @type {string|null} */
  let activeZoneId = null;

  // --- private helpers ------------------------------------------------------

  const uuid = () => `${Date.now().toString(36)}-${Math.random().toString(16).slice(2)}`;

  /**
   * @param {number} count
   * @returns {Slot[]}
   */
  const buildSlots = (count) => {
    const slots = [];
    for (let i = 1; i <= count; i += 1) {
      slots.push({
        id: uuid(),
        number: i,
        vehicle: null,
      });
    }
    return slots;
  };

  /**
   * @param {string} id
   * @returns {Zone|undefined}
   */
  const findZone = (id) => zones.find((z) => z.id === id);

  /**
   * @param {Zone} zone
   * @param {string} slotId
   * @returns {Slot|undefined}
   */
  const findSlot = (zone, slotId) => zone.slots.find((s) => s.id === slotId);

  const snapshotVehicle = (vehicle) =>
    vehicle ? { ...vehicle } : null;

  // --- public API -----------------------------------------------------------

  /**
   * Initialize with a couple of demo zones and vehicles.
   */
  const bootstrapDemoData = () => {
    if (zones.length > 0) return;

    const zoneA = {
      id: uuid(),
      name: "Zone A - Main Entrance",
      slots: buildSlots(8),
    };

    const zoneB = {
      id: uuid(),
      name: "Zone B - Faculty",
      slots: buildSlots(6),
    };

    // Pre-allocate a couple of vehicles for demonstration
    zoneA.slots[1].vehicle = {
      id: uuid(),
      ownerName: "Ali Haider",
      plate: "ALI-123",
    };
    zoneA.slots[3].vehicle = {
      id: uuid(),
      ownerName: "Shahzeb",
      plate: "SHZ-789",
    };
    zoneB.slots[0].vehicle = {
      id: uuid(),
      ownerName: "Campus Visitor",
      plate: "VIS-456",
    };

    zones = [zoneA, zoneB];
    activeZoneId = zoneA.id;
  };

  /**
   * @returns {{ zones: Zone[]; totalZones: number; parkedCars: number; freeSlots: number; activeZoneId: string|null }}
   */
  const getSnapshot = () => {
    let parkedCars = 0;
    let freeSlots = 0;

    zones.forEach((zone) => {
      zone.slots.forEach((slot) => {
        if (slot.vehicle) parkedCars += 1;
        else freeSlots += 1;
      });
    });

    return {
      zones: zones.map((z) => ({
        ...z,
        slots: z.slots.map((s) => ({
          ...s,
          vehicle: s.vehicle ? { ...s.vehicle } : null,
        })),
      })),
      totalZones: zones.length,
      parkedCars,
      freeSlots,
      activeZoneId,
    };
  };

  /**
   * @param {string} name
   * @param {number} slotCount
   * @returns {Zone}
   */
  const addZone = (name, slotCount) => {
    const zone = {
      id: uuid(),
      name,
      slots: buildSlots(slotCount),
    };
    zones = [...zones, zone];
    if (!activeZoneId) activeZoneId = zone.id;
    return zone;
  };

  /**
   * @param {string} id
   */
  const setActiveZone = (id) => {
    activeZoneId = id;
  };

  /**
   * @param {string} zoneId
   * @param {string} ownerName
   * @param {string} plate
   * @param {string|undefined} preferredSlotId
   * @returns {{ zoneId: string; slotId: string; vehicle: Vehicle } | null}
   */
  const allocateVehicle = (zoneId, ownerName, plate, preferredSlotId) => {
    const zone = findZone(zoneId);
    if (!zone) return null;

    const targetSlot = preferredSlotId
      ? findSlot(zone, preferredSlotId)
      : zone.slots.find((s) => !s.vehicle);

    if (!targetSlot || targetSlot.vehicle) {
      return null;
    }

    const vehicle = {
      id: uuid(),
      ownerName,
      plate,
    };

    const before = snapshotVehicle(targetSlot.vehicle);
    targetSlot.vehicle = vehicle;

    history.push({
      type: "allocate",
      zoneId,
      slotId: targetSlot.id,
      vehicleBefore: before,
      vehicleAfter: snapshotVehicle(vehicle),
    });

    return { zoneId, slotId: targetSlot.id, vehicle };
  };

  /**
   * @param {string} zoneId
   * @param {string} slotId
   * @returns {boolean}
   */
  const deallocateVehicle = (zoneId, slotId) => {
    const zone = findZone(zoneId);
    if (!zone) return false;

    const slot = findSlot(zone, slotId);
    if (!slot || !slot.vehicle) return false;

    const before = snapshotVehicle(slot.vehicle);
    slot.vehicle = null;

    history.push({
      type: "deallocate",
      zoneId,
      slotId,
      vehicleBefore: before,
      vehicleAfter: null,
    });

    return true;
  };

  /**
   * Undo the last allocation-related action.
   * @returns {{ zoneId: string; slotId: string } | null}
   */
  const undoLast = () => {
    const last = history.pop();
    if (!last) return null;

    const zone = findZone(last.zoneId);
    if (!zone) return null;
    const slot = findSlot(zone, last.slotId);
    if (!slot) return null;

    // Restore previous vehicle state
    slot.vehicle = snapshotVehicle(last.vehicleBefore);
    return { zoneId: zone.id, slotId: slot.id };
  };

  return {
    bootstrapDemoData,
    getSnapshot,
    addZone,
    setActiveZone,
    allocateVehicle,
    deallocateVehicle,
    undoLast,
  };
}

