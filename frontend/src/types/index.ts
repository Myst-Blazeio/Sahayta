export interface User {
  _id: string;
  username: string;
  full_name?: string;
  email?: string;
  phone?: string;
  aadhar?: string;
  role: "citizen" | "police" | "admin";
  station_id?: string;
  [key: string]: any;
}

export interface Station {
  station_id: string;
  station_name: string;
  location?: string;
  address?: string;
  officer_in_charge?: string;
  contact_number?: string;
  email?: string;
  [key: string]: any;
}

export interface FIR {
  _id: string;
  user_id: string;
  station_id: string;
  status: "submitted" | "under_review" | "registered" | "investigating" | "closed" | "rejected";
  status_history: {
    status: string;
    timestamp: string;
    note?: string;
  }[];
  filing_number?: string;
  original_text: string;
  incident_date: string;
  incident_time: string;
  location: string;
  submission_date: string;
  complainant_name?: string;
  complainant_phone?: string;
  complainant_email?: string;
  complainant_aadhar?: string;
  police_notes?: string;
  applicable_sections?: string[];
  [key: string]: any;
}

export interface Notification {
  _id: string;
  user_id: string;
  message: string;
  is_read: boolean;
  created_at: string;
  [key: string]: any;
}
