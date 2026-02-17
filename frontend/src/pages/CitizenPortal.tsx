import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import axios from "axios";
import { generateFIRPDF } from "../utils/pdfGenerator";
import { motion, AnimatePresence } from "framer-motion";
import AILegalSuggestion from "../components/AILegalSuggestion";
import SafetyGuidelines from "../components/SafetyGuidelines";
import AnonymousTip from "../components/AnonymousTip";
import CommunityAlerts from "../components/CommunityAlerts";
import FeedbackGrievance from "../components/FeedbackGrievance";
import WomenSOS from "../components/WomenSOS";
import SafeRouteFinder from "../components/SafeRouteFinder";
import SelfDefenseResources from "../components/SelfDefenseResources";
import ReportHarassment from "../components/ReportHarassment";
import CyberHelpCenter from "../components/CyberHelpCenter";
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
  PackageSearch,
  MapPin,
  Calendar,
  Clock,
  Eye,
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
                  <span className="absolute top-0 right-0 w-3 h-3 bg-red-500 rounded-full animate-pulse" />
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
                                className={`w-2 h-2 rounded-full ${!n.is_read ? "bg-blue-500" : "bg-transparent"}`}
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
        <div className="flex space-x-1 bg-muted p-1 rounded-lg mb-8 max-w-2xl overflow-x-auto">
          {["services", "new-fir", "history", "lost-found", "anonymous-tip", "community-alerts", "feedback", "women-sos", "safe-route", "self-defense", "report-harassment", "cyber-help", "ai-legal", "safety", "profile"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
<<<<<<< HEAD
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${activeTab === tab
=======
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all whitespace-nowrap ${activeTab === tab
>>>>>>> dec0794 (feat: Implement initial frontend application with core safety features, authentication, and citizen portal pages.)
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:bg-background/50"
                }`}
            >
              {tab === "services" && "Services"}
              {tab === "new-fir" && "File FIR"}
              {tab === "history" && "My FIRs"}
              {tab === "lost-found" && "Lost & Found"}
              {tab === "anonymous-tip" && "Anonymous Tip"}
              {tab === "community-alerts" && "Alerts"}
              {tab === "feedback" && "Feedback"}
              {tab === "women-sos" && "SOS"}
              {tab === "safe-route" && "Safe Route"}
              {tab === "self-defense" && "Self-Defense"}
              {tab === "report-harassment" && "Report Abuse"}
              {tab === "cyber-help" && "Cyber Help"}
              {tab === "ai-legal" && "AI Legal"}
              {tab === "safety" && "Safety"}
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
          {activeTab === "lost-found" && <LostFoundTab />}
          {activeTab === "anonymous-tip" && <AnonymousTip />}
          {activeTab === "community-alerts" && <CommunityAlerts />}
          {activeTab === "feedback" && <FeedbackGrievance />}
          {activeTab === "women-sos" && <WomenSOS />}
          {activeTab === "safe-route" && <SafeRouteFinder />}
          {activeTab === "self-defense" && <SelfDefenseResources />}
          {activeTab === "report-harassment" && <ReportHarassment />}
          {activeTab === "cyber-help" && <CyberHelpCenter />}
          {activeTab === "ai-legal" && <AILegalSuggestion />}
          {activeTab === "safety" && <SafetyGuidelines />}
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
      color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
    },
    {
      title: "Lost & Found",
      desc: "Report lost items or missing persons and track status.",
      action: () => setActiveTab("lost-found"),
      color: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
    },
    {
      title: "AI Legal Section Finder",
      desc: "Describe a crime and get relevant BNS section suggestions.",
      action: () => setActiveTab("ai-legal"),
      color: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400",
    },
    {
      title: "Safety Guidelines",
      desc: "Crime prevention tips & legal awareness for men and women.",
      action: () => setActiveTab("safety"),
      color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
    },
    {
      title: "Anonymous Tip",
      desc: "Report suspicious activity anonymously. No personal details required.",
      action: () => setActiveTab("anonymous-tip"),
      color: "bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400",
    },
    {
      title: "Community Alerts",
      desc: "Stay informed about crimes, safety warnings, and emergencies in your area.",
      action: () => setActiveTab("community-alerts"),
      color: "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400",
    },
    {
      title: "Feedback & Grievance",
      desc: "Submit feedback or complaints about police services and track resolution.",
      action: () => setActiveTab("feedback"),
      color: "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400",
    },
    {
      title: "Women Emergency SOS",
      desc: "Send instant SOS alert to police & emergency contacts with live location.",
      action: () => setActiveTab("women-sos"),
      color: "bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400",
    },
    {
      title: "Safe Route Finder",
      desc: "AI-suggested safer travel routes based on crime data and hotspot analysis.",
      action: () => setActiveTab("safe-route"),
      color: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400",
    },
    {
      title: "Self-Defense Resources",
      desc: "Guides, tips & legal rights on self-defense, emergency actions, and safety.",
      action: () => setActiveTab("self-defense"),
      color: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
    },
    {
      title: "Report Harassment",
      desc: "File complaints for harassment, stalking, domestic violence, or workplace abuse.",
      action: () => setActiveTab("report-harassment"),
      color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
    },
    {
      title: "Cyber Help Center",
      desc: "One place to report digital safety issues with instant guidance and legal information.",
      action: () => setActiveTab("cyber-help"),
      color: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400",
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
              className={`w-12 h-12 rounded-full flex items-center justify-center mb-4 ${service.color}`}
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
    if (e.target.value) {
      e.target.blur(); // Automatically close native time picker only when complete
    }
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
                    ? "bg-yellow-100 text-yellow-800"
                    : fir.status === "accepted"
                      ? "bg-blue-100 text-blue-800"
                      : fir.status === "resolved"
                        ? "bg-green-100 text-green-800"
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

interface LostFoundReport {
  id: string;
  type: "lost_item" | "missing_person";
  title: string;
  description: string;
  date: string;
  time: string;
  location: string;
  status: "submitted" | "under_review" | "found" | "closed";
  submitted_at: string;
}

const LostFoundTab = () => {
  const [reports, setReports] = useState<LostFoundReport[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    type: "lost_item" as "lost_item" | "missing_person",
    title: "",
    description: "",
    date: "",
    time: "",
    location: "",
  });
  const [msg, setMsg] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newReport: LostFoundReport = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      ...formData,
      status: "submitted",
      submitted_at: new Date().toISOString(),
    };
    setReports([newReport, ...reports]);
    setMsg("Report submitted successfully! You can track its status below.");
    setFormData({
      type: "lost_item",
      title: "",
      description: "",
      date: "",
      time: "",
      location: "",
    });
    setTimeout(() => {
      setShowForm(false);
      setMsg("");
    }, 2000);
  };

  const statusConfig: Record<string, { bg: string; text: string; label: string }> = {
    submitted: { bg: "bg-yellow-100", text: "text-yellow-800", label: "Submitted" },
    under_review: { bg: "bg-blue-100", text: "text-blue-800", label: "Under Review" },
    found: { bg: "bg-green-100", text: "text-green-800", label: "Found" },
    closed: { bg: "bg-gray-100", text: "text-gray-800", label: "Closed" },
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-amber-100 rounded-xl">
            <PackageSearch className="w-6 h-6 text-amber-700" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Lost & Found</h2>
            <p className="text-sm text-muted-foreground">
              Report lost items or missing persons and track status
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className={`px-5 py-2.5 font-bold rounded-lg transition-all flex items-center gap-2 text-sm shadow-sm ${showForm
            ? "bg-gray-200 text-gray-700 hover:bg-gray-300"
            : "bg-primary text-white hover:bg-primary/90"
            }`}
        >
          {showForm ? (
            <>
              <X className="w-4 h-4" /> Cancel
            </>
          ) : (
            <>
              <FileText className="w-4 h-4" /> New Report
            </>
          )}
        </button>
      </div>

      {/* Report Form */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="bg-card p-6 rounded-xl border border-border shadow-sm official-card">
              <h3 className="text-lg font-bold mb-5 text-gray-900 flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                File a Lost & Found Report
              </h3>

              {msg && (
                <div className="p-3 rounded-lg mb-4 bg-green-100 text-green-800 text-sm font-medium flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  {msg}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Type Selection */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Report Type <span className="text-red-500">*</span>
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() =>
                        setFormData({ ...formData, type: "lost_item" })
                      }
                      className={`p-4 rounded-xl border-2 text-left transition-all ${formData.type === "lost_item"
                        ? "border-primary bg-primary/5 shadow-sm"
                        : "border-gray-200 hover:border-gray-300"
                        }`}
                    >
                      <PackageSearch
                        className={`w-6 h-6 mb-2 ${formData.type === "lost_item"
                          ? "text-primary"
                          : "text-gray-400"
                          }`}
                      />
                      <p className="font-semibold text-sm">Lost Item</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Wallet, phone, documents, etc.
                      </p>
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setFormData({ ...formData, type: "missing_person" })
                      }
                      className={`p-4 rounded-xl border-2 text-left transition-all ${formData.type === "missing_person"
                        ? "border-primary bg-primary/5 shadow-sm"
                        : "border-gray-200 hover:border-gray-300"
                        }`}
                    >
                      <UserIcon
                        className={`w-6 h-6 mb-2 ${formData.type === "missing_person"
                          ? "text-primary"
                          : "text-gray-400"
                          }`}
                      />
                      <p className="font-semibold text-sm">Missing Person</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Report a missing person
                      </p>
                    </button>
                  </div>
                </div>

                {/* Title */}
                <div>
                  <label className="block text-sm font-medium mb-1">
                    {formData.type === "lost_item" ? "Item Name" : "Person's Name"}{" "}
                    <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    className="w-full p-2.5 rounded-lg border bg-input"
                    placeholder={
                      formData.type === "lost_item"
                        ? "e.g. Blue leather wallet"
                        : "e.g. Full name of the person"
                    }
                    required
                    value={formData.title}
                    onChange={(e) =>
                      setFormData({ ...formData, title: e.target.value })
                    }
                  />
                </div>

                {/* Date & Time */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1 flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                      Date Lost/Missing <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      className="w-full p-2.5 rounded-lg border bg-input"
                      required
                      value={formData.date}
                      onChange={(e) =>
                        setFormData({ ...formData, date: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                      Approximate Time
                    </label>
                    <input
                      type="time"
                      className="w-full p-2.5 rounded-lg border bg-input"
                      value={formData.time}
                      onChange={(e) =>
                        setFormData({ ...formData, time: e.target.value })
                      }
                    />
                  </div>
                </div>

                {/* Location */}
                <div>
                  <label className="block text-sm font-medium mb-1 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-muted-foreground" />
                    Last Known Location <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    className="w-full p-2.5 rounded-lg border bg-input"
                    placeholder="e.g. Central Market, Near Gate 3"
                    required
                    value={formData.location}
                    onChange={(e) =>
                      setFormData({ ...formData, location: e.target.value })
                    }
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Detailed Description <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    className="w-full h-28 p-3 rounded-lg border bg-input"
                    placeholder={
                      formData.type === "lost_item"
                        ? "Describe the item — color, brand, identifying marks, contents..."
                        : "Describe the person — age, height, clothing, last seen details..."
                    }
                    required
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-primary text-primary-foreground font-bold rounded-lg hover:bg-primary/90 transition-colors shadow-sm"
                >
                  Submit Report
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* My Reports */}
      <div>
        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
          <Eye className="w-5 h-5 text-muted-foreground" />
          My Reports
        </h3>

        {reports.length === 0 ? (
          <div className="text-center py-12 bg-muted/50 rounded-xl border border-dashed border-gray-300">
            <PackageSearch className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-muted-foreground font-medium">
              No reports filed yet
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Click "New Report" to file a lost item or missing person report
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {reports.map((report) => {
              const status = statusConfig[report.status];
              return (
                <div
                  key={report.id}
                  className="p-5 border rounded-xl bg-card shadow-sm official-card flex flex-col md:flex-row justify-between gap-4"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <span className="px-2 py-0.5 rounded text-xs font-semibold bg-gray-100 text-gray-600 uppercase">
                        {report.type === "lost_item" ? "Lost Item" : "Missing Person"}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        #{report.id}
                      </span>
                    </div>
                    <h4 className="font-bold text-lg text-gray-900">
                      {report.title}
                    </h4>
                    <p className="text-sm text-foreground/70 line-clamp-2 mt-1">
                      {report.description}
                    </p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {report.location}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {report.date}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2 min-w-[120px]">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${status.bg} ${status.text}`}
                    >
                      {status.label}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      Filed {new Date(report.submitted_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
