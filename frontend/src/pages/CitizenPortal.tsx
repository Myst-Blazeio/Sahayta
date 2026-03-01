import React, { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { generateFIRPDF } from "../utils/pdfGenerator";
import { motion, AnimatePresence } from "framer-motion";
import CommunityAlerts from "../components/CommunityAlerts";
import SafeRouteTab from "./SafeRouteTab";
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
import { firService } from "../api/firService";
import { authService } from "../api/authService";
import { Notification, Station, FIR, CommunityAlert } from "../types";

const CitizenPortal = () => {
  const [activeTab, setActiveTab] = useState("services");
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [alerts, setAlerts] = useState<CommunityAlert[]>([]);
  const [showNotifs, setShowNotifs] = useState(false);
  const { token, role, user } = useAuth();
  const searchParams = new URLSearchParams(window.location.search);
  const urlUsername = searchParams.get("username") || user?.username || "Citizen";

  useEffect(() => {
    if (token && role === "citizen") {
      fetchNotifications();
      fetchAlerts();
      const interval = setInterval(() => {
        fetchNotifications();
        fetchAlerts();
      }, 30000); // Poll every 30s
      return () => clearInterval(interval);
    }
  }, [token, role]);

  const fetchAlerts = async () => {
    try {
      const data = await firService.getCommunityAlerts();
      setAlerts(data);
    } catch (e) {
      console.error("Failed to fetch community alerts");
    }
  };

  const fetchNotifications = async () => {
    try {
      const data = await firService.getNotifications();
      setNotifications(data);
    } catch (e) {
      console.error("Failed to fetch notifications");
    }
  };

  const markRead = async (id: string) => {
    try {
      await firService.deleteNotification(id);
      // Remove permanently from local state — no longer shown
      setNotifications((prev) => prev.filter((n) => n._id !== id));
    } catch (e) {
      console.error("Failed to delete notification");
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
              Welcome, {urlUsername}
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

        {/* Custom Community Alerts header and list removed; now fully integrated into the ServicesTab/Tabs flow */}

        <div className="flex flex-wrap justify-center gap-2 bg-muted p-1 rounded-lg mb-8 w-full">
          {["services", "safe-route", "new-fir", "history", "community-alerts", "profile"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${activeTab === tab
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:bg-background/50"
                }`}
            >
              {tab === "services" && "Services"}
              {tab === "safe-route" && "Safe Route"}
              {tab === "new-fir" && "File FIR"}
              {tab === "history" && "My FIRs"}
              {tab === "community-alerts" && "Alerts"}
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
          {activeTab === "safe-route" && <SafeRouteTab />}
          {activeTab === "new-fir" && (
            <NewFIRTab onSuccess={() => setActiveTab("history")} />
          )}
          {activeTab === "history" && <HistoryTab />}

          {activeTab === "community-alerts" && <CommunityAlerts alerts={alerts} />}
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
      title: "Safe Route",
      desc: "Navigate safely by avoiding high-crime hotspots in your city.",
      action: () => setActiveTab("safe-route"),
    },
    {
      title: "Community Alerts",
      desc: "Stay informed about crimes, safety warnings, and emergencies in your area.",
      action: () => setActiveTab("community-alerts"),
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
    original_text: "",
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


  useEffect(() => {
    // Fetch stations on mount
    const fetchStations = async () => {
      try {
        const data = await authService.getStations();
        setStations(data);
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
      await firService.createFIR(formData);
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
            value={formData.original_text}
            onChange={(e) => setFormData({ ...formData, original_text: e.target.value })}
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

// ─── Status Progress Tracker ─────────────────────────────────────────────────


function getStatusIndex(status: string): number {
  switch (status) {
    case 'submitted': return 0;
    case 'pending': return 1;
    case 'in_progress': return 2;
    case 'resolved': return 3;
    case 'rejected': return 3;
    default: return 0;
  }
}

interface ProgressTrackerProps { status: string; }

const ProgressTracker: React.FC<ProgressTrackerProps> = ({ status }) => {
  const isRejected = status === 'rejected';
  const currentIdx = getStatusIndex(status);

  const nodes = [
    { label: 'Submitted', sublabel: 'FIR received', idx: 0 },
    { label: 'Pending', sublabel: 'Awaiting review', idx: 1 },
    { label: 'In Progress', sublabel: 'Under investigation', idx: 2 },
    {
      label: isRejected ? 'Rejected' : 'Resolved',
      sublabel: isRejected ? 'Case closed' : 'Case resolved', idx: 3
    },
  ];

  const trackPct = currentIdx === 0 ? '0%' : `${(currentIdx / 3) * 100}%`;

  return (
    <div className="py-2">
      <div className="relative flex items-start justify-between px-2">
        {/* Track background */}
        <div className="absolute top-5 left-6 right-6 h-[3px] bg-gray-200 z-0" />
        {/* Active track */}
        <div
          className="absolute top-5 left-6 h-[3px] z-0 transition-all duration-700"
          style={{
            width: `calc(${trackPct} * (100% - 3rem) / 100)`,
            background: isRejected && currentIdx === 3
              ? 'linear-gradient(to right, #22c55e, #ef4444)'
              : '#22c55e',
          }}
        />

        {nodes.map((node) => {
          const reached = node.idx <= currentIdx;
          const isLast = node.idx === 3;
          const isCurrent = node.idx === currentIdx;

          let ringClass = 'border-2 border-gray-300 bg-white text-gray-400';
          if (reached) {
            if (isLast && isRejected)
              ringClass = 'border-2 border-red-500 bg-red-500 text-white shadow-lg shadow-red-200';
            else
              ringClass = 'border-2 border-green-500 bg-green-500 text-white shadow-lg shadow-green-200';
          } else if (isCurrent) {
            ringClass = 'border-2 border-blue-400 bg-white text-blue-500';
          }

          return (
            <div key={node.idx} className="relative z-10 flex flex-col items-center gap-1.5 w-[25%]">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300 ${ringClass}`}>
                {reached
                  ? isLast && isRejected ? '✕' : '✓'
                  : <span className="text-xs font-semibold">{node.idx + 1}</span>
                }
              </div>
              <div className="text-center">
                <p className={`text-[11px] font-bold leading-tight ${reached
                  ? isLast && isRejected ? 'text-red-600' : 'text-green-700'
                  : 'text-gray-400'
                  }`}>{node.label}</p>
                <p className="text-[10px] text-gray-400 leading-tight mt-0.5">{node.sublabel}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ─── FIR Detail Card ─────────────────────────────────────────────────────────

interface FIRDetailCardProps {
  fir: FIR;
  stationName: string;
}

const FIRDetailCard: React.FC<FIRDetailCardProps> = ({ fir, stationName }) => {
  const [expanded, setExpanded] = useState(false);

  const statusConfig: Record<string, { label: string; badge: string; accent: string }> = {
    pending: { label: 'Pending', badge: 'bg-amber-100 text-amber-800 ring-1 ring-amber-300', accent: 'border-amber-400' },
    in_progress: { label: 'In Progress', badge: 'bg-blue-100 text-blue-800 ring-1 ring-blue-300', accent: 'border-blue-500' },
    resolved: { label: 'Resolved', badge: 'bg-emerald-100 text-emerald-800 ring-1 ring-emerald-300', accent: 'border-emerald-500' },
    rejected: { label: 'Rejected', badge: 'bg-red-100 text-red-800 ring-1 ring-red-300', accent: 'border-red-500' },
    submitted: { label: 'Submitted', badge: 'bg-gray-100 text-gray-700 ring-1 ring-gray-300', accent: 'border-gray-400' },
    accepted: { label: 'Accepted', badge: 'bg-blue-100 text-blue-800 ring-1 ring-blue-300', accent: 'border-blue-500' },
  };
  const cfg = statusConfig[fir.status] ?? statusConfig.submitted;

  return (
    <div className={`rounded-xl bg-white border border-gray-200 shadow-sm overflow-hidden border-l-4 ${cfg.accent} hover:shadow-md transition-shadow`}>

      {/* ── Card Header ────────────────────────────────── */}
      <div className="px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex-1 min-w-0">
          {/* Title row */}
          <div className="flex items-center gap-2.5 flex-wrap">
            <div className="flex items-center gap-1.5">
              <FileText size={14} className="text-gray-400 shrink-0" />
              <span className="font-bold text-gray-900 text-sm tracking-tight">
                FIR #{fir._id.slice(0, 8).toUpperCase()}
              </span>
            </div>
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold uppercase tracking-wide ${cfg.badge}`}>
              {cfg.label}
            </span>
            <span className="text-xs text-gray-400">
              {new Date(fir.submission_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
            </span>
          </div>

          {/* Complaint preview */}
          <p className="text-sm text-gray-500 mt-1.5 line-clamp-1 leading-relaxed">
            {fir.original_text}
          </p>

          {/* Meta row */}
          <div className="flex items-center gap-3 mt-1.5 flex-wrap">
            <span className="flex items-center gap-1 text-xs text-gray-400">
              <span>📍</span> {fir.location || 'N/A'}
            </span>
            <span className="text-gray-200">|</span>
            <span className="flex items-center gap-1 text-xs text-gray-400">
              <span>🏛</span> {stationName}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex sm:flex-col items-center sm:items-end gap-2 shrink-0">
          <button
            onClick={() => setExpanded(!expanded)}
            className={`inline-flex items-center gap-1.5 text-xs px-4 py-2 rounded-lg font-semibold transition-all ${expanded
              ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              : 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm'
              }`}
          >
            {expanded ? 'Close ▲' : 'View Details ▼'}
          </button>
          <button
            onClick={() => generateFIRPDF(fir)}
            className="inline-flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition-all font-medium"
          >
            <Download size={12} /> Report
          </button>
        </div>
      </div>

      {/* ── Expandable Panel ───────────────────────────── */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.28, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="border-t border-gray-100">

              {/* Progress Tracker section */}
              <div className="px-6 pt-5 pb-2">
                <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-3">Case Timeline</p>
                <ProgressTracker status={fir.status} />
              </div>

              <div className="border-t border-gray-100 mx-6" />

              {/* Info grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-0 divide-y sm:divide-y-0 sm:divide-x divide-gray-100">

                {/* Incident Details */}
                <div className="px-6 py-5">
                  <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-3">Incident Details</p>
                  <dl className="space-y-2.5">
                    {[
                      { label: 'Date', value: fir.incident_date || 'N/A' },
                      { label: 'Time', value: fir.incident_time || 'N/A' },
                      { label: 'Location', value: fir.location || 'N/A' },
                      { label: 'Filed On', value: new Date(fir.submission_date).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) },
                    ].map(({ label, value }) => (
                      <div key={label} className="flex justify-between items-start gap-4">
                        <dt className="text-xs text-gray-400 shrink-0">{label}</dt>
                        <dd className="text-xs font-semibold text-gray-800 text-right">{value}</dd>
                      </div>
                    ))}
                  </dl>
                </div>

                {/* Station Details */}
                <div className="px-6 py-5">
                  <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-3">Assigned Station</p>
                  <dl className="space-y-2.5">
                    {[
                      { label: 'Station', value: stationName },
                      { label: 'Station ID', value: fir.station_id },
                    ].map(({ label, value }) => (
                      <div key={label} className="flex justify-between items-start gap-4">
                        <dt className="text-xs text-gray-400 shrink-0">{label}</dt>
                        <dd className="text-xs font-semibold text-gray-800 text-right">{value}</dd>
                      </div>
                    ))}
                  </dl>
                  {fir.police_notes && (
                    <div className="mt-4 rounded-lg bg-amber-50 border border-amber-200 p-3">
                      <p className="text-[11px] font-bold uppercase tracking-wider text-amber-700 mb-1.5">Officer Notes</p>
                      <p className="text-xs text-amber-900 leading-relaxed">{fir.police_notes}</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="border-t border-gray-100 mx-6" />

              {/* Complaint Description */}
              <div className="px-6 py-5">
                <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-3">Complaint</p>
                <div className="border-l-2 border-blue-200 pl-4">
                  <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                    {fir.translated_text || fir.original_text}
                  </p>
                </div>
              </div>

            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ─── History Tab ──────────────────────────────────────────────────────────────

const HistoryTab = () => {
  const [firs, setFirs] = useState<FIR[]>([]);
  const [loading, setLoading] = useState(true);
  const [stations, setStations] = useState<Station[]>([]);
  const { token } = useAuth();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [firData, stationData] = await Promise.all([
          firService.getUserFIRs(),
          authService.getStations(),
        ]);
        setFirs(firData);
        setStations(stationData);
      } catch (error) {
        console.error("Error fetching history:", error);
      } finally {
        setLoading(false);
      }
    };
    if (token) {
      fetchData();
      const interval = setInterval(fetchData, 30000);
      return () => clearInterval(interval);
    }
  }, [token]);

  if (loading)
    return <div className="text-center py-8">Loading records...</div>;

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold mb-4">My FIR Status</h2>
      {firs.length === 0 ? (
        <div className="text-center p-8 bg-muted rounded">No records found.</div>
      ) : (
        firs.map((fir) => {
          const stationName =
            stations.find((s) => s.station_id === fir.station_id)?.station_name ||
            fir.station_id;
          return (
            <FIRDetailCard key={fir._id} fir={fir} stationName={stationName} />
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


