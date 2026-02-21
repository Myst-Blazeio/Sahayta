import { User, Station, Notification, FIR } from "../types";

export const mockUsers: User[] = [
    {
        _id: "user_citizen",
        username: "citizen",
        role: "citizen",
        full_name: "John Doe",
        email: "john@example.com",
        phone: "9876543210",
        aadhar: "1234-5678-9012",
    },
    {
        _id: "user_police",
        username: "police",
        role: "police",
        full_name: "Officer Smith",
        email: "smith@police.gov.in",
        phone: "1122334455",
        station_id: "PS001",
    },
];

export const mockStations: Station[] = [
    {
        station_id: "PS001",
        station_name: "Central Police Station",
        location: "Downtown",
        address: "123 Main St, Downtown",
        officer_in_charge: "Officer Smith",
        contact_number: "033-12345678",
        email: "ps001@police.gov.in"
    },
    {
        station_id: "PS002",
        station_name: "North Police Station",
        location: "Northside",
        address: "456 North Ave, Northside",
        officer_in_charge: "Officer Jones",
        contact_number: "033-87654321",
        email: "ps002@police.gov.in"
    },
];

export const mockNotifications: Notification[] = [
    {
        _id: "notif1",
        user_id: "citizen",
        message: "Your FIR has been registered successfully.",
        is_read: false,
        created_at: new Date().toISOString(),
    },
    {
        _id: "notif2",
        user_id: "citizen",
        message: "Status update: Officer assigned to your case.",
        is_read: true,
        created_at: new Date(Date.now() - 86400000).toISOString(),
    },
];

export const mockFIRs: FIR[] = [
    {
        _id: "FIR2023001",
        filing_number: "FIR-2023-001",
        user_id: "citizen",
        station_id: "PS001",
        incident_date: "2023-10-25",
        incident_time: "14:30",
        location: "Main Market",
        original_text: "My bag was stolen while I was shopping.",
        status: "submitted",
        status_history: [
            { status: "submitted", timestamp: new Date(Date.now() - 1000000).toISOString(), note: "FIR Filed" }
        ],
        submission_date: new Date().toISOString(),
        language: "en",
    },
    {
        _id: "FIR2023002",
        filing_number: "FIR-2023-002",
        user_id: "citizen",
        station_id: "PS002",
        incident_date: "2023-10-20",
        incident_time: "20:00",
        location: "North Park",
        original_text: "Witnessed a fight near the park entrance.",
        status: "investigating",
        status_history: [
            { status: "submitted", timestamp: new Date(Date.now() - 2000000).toISOString(), note: "FIR Filed" },
            { status: "under_review", timestamp: new Date(Date.now() - 1500000).toISOString(), note: "Under review by station in-charge" },
            { status: "registered", timestamp: new Date(Date.now() - 1000000).toISOString(), note: "FIR Registered" },
            { status: "investigating", timestamp: new Date(Date.now() - 500000).toISOString(), note: "Investigation started" }
        ],
        submission_date: new Date(Date.now() - 2000000).toISOString(),
        language: "en",
    },
];
