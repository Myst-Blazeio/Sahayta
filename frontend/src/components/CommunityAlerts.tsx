import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Megaphone,
    AlertTriangle,
    Shield,
    Siren,
    Info,
    MapPin,
    Clock,
    ChevronRight,
    Bell,
    BellRing,
    X,
    Filter,
} from "lucide-react";

type AlertType = "crime" | "safety" | "emergency" | "advisory" | "update";
type AlertSeverity = "critical" | "high" | "medium" | "low";

interface CommunityAlert {
    id: string;
    type: AlertType;
    severity: AlertSeverity;
    title: string;
    summary: string;
    details: string;
    location: string;
    issued_at: string;
    expires_at: string | null;
    is_active: boolean;
}

const alertTypeConfig: Record<
    AlertType,
    { label: string; icon: React.ReactNode; color: string; badgeBg: string }
> = {
    crime: {
        label: "Crime Alert",
        icon: <Siren className="w-4 h-4" />,
        color: "text-primary",
        badgeBg: "bg-primary/10 text-primary border-primary/20",
    },
    safety: {
        label: "Safety Warning",
        icon: <Shield className="w-4 h-4" />,
        color: "text-primary",
        badgeBg: "bg-primary/10 text-primary border-primary/20",
    },
    emergency: {
        label: "Emergency",
        icon: <AlertTriangle className="w-4 h-4" />,
        color: "text-destructive",
        badgeBg: "bg-red-50 text-destructive border-red-200",
    },
    advisory: {
        label: "Advisory",
        icon: <Info className="w-4 h-4" />,
        color: "text-primary",
        badgeBg: "bg-primary/10 text-primary border-primary/20",
    },
    update: {
        label: "Update",
        icon: <Bell className="w-4 h-4" />,
        color: "text-primary",
        badgeBg: "bg-primary/10 text-primary border-primary/20",
    },
};

const severityConfig: Record<
    AlertSeverity,
    { label: string; dot: string; border: string }
> = {
    critical: {
        label: "Critical",
        dot: "bg-red-500 animate-pulse",
        border: "border-l-red-500",
    },
    high: {
        label: "High",
        dot: "bg-orange-500",
        border: "border-l-orange-500",
    },
    medium: {
        label: "Medium",
        dot: "bg-yellow-500",
        border: "border-l-yellow-400",
    },
    low: {
        label: "Low",
        dot: "bg-green-500",
        border: "border-l-green-400",
    },
};

// Mock community alerts data
const mockAlerts: CommunityAlert[] = [
    {
        id: "ALT-001",
        type: "emergency",
        severity: "critical",
        title: "Flash Flood Warning — Low-lying Areas",
        summary: "Heavy rainfall expected in the next 6 hours. Residents in low-lying areas should move to higher ground immediately.",
        details: "The Meteorological Department has issued a red alert for the district. Water levels in the Hooghly and Damodar rivers are rising. All residents in Ward 5, 7, and 12 are advised to evacuate to the nearest relief shelters. Emergency helpline: 1070.",
        location: "Ward 5, 7, 12 — Riverside Areas",
        issued_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        expires_at: new Date(Date.now() + 10 * 60 * 60 * 1000).toISOString(),
        is_active: true,
    },
    {
        id: "ALT-002",
        type: "crime",
        severity: "high",
        title: "Chain Snatching Incidents — Market Area",
        summary: "Multiple chain snatching incidents reported near the central market between 6 PM and 9 PM.",
        details: "Police have received 4 complaints of chain snatching in the Central Market and adjoining lanes over the past 3 days. Suspects are operating on two-wheelers. Citizens are advised to avoid wearing visible jewellery in the area and report any suspicious activity immediately. Extra patrolling has been deployed.",
        location: "Central Market, Sector 4-6",
        issued_at: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
        expires_at: null,
        is_active: true,
    },
    {
        id: "ALT-003",
        type: "safety",
        severity: "medium",
        title: "Cyber Fraud Alert — Fake UPI Requests",
        summary: "Beware of fake UPI payment requests from unknown numbers claiming to be from banks or police.",
        details: "Several citizens have reported receiving phishing calls and fraudulent UPI requests. The scammers pose as bank officials or police officers and ask for OTPs. Remember: No bank or police officer will ever ask for your OTP, PIN, or password over the phone. If you receive such a call, disconnect and report to Cyber Crime helpline 1930.",
        location: "City-wide",
        issued_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        expires_at: null,
        is_active: true,
    },
    {
        id: "ALT-004",
        type: "advisory",
        severity: "low",
        title: "Road Closure — Republic Day Parade Route",
        summary: "Major roads will be closed on 26th January from 6 AM to 2 PM for the Republic Day parade.",
        details: "The following roads will be closed for vehicular traffic: MG Road, Station Road, and Parade Ground approach lanes. Citizens are requested to use alternate routes via Ring Road and NH-16. Public transport will be diverted. Plan your travel accordingly.",
        location: "MG Road, Station Road, Parade Ground",
        issued_at: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
        expires_at: new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString(),
        is_active: true,
    },
    {
        id: "ALT-005",
        type: "update",
        severity: "low",
        title: "New Women's Safety Helpline Launched",
        summary: "Dial 181 for the Women's Safety Helpline — 24x7 support for women in distress.",
        details: "The district administration has launched a dedicated Women's Safety Helpline number 181. The helpline provides immediate assistance, counselling, and connects callers with the nearest police station. This service is available 24x7 in Hindi, English, and Bengali.",
        location: "All Areas",
        issued_at: new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString(),
        expires_at: null,
        is_active: true,
    },
    {
        id: "ALT-006",
        type: "crime",
        severity: "medium",
        title: "Vehicle Theft Warning — Parking Lots",
        summary: "Increase in two-wheeler thefts reported from unguarded parking lots in the commercial district.",
        details: "Police have noted a 30% increase in two-wheeler thefts from open/unguarded parking areas near the commercial district. Citizens are advised to use only authorized parking lots, activate steering locks, and avoid leaving helmets on vehicles. CCTV footage is being analyzed and additional patrols have been assigned.",
        location: "Commercial District, Zone B",
        issued_at: new Date(Date.now() - 36 * 60 * 60 * 1000).toISOString(),
        expires_at: null,
        is_active: true,
    },
];

const CommunityAlerts: React.FC = () => {
    const [selectedAlert, setSelectedAlert] = useState<CommunityAlert | null>(null);
    const [filterType, setFilterType] = useState<AlertType | "all">("all");
    const [showFilters, setShowFilters] = useState(false);

    const filteredAlerts =
        filterType === "all"
            ? mockAlerts
            : mockAlerts.filter((a) => a.type === filterType);

    const criticalCount = mockAlerts.filter((a) => a.severity === "critical").length;

    const timeAgo = (dateStr: string) => {
        const diff = Date.now() - new Date(dateStr).getTime();
        const mins = Math.floor(diff / 60000);
        if (mins < 60) return `${mins}m ago`;
        const hrs = Math.floor(mins / 60);
        if (hrs < 24) return `${hrs}h ago`;
        const days = Math.floor(hrs / 24);
        return `${days}d ago`;
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-primary/10 rounded-xl">
                        <Megaphone className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900">
                            Community Alerts
                        </h2>
                        <p className="text-sm text-muted-foreground">
                            Stay informed about crime, safety, and emergencies in your area
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {criticalCount > 0 && (
                        <span className="px-3 py-1.5 bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 rounded-full text-xs font-bold flex items-center gap-1.5 animate-pulse">
                            <BellRing className="w-3.5 h-3.5" />
                            {criticalCount} Critical
                        </span>
                    )}
                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-all border ${showFilters
                            ? "bg-gray-200 text-gray-700 border-gray-300"
                            : "bg-card text-foreground border-border hover:bg-accent"
                            }`}
                    >
                        <Filter className="w-4 h-4" />
                        Filter
                    </button>
                </div>
            </div>

            {/* Filter Bar */}
            <AnimatePresence>
                {showFilters && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                    >
                        <div className="flex flex-wrap gap-2 p-4 bg-muted/50 rounded-xl border border-border">
                            <button
                                onClick={() => setFilterType("all")}
                                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all border ${filterType === "all"
                                    ? "bg-foreground text-background border-foreground"
                                    : "bg-card text-foreground border-border hover:bg-accent"
                                    }`}
                            >
                                All ({mockAlerts.length})
                            </button>
                            {(Object.keys(alertTypeConfig) as AlertType[]).map((type) => {
                                const config = alertTypeConfig[type];
                                const count = mockAlerts.filter((a) => a.type === type).length;
                                return (
                                    <button
                                        key={type}
                                        onClick={() => setFilterType(type)}
                                        className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all border flex items-center gap-1.5 ${filterType === type
                                            ? config.badgeBg
                                            : "bg-card text-muted-foreground border-border hover:bg-accent"
                                            }`}
                                    >
                                        {config.icon}
                                        {config.label} ({count})
                                    </button>
                                );
                            })}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Alerts List */}
            <div className="space-y-3">
                {filteredAlerts.length === 0 ? (
                    <div className="text-center py-12 bg-muted/50 rounded-xl border border-dashed border-gray-300 dark:border-gray-700">
                        <Bell className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                        <p className="text-muted-foreground font-medium">
                            No alerts in this category
                        </p>
                    </div>
                ) : (
                    filteredAlerts.map((alert) => {
                        const typeConf = alertTypeConfig[alert.type];
                        const sevConf = severityConfig[alert.severity];
                        return (
                            <motion.div
                                key={alert.id}
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                whileHover={{ x: 2 }}
                                onClick={() => setSelectedAlert(alert)}
                                className={`p-5 border-l-4 ${sevConf.border} border rounded-xl bg-card shadow-sm cursor-pointer hover:shadow-md transition-all official-card`}
                            >
                                <div className="flex flex-col md:flex-row justify-between gap-3">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                                            <span
                                                className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border flex items-center gap-1 ${typeConf.badgeBg}`}
                                            >
                                                {typeConf.icon}
                                                {typeConf.label}
                                            </span>
                                            <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                                <span className={`w-2 h-2 rounded-full inline-block ${sevConf.dot}`} />
                                                {sevConf.label}
                                            </span>
                                        </div>
                                        <h3 className="font-bold text-base text-gray-900 dark:text-foreground">
                                            {alert.title}
                                        </h3>
                                        <p className="text-sm text-foreground/70 mt-1 line-clamp-2">
                                            {alert.summary}
                                        </p>
                                        <div className="flex items-center gap-4 mt-2.5 text-xs text-muted-foreground">
                                            <span className="flex items-center gap-1">
                                                <MapPin className="w-3 h-3" />
                                                {alert.location}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <Clock className="w-3 h-3" />
                                                {timeAgo(alert.issued_at)}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex items-center self-end md:self-center">
                                        <ChevronRight className="w-5 h-5 text-muted-foreground" />
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })
                )}
            </div>

            {/* Alert Detail Modal */}
            <AnimatePresence>
                {selectedAlert && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
                        onClick={() => setSelectedAlert(null)}
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-card rounded-2xl shadow-2xl max-w-lg w-full max-h-[80vh] overflow-y-auto"
                        >
                            {(() => {
                                const typeConf = alertTypeConfig[selectedAlert.type];
                                const sevConf = severityConfig[selectedAlert.severity];
                                return (
                                    <>
                                        {/* Modal Header */}
                                        <div className={`p-5 border-b border-border border-l-4 ${sevConf.border} rounded-t-2xl`}>
                                            <div className="flex justify-between items-start">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <span
                                                        className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border flex items-center gap-1 ${typeConf.badgeBg}`}
                                                    >
                                                        {typeConf.icon}
                                                        {typeConf.label}
                                                    </span>
                                                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                                        <span className={`w-2 h-2 rounded-full inline-block ${sevConf.dot}`} />
                                                        {sevConf.label} Priority
                                                    </span>
                                                </div>
                                                <button
                                                    onClick={() => setSelectedAlert(null)}
                                                    className="p-1.5 rounded-lg hover:bg-accent transition"
                                                >
                                                    <X className="w-5 h-5 text-muted-foreground" />
                                                </button>
                                            </div>
                                            <h3 className="text-xl font-bold mt-3 text-gray-900 dark:text-foreground">
                                                {selectedAlert.title}
                                            </h3>
                                        </div>

                                        {/* Modal Body */}
                                        <div className="p-5 space-y-4">
                                            <p className="text-sm text-foreground/80 leading-relaxed">
                                                {selectedAlert.details}
                                            </p>

                                            <div className="grid grid-cols-2 gap-3 pt-2">
                                                <div className="bg-muted/50 rounded-lg p-3">
                                                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                                                        Location
                                                    </p>
                                                    <p className="text-sm font-semibold mt-1 flex items-center gap-1">
                                                        <MapPin className="w-3.5 h-3.5 text-muted-foreground" />
                                                        {selectedAlert.location}
                                                    </p>
                                                </div>
                                                <div className="bg-muted/50 rounded-lg p-3">
                                                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                                                        Issued
                                                    </p>
                                                    <p className="text-sm font-semibold mt-1 flex items-center gap-1">
                                                        <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                                                        {new Date(selectedAlert.issued_at).toLocaleString()}
                                                    </p>
                                                </div>
                                            </div>

                                            {selectedAlert.expires_at && (
                                                <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3 text-sm">
                                                    <span className="font-semibold text-amber-800 dark:text-amber-400">
                                                        Expires:{" "}
                                                    </span>
                                                    <span className="text-amber-700 dark:text-amber-300">
                                                        {new Date(selectedAlert.expires_at).toLocaleString()}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </>
                                );
                            })()}
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default CommunityAlerts;
