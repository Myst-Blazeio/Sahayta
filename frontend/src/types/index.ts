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
  [key: string]: any;
}

export interface FIR {
  _id: string;
  user_id: string;
  station_id: string;
  status: "pending" | "accepted" | "rejected" | "resolved" | "in_progress";
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

export interface CommunityAlert {
  _id: string;
  title: string;
  message: string;
  severity: "emergency" | "important" | "info";
  station_id: string;
  created_at: string;
  [key: string]: any;
}
