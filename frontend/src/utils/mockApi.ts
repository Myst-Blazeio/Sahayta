/**
 * Mock API Interceptor
 * Intercepts all /api/ requests and returns mock data,
 * preventing ECONNREFUSED errors when no backend is running.
 */
import axios from "axios";

// Mock data
const mockStations = [
    {
        _id: "station_1",
        name: "Central Police Station",
        location: "MG Road, Kolkata",
        contact: "033-22001100",
    },
    {
        _id: "station_2",
        name: "South Police Station",
        location: "Park Street, Kolkata",
        contact: "033-22002200",
    },
    {
        _id: "station_3",
        name: "North Police Station",
        location: "Shyambazar, Kolkata",
        contact: "033-22003300",
    },
];

const mockFirs = [
    {
        _id: "fir_1",
        fir_number: "FIR-2026-001",
        title: "Theft Report",
        description: "Wallet stolen at market",
        category: "Theft",
        station_id: "station_1",
        status: "registered",
        date: "2026-02-10",
        time: "14:30",
        location: "New Market, Kolkata",
        created_at: "2026-02-10T14:30:00Z",
    },
    {
        _id: "fir_2",
        fir_number: "FIR-2026-002",
        title: "Lost Phone",
        description: "Phone lost in metro",
        category: "Lost Property",
        station_id: "station_2",
        status: "under_investigation",
        date: "2026-02-12",
        time: "09:15",
        location: "Metro Station, Park Street",
        created_at: "2026-02-12T09:15:00Z",
    },
];

const mockNotifications: never[] = [];

/**
 * Setup Axios interceptor to handle all API calls with mock data
 * when no backend is available.
 */
export function setupMockApi() {
    axios.interceptors.request.use(async (config) => {
        const url = config.url || "";

        // Only intercept /api/ calls
        if (!url.startsWith("/api/")) {
            return config;
        }

        const method = (config.method || "get").toLowerCase();

        // Create a mock response based on the endpoint
        let mockData: unknown = null;
        let shouldMock = true;

        // AUTH endpoints
        if (url === "/api/auth/login" && method === "post") {
            const body =
                typeof config.data === "string"
                    ? JSON.parse(config.data)
                    : config.data;
            mockData = {
                token: "mock-token-" + Date.now(),
                role: "citizen",
                _id: "mock_" + Date.now(),
                username: body?.username || "user",
                full_name:
                    (body?.username || "User").charAt(0).toUpperCase() +
                    (body?.username || "user").slice(1),
                email: (body?.username || "user") + "@example.com",
                phone: "9876543210",
                aadhar: "XXXX-XXXX-XXXX",
            };
        } else if (url === "/api/auth/register" && method === "post") {
            mockData = { message: "Registration successful" };
        } else if (url === "/api/auth/me" && method === "get") {
            // Return stored user from sessionStorage if available
            const storedUser = sessionStorage.getItem("user");
            if (storedUser) {
                mockData = JSON.parse(storedUser);
            } else {
                // Return 401-like rejection
                return Promise.reject({
                    response: { status: 401, data: { error: "Not authenticated" } },
                });
            }
        } else if (url === "/api/auth/stations" && method === "get") {
            mockData = mockStations;
        }

        // FIR endpoints
        else if (url === "/api/fir/" && method === "get") {
            mockData = mockFirs;
        } else if (url === "/api/fir/" && method === "post") {
            const body =
                typeof config.data === "string"
                    ? JSON.parse(config.data)
                    : config.data;
            mockData = {
                _id: "fir_" + Date.now(),
                fir_number: "FIR-2026-" + String(Date.now()).slice(-3),
                ...body,
                status: "registered",
                created_at: new Date().toISOString(),
            };
        } else if (url === "/api/fir/notifications" && method === "get") {
            mockData = mockNotifications;
        } else if (
            url.match(/\/api\/fir\/notifications\/.*\/read/) &&
            method === "put"
        ) {
            mockData = { message: "Marked as read" };
        } else {
            // Unknown API endpoint — let it pass through (will still hit proxy)
            shouldMock = false;
        }

        if (shouldMock) {
            // Cancel the real request and return mock data via adapter
            config.adapter = () => {
                return Promise.resolve({
                    data: mockData,
                    status: 200,
                    statusText: "OK",
                    headers: {},
                    config,
                });
            };
        }

        return config;
    });

    console.log("[Mock API] Interceptor active — backend calls are mocked.");
}
