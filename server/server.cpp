#include <crow.h>
#include <crow/middlewares/cors.h>
#include "ApiController.h"

/**
 * @file server.cpp
 * @brief Main entry point for the Smart Parking Allocation REST API server
 *
 * This server provides REST API endpoints for the parking system using the Crow framework.
 * It sets up routes that delegate to the ApiController class methods.
 */

int main() {
    // Create Crow app with CORS middleware for web frontend support
    crow::App<crow::CORSHandler> app;

    // Configure CORS to allow all origins (for development)
    auto& cors = app.get_middleware<crow::CORSHandler>();
    cors.global().origin("*")
                 .methods("GET"_method, "POST"_method, "PUT"_method, "DELETE"_method)
                 .headers("Content-Type", "Authorization");

    // Create API controller instance
    ApiController apiController;

    // Define API routes

    // Health check endpoint
    CROW_ROUTE(app, "/api/health")
    ([](){
        crow::json::wvalue response;
        response["status"] = "healthy";
        response["service"] = "Smart Parking Allocation API";
        response["version"] = "1.0.0";
        return crow::response(200, response);
    });

    // Zone Management Routes
    CROW_ROUTE(app, "/api/zones")
    .methods("GET"_method, "POST"_method)
    ([&apiController](const crow::request& req) {
        if (req.method == "GET"_method) {
            return apiController.getZones(req);
        } else if (req.method == "POST"_method) {
            return apiController.createZone(req);
        }
        return crow::response(405); // Method not allowed
    });

    CROW_ROUTE(app, "/api/zones/<int>")
    .methods("GET"_method)
    ([&apiController](int zoneId, const crow::request& req) {
        return apiController.getZone(zoneId, req);
    });

    CROW_ROUTE(app, "/api/zones/<int>/availability")
    .methods("GET"_method)
    ([&apiController](int zoneId, const crow::request& req) {
        return apiController.getZoneAvailability(zoneId, req);
    });

    // Vehicle Management Routes
    CROW_ROUTE(app, "/api/vehicles")
    .methods("POST"_method)
    ([&apiController](const crow::request& req) {
        return apiController.registerVehicle(req);
    });

    CROW_ROUTE(app, "/api/vehicles/<string>")
    .methods("GET"_method)
    ([&apiController](const std::string& vehicleId, const crow::request& req) {
        return apiController.getVehicle(vehicleId, req);
    });

    // Parking Request Routes
    CROW_ROUTE(app, "/api/parking/requests")
    .methods("POST"_method)
    ([&apiController](const crow::request& req) {
        return apiController.createParkingRequest(req);
    });

    CROW_ROUTE(app, "/api/parking/requests/<int>")
    .methods("GET"_method)
    ([&apiController](int requestId, const crow::request& req) {
        return apiController.getParkingRequest(requestId, req);
    });

    CROW_ROUTE(app, "/api/parking/requests/<int>/cancel")
    .methods("PUT"_method)
    ([&apiController](int requestId, const crow::request& req) {
        return apiController.cancelParkingRequest(requestId, req);
    });

    CROW_ROUTE(app, "/api/parking/requests/<int>/allocate")
    .methods("PUT"_method)
    ([&apiController](int requestId, const crow::request& req) {
        return apiController.allocateParking(requestId, req);
    });

    CROW_ROUTE(app, "/api/parking/requests/<int>/release")
    .methods("PUT"_method)
    ([&apiController](int requestId, const crow::request& req) {
        return apiController.releaseParking(requestId, req);
    });

    CROW_ROUTE(app, "/api/parking/requests/<int>/occupy")
    .methods("PUT"_method)
    ([&apiController](int requestId, const crow::request& req) {
        return apiController.occupyParking(requestId, req);
    });

    // System Operations Routes
    CROW_ROUTE(app, "/api/system/rollback")
    .methods("POST"_method)
    ([&apiController](const crow::request& req) {
        return apiController.rollbackAllocations(req);
    });

    // Analytics Routes
    CROW_ROUTE(app, "/api/analytics/zones/utilization")
    .methods("GET"_method)
    ([&apiController](const crow::request& req) {
        return apiController.getZoneUtilization(req);
    });

    CROW_ROUTE(app, "/api/analytics/cancellations")
    .methods("GET"_method)
    ([&apiController](const crow::request& req) {
        return apiController.getCancellationStats(req);
    });

    CROW_ROUTE(app, "/api/analytics/peak-usage")
    .methods("GET"_method)
    ([&apiController](const crow::request& req) {
        return apiController.getPeakUsage(req);
    });

    // Static file serving for web frontend (optional)
    // This would serve the HTML/CSS/JS files if placed in a www directory
    // CROW_ROUTE(app, "/<path>")
    // ([](const crow::request& req, crow::response& res, std::string path) {
    //     // Serve static files
    // });

    // Start server
    std::cout << "Smart Parking Allocation API Server starting..." << std::endl;
    std::cout << "Listening on http://localhost:8080" << std::endl;
    std::cout << "Health check: http://localhost:8080/api/health" << std::endl;

    app.port(8080).multithreaded().run();

    return 0;
}