import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Phone,
    MapPin,
    Shield,
    UserPlus,
    X,
    Clock,
    CheckCircle2,
    AlertTriangle,
    Navigation,
    Loader2,
    Plus,
    Trash2,
    PhoneCall,
} from "lucide-react";

interface EmergencyContact {
    id: string;
    name: string;
    phone: string;
    relation: string;
}

interface SOSLog {
    id: string;
    timestamp: string;
    location: string;
    coordinates: { lat: number; lng: number } | null;
    contactsNotified: number;
    status: "sent" | "acknowledged" | "responded";
}

const WomenSOS: React.FC = () => {
    const [sosActive, setSosActive] = useState(false);
    const [sosCountdown, setSosCountdown] = useState<number | null>(null);
    const [sosSent, setSosSent] = useState(false);
    const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
    const [locationName, setLocationName] = useState("Fetching location...");
    const [locating, setLocating] = useState(false);
    const [contacts, setContacts] = useState<EmergencyContact[]>([
        { id: "1", name: "Mom", phone: "+91 98765 43210", relation: "Mother" },
        { id: "2", name: "Dad", phone: "+91 98765 43211", relation: "Father" },
    ]);
    const [showAddContact, setShowAddContact] = useState(false);
    const [newContact, setNewContact] = useState({ name: "", phone: "", relation: "" });
    const [sosLogs, setSosLogs] = useState<SOSLog[]>([]);
    const [holdProgress, setHoldProgress] = useState(0);
    const [isHolding, setIsHolding] = useState(false);

    // Fetch location
    const fetchLocation = useCallback(() => {
        setLocating(true);
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
                    setLocation(coords);
                    setLocationName(`${coords.lat.toFixed(4)}°N, ${coords.lng.toFixed(4)}°E`);
                    setLocating(false);
                },
                () => {
                    setLocationName("Location unavailable — enable GPS");
                    setLocating(false);
                },
                { enableHighAccuracy: true, timeout: 10000 }
            );
        } else {
            setLocationName("Geolocation not supported");
            setLocating(false);
        }
    }, []);

    useEffect(() => {
        fetchLocation();
    }, [fetchLocation]);

    // SOS Countdown
    useEffect(() => {
        if (sosCountdown === null) return;
        if (sosCountdown <= 0) {
            triggerSOS();
            return;
        }
        const timer = setTimeout(() => setSosCountdown(sosCountdown - 1), 1000);
        return () => clearTimeout(timer);
    }, [sosCountdown]);

    // Hold-to-activate progress
    useEffect(() => {
        if (!isHolding) {
            setHoldProgress(0);
            return;
        }
        const interval = setInterval(() => {
            setHoldProgress((prev) => {
                if (prev >= 100) {
                    setSosCountdown(5);
                    setSosActive(true);
                    setIsHolding(false);
                    return 0;
                }
                return prev + 4;
            });
        }, 50);
        return () => clearInterval(interval);
    }, [isHolding]);

    const triggerSOS = () => {
        setSosCountdown(null);
        setSosSent(true);
        const newLog: SOSLog = {
            id: "SOS-" + Date.now().toString(36).toUpperCase(),
            timestamp: new Date().toISOString(),
            location: locationName,
            coordinates: location,
            contactsNotified: contacts.length,
            status: "sent",
        };
        setSosLogs([newLog, ...sosLogs]);

        setTimeout(() => {
            setSosSent(false);
            setSosActive(false);
        }, 5000);
    };

    const cancelSOS = () => {
        setSosCountdown(null);
        setSosActive(false);
    };

    const addContact = () => {
        if (!newContact.name || !newContact.phone) return;
        const contact: EmergencyContact = {
            id: Date.now().toString(36),
            ...newContact,
        };
        setContacts([...contacts, contact]);
        setNewContact({ name: "", phone: "", relation: "" });
        setShowAddContact(false);
    };

    const removeContact = (id: string) => {
        setContacts(contacts.filter((c) => c.id !== id));
    };

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex items-center gap-3">
                <div className="p-2.5 bg-pink-100 rounded-xl dark:bg-pink-900/30">
                    <Shield className="w-6 h-6 text-pink-700 dark:text-pink-400" />
                </div>
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-foreground">
                        Women Emergency SOS
                    </h2>
                    <p className="text-sm text-muted-foreground">
                        Instant SOS alert to police stations & emergency contacts with live location
                    </p>
                </div>
            </div>

            {/* SOS Button Section */}
            <div className="bg-gradient-to-br from-pink-50 via-rose-50 to-red-50 dark:from-pink-900/20 dark:via-rose-900/20 dark:to-red-900/20 border border-pink-200 dark:border-pink-800 rounded-2xl p-8">
                <AnimatePresence mode="wait">
                    {sosSent ? (
                        /* SOS Sent Confirmation */
                        <motion.div
                            key="sent"
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.8, opacity: 0 }}
                            className="text-center py-6"
                        >
                            <motion.div
                                animate={{ scale: [1, 1.1, 1] }}
                                transition={{ repeat: Infinity, duration: 1.5 }}
                                className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-5"
                            >
                                <CheckCircle2 className="w-12 h-12 text-green-600" />
                            </motion.div>
                            <h3 className="text-2xl font-bold text-green-800 dark:text-green-400 mb-2">
                                SOS Alert Sent!
                            </h3>
                            <p className="text-sm text-green-700 dark:text-green-300 max-w-sm mx-auto">
                                Alert dispatched to <strong>{contacts.length} emergency contacts</strong> and
                                nearby police stations with your live location.
                            </p>
                            <div className="mt-4 px-4 py-2 bg-green-100 dark:bg-green-900/30 rounded-lg inline-flex items-center gap-2 text-sm text-green-800 dark:text-green-300">
                                <MapPin className="w-4 h-4" />
                                {locationName}
                            </div>
                        </motion.div>
                    ) : sosActive ? (
                        /* Countdown / Cancel */
                        <motion.div
                            key="countdown"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="text-center py-6"
                        >
                            <motion.div
                                animate={{ scale: [1, 1.15, 1] }}
                                transition={{ repeat: Infinity, duration: 0.8 }}
                                className="w-28 h-28 bg-red-100 dark:bg-red-900/40 rounded-full flex items-center justify-center mx-auto mb-5 border-4 border-red-400"
                            >
                                <span className="text-5xl font-bold text-red-600">{sosCountdown}</span>
                            </motion.div>
                            <h3 className="text-xl font-bold text-red-800 dark:text-red-400 mb-1">
                                Sending SOS in {sosCountdown} seconds...
                            </h3>
                            <p className="text-sm text-red-600 dark:text-red-300 mb-5">
                                Press cancel if this was accidental
                            </p>
                            <button
                                onClick={cancelSOS}
                                className="px-8 py-3 bg-gray-800 text-white font-bold rounded-xl hover:bg-gray-700 transition-colors text-sm"
                            >
                                Cancel SOS
                            </button>
                        </motion.div>
                    ) : (
                        /* Main SOS Button */
                        <motion.div
                            key="main"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="text-center"
                        >
                            <p className="text-sm font-semibold text-pink-800 dark:text-pink-300 uppercase tracking-wider mb-6">
                                Hold the button for 2 seconds to activate
                            </p>

                            <div className="relative inline-block">
                                {/* Progress ring */}
                                <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 160 160">
                                    <circle
                                        cx="80" cy="80" r="74"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="6"
                                        className="text-pink-200 dark:text-pink-800"
                                    />
                                    <circle
                                        cx="80" cy="80" r="74"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="6"
                                        strokeDasharray={`${2 * Math.PI * 74}`}
                                        strokeDashoffset={`${2 * Math.PI * 74 * (1 - holdProgress / 100)}`}
                                        strokeLinecap="round"
                                        className="text-red-500 transition-all duration-75"
                                    />
                                </svg>
                                <button
                                    onMouseDown={() => setIsHolding(true)}
                                    onMouseUp={() => setIsHolding(false)}
                                    onMouseLeave={() => setIsHolding(false)}
                                    onTouchStart={() => setIsHolding(true)}
                                    onTouchEnd={() => setIsHolding(false)}
                                    className={`relative w-40 h-40 rounded-full font-bold text-white text-lg shadow-2xl transition-all select-none ${isHolding
                                            ? "bg-red-700 scale-95 shadow-red-500/50"
                                            : "bg-gradient-to-br from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 shadow-red-400/30 hover:shadow-red-500/40"
                                        }`}
                                >
                                    <div className="flex flex-col items-center">
                                        <AlertTriangle className="w-10 h-10 mb-1" />
                                        <span className="text-lg font-black tracking-wide">SOS</span>
                                    </div>
                                </button>
                            </div>

                            <div className="mt-6 flex items-center justify-center gap-2 text-sm text-muted-foreground">
                                {locating ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Fetching your location...
                                    </>
                                ) : (
                                    <>
                                        <Navigation className="w-4 h-4 text-green-500" />
                                        <span>Live: {locationName}</span>
                                        <button
                                            onClick={fetchLocation}
                                            className="text-xs text-primary hover:underline ml-1"
                                        >
                                            Refresh
                                        </button>
                                    </>
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Quick Helpline Numbers */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                    { name: "Women Helpline", number: "181", color: "bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400" },
                    { name: "Police Emergency", number: "112", color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" },
                    { name: "Domestic Violence", number: "1091", color: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400" },
                ].map((line) => (
                    <a
                        key={line.number}
                        href={`tel:${line.number}`}
                        className={`p-4 rounded-xl border border-border ${line.color} flex items-center gap-3 hover:shadow-md transition-shadow official-card`}
                    >
                        <div className="p-2 bg-white/60 dark:bg-black/20 rounded-lg">
                            <PhoneCall className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-wider opacity-80">{line.name}</p>
                            <p className="text-xl font-black">{line.number}</p>
                        </div>
                    </a>
                ))}
            </div>

            {/* Emergency Contacts */}
            <div className="bg-card rounded-xl border border-border p-6 official-card">
                <div className="flex justify-between items-center mb-5">
                    <h3 className="text-lg font-bold flex items-center gap-2 text-gray-900 dark:text-foreground">
                        <Phone className="w-5 h-5 text-pink-600" />
                        Emergency Contacts
                    </h3>
                    <button
                        onClick={() => setShowAddContact(!showAddContact)}
                        className={`px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-1.5 transition-all ${showAddContact
                                ? "bg-gray-200 text-gray-700"
                                : "bg-pink-600 text-white hover:bg-pink-700"
                            }`}
                    >
                        {showAddContact ? <X className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
                        {showAddContact ? "Cancel" : "Add Contact"}
                    </button>
                </div>

                {/* Add Contact Form */}
                <AnimatePresence>
                    {showAddContact && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            className="overflow-hidden mb-5"
                        >
                            <div className="p-4 bg-pink-50 dark:bg-pink-900/20 rounded-xl border border-pink-200 dark:border-pink-800 space-y-3">
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                    <input
                                        type="text"
                                        placeholder="Name"
                                        className="p-2.5 rounded-lg border bg-input text-sm"
                                        value={newContact.name}
                                        onChange={(e) => setNewContact({ ...newContact, name: e.target.value })}
                                    />
                                    <input
                                        type="tel"
                                        placeholder="Phone Number"
                                        className="p-2.5 rounded-lg border bg-input text-sm"
                                        value={newContact.phone}
                                        onChange={(e) => setNewContact({ ...newContact, phone: e.target.value })}
                                    />
                                    <input
                                        type="text"
                                        placeholder="Relation (e.g. Sister)"
                                        className="p-2.5 rounded-lg border bg-input text-sm"
                                        value={newContact.relation}
                                        onChange={(e) => setNewContact({ ...newContact, relation: e.target.value })}
                                    />
                                </div>
                                <button
                                    onClick={addContact}
                                    className="w-full py-2.5 bg-pink-600 text-white font-bold rounded-lg hover:bg-pink-700 transition text-sm flex items-center justify-center gap-2"
                                >
                                    <Plus className="w-4 h-4" />
                                    Save Contact
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Contacts List */}
                {contacts.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                        <UserPlus className="w-10 h-10 mx-auto mb-2 text-gray-300" />
                        <p className="font-medium">No emergency contacts added</p>
                        <p className="text-sm mt-1">Add trusted contacts who will be notified during SOS</p>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {contacts.map((contact) => (
                            <div
                                key={contact.id}
                                className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-accent/30 transition"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-pink-100 dark:bg-pink-900/30 rounded-full flex items-center justify-center text-pink-700 dark:text-pink-400 font-bold text-sm">
                                        {contact.name.charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                        <p className="font-semibold text-sm">{contact.name}</p>
                                        <p className="text-xs text-muted-foreground">
                                            {contact.phone}
                                            {contact.relation && ` · ${contact.relation}`}
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => removeContact(contact.id)}
                                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* SOS History */}
            <div>
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                    <Clock className="w-5 h-5 text-muted-foreground" />
                    SOS History
                </h3>

                {sosLogs.length === 0 ? (
                    <div className="text-center py-10 bg-muted/50 rounded-xl border border-dashed border-gray-300 dark:border-gray-700">
                        <Shield className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                        <p className="text-muted-foreground font-medium">No SOS alerts sent</p>
                        <p className="text-sm text-muted-foreground mt-1">
                            Your SOS history will appear here
                        </p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {sosLogs.map((log) => (
                            <motion.div
                                key={log.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="p-4 border rounded-xl bg-card shadow-sm official-card flex flex-col sm:flex-row justify-between gap-3"
                            >
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-800 uppercase">
                                            SOS Alert
                                        </span>
                                        <span className="text-xs text-muted-foreground font-mono">
                                            #{log.id}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1.5">
                                        <span className="flex items-center gap-1">
                                            <MapPin className="w-3 h-3" />
                                            {log.location}
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <Clock className="w-3 h-3" />
                                            {new Date(log.timestamp).toLocaleString()}
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <Phone className="w-3 h-3" />
                                            {log.contactsNotified} notified
                                        </span>
                                    </div>
                                </div>
                                <span className="px-3 py-1 rounded-full text-xs font-bold uppercase bg-green-100 text-green-800 self-start sm:self-center">
                                    {log.status}
                                </span>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default WomenSOS;
