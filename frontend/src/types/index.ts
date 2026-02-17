export interface User {
  _id: string;
  username: string;
  full_name?: string;
  email?: string;
  phone?: string;
  aadhar?: string;
  role: "citizen" | "police" | "admin";
  station_id?: string;
  police_id?: string; // Added from schema
  created_at?: string; // Added from schema
  [key: string]: any;
}

export interface Station {
  station_id: string;
  station_name: string;
  location?: string;
  [key: string]: any;
}

export interface FIR {
  _id: string;
  user_id: string;
  station_id: string;
  status: "pending" | "in_progress" | "accepted" | "rejected" | "resolved";
  original_text: string;
  translated_text?: string; // Added from schema
  language?: string; // Added from schema
  incident_date: string;
  incident_time: string;
  location: string;
  submission_date: string;
  last_updated?: string; // Added from schema
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
