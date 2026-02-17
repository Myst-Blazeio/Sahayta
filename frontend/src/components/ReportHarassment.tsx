import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    ShieldAlert,
    MapPin,
    Clock,
    X,
    Send,
    CheckCircle2,
    Eye,
    ChevronDown,
    Upload,
    Calendar,
    User,
    FileText,
    AlertTriangle,
} from "lucide-react";

type AbuseType = "harassment" | "stalking" | "domestic_violence" | "workplace" | "cyber" | "other";

interface HarassmentReport {
    id: string;
    type: AbuseType;
    subject: string;
    description: string;
    location: string;
    incidentDate: string;
    accusedInfo: string;
    urgency: "immediate" | "urgent" | "standard";
    status: "filed" | "under_review" | "investigation" | "action_taken" | "closed";
    filed_at: string;
    hasEvidence: boolean;
}

const abuseTypeConfig: Record<
    AbuseType,
    { label: string; icon: string; color: string; desc: string }
> = {
    harassment: {
        label: "Harassment",
        icon: "🚫",
        color: "bg-red-100 text-red-700 border-red-300 dark:bg-red-900/30 dark:text-red-400",
        desc: "Eve-teasing, verbal abuse, unwanted advances",
    },
    stalking: {
        label: "Stalking",
        icon: "👁️",
        color: "bg-orange-100 text-orange-700 border-orange-300 dark:bg-orange-900/30 dark:text-orange-400",
        desc: "Being followed, monitored, or contacted repeatedly",
    },
    domestic_violence: {
        label: "Domestic Violence",
        icon: "🏠",
        color: "bg-purple-100 text-purple-700 border-purple-300 dark:bg-purple-900/30 dark:text-purple-400",
        desc: "Physical, emotional, or financial abuse at home",
    },
    workplace: {
        label: "Workplace Abuse",
        icon: "🏢",
        color: "bg-blue-100 text-blue-700 border-blue-300 dark:bg-blue-900/30 dark:text-blue-400",
        desc: "Sexual harassment, bullying, or discrimination at work",
    },
    cyber: {
        label: "Cyber Harassment",
        icon: "💻",
        color: "bg-indigo-100 text-indigo-700 border-indigo-300 dark:bg-indigo-900/30 dark:text-indigo-400",
        desc: "Online threats, morphing, revenge content, trolling",
    },
    other: {
        label: "Other",
        icon: "📋",
        color: "bg-gray-100 text-gray-700 border-gray-300 dark:bg-gray-800/30 dark:text-gray-400",
        desc: "Any other form of abuse not listed above",
    },
};

const urgencyConfig: Record<string, { label: string; color: string; desc: string }> = {
    immediate: {
        label: "Immediate Danger",
        color: "bg-red-600 text-white",
        desc: "Currently in danger — need immediate police response",
    },
    urgent: {
        label: "Urgent",
        color: "bg-orange-500 text-white",
        desc: "Recent incident — needs quick attention within 24 hours",
    },
    standard: {
        label: "Standard",
        color: "bg-blue-500 text-white",
        desc: "Past incident — file for record and investigation",
    },
};

const statusConfig: Record<string, { bg: string; text: string; label: string }> = {
    filed: { bg: "bg-yellow-100", text: "text-yellow-800", label: "Filed" },
    under_review: { bg: "bg-blue-100", text: "text-blue-800", label: "Under Review" },
    investigation: { bg: "bg-orange-100", text: "text-orange-800", label: "Investigation" },
    action_taken: { bg: "bg-green-100", text: "text-green-800", label: "Action Taken" },
    closed: { bg: "bg-gray-100", text: "text-gray-800", label: "Closed" },
};

const ReportHarassment: React.FC = () => {
    const [reports, setReports] = useState<HarassmentReport[]>([]);
    const [showForm, setShowForm] = useState(false);
    const [selectedType, setSelectedType] = useState<AbuseType>("harassment");
    const [urgency, setUrgency] = useState<"immediate" | "urgent" | "standard">("standard");
    const [formData, setFormData] = useState({
        subject: "",
        description: "",
        location: "",
        incidentDate: "",
        accusedInfo: "",
    });
    const [hasEvidence, setHasEvidence] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [expandedId, setExpandedId] = useState<string | null>(null);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const newReport: HarassmentReport = {
            id: "HAR-" + Date.now().toString(36).toUpperCase() + Math.random().toString(36).slice(2, 5).toUpperCase(),
            type: selectedType,
            subject: formData.subject,
            description: formData.description,
            location: formData.location,
            incidentDate: formData.incidentDate,
            accusedInfo: formData.accusedInfo,
            urgency,
            status: "filed",
            filed_at: new Date().toISOString(),
            hasEvidence,
        };
        setReports([newReport, ...reports]);
        setSubmitted(true);
        setFormData({ subject: "", description: "", location: "", incidentDate: "", accusedInfo: "" });
        setSelectedType("harassment");
        setUrgency("standard");
        setHasEvidence(false);

        setTimeout(() => {
            setShowForm(false);
            setSubmitted(false);
        }, 3500);
    };

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-red-100 rounded-xl dark:bg-red-900/30">
                        <ShieldAlert className="w-6 h-6 text-red-700 dark:text-red-400" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-foreground">
                            Report Harassment or Abuse
                        </h2>
                        <p className="text-sm text-muted-foreground">
                            File complaints for harassment, stalking, domestic violence, or workplace abuse
                        </p>
                    </div>
                </div>
                <button
                    onClick={() => {
                        setShowForm(!showForm);
                        setSubmitted(false);
                    }}
                    className={`px-5 py-2.5 font-bold rounded-lg transition-all flex items-center gap-2 text-sm shadow-sm ${showForm
                            ? "bg-gray-200 text-gray-700 hover:bg-gray-300"
                            : "bg-red-600 text-white hover:bg-red-700"
                        }`}
                >
                    {showForm ? (
                        <><X className="w-4 h-4" /> Cancel</>
                    ) : (
                        <><ShieldAlert className="w-4 h-4" /> File a Report</>
                    )}
                </button>
            </div>

            {/* Confidentiality Banner */}
            <div className="bg-gradient-to-r from-red-50 via-rose-50 to-pink-50 dark:from-red-900/20 dark:via-rose-900/20 dark:to-pink-900/20 border border-red-200 dark:border-red-800 rounded-xl p-5">
                <div className="flex items-start gap-3">
                    <div className="p-2 bg-red-100 dark:bg-red-900/40 rounded-lg mt-0.5">
                        <ShieldAlert className="w-5 h-5 text-red-700 dark:text-red-400" />
                    </div>
                    <div>
                        <h3 className="font-bold text-red-800 dark:text-red-300 text-sm uppercase tracking-wide">
                            Confidential & Secure
                        </h3>
                        <p className="text-sm text-red-700 dark:text-red-400 mt-1 leading-relaxed">
                            Your report is handled with strict confidentiality. All complaints are
                            assigned to a dedicated women's cell officer. You have the legal right
                            to file at <strong>any</strong> police station (Zero FIR). For immediate
                            danger, call <strong>112</strong> or <strong>181</strong>.
                        </p>
                    </div>
                </div>
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
                            {submitted ? (
                                <motion.div
                                    initial={{ scale: 0.9, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    className="text-center py-10"
                                >
                                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <CheckCircle2 className="w-8 h-8 text-green-600" />
                                    </div>
                                    <h3 className="text-xl font-bold text-green-800 dark:text-green-400 mb-2">
                                        Report Filed Successfully
                                    </h3>
                                    <p className="text-sm text-muted-foreground max-w-md mx-auto">
                                        Your complaint has been registered and assigned a case ID.
                                        A dedicated officer will review it within 24 hours. Stay safe.
                                    </p>
                                </motion.div>
                            ) : (
                                <>
                                    <h3 className="text-lg font-bold mb-5 text-gray-900 dark:text-foreground flex items-center gap-2">
                                        <FileText className="w-5 h-5 text-red-600" />
                                        New Complaint
                                    </h3>

                                    <form onSubmit={handleSubmit} className="space-y-5">
                                        {/* Abuse Type Selection */}
                                        <div>
                                            <label className="block text-sm font-medium mb-2">
                                                Type of Abuse <span className="text-red-500">*</span>
                                            </label>
                                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                                {(Object.keys(abuseTypeConfig) as AbuseType[]).map((type) => {
                                                    const config = abuseTypeConfig[type];
                                                    return (
                                                        <button
                                                            key={type}
                                                            type="button"
                                                            onClick={() => setSelectedType(type)}
                                                            className={`p-3 rounded-xl border-2 text-left transition-all ${selectedType === type
                                                                    ? "border-red-500 bg-red-50 dark:bg-red-900/20 shadow-sm ring-1 ring-red-200"
                                                                    : "border-gray-200 dark:border-gray-700 hover:border-gray-300"
                                                                }`}
                                                        >
                                                            <span className="text-xl">{config.icon}</span>
                                                            <p className="font-semibold text-xs mt-1">{config.label}</p>
                                                            <p className="text-[10px] text-muted-foreground leading-tight mt-0.5">{config.desc}</p>
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>

                                        {/* Urgency Level */}
                                        <div>
                                            <label className="block text-sm font-medium mb-2">
                                                Urgency Level <span className="text-red-500">*</span>
                                            </label>
                                            <div className="grid grid-cols-3 gap-3">
                                                {(Object.keys(urgencyConfig) as ("immediate" | "urgent" | "standard")[]).map((level) => {
                                                    const config = urgencyConfig[level];
                                                    return (
                                                        <button
                                                            key={level}
                                                            type="button"
                                                            onClick={() => setUrgency(level)}
                                                            className={`p-3 rounded-xl border-2 text-center transition-all ${urgency === level
                                                                    ? "border-red-500 shadow-sm"
                                                                    : "border-gray-200 dark:border-gray-700"
                                                                }`}
                                                        >
                                                            <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${config.color}`}>
                                                                {config.label}
                                                            </span>
                                                            <p className="text-[10px] text-muted-foreground mt-1.5 leading-tight">{config.desc}</p>
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>

                                        {/* Subject */}
                                        <div>
                                            <label className="block text-sm font-medium mb-1">
                                                Brief Subject <span className="text-red-500">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                className="w-full p-2.5 rounded-lg border bg-input"
                                                placeholder="e.g. Repeated stalking near college campus"
                                                required
                                                value={formData.subject}
                                                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                                            />
                                        </div>

                                        {/* Incident Details */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium mb-1 flex items-center gap-1.5">
                                                    <MapPin className="w-3.5 h-3.5 text-muted-foreground" />
                                                    Location of Incident <span className="text-red-500">*</span>
                                                </label>
                                                <input
                                                    type="text"
                                                    className="w-full p-2.5 rounded-lg border bg-input"
                                                    placeholder="e.g. Near Park Street, Kolkata"
                                                    required
                                                    value={formData.location}
                                                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium mb-1 flex items-center gap-1.5">
                                                    <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                                                    Date of Incident
                                                </label>
                                                <input
                                                    type="date"
                                                    className="w-full p-2.5 rounded-lg border bg-input"
                                                    value={formData.incidentDate}
                                                    onChange={(e) => setFormData({ ...formData, incidentDate: e.target.value })}
                                                />
                                            </div>
                                        </div>

                                        {/* Description */}
                                        <div>
                                            <label className="block text-sm font-medium mb-1">
                                                Detailed Description <span className="text-red-500">*</span>
                                            </label>
                                            <textarea
                                                className="w-full h-32 p-3 rounded-lg border bg-input"
                                                placeholder="Describe the incident in detail — what happened, when, how many times, any witnesses. The more detail, the better the investigation."
                                                required
                                                value={formData.description}
                                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                            />
                                        </div>

                                        {/* Accused Info */}
                                        <div>
                                            <label className="block text-sm font-medium mb-1 flex items-center gap-1.5">
                                                <User className="w-3.5 h-3.5 text-muted-foreground" />
                                                Accused Details (if known)
                                            </label>
                                            <input
                                                type="text"
                                                className="w-full p-2.5 rounded-lg border bg-input"
                                                placeholder="Name, description, relationship, or any identifying info"
                                                value={formData.accusedInfo}
                                                onChange={(e) => setFormData({ ...formData, accusedInfo: e.target.value })}
                                            />
                                        </div>

                                        {/* Evidence Checkbox */}
                                        <div className="flex items-center gap-3 p-3 bg-muted/40 rounded-lg border border-border">
                                            <input
                                                type="checkbox"
                                                id="evidence"
                                                checked={hasEvidence}
                                                onChange={(e) => setHasEvidence(e.target.checked)}
                                                className="w-4 h-4 accent-red-600"
                                            />
                                            <label htmlFor="evidence" className="text-sm flex items-center gap-2 cursor-pointer">
                                                <Upload className="w-4 h-4 text-muted-foreground" />
                                                I have evidence (screenshots, recordings, photos) to submit
                                            </label>
                                        </div>

                                        {hasEvidence && (
                                            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg text-sm text-blue-700 dark:text-blue-400">
                                                📎 Evidence upload will be available once connected to the backend.
                                                Please keep your evidence safe — do not delete screenshots or recordings.
                                            </div>
                                        )}

                                        {/* Immediate Danger Warning */}
                                        {urgency === "immediate" && (
                                            <div className="p-4 bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700 rounded-xl flex items-start gap-3">
                                                <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                                                <div>
                                                    <p className="font-bold text-red-800 dark:text-red-300 text-sm">
                                                        If you are in immediate danger
                                                    </p>
                                                    <p className="text-sm text-red-700 dark:text-red-400 mt-0.5">
                                                        Call <strong>112</strong> (Police) or <strong>181</strong> (Women
                                                        Helpline) right now. Do NOT wait for this form to be
                                                        processed. Move to a safe location first.
                                                    </p>
                                                </div>
                                            </div>
                                        )}

                                        {/* Submit */}
                                        <button
                                            type="submit"
                                            className="w-full py-3 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 transition-colors shadow-sm flex items-center justify-center gap-2"
                                        >
                                            <Send className="w-4 h-4" />
                                            Submit Report
                                        </button>
                                    </form>
                                </>
                            )}
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
                    <div className="text-center py-12 bg-muted/50 rounded-xl border border-dashed border-gray-300 dark:border-gray-700">
                        <ShieldAlert className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                        <p className="text-muted-foreground font-medium">No reports filed yet</p>
                        <p className="text-sm text-muted-foreground mt-1">
                            Click "File a Report" if you need to report any harassment or abuse
                        </p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {reports.map((report) => {
                            const status = statusConfig[report.status];
                            const typeConf = abuseTypeConfig[report.type];
                            const urgConf = urgencyConfig[report.urgency];
                            const isExpanded = expandedId === report.id;

                            return (
                                <motion.div
                                    key={report.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="border rounded-xl bg-card shadow-sm official-card overflow-hidden"
                                >
                                    <div
                                        onClick={() => setExpandedId(isExpanded ? null : report.id)}
                                        className="p-5 cursor-pointer hover:bg-accent/30 transition flex flex-col md:flex-row justify-between gap-3"
                                    >
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-2 flex-wrap">
                                                <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${typeConf.color}`}>
                                                    {typeConf.icon} {typeConf.label}
                                                </span>
                                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${urgConf.color}`}>
                                                    {urgConf.label}
                                                </span>
                                                <span className="text-xs text-muted-foreground font-mono">
                                                    #{report.id}
                                                </span>
                                            </div>
                                            <h4 className="font-bold text-base text-gray-900 dark:text-foreground">
                                                {report.subject}
                                            </h4>
                                            <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground flex-wrap">
                                                <span className="flex items-center gap-1">
                                                    <MapPin className="w-3 h-3" />
                                                    {report.location}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <Clock className="w-3 h-3" />
                                                    {new Date(report.filed_at).toLocaleDateString()}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3 self-end md:self-center">
                                            <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${status.bg} ${status.text}`}>
                                                {status.label}
                                            </span>
                                            <ChevronDown className={`w-5 h-5 text-muted-foreground transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                                        </div>
                                    </div>

                                    <AnimatePresence>
                                        {isExpanded && (
                                            <motion.div
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: "auto", opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                transition={{ duration: 0.2 }}
                                                className="overflow-hidden"
                                            >
                                                <div className="px-5 pb-5 pt-2 border-t border-border space-y-3">
                                                    <p className="text-sm text-foreground/80 leading-relaxed">
                                                        {report.description}
                                                    </p>
                                                    <div className="grid grid-cols-2 gap-3 text-sm">
                                                        {report.incidentDate && (
                                                            <div className="p-2 bg-muted/40 rounded-lg">
                                                                <p className="text-[10px] text-muted-foreground uppercase font-semibold">Incident Date</p>
                                                                <p className="font-medium">{report.incidentDate}</p>
                                                            </div>
                                                        )}
                                                        {report.accusedInfo && (
                                                            <div className="p-2 bg-muted/40 rounded-lg">
                                                                <p className="text-[10px] text-muted-foreground uppercase font-semibold">Accused Info</p>
                                                                <p className="font-medium">{report.accusedInfo}</p>
                                                            </div>
                                                        )}
                                                    </div>
                                                    {report.hasEvidence && (
                                                        <div className="text-xs px-3 py-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-blue-700 dark:text-blue-400 flex items-center gap-1.5">
                                                            <Upload className="w-3.5 h-3.5" />
                                                            Evidence marked for submission
                                                        </div>
                                                    )}
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </motion.div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ReportHarassment;
