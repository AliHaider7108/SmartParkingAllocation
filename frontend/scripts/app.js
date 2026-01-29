// Entry point: wires state + UI together, attaches event handlers.

import { createParkingState } from "./state.js";
import {
  renderDashboardStats,
  renderZonesList,
  renderZoneDetail,
  switchView,
  playHornSound,
  animateCarInteraction,
  openModal,
} from "./ui.js";

const parkingState = createParkingState();

/**
 * Centralized re-render using the latest snapshot.
 * Keeps DOM updates predictable.
 * @param {("dashboard"|"zones"|"zone-detail")=} preferredView
 */
const render = (preferredView) => {
  const snapshot = parkingState.getSnapshot();

  renderDashboardStats({
    totalZones: snapshot.totalZones,
    parkedCars: snapshot.parkedCars,
    freeSlots: snapshot.freeSlots,
  });

  renderZonesList(snapshot.zones, (zoneId) => {
    parkingState.setActiveZone(zoneId);
    render("zone-detail");
  });

  const activeZone =
    snapshot.activeZoneId &&
    snapshot.zones.find((z) => z.id === snapshot.activeZoneId);

  if (activeZone) {
    renderZoneDetail(activeZone, (slotId) => {
      // When a car is clicked: play horn + animation only (no state change).
      const carButton = document.querySelector(
        `.car-card[data-slot-id="${slotId}"]`,
      );
      if (carButton instanceof HTMLElement) {
        playHornSound();
        animateCarInteraction(carButton);
      }
    });
  }

  // View priority: explicit preferred view, otherwise keep current,
  // otherwise fall back to dashboard.
  if (preferredView) {
    switchView(preferredView);
  }
};

// --- Event bindings ---------------------------------------------------------

const bindNavigation = () => {
  const navButtons = document.querySelectorAll(".nav-link");
  navButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const view = btn.getAttribute("data-view");
      if (view === "dashboard" || view === "zones") {
        switchView(view);
      }
    });
  });

  const backBtn = document.querySelector("#btn-back-to-zones");
  if (backBtn) {
    backBtn.addEventListener("click", () => {
      switchView("zones");
    });
  }
};

const bindAddZone = () => {
  const addZoneBtn = document.querySelector("#btn-add-zone");
  if (!addZoneBtn) return;

  addZoneBtn.addEventListener("click", () => {
    const nameField = document.createElement("div");
    nameField.className = "form-field";
    const nameLabel = document.createElement("label");
    nameLabel.className = "form-label";
    nameLabel.textContent = "Zone name";
    nameLabel.htmlFor = "zone-name";
    const nameInput = document.createElement("input");
    nameInput.id = "zone-name";
    nameInput.name = "zoneName";
    nameInput.required = true;
    nameInput.placeholder = "e.g. Zone C - Students";
    nameInput.className = "form-input";
    nameField.appendChild(nameLabel);
    nameField.appendChild(nameInput);

    const slotsField = document.createElement("div");
    slotsField.className = "form-field";
    const slotsLabel = document.createElement("label");
    slotsLabel.className = "form-label";
    slotsLabel.textContent = "Number of slots";
    slotsLabel.htmlFor = "slot-count";
    const slotsInput = document.createElement("input");
    slotsInput.id = "slot-count";
    slotsInput.name = "slotCount";
    slotsInput.type = "number";
    slotsInput.min = "1";
    slotsInput.max = "80";
    slotsInput.value = "10";
    slotsInput.required = true;
    slotsInput.className = "form-input";
    slotsField.appendChild(slotsLabel);
    slotsField.appendChild(slotsInput);

    openModal("Add Zone", [nameField, slotsField], (formData) => {
      const zoneName = String(formData.get("zoneName") || "").trim();
      const slotCountRaw = Number(formData.get("slotCount") || 0);
      const slotCount = Number.isFinite(slotCountRaw) ? slotCountRaw : 0;
      if (!zoneName || slotCount <= 0) return;
      parkingState.addZone(zoneName, slotCount);
      render("zones");
    });
  });
};

const bindAddVehicle = () => {
  const addVehicleBtn = document.querySelector("#btn-add-vehicle");
  if (!addVehicleBtn) return;

  addVehicleBtn.addEventListener("click", () => {
    const snapshot = parkingState.getSnapshot();
    const activeZone =
      snapshot.activeZoneId &&
      snapshot.zones.find((z) => z.id === snapshot.activeZoneId);
    if (!activeZone) return;

    const ownerField = document.createElement("div");
    ownerField.className = "form-field";
    const ownerLabel = document.createElement("label");
    ownerLabel.className = "form-label";
    ownerLabel.textContent = "Owner name";
    ownerLabel.htmlFor = "owner-name";
    const ownerInput = document.createElement("input");
    ownerInput.id = "owner-name";
    ownerInput.name = "ownerName";
    ownerInput.required = true;
    ownerInput.placeholder = "e.g. Ali Haider";
    ownerInput.className = "form-input";
    ownerField.appendChild(ownerLabel);
    ownerField.appendChild(ownerInput);

    const plateField = document.createElement("div");
    plateField.className = "form-field";
    const plateLabel = document.createElement("label");
    plateLabel.className = "form-label";
    plateLabel.textContent = "Vehicle plate";
    plateLabel.htmlFor = "plate";
    const plateInput = document.createElement("input");
    plateInput.id = "plate";
    plateInput.name = "plate";
    plateInput.placeholder = "e.g. ABC-123";
    plateInput.className = "form-input";
    plateField.appendChild(plateLabel);
    plateField.appendChild(plateInput);

    const slotField = document.createElement("div");
    slotField.className = "form-field";
    const slotLabel = document.createElement("label");
    slotLabel.className = "form-label";
    slotLabel.textContent = "Preferred slot (optional)";
    slotLabel.htmlFor = "slot-select";

    const slotSelect = document.createElement("select");
    slotSelect.id = "slot-select";
    slotSelect.name = "slotId";
    slotSelect.className = "form-select";

    const anyOption = document.createElement("option");
    anyOption.value = "";
    anyOption.textContent = "Auto-select nearest free slot";
    slotSelect.appendChild(anyOption);

    activeZone.slots.forEach((slot) => {
      if (!slot.vehicle) {
        const opt = document.createElement("option");
        opt.value = slot.id;
        opt.textContent = `Slot ${slot.number}`;
        slotSelect.appendChild(opt);
      }
    });

    slotField.appendChild(slotLabel);
    slotField.appendChild(slotSelect);

    openModal("Allocate Vehicle", [ownerField, plateField, slotField], (formData) => {
      const ownerName = String(formData.get("ownerName") || "").trim();
      const plate = String(formData.get("plate") || "").trim();
      const slotIdRaw = String(formData.get("slotId") || "").trim();
      const preferredSlotId = slotIdRaw || undefined;
      if (!ownerName) return;
      const res = parkingState.allocateVehicle(
        activeZone.id,
        ownerName,
        plate || "N/A",
        preferredSlotId,
      );
      if (res) {
        render("zone-detail");
        // Car "driving in" animation: quickly highlight the slot.
        const slotTile = document.querySelector(
          `.slot-tile[data-slot-id="${res.slotId}"]`,
        );
        if (slotTile instanceof HTMLElement) {
          slotTile.scrollIntoView({ block: "center", behavior: "smooth" });
          slotTile.style.transform = "translateY(-4px) scale(1.02)";
          window.setTimeout(() => {
            slotTile.style.transform = "";
          }, 260);
        }
      }
    });
  });
};

const bindUndo = () => {
  const undoBtn = document.querySelector("#btn-undo");
  if (!undoBtn) return;

  undoBtn.addEventListener("click", () => {
    const undone = parkingState.undoLast();
    if (!undone) return;
    render("zones");

    // Small "reverse" visual: briefly flash the affected slot if we are on detail view.
    const slotTile = document.querySelector(
      `.slot-tile[data-slot-id="${undone.slotId}"]`,
    );
    if (slotTile instanceof HTMLElement) {
      slotTile.style.outline = "2px solid rgba(248,113,113,0.8)";
      window.setTimeout(() => {
        slotTile.style.outline = "";
      }, 320);
    }
  });
};

const init = () => {
  parkingState.bootstrapDemoData();
  bindNavigation();
  bindAddZone();
  bindAddVehicle();
  bindUndo();
  render("dashboard");
};

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}

