/* eslint-disable @typescript-eslint/no-explicit-any */
import { User, FIR } from "../types";
import { mockUsers, mockStations, mockNotifications, mockFIRs } from "./mockData";

const SIMULATED_DELAY = 500;

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Helper to get current user from session
const getCurrentUser = (): User | null => {
    const userStr = sessionStorage.getItem("user");
    return userStr ? JSON.parse(userStr) : null;
};

export const api = {
    login: async (credentials: any) => {
        await delay(SIMULATED_DELAY);

        // Find existing user (citizen or police)
        let user = mockUsers.find((u) => u.username === credentials.username);

        // If not found, create a dummy citizen user on the fly to allow "dummy data" login
        if (!user) {
            user = {
                _id: `user_${credentials.username}`,
                username: credentials.username,
                role: "citizen",
                full_name: "Mock User",
                email: `${credentials.username}@example.com`,
                phone: "0000000000",
                aadhar: "0000-0000-0000"
            };
        }

        return {
            data: {
                token: `mock-jwt-token-${user.role}`,
                ...user,
            },
        };
    },

    register: async (userData: any) => {
        await delay(SIMULATED_DELAY);
        const existing = mockUsers.find((u) => u.username === userData.username);
        if (existing) {
            throw { response: { data: { error: "Username already exists" } } };
        }

        // Create new user and add to mockUsers
        const newUser: User = {
            _id: `user_${Date.now()}`,
            role: "citizen",
            ...userData
        };
        mockUsers.push(newUser);

        return { data: { message: "Registration successful" } };
    },

    getMe: async () => {
        await delay(SIMULATED_DELAY);
        const user = getCurrentUser();
        if (user) {
            return { ok: true, json: async () => user };
        }
        return { ok: false };
    },

    getStations: async () => {
        await delay(SIMULATED_DELAY);
        return { data: mockStations };
    },

    getNotifications: async () => {
        await delay(SIMULATED_DELAY);
        return { data: mockNotifications };
    },

    markNotificationRead: async (id: string) => {
        await delay(SIMULATED_DELAY);
        // In-memory update for the session
        const index = mockNotifications.findIndex(n => n._id === id);
        if (index !== -1) {
            mockNotifications[index].is_read = true;
        }
        return { data: { success: true } };
    },

    submitFIR: async (firData: any) => {
        await delay(SIMULATED_DELAY);

        const currentYear = new Date().getFullYear();
        const randId = Math.floor(1000 + Math.random() * 9000); // Simple random 4 digit
        const filingNumber = `FIR-${currentYear}-${randId}`;

        const newFIR: FIR = {
            _id: `FIR${Date.now()}`,
            filing_number: filingNumber,
            user_id: getCurrentUser()?.username || "anonymous",
            submission_date: new Date().toISOString(),
            status: "submitted",
            status_history: [
                {
                    status: "submitted",
                    timestamp: new Date().toISOString(),
                    note: "FIR Submitted by Citizen"
                }
            ],
            ...firData,
        };
        mockFIRs.unshift(newFIR); // Add to local mock data
        return { data: { id: newFIR._id, filing_number: filingNumber } };
    },

    getFIRs: async () => {
        await delay(SIMULATED_DELAY);
        const user = getCurrentUser();
        if (!user) return { data: [] };
        return { data: mockFIRs }; // For simplicity returns all, filters usually backend
    },
};
