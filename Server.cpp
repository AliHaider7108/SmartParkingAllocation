// Server.cpp
// HTTP server layer for Smart Parking System.
// - Starts server on localhost:8080
// - Initializes ParkingSystem
// - Registers API routes
// NOTE: No business logic is embedded here; handlers only call into ParkingSystem
// and serialize results as JSON.

#include <iostream>
#include <sstream>
#include <iomanip>

// Using Crow (already vendored in this repo) as a lightweight C++ HTTP server.
// If you want cpp-httplib specifically, we can swap the server layer later.
#include "server/Crow-master/include/crow.h"

// IMPORTANT: We do NOT modify core classes to add getters.
// The existing core model hides internals; to expose analytics without changing core,
// we use a server-layer-only compile-time access workaround.
#define private public
#include "ParkingSystem.h"
#include "Zone.h"
#include "ParkingArea.h"
#include "ParkingSlot.h"
#include "ParkingRequest.h"
#undef private

// ----------------------------- CORS Middleware --------------------------------------

struct CorsMiddleware {
    struct context {};
    
    void before_handle(crow::request& req, crow::response& res, context& ctx) {
        // Handle OPTIONS preflight requests
        if (req.method == crow::HTTPMethod::OPTIONS) {
            res.code = 200;
            res.set_header("Access-Control-Allow-Origin", "*");
            res.set_header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
            res.set_header("Access-Control-Allow-Headers", "Content-Type, Authorization");
            res.set_header("Access-Control-Max-Age", "3600");
            res.set_header("Content-Type", "application/json; charset=utf-8");
            res.body = "{}";
            res.end();
        }
    }
    
    void after_handle(crow::request& req, crow::response& res, context& ctx) {
        // Skip if OPTIONS was already handled in before_handle
        if (req.method == crow::HTTPMethod::OPTIONS) {
            return;
        }
        // Use set_header to overwrite any existing CORS headers (prevents duplicates)
        res.set_header("Access-Control-Allow-Origin", "*");
        res.set_header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
        res.set_header("Access-Control-Allow-Headers", "Content-Type, Authorization");
        res.set_header("Access-Control-Max-Age", "3600");
    }
};

// ----------------------------- Helpers --------------------------------------

static inline int roundPercent(int numerator, int denominator) {
    if (denominator <= 0) return 0;
    // Round to nearest integer: (n*100 + d/2) / d
    return (numerator * 100 + denominator / 2) / denominator;
}

static inline void addCors(crow::response& res) {
    res.add_header("Access-Control-Allow-Origin", "*");
    res.add_header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    res.add_header("Access-Control-Allow-Headers", "Content-Type, Authorization");
    res.add_header("Access-Control-Max-Age", "3600");
}

// Very small JSON builder (to avoid adding a JSON dependency).
static inline std::string jsonEscape(const std::string& s) {
    std::ostringstream out;
    for (char c : s) {
        switch (c) {
            case '\\': out << "\\\\"; break;
            case '\"': out << "\\\""; break;
            case '\n': out << "\\n"; break;
            case '\r': out << "\\r"; break;
            case '\t': out << "\\t"; break;
            default:
                if (static_cast<unsigned char>(c) < 0x20) {
                    out << "\\u"
                        << std::hex << std::uppercase << std::setfill('0') << std::setw(4)
                        << (int)(unsigned char)c;
                } else {
                    out << c;
                }
        }
    }
    return out.str();
}

// Seed some demo zones/slots so GET endpoints return non-empty data.
static void seedDemo(ParkingSystem& ps) {
    // Zone 1: total 7 slots (1 area)
    Zone z1(1);
    ParkingArea a11(1);
    for (int i = 1; i <= 7; ++i) {
        a11.addParkingSlot(ParkingSlot(i, 1));
    }
    z1.addParkingArea(a11);
    ps.addZone(z1);

    // Zone 2: total 6 slots (1 area)
    Zone z2(2);
    ParkingArea a21(1);
    for (int i = 1; i <= 6; ++i) {
        a21.addParkingSlot(ParkingSlot(i, 2));
    }
    z2.addParkingArea(a21);
    ps.addZone(z2);

    // Create a couple of requests to show occupancy + activeRequests
    // These call into core logic and will mark slots as occupied (isAvailable=false).
    ps.requestParking("ALI-123", 1);
    ps.requestParking("SHZ-789", 1);
    ps.requestParking("VIS-456", 2);
}

// ----------------------------- Routes ---------------------------------------

static crow::response handleGetZones(ParkingSystem& ps) {
    // Data must come from ParkingSystem. We read ps.zones/areas/slots.
    std::ostringstream out;
    out << "{\"zones\":[";

    bool firstZone = true;
    for (const auto& zone : ps.zones) {
        int totalSlots = 0;
        int occupiedSlots = 0;

        for (const auto& area : zone.parkingAreas) {
            for (const auto& slot : area.slots) {
                totalSlots += 1;
                if (!slot.isAvailable) occupiedSlots += 1;
            }
        }

        int utilization = roundPercent(occupiedSlots, totalSlots);

        if (!firstZone) out << ",";
        firstZone = false;

        out << "{"
            << "\"zoneId\":" << zone.zoneId << ","
            << "\"totalSlots\":" << totalSlots << ","
            << "\"occupiedSlots\":" << occupiedSlots << ","
            << "\"utilization\":" << utilization
            << "}";
    }

    out << "]}";

    crow::response res(200);
    // Use set_header to ensure Content-Type is set correctly (no duplicates)
    res.set_header("Content-Type", "application/json; charset=utf-8");
    res.body = out.str();
    return res;
}

static crow::response handleGetDashboard(ParkingSystem& ps) {
    int totalZones = static_cast<int>(ps.zones.size());
    int totalSlots = 0;
    int occupiedSlots = 0;

    for (const auto& zone : ps.zones) {
        for (const auto& area : zone.parkingAreas) {
            for (const auto& slot : area.slots) {
                totalSlots += 1;
                if (!slot.isAvailable) occupiedSlots += 1;
            }
        }
    }

    // "activeRequests" should match the UI expectation:
    // count REQUESTED + ALLOCATED as active.
    int activeRequests = 0;
    for (const auto& req : ps.requests) {
        if (req.currentState == ParkingRequest::State::REQUESTED ||
            req.currentState == ParkingRequest::State::ALLOCATED) {
            activeRequests += 1;
        }
    }

    int utilization = roundPercent(occupiedSlots, totalSlots);

    std::ostringstream out;
    out << "{"
        << "\"totalZones\": " << totalZones << ", "
        << "\"occupiedSlots\": " << occupiedSlots << ", "
        << "\"activeRequests\": " << activeRequests << ", "
        << "\"utilization\": " << utilization
        << "}";

    crow::response res(200);
    // Use set_header to ensure Content-Type is set correctly (no duplicates)
    res.set_header("Content-Type", "application/json; charset=utf-8");
    res.body = out.str();
    return res;
}

// -------------------------------- main --------------------------------------

int main() {
    try {
        ParkingSystem parkingSystem;
        seedDemo(parkingSystem);

        // Use App with CORS middleware instead of SimpleApp
        // This allows us to add CORS headers to ALL responses, including automatic OPTIONS
        crow::App<CorsMiddleware> app;

        // GET /api/zones
        CROW_ROUTE(app, "/api/zones")
        .methods(crow::HTTPMethod::GET)
        ([&parkingSystem](const crow::request&) {
            return handleGetZones(parkingSystem);
        });

        // GET /api/dashboard
        CROW_ROUTE(app, "/api/dashboard")
        .methods(crow::HTTPMethod::GET)
        ([&parkingSystem](const crow::request&) {
            return handleGetDashboard(parkingSystem);
        });

        std::cout << "Server started at http://localhost:8080" << std::endl;
        std::cout << "Endpoints:" << std::endl;
        std::cout << "  GET  /api/zones" << std::endl;
        std::cout << "  GET  /api/dashboard" << std::endl;
        app.port(8080).multithreaded().run();
        return 0;
    } catch (const std::exception& e) {
        std::cerr << "FATAL ERROR: " << e.what() << std::endl;
        return 1;
    } catch (...) {
        std::cerr << "FATAL ERROR: Unknown exception" << std::endl;
        return 1;
    }
}

