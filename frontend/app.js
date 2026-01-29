// Smart Parking System - Frontend Application
// Connects UI with backend APIs using fetch

const API_BASE = 'http://localhost:8080/api';

// Application State
const appState = {
    zones: [],
    requests: [],
    activePage: 'dashboard',
    isLiveMode: false,
    lastRequestId: null,
    charts: {}
};

// ==================== Utility Functions ====================

/**
 * Show toast notification
 */
function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    container.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transition = 'opacity 0.3s';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

/**
 * Show error message
 */
function showError(message) {
    showToast(message, 'error');
}

/**
 * Show success message
 */
function showSuccess(message) {
    showToast(message, 'success');
}

/**
 * Show loading overlay
 */
function showLoading(show = true) {
    const overlay = document.getElementById('loading-overlay');
    if (overlay) {
        overlay.classList.toggle('hidden', !show);
    }
}

/**
 * API fetch wrapper with error handling
 */
async function apiFetch(endpoint, options = {}) {
    const url = `${API_BASE}${endpoint}`;
    const config = {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...options.headers
        }
    };

    try {
        const response = await fetch(url, config);
        const contentType = response.headers.get('content-type');
        
        let data;
        if (contentType && contentType.includes('application/json')) {
            data = await response.json();
        } else {
            data = await response.text();
        }

        if (!response.ok) {
            const errorMsg = data?.message || data || `Request failed: ${response.status}`;
            showError(errorMsg);
            throw new Error(errorMsg);
        }

        return data;
    } catch (error) {
        if (error.name === 'TypeError' && error.message.includes('fetch')) {
            showError('Cannot connect to server. Make sure the backend is running on localhost:8080');
        }
        throw error;
    }
}

// ==================== Navigation ====================

/**
 * Switch between pages
 */
function switchPage(pageName) {
    // Update nav links
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.toggle('active', link.dataset.page === pageName);
    });

    // Update page visibility
    document.querySelectorAll('.page').forEach(page => {
        page.classList.toggle('active', page.id === pageName);
    });

    appState.activePage = pageName;

    // Load page-specific data
    if (pageName === 'dashboard') {
        loadDashboard();
    } else if (pageName === 'zones') {
        loadZones();
    } else if (pageName === 'requests') {
        loadRequests();
    } else if (pageName === 'analytics') {
        loadAnalytics();
    }
}

/**
 * Initialize navigation
 */
function initNavigation() {
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const page = link.dataset.page;
            if (page) {
                switchPage(page);
            }
        });
    });

    // Mode toggle
    const modeToggle = document.getElementById('mode-toggle');
    if (modeToggle) {
        modeToggle.addEventListener('click', () => {
            appState.isLiveMode = !appState.isLiveMode;
            modeToggle.textContent = appState.isLiveMode ? 'Demo Mode' : 'Live Mode';
            const indicator = document.getElementById('demo-indicator');
            if (indicator) {
                indicator.textContent = appState.isLiveMode ? 'LIVE MODE' : 'DEMO MODE';
                indicator.style.background = appState.isLiveMode ? '#10b981' : '#f59e0b';
            }
        });
    }
}

// ==================== Dashboard ====================

/**
 * Load dashboard data
 */
async function loadDashboard() {
    try {
        showLoading(true);
        
        // Fetch zones
        const zonesData = await apiFetch('/zones');
        const zones = Array.isArray(zonesData) ? zonesData : (zonesData?.zones || []);
        
        // Calculate stats
        let totalZones = zones.length;
        let totalSlots = 0;
        let occupiedSlots = 0;
        let activeRequests = 0;

        zones.forEach(zone => {
            const capacity = zone.capacity || zone.totalSlots || 0;
            const occupied = zone.occupiedSlots || 0;
            totalSlots += capacity;
            occupiedSlots += occupied;
        });

        // Fetch requests for active count
        try {
            const requestsData = await apiFetch('/parking/requests');
            const requests = Array.isArray(requestsData) ? requestsData : (requestsData?.requests || []);
            activeRequests = requests.filter(r => 
                r.status === 'REQUESTED' || r.status === 'ALLOCATED'
            ).length;
        } catch (e) {
            // Requests endpoint might not exist
        }

        // Update dashboard stats
        document.getElementById('total-zones').textContent = totalZones;
        document.getElementById('occupied-slots').textContent = `${occupiedSlots}/${totalSlots}`;
        document.getElementById('active-requests').textContent = activeRequests;
        
        const utilization = totalSlots > 0 ? Math.round((occupiedSlots / totalSlots) * 100) : 0;
        document.getElementById('utilization').textContent = `${utilization}%`;

        // Load zones overview
        renderZonesOverview(zones);

        // Load recent activity
        loadRecentActivity();

    } catch (error) {
        console.error('Failed to load dashboard:', error);
    } finally {
        showLoading(false);
    }
}

/**
 * Render zones overview on dashboard
 */
function renderZonesOverview(zones) {
    const container = document.getElementById('zones-overview');
    if (!container) return;

    if (zones.length === 0) {
        container.innerHTML = '<div class="loading-state">No zones available</div>';
        return;
    }

    container.innerHTML = zones.map(zone => {
        const capacity = zone.capacity || zone.totalSlots || 0;
        const occupied = zone.occupiedSlots || 0;
        const free = capacity - occupied;
        const utilization = capacity > 0 ? Math.round((occupied / capacity) * 100) : 0;

        return `
            <div class="zone-card" onclick="viewZoneDetail(${zone.id || zone.zoneId})">
                <h3>${zone.name || `Zone ${zone.id || zone.zoneId}`}</h3>
                <div class="zone-stats">
                    <div class="zone-stat">
                        <div class="zone-stat-value">${capacity}</div>
                        <div class="zone-stat-label">Total</div>
                    </div>
                    <div class="zone-stat">
                        <div class="zone-stat-value" style="color: #10b981">${free}</div>
                        <div class="zone-stat-label">Free</div>
                    </div>
                    <div class="zone-stat">
                        <div class="zone-stat-value" style="color: #ef4444">${occupied}</div>
                        <div class="zone-stat-label">Occupied</div>
                    </div>
                    <div class="zone-stat">
                        <div class="zone-stat-value">${utilization}%</div>
                        <div class="zone-stat-label">Usage</div>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

/**
 * Load recent activity
 */
async function loadRecentActivity() {
    const container = document.getElementById('recent-activity');
    if (!container) return;

    try {
        const requestsData = await apiFetch('/parking/requests');
        const requests = Array.isArray(requestsData) ? requestsData : (requestsData?.requests || []);
        
        // Get recent 5 requests
        const recent = requests.slice(-5).reverse();

        if (recent.length === 0) {
            container.innerHTML = '<div class="activity-item"><div class="activity-icon">📭</div><div class="activity-content"><p>No recent activity</p></div></div>';
            return;
        }

        container.innerHTML = recent.map(req => {
            const icon = {
                'REQUESTED': '⏳',
                'ALLOCATED': '✅',
                'OCCUPIED': '🅿️',
                'RELEASED': '🚗',
                'CANCELLED': '❌'
            }[req.status] || '📋';

            const time = req.timestamp || req.createdAt || 'Just now';
            
            return `
                <div class="activity-item">
                    <div class="activity-icon">${icon}</div>
                    <div class="activity-content">
                        <p>Vehicle ${req.vehicleId || 'N/A'} - ${req.status || 'Unknown'}</p>
                        <small>${time}</small>
                    </div>
                </div>
            `;
        }).join('');
    } catch (error) {
        container.innerHTML = '<div class="activity-item"><div class="activity-icon">⚠️</div><div class="activity-content"><p>Failed to load activity</p></div></div>';
    }
}

/**
 * Refresh dashboard (called from HTML onclick)
 */
function refreshDashboard() {
    loadDashboard();
}

/**
 * View zone detail (called from zone card onclick)
 */
function viewZoneDetail(zoneId) {
    switchPage('zones');
    // Scroll to zone after loading
    setTimeout(() => {
        const zoneCard = document.querySelector(`[data-zone-id="${zoneId}"]`);
        if (zoneCard) {
            zoneCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }, 500);
}

// ==================== Zones ====================

/**
 * Load zones page
 */
async function loadZones() {
    const container = document.getElementById('zones-detailed');
    if (!container) return;

    try {
        showLoading(true);
        const zonesData = await apiFetch('/zones');
        const zones = Array.isArray(zonesData) ? zonesData : (zonesData?.zones || []);
        
        appState.zones = zones;
        renderZonesDetailed(zones);
    } catch (error) {
        container.innerHTML = '<div class="loading-state">Failed to load zones</div>';
    } finally {
        showLoading(false);
    }
}

/**
 * Render detailed zones view
 */
async function renderZonesDetailed(zones) {
    const container = document.getElementById('zones-detailed');
    if (!container) return;

    if (zones.length === 0) {
        container.innerHTML = '<div class="loading-state">No zones available. Create your first zone!</div>';
        return;
    }

    // Fetch detailed data for each zone
    const zonesWithDetails = await Promise.all(zones.map(async (zone) => {
        try {
            const detail = await apiFetch(`/zones/${zone.id || zone.zoneId}`);
            return detail || zone;
        } catch {
            return zone;
        }
    }));

    container.innerHTML = zonesWithDetails.map(zone => {
        const zoneId = zone.id || zone.zoneId;
        const zoneName = zone.name || `Zone ${zoneId}`;
        const slots = zone.slots || [];
        const capacity = zone.capacity || zone.totalSlots || slots.length;
        
        // Render slots grid
        const slotsHtml = Array.from({ length: capacity }, (_, i) => {
            const slot = slots[i];
            const slotNumber = i + 1;
            const isOccupied = slot?.vehicle || slot?.occupied || false;
            const vehicle = slot?.vehicle || {};
            
            if (isOccupied) {
                return `
                    <div class="slot occupied" onclick="handleCarClick(event, '${vehicle.vehicleId || vehicle.plate || ''}', '${vehicle.ownerName || 'Unknown'}')">
                        <div style="font-size: 0.6rem;">${slotNumber}</div>
                        <div style="font-size: 0.5rem; margin-top: 2px;">🚗</div>
                    </div>
                `;
            } else {
                return `<div class="slot free">${slotNumber}</div>`;
            }
        }).join('');

        return `
            <div class="zone-detail-card" data-zone-id="${zoneId}">
                <div class="zone-detail-header">
                    <h3>${zoneName}</h3>
                    <button class="btn btn-small btn-primary" onclick="allocateVehicleToZone(${zoneId})">
                        + Allocate Vehicle
                    </button>
                </div>
                <div class="slots-grid">
                    ${slotsHtml}
                </div>
            </div>
        `;
    }).join('');
}

/**
 * Handle car click (play horn sound)
 */
function handleCarClick(event, plate, owner) {
    event.stopPropagation();
    
    // Play horn sound
    const audio = document.getElementById('car-horn-audio');
    if (audio) {
        audio.currentTime = 0;
        audio.play().catch(e => console.log('Audio play failed:', e));
    }

    // Animate car
    const slot = event.currentTarget;
    slot.classList.add('animate');
    setTimeout(() => slot.classList.remove('animate'), 500);

    // Show info
    showToast(`Car: ${plate} | Owner: ${owner}`, 'info');
}

/**
 * Allocate vehicle to zone
 */
async function allocateVehicleToZone(zoneId) {
    const vehicleId = prompt('Enter Vehicle ID:');
    if (!vehicleId) return;

    try {
        showLoading(true);

        // Create parking request
        const request = await apiFetch('/parking/requests', {
            method: 'POST',
            body: JSON.stringify({
                vehicleId: vehicleId.trim(),
                requestedZoneId: zoneId
            })
        });

        const requestId = request.id || request.requestId;
        if (!requestId) {
            showError('Request created but ID missing');
            return;
        }

        appState.lastRequestId = requestId;

        // Allocate parking
        await apiFetch(`/parking/requests/${requestId}/allocate`, {
            method: 'PUT'
        });

        showSuccess('Vehicle allocated successfully!');
        await loadZones();
    } catch (error) {
        console.error('Allocation failed:', error);
    } finally {
        showLoading(false);
    }
}

// ==================== Zone Creation ====================

/**
 * Show create zone modal
 */
function showCreateZoneModal() {
    const modal = document.getElementById('create-zone-modal');
    if (modal) {
        modal.classList.add('active');
    }
}

/**
 * Close modal
 */
function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('active');
    }
}

/**
 * Add area input field
 */
function addArea() {
    const container = document.getElementById('areas-container');
    if (!container) return;

    const areaItem = document.createElement('div');
    areaItem.className = 'area-item';
    areaItem.innerHTML = `
        <input type="number" placeholder="Area ID" min="1" required>
        <input type="number" placeholder="Slots" min="1" required>
        <button type="button" class="btn btn-small btn-danger" onclick="removeArea(this)">Remove</button>
    `;
    container.appendChild(areaItem);
}

/**
 * Remove area input field
 */
function removeArea(button) {
    button.closest('.area-item').remove();
}

/**
 * Handle create zone form submission
 */
async function handleCreateZone(e) {
    e.preventDefault();
    
    const zoneId = document.getElementById('zone-id').value;
    const areaItems = document.querySelectorAll('#areas-container .area-item');
    
    if (!zoneId || areaItems.length === 0) {
        showError('Please fill in zone ID and at least one area');
        return;
    }

    const areas = Array.from(areaItems).map(item => {
        const inputs = item.querySelectorAll('input');
        return {
            areaId: parseInt(inputs[0].value),
            slots: parseInt(inputs[1].value)
        };
    });

    try {
        showLoading(true);
        
        // Create zone with areas
        await apiFetch('/zones', {
            method: 'POST',
            body: JSON.stringify({
                id: parseInt(zoneId),
                name: `Zone ${zoneId}`,
                areas: areas
            })
        });

        showSuccess('Zone created successfully!');
        closeModal('create-zone-modal');
        document.getElementById('create-zone-form').reset();
        document.getElementById('areas-container').innerHTML = `
            <div class="area-item">
                <input type="number" placeholder="Area ID" min="1" required>
                <input type="number" placeholder="Slots" min="1" required>
                <button type="button" class="btn btn-small btn-danger" onclick="removeArea(this)">Remove</button>
            </div>
        `;
        
        await loadZones();
        await loadDashboard();
    } catch (error) {
        console.error('Zone creation failed:', error);
    } finally {
        showLoading(false);
    }
}

// ==================== Requests ====================

/**
 * Load parking requests
 */
async function loadRequests() {
    const container = document.getElementById('requests-list');
    if (!container) return;

    try {
        showLoading(true);
        const requestsData = await apiFetch('/parking/requests');
        const requests = Array.isArray(requestsData) ? requestsData : (requestsData?.requests || []);
        
        appState.requests = requests;
        renderRequests(requests);
    } catch (error) {
        container.innerHTML = '<div class="loading-state">Failed to load requests</div>';
    } finally {
        showLoading(false);
    }
}

/**
 * Render requests list
 */
function renderRequests(requests) {
    const container = document.getElementById('requests-list');
    if (!container) return;

    const statusFilter = document.getElementById('status-filter')?.value || 'all';
    const searchInput = document.getElementById('search-input')?.value.toLowerCase() || '';

    let filtered = requests;
    
    if (statusFilter !== 'all') {
        filtered = filtered.filter(r => r.status === statusFilter);
    }
    
    if (searchInput) {
        filtered = filtered.filter(r => 
            (r.vehicleId || '').toLowerCase().includes(searchInput) ||
            (r.id || '').toString().includes(searchInput)
        );
    }

    if (filtered.length === 0) {
        container.innerHTML = '<div class="loading-state">No requests found</div>';
        return;
    }

    container.innerHTML = filtered.map(req => {
        const status = req.status || 'UNKNOWN';
        const zoneId = req.zoneId || req.allocatedZoneId || 'N/A';
        const slotNumber = req.slotNumber || req.allocatedSlotNumber || 'N/A';
        const timestamp = req.timestamp || req.createdAt || 'Unknown';

        return `
            <div class="request-card">
                <div class="request-info">
                    <div class="request-id">Request #${req.id || req.requestId || 'N/A'}</div>
                    <div class="request-details">
                        <span>Vehicle: ${req.vehicleId || 'N/A'}</span>
                        <span>Zone: ${zoneId}</span>
                        <span>Slot: ${slotNumber}</span>
                        <span>Time: ${timestamp}</span>
                    </div>
                </div>
                <div class="request-status ${status}">${status}</div>
            </div>
        `;
    }).join('');
}

/**
 * Show new request modal
 */
function showNewRequestModal() {
    const modal = document.getElementById('new-request-modal');
    if (modal) {
        // Load zones into select
        loadZonesForSelect();
        modal.classList.add('active');
    }
}

/**
 * Load zones into request modal select
 */
async function loadZonesForSelect() {
    const select = document.getElementById('requested-zone');
    if (!select) return;

    try {
        const zonesData = await apiFetch('/zones');
        const zones = Array.isArray(zonesData) ? zonesData : (zonesData?.zones || []);
        
        select.innerHTML = '<option value="">Select Zone</option>' + 
            zones.map(zone => {
                const id = zone.id || zone.zoneId;
                const name = zone.name || `Zone ${id}`;
                return `<option value="${id}">${name}</option>`;
            }).join('');
    } catch (error) {
        console.error('Failed to load zones:', error);
    }
}

/**
 * Handle new request form submission
 */
async function handleNewRequest(e) {
    e.preventDefault();
    
    const vehicleId = document.getElementById('vehicle-id').value;
    const requestedZoneId = document.getElementById('requested-zone').value;

    if (!vehicleId || !requestedZoneId) {
        showError('Please fill in all fields');
        return;
    }

    try {
        showLoading(true);

        // Create parking request
        const request = await apiFetch('/parking/requests', {
            method: 'POST',
            body: JSON.stringify({
                vehicleId: vehicleId.trim(),
                requestedZoneId: parseInt(requestedZoneId)
            })
        });

        const requestId = request.id || request.requestId;
        appState.lastRequestId = requestId;

        // Auto-allocate
        await apiFetch(`/parking/requests/${requestId}/allocate`, {
            method: 'PUT'
        });

        showSuccess('Parking request created and allocated!');
        closeModal('new-request-modal');
        document.getElementById('new-request-form').reset();
        
        await loadRequests();
        await loadDashboard();
    } catch (error) {
        console.error('Request creation failed:', error);
    } finally {
        showLoading(false);
    }
}

// ==================== Analytics ====================

/**
 * Load analytics page
 */
async function loadAnalytics() {
    try {
        showLoading(true);

        // Load utilization stats
        const utilizationData = await apiFetch('/analytics/zones/utilization');
        
        // Load cancellation stats
        let cancellationData = null;
        try {
            cancellationData = await apiFetch('/analytics/cancellations');
        } catch (e) {
            // Endpoint might not exist
        }

        // Update analytics cards
        updateAnalyticsCards(utilizationData, cancellationData);

        // Render charts
        renderAnalyticsCharts(utilizationData);
    } catch (error) {
        console.error('Failed to load analytics:', error);
    } finally {
        showLoading(false);
    }
}

/**
 * Update analytics cards
 */
function updateAnalyticsCards(utilizationData, cancellationData) {
    // Total requests
    const totalRequests = utilizationData?.totalRequests || 0;
    document.getElementById('total-requests').textContent = totalRequests;

    // Success rate (simplified)
    const successRate = utilizationData?.successRate || 85;
    document.getElementById('success-rate').textContent = `${successRate}%`;

    // Average duration
    const avgDuration = utilizationData?.averageDuration || 120;
    document.getElementById('avg-duration').textContent = `${avgDuration} min`;

    // Cancellation rate
    const cancelRate = cancellationData?.rate || 5;
    document.getElementById('cancel-rate').textContent = `${cancelRate}%`;
}

/**
 * Render analytics charts
 */
function renderAnalyticsCharts(utilizationData) {
    const container = document.getElementById('analytics-charts');
    if (!container || typeof Chart === 'undefined') {
        container.innerHTML = '<div class="loading-state">Chart.js not loaded</div>';
        return;
    }

    // Destroy existing charts
    Object.values(appState.charts).forEach(chart => chart.destroy());
    appState.charts = {};

    container.innerHTML = '<canvas id="utilization-chart"></canvas>';

    const ctx = document.getElementById('utilization-chart');
    if (!ctx) return;

    const zones = utilizationData?.zones || [];
    const labels = zones.map(z => z.name || `Zone ${z.id}`);
    const data = zones.map(z => z.utilization || 0);

    appState.charts.utilization = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Utilization %',
                data: data,
                backgroundColor: 'rgba(0, 212, 255, 0.5)',
                borderColor: '#00d4ff',
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100,
                    ticks: {
                        color: '#9ca3af'
                    },
                    grid: {
                        color: '#374151'
                    }
                },
                x: {
                    ticks: {
                        color: '#9ca3af'
                    },
                    grid: {
                        color: '#374151'
                    }
                }
            },
            plugins: {
                legend: {
                    labels: {
                        color: '#f9fafb'
                    }
                }
            }
        }
    });
}

// ==================== Initialization ====================

/**
 * Initialize application
 */
async function init() {
    // Hide loading overlay after a short delay
    setTimeout(() => {
        showLoading(false);
    }, 500);

    // Initialize navigation
    initNavigation();

    // Bind form submissions
    const createZoneForm = document.getElementById('create-zone-form');
    if (createZoneForm) {
        createZoneForm.addEventListener('submit', handleCreateZone);
    }

    const newRequestForm = document.getElementById('new-request-form');
    if (newRequestForm) {
        newRequestForm.addEventListener('submit', handleNewRequest);
    }

    // Bind request filters
    const statusFilter = document.getElementById('status-filter');
    const searchInput = document.getElementById('search-input');
    
    if (statusFilter) {
        statusFilter.addEventListener('change', () => loadRequests());
    }
    
    if (searchInput) {
        searchInput.addEventListener('input', () => loadRequests());
    }

    // Bind time range selector
    const timeRange = document.getElementById('time-range');
    if (timeRange) {
        timeRange.addEventListener('change', () => loadAnalytics());
    }

    // Load initial page
    switchPage('dashboard');
}

// Start app when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
