import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import axios from "axios";
import { generateFIRPDF } from "../utils/pdfGenerator";
import { motion, AnimatePresence } from "framer-motion";
import AnonymousTip from "../components/AnonymousTip";
import CommunityAlerts from "../components/CommunityAlerts";
import FeedbackGrievance from "../components/FeedbackGrievance";
import SafeRouteFinder from "../components/SafeRouteFinder";
import {
  Bell,
  X,
  Search as SearchIcon,
  ChevronDown,
  AlertCircle,
  User as UserIcon,
  Phone,
  Mail,
  FileText,
  Download,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { Notification, Station, FIR } from "../types";

const CitizenPortal = () => {
  const [activeTab, setActiveTab] = useState("services");
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifs, setShowNotifs] = useState(false);
  const { username } = useParams();
  const { token, role } = useAuth();

  useEffect(() => {
    if (token && role === "citizen") {
      fetchNotifications();
      const interval = setInterval(fetchNotifications, 30000); // Poll every 30s
      return () => clearInterval(interval);
    }
  }, [token, role]);

  const fetchNotifications = async () => {
    try {
      const res = await axios.get("/api/fir/notifications", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setNotifications(res.data);
    } catch (e) {
      console.error("Failed to fetch notifications");
    }
  };

  const markRead = async (id: string) => {
    try {
      await axios.put(
        `/api/fir/notifications/${id}/read`,
        {},
        { headers: { Authorization: `Bearer ${token}` } },
      );
      setNotifications(
        notifications.map((n) => (n._id === id ? { ...n, is_read: true } : n)),
      );
    } catch (e) {
      console.error("Failed to mark read");
    }
  };

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Navbar />
      <main className="flex-grow container mx-auto px-4 py-8 relative">
        <header className="mb-8 flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              Welcome, {username}
            </h1>
            <p className="text-muted-foreground">
              Access police services online.
            </p>
          </div>

          <div className="flex items-center">
            <div className="relative">
              <button
                onClick={() => setShowNotifs(!showNotifs)}
                className="p-2 bg-card border rounded-full hover:bg-accent relative"
              >
                <Bell className="w-6 h-6 text-foreground" />
                {unreadCount > 0 && (
                  <span className="absolute top-0 right-0 w-3 h-3 bg-primary rounded-full animate-pulse" />
                )}
              </button>
              <AnimatePresence>
                {showNotifs && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute right-0 mt-2 w-80 bg-card border rounded-lg shadow-xl z-50 overflow-hidden"
                  >
                    <div className="p-3 border-b font-bold flex justify-between">
                      <span>Notifications</span>
                      <button onClick={() => setShowNotifs(false)}>
                        <X size={16} />
                      </button>
                    </div>
                    <div className="max-h-64 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <p className="p-4 text-center text-sm text-muted-foreground">
                          No notifications.
                        </p>
                      ) : (
                        notifications.map((n) => (
                          <div
                            key={n._id}
                            className={`p-3 border-b hover:bg-accent/50 transition flex gap-3 ${!n.is_read ? "bg-accent/10" : ""}`}
                          >
                            <div className="mt-1">
                              <div
                                className={`w-2 h-2 rounded-full ${!n.is_read ? "bg-primary" : "bg-transparent"}`}
                              />
                            </div>
                            <div className="flex-1">
                              <p className="text-sm">{n.message}</p>
                              <p className="text-xs text-muted-foreground mt-1">
                                {new Date(n.created_at).toLocaleString()}
                              </p>
                              {!n.is_read && (
                                <button
                                  onClick={() => markRead(n._id)}
                                  className="text-xs text-primary mt-1 hover:underline"
                                >
                                  Mark as read
                                </button>
                              )}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </header>

        {/* Tabs */}
        <div className="flex flex-wrap justify-center gap-2 bg-muted p-1 rounded-lg mb-8 w-full">
          {["services", "new-fir", "history", "anonymous-tip", "community-alerts", "feedback", "safe-route", "profile"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-2 px-4 rounded-md text-sm font-medium transition-all whitespace-nowrap ${activeTab === tab
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:bg-background/50"
                }`}
            >
              {tab === "services" && "Services"}
              {tab === "new-fir" && "File FIR"}
              {tab === "history" && "My FIRs"}
              {tab === "anonymous-tip" && "Anonymous Tip"}
              {tab === "community-alerts" && "Alerts"}
              {tab === "feedback" && "Feedback"}
              {tab === "safe-route" && "Safe Route"}
              {tab === "profile" && "Profile"}
            </button>
          ))}
        </div>

        {/* Content */}
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
        >
          {activeTab === "services" && (
            <ServicesTab setActiveTab={setActiveTab} />
          )}
          {activeTab === "new-fir" && (
            <NewFIRTab onSuccess={() => setActiveTab("history")} />
          )}
          {activeTab === "history" && <HistoryTab />}
          {activeTab === "anonymous-tip" && <AnonymousTip />}
          {activeTab === "community-alerts" && <CommunityAlerts />}
          {activeTab === "feedback" && <FeedbackGrievance />}
          {activeTab === "safe-route" && <SafeRouteFinder />}
          {activeTab === "profile" && <ProfileTab />}
        </motion.div>
      </main>
      <Footer />
    </div>
  );
};




const ServicesTab: React.FC<{ setActiveTab: (tab: string) => void }> = ({ setActiveTab }) => {
  const services = [
    {
      title: "File an FIR",
      desc: "Report cognizable offenses immediately.",
      action: () => setActiveTab("new-fir"),
    },
    {
      title: "Anonymous Tip",
      desc: "Report suspicious activity anonymously. No personal details required.",
      action: () => setActiveTab("anonymous-tip"),
    },
    {
      title: "Community Alerts",
      desc: "Stay informed about crimes, safety warnings, and emergencies in your area.",
      action: () => setActiveTab("community-alerts"),
    },
    {
      title: "Feedback & Grievance",
      desc: "Submit feedback or complaints about police services and track resolution.",
      action: () => setActiveTab("feedback"),
    },
    {
      title: "Safe Route Finder",
      desc: "AI-suggested safer travel routes based on crime data and hotspot analysis.",
      action: () => setActiveTab("safe-route"),
    },
  ];

  return (
    <div className="space-y-10">
      {/* Existing Services */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {services.map((service, index) => (
          <div
            key={index}
            className="p-6 rounded-lg border border-border bg-card hover:shadow-lg transition-shadow cursor-pointer official-card"
            onClick={service.action}
          >
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center mb-4 bg-primary/10 text-primary"
            >
              {/* Icon placeholder */}
              <span className="text-xl font-bold">{service.title[0]}</span>
            </div>
            <h3 className="text-xl font-semibold mb-2">{service.title}</h3>
            <p className="text-muted-foreground">{service.desc}</p>
          </div>
        ))}
      </div>

    </div>
  );
};

const NewFIRTab: React.FC<{ onSuccess: () => void }> = ({ onSuccess }) => {
  const [formData, setFormData] = useState({
    text: "",
    language: "en",
    incident_date: "",
    incident_time: "",
    location: "",
    station_id: "",
  });
  const [loading, setLoading] = useState(false);
  const [stations, setStations] = useState<Station[]>([]);
  const [msg, setMsg] = useState("");
  const [dateWarning, setDateWarning] = useState("");
  const { token } = useAuth();

  useEffect(() => {
    // Fetch stations on mount
    const fetchStations = async () => {
      try {
        const res = await axios.get("/api/auth/stations");
        setStations(res.data);
      } catch (err) {
        console.error("Failed to fetch stations", err);
      }
    };
    fetchStations();
  }, []);

  const validateDateTime = (date: string, time: string) => {
    if (!date || !time) return;
    const selected = new Date(`${date}T${time}`);
    const now = new Date();
    if (selected > now) {
      setDateWarning("Warning: Future date/time selected.");
    } else {
      setDateWarning("");
    }
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, incident_date: e.target.value });
    validateDateTime(e.target.value, formData.incident_time);
  };

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, incident_time: e.target.value });
    validateDateTime(formData.incident_date, e.target.value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.station_id) {
      setMsg("Please select a Police Station.");
      return;
    }
    setLoading(true);
    setMsg("");

    try {
      await axios.post("/api/fir/", formData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMsg("FIR Submitted Successfully!");
      setTimeout(() => onSuccess(), 1500);
    } catch (error) {
      setMsg("Error submitting FIR.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto bg-card p-8 rounded-lg border border-border official-card">
      <h2 className="text-2xl font-bold mb-6 text-blue-900">File a New FIR</h2>

      {/* Legal Warning */}
      <div className="bg-amber-50 border-l-4 border-amber-500 p-4 mb-6">
        <div className="flex items-start">
          <AlertCircle className="w-6 h-6 text-amber-600 mr-3 mt-0.5 flex-shrink-0" />
          <div>
            <h3 className="text-sm font-bold text-amber-800 uppercase tracking-wide">
              Legal Warning
            </h3>
            <p className="text-sm text-amber-700 mt-1">
              Filing a false FIR is a punishable offense under{" "}
              <strong>Section 217 of the Bharatiya Nyaya Sanhita (BNS), 2023</strong>{" "}
              (previously Section 182 IPC). Providing false information to a public
              servant can lead to imprisonment and fines.
            </p>
          </div>
        </div>
      </div>

      {msg && (
        <div
          className={`p-3 rounded mb-4 ${msg.includes("Success") ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}
        >
          {msg}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Police Station Dropdown */}
        <div>
          <label className="block text-sm font-medium mb-1">
            Select Police Station <span className="text-red-500">*</span>
          </label>
          <StationDropdown
            stations={stations}
            selected={formData.station_id}
            onSelect={(id) => setFormData({ ...formData, station_id: id })}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              Incident Date <span className="text-red-500">*</span>
            </label>
            <div className="relative group">
              <input
                type="date"
                className={`w-full p-2 rounded border bg-input ${dateWarning ? "border-amber-500" : ""}`}
                required
                value={formData.incident_date}
                onChange={handleDateChange}
              />
              {dateWarning && (
                <div className="text-xs text-amber-600 mt-1 flex items-center">
                  <AlertCircle size={12} className="mr-1" /> {dateWarning}
                </div>
              )}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">
              Incident Time <span className="text-red-500">*</span>
            </label>
            <input
              type="time"
              className={`w-full p-2 rounded border bg-input ${dateWarning ? "border-amber-500" : ""}`}
              required
              value={formData.incident_time}
              onChange={handleTimeChange}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            Location of Incident <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            className="w-full p-2 rounded border bg-input"
            placeholder="e.g. Main Market, Sector 4"
            required
            value={formData.location}
            onChange={(e) =>
              setFormData({ ...formData, location: e.target.value })
            }
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            Language of Description
          </label>
          <select
            className="w-full p-2 rounded border bg-input"
            value={formData.language}
            onChange={(e) =>
              setFormData({ ...formData, language: e.target.value })
            }
          >
            <option value="en">English</option>
            <option value="hi">Hindi</option>
            <option value="bn">Bengali</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            Incident Description <span className="text-red-500">*</span>
          </label>
          <textarea
            className="w-full h-32 p-3 rounded border bg-input"
            placeholder="Describe what happened..."
            required
            value={formData.text}
            onChange={(e) => setFormData({ ...formData, text: e.target.value })}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 bg-primary text-primary-foreground font-bold rounded hover:bg-primary/90 transition"
        >
          {loading ? "Submitting..." : "Submit Grievance"}
        </button>
      </form>
    </div>
  );
};

interface StationDropdownProps {
  stations: Station[];
  selected: string;
  onSelect: (id: string) => void;
}

const StationDropdown: React.FC<StationDropdownProps> = ({ stations, selected, onSelect }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");

  // Close dropdown when clicking outside could be added, but simple toggle for now

  const filtered = stations.filter(
    (s) =>
      (s.station_name || "").toLowerCase().includes(search.toLowerCase()) ||
      (s.station_id || "").toLowerCase().includes(search.toLowerCase()),
  );

  const selectedName =
    stations.find((s) => s.station_id === selected)?.station_name || selected;

  return (
    <div className="relative">
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="w-full p-2 rounded border bg-input cursor-pointer flex justify-between items-center"
      >
        <span
          className={selected ? "text-foreground" : "text-muted-foreground"}
        >
          {selectedName ? `${selectedName}` : "Search Police Station..."}
        </span>
        <ChevronDown size={16} className="text-muted-foreground" />
      </div>

      {isOpen && (
        <div className="absolute z-10 w-full bg-white border border-gray-300 rounded shadow-lg mt-1 max-h-60 overflow-hidden flex flex-col">
          <div className="p-2 border-b bg-gray-50">
            <div className="flex items-center bg-white border rounded px-2">
              <SearchIcon size={14} className="text-gray-400 mr-2" />
              <input
                className="w-full p-1 outline-none text-sm"
                placeholder="Search by name or ID..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                autoFocus
              />
            </div>
          </div>
          <ul className="overflow-y-auto flex-1 max-h-40">
            {filtered.length > 0 ? (
              filtered.map((s) => (
                <li
                  key={s.station_id}
                  onClick={() => {
                    onSelect(s.station_id);
                    setIsOpen(false);
                    setSearch("");
                  }}
                  className="p-2 hover:bg-blue-50 cursor-pointer text-sm border-b last:border-b-0"
                >
                  <span className="font-semibold text-gray-700">
                    {s.station_name}
                  </span>
                  <span className="text-gray-500 ml-1">({s.station_id})</span>
                </li>
              ))
            ) : (
              <li className="p-3 text-gray-500 text-xs text-center">
                No stations found
              </li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
};

const HistoryTab = () => {
  const [firs, setFirs] = useState<FIR[]>([]);
  const [loading, setLoading] = useState(true);
  const [stations, setStations] = useState<Station[]>([]);
  const { token } = useAuth();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [firRes, stationRes] = await Promise.all([
          axios.get("/api/fir/", {
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get("/api/auth/stations"),
        ]);
        setFirs(firRes.data);
        setStations(stationRes.data);
      } catch (error) {
        console.error("Error fetching history:", error);
      } finally {
        setLoading(false);
      }
    };
    if (token) fetchData();
  }, [token]);

  if (loading)
    return <div className="text-center py-8">Loading records...</div>;

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold mb-4">My FIR Status</h2>
      {firs.length === 0 ? (
        <div className="text-center p-8 bg-muted rounded">
          No records found.
        </div>
      ) : (
        firs.map((fir) => {
          const stationName =
            stations.find((s) => s.station_id === fir.station_id)
              ?.station_name || fir.station_id;
          return (
            <div
              key={fir._id}
              className="p-5 border rounded-lg bg-card shadow-sm flex flex-col md:flex-row justify-between gap-4 official-card"
            >
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-bold text-lg">
                    FIR #{fir._id.slice(0, 8)}...
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {new Date(fir.submission_date).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-sm text-foreground/80 line-clamp-2">
                  {fir.original_text}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Loc: {fir.location} | Station: {stationName || "N/A"}
                </p>
              </div>
              <div className="flex flex-col items-end gap-2 min-w-[120px]">
                <span
                  className={`px-3 py-1 rounded-full text-xs font-bold uppercase self-end ${fir.status === "pending"
                    ? "bg-gray-100 text-gray-800 border border-gray-200"
                    : fir.status === "accepted" || fir.status === "in_progress"
                      ? "bg-blue-100 text-blue-800 border border-blue-200"
                      : fir.status === "resolved"
                        ? "bg-primary text-secondary border border-primary"
                        : "bg-gray-100"
                    }`}
                >
                  {fir.status.replace("_", " ")}
                </span>

                {fir.status === "resolved" && (
                  <div className="mt-auto pt-4">
                    <button
                      onClick={() => generateFIRPDF(fir)}
                      className="text-xs text-primary hover:underline flex items-center gap-1"
                    >
                      <Download size={14} /> Download Report
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
};

export default CitizenPortal;

const ProfileTab = () => {
  const { user } = useAuth();

  if (!user) return <div className="text-center p-8">Loading profile...</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4 mb-6">
        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center text-blue-700">
          <UserIcon size={32} />
        </div>
        <div>
          <h2 className="text-2xl font-bold">My Profile</h2>
          <p className="text-muted-foreground">Personal Information</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-card border rounded-lg p-4 flex gap-3 items-start official-card">
          <div className="mt-1 text-muted-foreground">
            <UserIcon size={20} />
          </div>
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Full Name
            </p>
            <p className="font-medium text-lg">
              {user.full_name || user.username}
            </p>
          </div>
        </div>

        <div className="bg-card border rounded-lg p-4 flex gap-3 items-start official-card">
          <div className="mt-1 text-muted-foreground">
            <UserIcon size={20} />
          </div>
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Username
            </p>
            <p className="font-medium text-lg">@{user.username}</p>
          </div>
        </div>

        <div className="bg-card border rounded-lg p-4 flex gap-3 items-start official-card">
          <div className="mt-1 text-muted-foreground">
            <Phone size={20} />
          </div>
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Phone
            </p>
            <p className="font-medium text-lg">
              {user.phone || "Not Verified"}
            </p>
          </div>
        </div>

        <div className="bg-card border rounded-lg p-4 flex gap-3 items-start official-card">
          <div className="mt-1 text-muted-foreground">
            <Mail size={20} />
          </div>
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Email
            </p>
            <p className="font-medium text-lg">
              {user.email || "Not Verified"}
            </p>
          </div>
        </div>

        <div className="bg-card border rounded-lg p-4 flex gap-3 items-start official-card col-span-1 md:col-span-2">
          <div className="mt-1 text-muted-foreground">
            <FileText size={20} />
          </div>
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Aadhar Number
            </p>
            <p className="font-medium text-lg font-mono tracking-wide">
              {user.aadhar || "Not Linked"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};


