import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Route,
    MapPin,
    Clock,
    Shield,
    AlertTriangle,
    Navigation,
    Moon,
    Sun,
    Loader2,
    ChevronRight,
    CheckCircle2,
    Info,
    Lightbulb,
} from "lucide-react";

type SafetyLevel = "safe" | "moderate" | "caution" | "avoid";
type TimeOfDay = "morning" | "afternoon" | "evening" | "night";

interface RouteOption {
    id: string;
    name: string;
    distance: string;
    duration: string;
    safetyScore: number;
    safetyLevel: SafetyLevel;
    hotspots: number;
    litStreets: number;
    cctvCoverage: number;
    policeStations: number;
    landmarks: string[];
    tips: string[];
}

const safetyLevelConfig: Record<
    SafetyLevel,
    { label: string; color: string; bg: string; border: string }
> = {
    safe: {
        label: "Safe",
        color: "text-green-700 dark:text-green-400",
        bg: "bg-green-100 dark:bg-green-900/30",
        border: "border-green-400",
    },
    moderate: {
        label: "Moderate",
        color: "text-yellow-700 dark:text-yellow-400",
        bg: "bg-yellow-100 dark:bg-yellow-900/30",
        border: "border-yellow-400",
    },
    caution: {
        label: "Caution",
        color: "text-orange-700 dark:text-orange-400",
        bg: "bg-orange-100 dark:bg-orange-900/30",
        border: "border-orange-400",
    },
    avoid: {
        label: "Avoid",
        color: "text-red-700 dark:text-red-400",
        bg: "bg-red-100 dark:bg-red-900/30",
        border: "border-red-400",
    },
};

const SafeRouteFinder: React.FC = () => {
    const [origin, setOrigin] = useState("");
    const [destination, setDestination] = useState("");
    const [timeOfDay, setTimeOfDay] = useState<TimeOfDay>("evening");
    const [loading, setLoading] = useState(false);
    const [routes, setRoutes] = useState<RouteOption[]>([]);
    const [selectedRoute, setSelectedRoute] = useState<RouteOption | null>(null);
    const [searched, setSearched] = useState(false);

    const mockRoutes: RouteOption[] = [
        {
            id: "route-1",
            name: "Main Road via MG Road",
            distance: "4.2 km",
            duration: "18 min",
            safetyScore: 92,
            safetyLevel: "safe",
            hotspots: 0,
            litStreets: 95,
            cctvCoverage: 88,
            policeStations: 3,
            landmarks: ["City Mall", "Central Hospital", "Police HQ", "Metro Station"],
            tips: [
                "Well-lit main road with continuous CCTV coverage",
                "Active police patrol route — frequent patrols between 6 PM and 12 AM",
                "Multiple shops and establishments open till late",
            ],
        },
        {
            id: "route-2",
            name: "Ring Road via NH-16",
            distance: "5.8 km",
            duration: "22 min",
            safetyScore: 78,
            safetyLevel: "moderate",
            hotspots: 1,
            litStreets: 70,
            cctvCoverage: 55,
            policeStations: 2,
            landmarks: ["Petrol Pump", "Government School", "Ring Road Junction"],
            tips: [
                "Mostly residential area with moderate foot traffic",
                "One stretch near the railway crossing has limited lighting — stay alert",
                "Nearest police station is 800m away on Ring Road",
            ],
        },
        {
            id: "route-3",
            name: "Shortcut via Old Town Lane",
            distance: "3.1 km",
            duration: "14 min",
            safetyScore: 38,
            safetyLevel: "avoid",
            hotspots: 3,
            litStreets: 25,
            cctvCoverage: 10,
            policeStations: 0,
            landmarks: ["Old Market (closed by 7 PM)"],
            tips: [
                "⚠️ Multiple crime hotspots reported in the last 30 days",
                "⚠️ Very poor street lighting — almost no lights after the Old Market",
                "⚠️ No police station within 2 km — NOT recommended after dark",
            ],
        },
    ];

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (!origin || !destination) return;
        setLoading(true);
        setSearched(false);
        setSelectedRoute(null);

        // Simulate AI analysis
        setTimeout(() => {
            setRoutes(mockRoutes);
            setSearched(true);
            setLoading(false);
        }, 2000);
    };

    const getScoreColor = (score: number) => {
        if (score >= 80) return "text-green-600";
        if (score >= 60) return "text-yellow-600";
        if (score >= 40) return "text-orange-600";
        return "text-red-600";
    };

    const getScoreBarColor = (score: number) => {
        if (score >= 80) return "bg-green-500";
        if (score >= 60) return "bg-yellow-500";
        if (score >= 40) return "bg-orange-500";
        return "bg-red-500";
    };

    return (
        <div className="space-y-8">
            {/* Header */}
            {/* Header */}
            <div className="flex items-center gap-3">
                <div className="p-2.5 bg-primary/10 rounded-xl">
                    <Route className="w-6 h-6 text-primary" />
                </div>
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">
                        Safe Route Finder
                    </h2>
                    <p className="text-sm text-muted-foreground">
                        AI-suggested safer travel routes based on crime data & hotspot analysis
                    </p>
                </div>
            </div>

            {/* Info Banner */}
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-5">
                <div className="flex items-start gap-3">
                    <div className="p-2 bg-white border border-gray-200 rounded-lg mt-0.5">
                        <Shield className="w-5 h-5 text-gray-700" />
                    </div>
                    <div>
                        <h3 className="font-bold text-gray-900 text-sm uppercase tracking-wide">
                            AI-Powered Safety Analysis
                        </h3>
                        <p className="text-sm text-gray-600 mt-1 leading-relaxed">
                            Routes are analyzed using real-time crime data, CCTV coverage maps,
                            street lighting data, police patrol schedules, and historical crime
                            hotspot patterns to recommend the safest path.
                        </p>
                    </div>
                </div>
            </div>

            {/* Search Form */}
            <div className="bg-card p-6 rounded-xl border border-border shadow-sm official-card">
                <form onSubmit={handleSearch} className="space-y-5">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1 flex items-center gap-1.5">
                                <Navigation className="w-3.5 h-3.5 text-green-500" />
                                Starting Point <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                className="w-full p-2.5 rounded-lg border bg-input"
                                placeholder="e.g. Central Metro Station"
                                required
                                value={origin}
                                onChange={(e) => setOrigin(e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1 flex items-center gap-1.5">
                                <MapPin className="w-3.5 h-3.5 text-red-500" />
                                Destination <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                className="w-full p-2.5 rounded-lg border bg-input"
                                placeholder="e.g. Park Street Residence"
                                required
                                value={destination}
                                onChange={(e) => setDestination(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Time of Day */}
                    <div>
                        <label className="block text-sm font-medium mb-2">
                            Time of Travel
                        </label>
                        <div className="grid grid-cols-4 gap-2">
                            {([
                                { value: "morning", label: "Morning", icon: <Sun className="w-4 h-4" />, sub: "6 AM–12 PM" },
                                { value: "afternoon", label: "Afternoon", icon: <Sun className="w-4 h-4" />, sub: "12–4 PM" },
                                { value: "evening", label: "Evening", icon: <Moon className="w-4 h-4" />, sub: "4–8 PM" },
                                { value: "night", label: "Night", icon: <Moon className="w-4 h-4" />, sub: "8 PM–6 AM" },
                            ] as { value: TimeOfDay; label: string; icon: React.ReactNode; sub: string }[]).map((time) => (
                                <button
                                    key={time.value}
                                    type="button"
                                    onClick={() => setTimeOfDay(time.value)}
                                    className={`p-3 rounded-xl border-2 text-center transition-all ${timeOfDay === time.value
                                        ? "border-primary bg-primary/5 shadow-sm"
                                        : "border-gray-200 hover:border-gray-300"
                                        }`}
                                >
                                    <div className={`mx-auto mb-1 ${timeOfDay === time.value ? "text-primary" : "text-gray-400"}`}>
                                        {time.icon}
                                    </div>
                                    <p className="font-semibold text-xs">{time.label}</p>
                                    <p className="text-[10px] text-muted-foreground">{time.sub}</p>
                                </button>
                            ))}
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3 bg-primary text-white font-bold rounded-lg hover:bg-primary/90 transition-colors shadow-sm flex items-center justify-center gap-2 disabled:opacity-60"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Analyzing Routes...
                            </>
                        ) : (
                            <>
                                <Route className="w-4 h-4" />
                                Find Safe Routes
                            </>
                        )}
                    </button>
                </form>
            </div>

            {/* Results */}
            <AnimatePresence>
                {searched && (
                    <motion.div
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-6"
                    >
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-bold flex items-center gap-2">
                                <Route className="w-5 h-5 text-muted-foreground" />
                                {routes.length} Routes Found
                            </h3>
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                                <Info className="w-3.5 h-3.5" />
                                Sorted by safety score
                            </span>
                        </div>

                        {/* AI Recommendation */}
                        <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl flex items-start gap-3">
                            <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                            <div>
                                <p className="text-sm font-bold text-green-800 dark:text-green-300">
                                    AI Recommended: {routes[0]?.name}
                                </p>
                                <p className="text-xs text-green-700 dark:text-green-400 mt-0.5">
                                    Highest safety score ({routes[0]?.safetyScore}/100) with best CCTV coverage
                                    and police presence for {timeOfDay} travel.
                                </p>
                            </div>
                        </div>

                        {/* Route Cards */}
                        <div className="space-y-4">
                            {routes.map((route, idx) => {
                                const safety = safetyLevelConfig[route.safetyLevel];
                                const isSelected = selectedRoute?.id === route.id;
                                return (
                                    <motion.div
                                        key={route.id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: idx * 0.1 }}
                                        onClick={() => setSelectedRoute(isSelected ? null : route)}
                                        className={`border-l-4 ${safety.border} border rounded-xl bg-card shadow-sm cursor-pointer transition-all official-card overflow-hidden ${isSelected ? "ring-2 ring-primary/30 shadow-md" : "hover:shadow-md"
                                            }`}
                                    >
                                        {/* Route Header */}
                                        <div className="p-5">
                                            <div className="flex flex-col md:flex-row justify-between gap-3">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                                                        {idx === 0 && (
                                                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary/10 text-primary uppercase">
                                                                Recommended
                                                            </span>
                                                        )}
                                                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${safety.bg} ${safety.color}`}>
                                                            {safety.label}
                                                        </span>
                                                    </div>
                                                    <h4 className="font-bold text-base text-gray-900 dark:text-foreground">
                                                        {route.name}
                                                    </h4>
                                                    <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                                                        <span className="flex items-center gap-1">
                                                            <MapPin className="w-3 h-3" />
                                                            {route.distance}
                                                        </span>
                                                        <span className="flex items-center gap-1">
                                                            <Clock className="w-3 h-3" />
                                                            {route.duration}
                                                        </span>
                                                        {route.hotspots > 0 && (
                                                            <span className="flex items-center gap-1 text-red-600">
                                                                <AlertTriangle className="w-3 h-3" />
                                                                {route.hotspots} hotspot{route.hotspots > 1 ? "s" : ""}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3 self-end md:self-center">
                                                    <div className="text-center">
                                                        <p className={`text-2xl font-black ${getScoreColor(route.safetyScore)}`}>
                                                            {route.safetyScore}
                                                        </p>
                                                        <p className="text-[10px] text-muted-foreground uppercase font-semibold">Score</p>
                                                    </div>
                                                    <ChevronRight className={`w-5 h-5 text-muted-foreground transition-transform ${isSelected ? "rotate-90" : ""}`} />
                                                </div>
                                            </div>

                                            {/* Safety Score Bar */}
                                            <div className="mt-3 w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                                <div
                                                    className={`h-2 rounded-full transition-all duration-500 ${getScoreBarColor(route.safetyScore)}`}
                                                    style={{ width: `${route.safetyScore}%` }}
                                                />
                                            </div>
                                        </div>

                                        {/* Expanded Details */}
                                        <AnimatePresence>
                                            {isSelected && (
                                                <motion.div
                                                    initial={{ height: 0, opacity: 0 }}
                                                    animate={{ height: "auto", opacity: 1 }}
                                                    exit={{ height: 0, opacity: 0 }}
                                                    transition={{ duration: 0.2 }}
                                                    className="overflow-hidden"
                                                >
                                                    <div className="px-5 pb-5 pt-2 border-t border-border space-y-4">
                                                        {/* Stats Grid */}
                                                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                                            <div className="bg-muted/50 rounded-lg p-3 text-center">
                                                                <p className="text-lg font-black text-foreground">{route.litStreets}%</p>
                                                                <p className="text-[10px] text-muted-foreground uppercase font-semibold mt-0.5">Lit Streets</p>
                                                            </div>
                                                            <div className="bg-muted/50 rounded-lg p-3 text-center">
                                                                <p className="text-lg font-black text-foreground">{route.cctvCoverage}%</p>
                                                                <p className="text-[10px] text-muted-foreground uppercase font-semibold mt-0.5">CCTV Coverage</p>
                                                            </div>
                                                            <div className="bg-muted/50 rounded-lg p-3 text-center">
                                                                <p className="text-lg font-black text-foreground">{route.policeStations}</p>
                                                                <p className="text-[10px] text-muted-foreground uppercase font-semibold mt-0.5">Police Stations</p>
                                                            </div>
                                                            <div className="bg-muted/50 rounded-lg p-3 text-center">
                                                                <p className="text-lg font-black text-foreground">{route.hotspots}</p>
                                                                <p className="text-[10px] text-muted-foreground uppercase font-semibold mt-0.5">Crime Hotspots</p>
                                                            </div>
                                                        </div>

                                                        {/* Landmarks */}
                                                        <div>
                                                            <p className="text-xs font-semibold uppercase text-muted-foreground tracking-wider mb-2">
                                                                Key Landmarks
                                                            </p>
                                                            <div className="flex flex-wrap gap-2">
                                                                {route.landmarks.map((lm, i) => (
                                                                    <span
                                                                        key={i}
                                                                        className="px-2.5 py-1 bg-muted/70 rounded-full text-xs font-medium flex items-center gap-1"
                                                                    >
                                                                        <MapPin className="w-3 h-3 text-muted-foreground" />
                                                                        {lm}
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        </div>

                                                        {/* Safety Tips */}
                                                        <div>
                                                            <p className="text-xs font-semibold uppercase text-muted-foreground tracking-wider mb-2 flex items-center gap-1">
                                                                <Lightbulb className="w-3.5 h-3.5" />
                                                                Safety Tips for this Route
                                                            </p>
                                                            <div className="space-y-2">
                                                                {route.tips.map((tip, i) => (
                                                                    <div
                                                                        key={i}
                                                                        className={`text-sm p-3 rounded-lg ${tip.startsWith("⚠️")
                                                                            ? "bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800"
                                                                            : "bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800"
                                                                            }`}
                                                                    >
                                                                        {tip}
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </motion.div>
                                );
                            })}
                        </div>

                        {/* General Night Safety Tips */}
                        {(timeOfDay === "evening" || timeOfDay === "night") && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="p-5 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl"
                            >
                                <h4 className="font-bold text-amber-800 dark:text-amber-300 text-sm flex items-center gap-2 mb-3">
                                    <Moon className="w-4 h-4" />
                                    Night Travel Safety Tips
                                </h4>
                                <ul className="space-y-1.5 text-sm text-amber-700 dark:text-amber-400">
                                    <li className="flex items-start gap-2">
                                        <ChevronRight className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                                        Share your live location with a trusted contact before starting
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <ChevronRight className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                                        Stick to well-lit main roads — avoid shortcuts through alleys
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <ChevronRight className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                                        Keep emergency numbers (112, 181) on speed dial
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <ChevronRight className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                                        If using a cab, verify driver details and share trip info
                                    </li>
                                </ul>
                            </motion.div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default SafeRouteFinder;
