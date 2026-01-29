// Pure UI helpers and rendering functions.
// This module does not own any state; it receives data and callbacks.

/**
 * Simple helper to remove all children from an element.
 * @param {HTMLElement} el
 */
const clearElement = (el) => {
  while (el.firstChild) el.removeChild(el.firstChild);
};

/**
 * @param {number} count
 * @returns {HTMLElement}
 */
const renderMiniCars = (count) => {
  const container = document.createElement("div");
  container.className = "zone-mini-cars";
  const capped = Math.min(count, 4);
  for (let i = 0; i < capped; i += 1) {
    const chip = document.createElement("div");
    chip.className = "car-chip";
    container.appendChild(chip);
  }
  return container;
};

/**
 * Renders the dashboard statistics.
 * @param {{ totalZones: number; parkedCars: number; freeSlots: number }} stats
 */
export const renderDashboardStats = (stats) => {
  const totalZonesEl = document.querySelector("#stat-total-zones");
  const parkedCarsEl = document.querySelector("#stat-parked-cars");
  const freeSlotsEl = document.querySelector("#stat-free-slots");
  if (!totalZonesEl || !parkedCarsEl || !freeSlotsEl) return;

  totalZonesEl.textContent = String(stats.totalZones);
  parkedCarsEl.textContent = String(stats.parkedCars);
  freeSlotsEl.textContent = String(stats.freeSlots);
};

/**
 * Renders the list of zones.
 * @param {import("./state.js").Zone[]} zones
 * @param {(zoneId: string) => void} onZoneClick
 */
export const renderZonesList = (zones, onZoneClick) => {
  const listRoot = document.querySelector("#zones-list");
  if (!listRoot) return;
  clearElement(listRoot);

  zones.forEach((zone) => {
    const card = document.createElement("article");
    card.className = "zone-card";
    card.dataset.zoneId = zone.id;

    const totalSlots = zone.slots.length;
    const occupied = zone.slots.filter((s) => s.vehicle).length;
    const free = totalSlots - occupied;

    const title = document.createElement("h2");
    title.className = "zone-title";
    title.textContent = zone.name;

    const sub = document.createElement("p");
    sub.className = "zone-sub";
    sub.textContent = `Slots: ${totalSlots}  •  Free: ${free}`;

    const metrics = document.createElement("div");
    metrics.className = "zone-metrics";

    const freePill = document.createElement("span");
    freePill.className = "metric-pill metric-pill--success";
    freePill.textContent = `${free} free`;

    const occupiedPill = document.createElement("span");
    occupiedPill.className = "metric-pill metric-pill--danger";
    occupiedPill.textContent = `${occupied} parked`;

    const miniCars = renderMiniCars(occupied);

    metrics.appendChild(freePill);
    metrics.appendChild(occupiedPill);
    metrics.appendChild(miniCars);

    card.appendChild(title);
    card.appendChild(sub);
    card.appendChild(metrics);

    card.addEventListener("click", () => onZoneClick(zone.id));

    listRoot.appendChild(card);
  });
};

/**
 * Renders detail header info and slots grid for a single zone.
 * @param {import("./state.js").Zone} zone
 * @param {(slotId: string) => void} onCarClick
 */
export const renderZoneDetail = (zone, onCarClick) => {
  const nameEl = document.querySelector("#zone-detail-name");
  const slotsMetaEl = document.querySelector("#zone-detail-slots");
  const freeMetaEl = document.querySelector("#zone-detail-free");
  const slotsGrid = document.querySelector("#slots-grid");
  if (!nameEl || !slotsMetaEl || !freeMetaEl || !slotsGrid) return;

  nameEl.textContent = zone.name;

  const totalSlots = zone.slots.length;
  const occupied = zone.slots.filter((s) => s.vehicle).length;
  const free = totalSlots - occupied;

  slotsMetaEl.textContent = `Slots: ${totalSlots}`;
  freeMetaEl.textContent = `Free: ${free}`;

  clearElement(slotsGrid);

  zone.slots.forEach((slot) => {
    const tile = document.createElement("article");
    tile.className = "slot-tile";
    tile.dataset.slotId = slot.id;

    const label = document.createElement("div");
    label.className = "slot-label";
    label.textContent = `Slot ${slot.number}`;

    const statusPill = document.createElement("span");
    statusPill.className = "slot-status-pill";

    tile.appendChild(label);

    if (slot.vehicle) {
      tile.classList.add("slot-occupied");
      statusPill.classList.add("slot-status-pill--occupied");
      statusPill.textContent = "Occupied";
      tile.appendChild(statusPill);

      const carCard = document.createElement("button");
      carCard.type = "button";
      carCard.className = "car-card";
      carCard.dataset.slotId = slot.id;

      const body = document.createElement("div");
      body.className = "car-body";

      const car3d = document.createElement("div");
      car3d.className = "car-3d";

      const wheels = document.createElement("div");
      wheels.className = "car-wheels";
      const w1 = document.createElement("div");
      w1.className = "car-wheel";
      const w2 = document.createElement("div");
      w2.className = "car-wheel";
      wheels.appendChild(w1);
      wheels.appendChild(w2);
      car3d.appendChild(wheels);

      const info = document.createElement("div");
      info.className = "car-info";
      const owner = document.createElement("div");
      owner.className = "car-owner";
      owner.textContent = slot.vehicle.ownerName;
      const meta = document.createElement("div");
      meta.className = "car-meta";
      const plateSpan = document.createElement("span");
      plateSpan.textContent = slot.vehicle.plate;
      const slotSpan = document.createElement("span");
      slotSpan.textContent = `Slot ${slot.number}`;
      meta.appendChild(plateSpan);
      meta.appendChild(slotSpan);
      info.appendChild(owner);
      info.appendChild(meta);

      body.appendChild(car3d);
      body.appendChild(info);
      carCard.appendChild(body);

      carCard.addEventListener("click", () => onCarClick(slot.id));

      tile.appendChild(carCard);
    } else {
      tile.classList.add("slot-free");
      statusPill.classList.add("slot-status-pill--free");
      statusPill.textContent = "Free";
      tile.appendChild(statusPill);
    }

    slotsGrid.appendChild(tile);
  });
};

/**
 * Switches between main "views" in the SPA.
 * @param {"dashboard"|"zones"|"zone-detail"} view
 */
export const switchView = (view) => {
  const allViews = document.querySelectorAll(".view");
  allViews.forEach((v) => v.classList.remove("view--active"));

  const target = document.querySelector(`#view-${view}`);
  if (target) target.classList.add("view--active");

  // Update nav active state for top-level views
  const navButtons = document.querySelectorAll(".nav-link");
  navButtons.forEach((btn) => {
    const btnView = btn.getAttribute("data-view");
    if (btnView === view) btn.classList.add("nav-link--active");
    else btn.classList.remove("nav-link--active");
  });
};

/**
 * Quick helper to play the horn sound if available.
 */
export const playHornSound = () => {
  const audio = document.querySelector("#horn-audio");
  if (!audio) return;
  try {
    // Rewind so rapid clicks retrigger the sound.
    audio.currentTime = 0;
    void audio.play();
  } catch {
    // ignore – some browsers block autoplay without user gesture
  }
};

/**
 * Applies a transient shake + glow class to a car card.
 * @param {HTMLElement} carCard
 */
export const animateCarInteraction = (carCard) => {
  carCard.classList.remove("car-card--shake", "car-card--glow");
  // Force reflow so the animation can restart:
  // eslint-disable-next-line no-unused-expressions
  carCard.offsetHeight;
  carCard.classList.add("car-card--shake", "car-card--glow");
  window.setTimeout(() => {
    carCard.classList.remove("car-card--glow");
  }, 320);
};

/**
 * Shows the reusable modal and injects fields.
 * @param {string} title
 * @param {HTMLElement[]} fields
 * @param {(formData: FormData) => void} onSubmit
 */
export const openModal = (title, fields, onSubmit) => {
  const backdrop = document.querySelector("#modal-backdrop");
  const titleEl = document.querySelector("#modal-title");
  const form = document.querySelector("#modal-form");
  if (!backdrop || !titleEl || !form) return;

  titleEl.textContent = title;
  clearElement(form);
  fields.forEach((f) => form.appendChild(f));

  const actions = document.createElement("div");
  actions.className = "modal-actions";

  const cancel = document.createElement("button");
  cancel.type = "button";
  cancel.className = "btn btn-secondary";
  cancel.textContent = "Cancel";

  const confirm = document.createElement("button");
  confirm.type = "submit";
  confirm.className = "btn btn-primary";
  confirm.textContent = "Confirm";

  actions.appendChild(cancel);
  actions.appendChild(confirm);
  form.appendChild(actions);

  const onFormSubmit = (event) => {
    event.preventDefault();
    const data = new FormData(form);
    onSubmit(data);
  };

  const close = () => {
    backdrop.classList.add("hidden");
    form.removeEventListener("submit", onFormSubmit);
  };

  cancel.addEventListener("click", close, { once: true });
  form.addEventListener("submit", onFormSubmit);

  backdrop.classList.remove("hidden");

  // Basic "click outside" close
  const onBackdropClick = (event) => {
    if (event.target === backdrop) {
      close();
      backdrop.removeEventListener("click", onBackdropClick);
    }
  };
  backdrop.addEventListener("click", onBackdropClick);
};

