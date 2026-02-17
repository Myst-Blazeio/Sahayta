import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    ShieldOff,
    MapPin,
    Calendar,
    Clock,
    Eye,
    EyeOff,
    X,
    Send,
    CheckCircle2,
    Lock,
} from "lucide-react";

type TipCategory =
    | "suspicious_activity"
    | "drug_related"
    | "theft_robbery"
    | "cybercrime"
    | "corruption"
    | "other";

interface AnonymousTipReport {
    id: string;
    category: TipCategory;
    description: string;
    location: string;
    date: string;
    time: string;
    status: "submitted" | "under_review" | "acknowledged" | "action_taken";
    submitted_at: string;
}

const categoryConfig: Record<
    TipCategory,
    { label: string; icon: string; color: string }
> = {
    suspicious_activity: {
        label: "Suspicious Activity",
        icon: "👁️",
        color: "bg-primary/5 text-primary border-primary/10 hover:bg-primary/10",
    },
    drug_related: {
        label: "Drug-Related",
        icon: "🚫",
        color: "bg-primary/5 text-primary border-primary/10 hover:bg-primary/10",
    },
    theft_robbery: {
        label: "Theft / Robbery",
        icon: "🔒",
        color: "bg-primary/5 text-primary border-primary/10 hover:bg-primary/10",
    },
    cybercrime: {
        label: "Cybercrime",
        icon: "💻",
        color: "bg-primary/5 text-primary border-primary/10 hover:bg-primary/10",
    },
    corruption: {
        label: "Corruption",
        icon: "⚖️",
        color: "bg-primary/5 text-primary border-primary/10 hover:bg-primary/10",
    },
    other: {
        label: "Other",
        icon: "📋",
        color: "bg-primary/5 text-primary border-primary/10 hover:bg-primary/10",
    },
};

const statusConfig: Record<
    string,
    { bg: string; text: string; label: string }
> = {
    submitted: {
        bg: "bg-yellow-100",
        text: "text-yellow-800",
        label: "Submitted",
    },
    under_review: {
        bg: "bg-blue-100",
        text: "text-blue-800",
        label: "Under Review",
    },
    acknowledged: {
        bg: "bg-indigo-100",
        text: "text-indigo-800",
        label: "Acknowledged",
    },
    action_taken: {
        bg: "bg-green-100",
        text: "text-green-800",
        label: "Action Taken",
    },
};

const AnonymousTip: React.FC = () => {
    const [tips, setTips] = useState<AnonymousTipReport[]>([]);
    const [showForm, setShowForm] = useState(false);
    const [selectedCategory, setSelectedCategory] =
        useState<TipCategory>("suspicious_activity");
    const [formData, setFormData] = useState({
        description: "",
        location: "",
        date: "",
        time: "",
    });
    const [msg, setMsg] = useState("");
    const [submitted, setSubmitted] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const newTip: AnonymousTipReport = {
            id: "TIP-" + Date.now().toString(36).toUpperCase() + Math.random().toString(36).slice(2, 5).toUpperCase(),
            category: selectedCategory,
            description: formData.description,
            location: formData.location,
            date: formData.date,
            time: formData.time,
            status: "submitted",
            submitted_at: new Date().toISOString(),
        };
        setTips([newTip, ...tips]);
        setSubmitted(true);
        setMsg("Tip submitted anonymously! Your identity is fully protected.");
        setFormData({ description: "", location: "", date: "", time: "" });
        setSelectedCategory("suspicious_activity");

        setTimeout(() => {
            setShowForm(false);
            setSubmitted(false);
            setMsg("");
        }, 3000);
    };

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-primary/10 rounded-xl">
                        <ShieldOff className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900">
                            Anonymous Tip Submission
                        </h2>
                        <p className="text-sm text-muted-foreground">
                            Report suspicious activity — no personal details required
                        </p>
                    </div>
                </div>
                <button
                    onClick={() => {
                        setShowForm(!showForm);
                        setSubmitted(false);
                        setMsg("");
                    }}
                    className={`px-5 py-2.5 font-bold rounded-lg transition-all flex items-center gap-2 text-sm shadow-sm ${showForm
                        ? "bg-gray-100 text-gray-700 hover:bg-gray-200"
                        : "bg-primary text-white hover:bg-primary/90"
                        }`}
                >
                    {showForm ? (
                        <>
                            <X className="w-4 h-4" /> Cancel
                        </>
                    ) : (
                        <>
                            <Send className="w-4 h-4" /> Submit a Tip
                        </>
                    )}
                </button>
            </div>

            {/* Privacy Banner */}
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-5">
                <div className="flex items-start gap-3">
                    <div className="p-2 bg-white border border-gray-200 rounded-lg mt-0.5">
                        <Lock className="w-5 h-5 text-gray-700" />
                    </div>
                    <div>
                        <h3 className="font-bold text-gray-900 text-sm uppercase tracking-wide">
                            Your Privacy is Guaranteed
                        </h3>
                        <p className="text-sm text-gray-600 mt-1 leading-relaxed">
                            This form does <strong>not</strong> collect your name, phone
                            number, email, IP address, or any identifying information. All
                            tips are processed anonymously. You are helping make your
                            community safer.
                        </p>
                    </div>
                </div>
            </div>

            {/* Tip Form */}
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
                            {submitted ? (
                                <motion.div
                                    initial={{ scale: 0.9, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    className="text-center py-10"
                                >
                                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <CheckCircle2 className="w-8 h-8 text-green-600" />
                                    </div>
                                    <h3 className="text-xl font-bold text-green-800 mb-2">
                                        Tip Submitted Successfully
                                    </h3>
                                    <p className="text-sm text-muted-foreground max-w-md mx-auto">
                                        {msg}
                                    </p>
                                </motion.div>
                            ) : (
                                <>
                                    <h3 className="text-lg font-bold mb-5 text-gray-900 dark:text-foreground flex items-center gap-2">
                                        <EyeOff className="w-5 h-5 text-teal-600" />
                                        Report Anonymously
                                    </h3>

                                    <form onSubmit={handleSubmit} className="space-y-5">
                                        {/* Category Selection */}
                                        <div>
                                            <label className="block text-sm font-medium mb-2">
                                                Tip Category{" "}
                                                <span className="text-red-500">*</span>
                                            </label>
                                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                                {(
                                                    Object.keys(categoryConfig) as TipCategory[]
                                                ).map((cat) => {
                                                    const config = categoryConfig[cat];
                                                    return (
                                                        <button
                                                            key={cat}
                                                            type="button"
                                                            onClick={() => setSelectedCategory(cat)}
                                                            className={`p-3 rounded-xl border-2 text-left transition-all ${selectedCategory === cat
                                                                ? "border-teal-500 bg-teal-50 dark:bg-teal-900/20 shadow-sm ring-1 ring-teal-200"
                                                                : "border-gray-200 dark:border-gray-700 hover:border-gray-300"
                                                                }`}
                                                        >
                                                            <span className="text-xl mb-1 block">
                                                                {config.icon}
                                                            </span>
                                                            <p className="font-semibold text-xs">
                                                                {config.label}
                                                            </p>
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>

                                        {/* Location */}
                                        <div>
                                            <label className="block text-sm font-medium mb-1 flex items-center gap-1.5">
                                                <MapPin className="w-3.5 h-3.5 text-muted-foreground" />
                                                Location / Area{" "}
                                                <span className="text-red-500">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                className="w-full p-2.5 rounded-lg border bg-input"
                                                placeholder="e.g. Near Central Park, Sector 12"
                                                required
                                                value={formData.location}
                                                onChange={(e) =>
                                                    setFormData({
                                                        ...formData,
                                                        location: e.target.value,
                                                    })
                                                }
                                            />
                                        </div>

                                        {/* Date & Time (Optional) */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium mb-1 flex items-center gap-1.5">
                                                    <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                                                    Date Observed{" "}
                                                    <span className="text-xs text-muted-foreground">
                                                        (optional)
                                                    </span>
                                                </label>
                                                <input
                                                    type="date"
                                                    className="w-full p-2.5 rounded-lg border bg-input"
                                                    value={formData.date}
                                                    onChange={(e) =>
                                                        setFormData({
                                                            ...formData,
                                                            date: e.target.value,
                                                        })
                                                    }
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium mb-1 flex items-center gap-1.5">
                                                    <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                                                    Approximate Time{" "}
                                                    <span className="text-xs text-muted-foreground">
                                                        (optional)
                                                    </span>
                                                </label>
                                                <input
                                                    type="time"
                                                    className="w-full p-2.5 rounded-lg border bg-input"
                                                    value={formData.time}
                                                    onChange={(e) =>
                                                        setFormData({
                                                            ...formData,
                                                            time: e.target.value,
                                                        })
                                                    }
                                                />
                                            </div>
                                        </div>

                                        {/* Description */}
                                        <div>
                                            <label className="block text-sm font-medium mb-1">
                                                What did you observe?{" "}
                                                <span className="text-red-500">*</span>
                                            </label>
                                            <textarea
                                                className="w-full h-32 p-3 rounded-lg border bg-input"
                                                placeholder="Describe the suspicious activity in as much detail as possible — what you saw, who was involved, vehicles, time of day, etc."
                                                required
                                                value={formData.description}
                                                onChange={(e) =>
                                                    setFormData({
                                                        ...formData,
                                                        description: e.target.value,
                                                    })
                                                }
                                            />
                                            <p className="text-xs text-muted-foreground mt-1.5 flex items-center gap-1">
                                                <EyeOff className="w-3 h-3" />
                                                Do not include your personal details in the
                                                description.
                                            </p>
                                        </div>

                                        {/* Submit */}
                                        <button
                                            type="submit"
                                            className="w-full py-3 bg-primary text-white font-bold rounded-lg hover:bg-primary/90 transition-colors shadow-sm flex items-center justify-center gap-2"
                                        >
                                            <Send className="w-4 h-4" />
                                            Submit Anonymous Tip
                                        </button>
                                    </form>
                                </>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* My Tips */}
            <div>
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                    <Eye className="w-5 h-5 text-muted-foreground" />
                    Submitted Tips
                </h3>

                {tips.length === 0 ? (
                    <div className="text-center py-12 bg-muted/50 rounded-xl border border-dashed border-gray-300 dark:border-gray-700">
                        <ShieldOff className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                        <p className="text-muted-foreground font-medium">
                            No tips submitted yet
                        </p>
                        <p className="text-sm text-muted-foreground mt-1">
                            Click "Submit a Tip" to anonymously report suspicious activity
                        </p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {tips.map((tip) => {
                            const status = statusConfig[tip.status];
                            const catConfig = categoryConfig[tip.category];
                            return (
                                <motion.div
                                    key={tip.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="p-5 border rounded-xl bg-card shadow-sm official-card flex flex-col md:flex-row justify-between gap-4"
                                >
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                                            <span
                                                className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${catConfig.color}`}
                                            >
                                                {catConfig.icon} {catConfig.label}
                                            </span>
                                            <span className="text-xs text-muted-foreground font-mono">
                                                #{tip.id}
                                            </span>
                                        </div>
                                        <p className="text-sm text-foreground/80 line-clamp-2 mt-1">
                                            {tip.description}
                                        </p>
                                        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                                            <span className="flex items-center gap-1">
                                                <MapPin className="w-3 h-3" />
                                                {tip.location}
                                            </span>
                                            {tip.date && (
                                                <span className="flex items-center gap-1">
                                                    <Calendar className="w-3 h-3" />
                                                    {tip.date}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-end gap-2 min-w-[120px]">
                                        <span
                                            className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${status.bg} ${status.text}`}
                                        >
                                            {status.label}
                                        </span>
                                        <span className="text-xs text-muted-foreground">
                                            {new Date(tip.submitted_at).toLocaleDateString()}
                                        </span>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

export default AnonymousTip;
