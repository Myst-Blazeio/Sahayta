import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Shield,
    AlertTriangle,
    Phone,
    ExternalLink,
    Send,
    CheckCircle,
    Globe,
    Lock,
    UserX,
    CreditCard,
    Database,
    HelpCircle,
    ChevronDown,
    ChevronUp,
    ShieldAlert,
    Zap,
    FileText,
} from "lucide-react";

const cyberCategories = [
    { value: "online_fraud", label: "Online Fraud / Financial Scam", icon: CreditCard },
    { value: "hacking", label: "Hacking / Unauthorized Access", icon: Lock },
    { value: "cyberbullying", label: "Cyberbullying / Online Harassment", icon: UserX },
    { value: "identity_theft", label: "Identity Theft", icon: ShieldAlert },
    { value: "data_breach", label: "Data Breach / Privacy Violation", icon: Database },
    { value: "phishing", label: "Phishing / Social Engineering", icon: Globe },
    { value: "other", label: "Other Cybercrime", icon: HelpCircle },
];

const urgencyLevels = [
    { value: "low", label: "Low — General inquiry / awareness", color: "bg-green-100 text-green-700 border-green-300" },
    { value: "medium", label: "Medium — Ongoing issue, no immediate danger", color: "bg-yellow-100 text-yellow-700 border-yellow-300" },
    { value: "high", label: "High — Active financial loss / data compromise", color: "bg-orange-100 text-orange-700 border-orange-300" },
    { value: "critical", label: "Critical — Immediate threat to safety", color: "bg-red-100 text-red-700 border-red-300" },
];

interface GuidanceCard {
    title: string;
    description: string;
    legalRef: string;
    steps: string[];
    icon: React.ElementType;
    gradient: string;
}

const guidanceCards: GuidanceCard[] = [
    {
        title: "Online Financial Fraud",
        description: "UPI scams, fake e-commerce, loan fraud, or card cloning.",
        legalRef: "IT Act Sec 66D, BNS Sec 318 (Cheating)",
        steps: [
            "Immediately call 1930 (Cyber Crime Helpline)",
            "Block your cards / freeze accounts via your bank",
            "Take screenshots of all transactions & messages",
            "File a complaint on cybercrime.gov.in",
        ],
        icon: CreditCard,
        gradient: "from-red-500 to-orange-500",
    },
    {
        title: "Hacking & Unauthorized Access",
        description: "Email, social media, or device hacked without consent.",
        legalRef: "IT Act Sec 43, 66 & 66B",
        steps: [
            "Change passwords on all accounts immediately",
            "Enable two-factor authentication (2FA)",
            "Log out from all devices remotely",
            "Report to cybercrime.gov.in with evidence",
        ],
        icon: Lock,
        gradient: "from-blue-600 to-cyan-500",
    },
    {
        title: "Cyberbullying & Harassment",
        description: "Online threats, doxxing, revenge content, or stalking.",
        legalRef: "IT Act Sec 66A (read-down), 67; BNS Sec 351, 356",
        steps: [
            "Do NOT engage — block the harasser",
            "Screenshot all evidence with timestamps",
            "Report on the platform (WhatsApp, Instagram, etc.)",
            "File FIR or report at cybercrime.gov.in",
        ],
        icon: UserX,
        gradient: "from-purple-600 to-pink-500",
    },
    {
        title: "Identity Theft",
        description: "Someone using your Aadhaar, PAN, or other IDs fraudulently.",
        legalRef: "IT Act Sec 66C (Identity Theft), BNS Sec 318",
        steps: [
            "Lock your Aadhaar biometrics on UIDAI website",
            "Report to CIBIL for suspicious credit activity",
            "Alert your bank and telecom operator",
            "File an FIR with supporting documents",
        ],
        icon: ShieldAlert,
        gradient: "from-amber-500 to-red-500",
    },
    {
        title: "Phishing & Social Engineering",
        description: "Fake emails, calls, or links tricking you into sharing data.",
        legalRef: "IT Act Sec 66D (Impersonation), BNS Sec 319",
        steps: [
            "Do NOT click suspicious links or share OTPs",
            "Report phishing emails to the platform",
            "Check haveibeenpwned.com for compromised credentials",
            "Change passwords if you clicked anything",
        ],
        icon: Globe,
        gradient: "from-emerald-500 to-teal-500",
    },
    {
        title: "Data Breach & Privacy Violation",
        description: "Personal data leaked, sold, or misused without consent.",
        legalRef: "IT Act Sec 43A, DPDP Act 2023",
        steps: [
            "Document what data was compromised",
            "Change credentials for affected services",
            "Report to the data controller / company",
            "File complaint with Grievance Officer or cybercrime.gov.in",
        ],
        icon: Database,
        gradient: "from-indigo-500 to-blue-500",
    },
];

const CyberHelpCenter: React.FC = () => {
    const [formData, setFormData] = useState({
        category: "",
        description: "",
        urgency: "medium",
        contactEmail: "",
    });
    const [submitted, setSubmitted] = useState(false);
    const [expandedGuide, setExpandedGuide] = useState<number | null>(null);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // Mock submission
        setSubmitted(true);
        setTimeout(() => {
            setSubmitted(false);
            setFormData({ category: "", description: "", urgency: "medium", contactEmail: "" });
        }, 4000);
    };

    return (
        <div className="max-w-6xl mx-auto space-y-10">
            {/* ── Hero Section ── */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-cyan-600 via-blue-700 to-indigo-800 p-8 md:p-12 text-white"
            >
                <div className="absolute inset-0 opacity-10">
                    <div className="absolute top-4 right-8 w-64 h-64 rounded-full bg-white/20 blur-3xl" />
                    <div className="absolute bottom-0 left-8 w-48 h-48 rounded-full bg-cyan-300/30 blur-2xl" />
                </div>

                <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center gap-6">
                    <div className="p-4 bg-white/15 backdrop-blur-sm rounded-2xl border border-white/20">
                        <Shield className="w-10 h-10 text-white" />
                    </div>
                    <div className="flex-1">
                        <h1 className="text-3xl md:text-4xl font-bold mb-2">Cyber Help Center</h1>
                        <p className="text-lg text-cyan-100 mb-4">
                            One place to report digital safety issues.
                        </p>
                        <div className="flex flex-wrap gap-4 text-sm">
                            <span className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-full border border-white/20">
                                <ShieldAlert className="w-4 h-4" />
                                Report Digital Safety Issues
                            </span>
                            <span className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-full border border-white/20">
                                <Zap className="w-4 h-4" />
                                Instant Guidance & Legal Info
                            </span>
                            <span className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-full border border-white/20">
                                <FileText className="w-4 h-4" />
                                Fast & Easy Support
                            </span>
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* ── Quick Helpline Banner ── */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <a
                    href="tel:1930"
                    className="flex items-center gap-4 p-5 rounded-xl bg-red-50 border border-red-200 hover:shadow-lg hover:scale-[1.02] transition-all group"
                >
                    <div className="p-3 rounded-xl bg-gradient-to-br from-red-500 to-red-700 shadow-lg group-hover:shadow-xl transition-shadow">
                        <Phone className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <p className="text-sm font-semibold text-red-600 uppercase tracking-wide">
                            Cybercrime Helpline
                        </p>
                        <p className="text-2xl font-extrabold text-red-800">1930</p>
                        <p className="text-xs text-red-500 mt-0.5">Available 24/7 — Call immediately if money is lost</p>
                    </div>
                </a>
                <a
                    href="https://cybercrime.gov.in"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-4 p-5 rounded-xl bg-blue-50 border border-blue-200 hover:shadow-lg hover:scale-[1.02] transition-all group"
                >
                    <div className="p-3 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 shadow-lg group-hover:shadow-xl transition-shadow">
                        <Globe className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <p className="text-sm font-semibold text-blue-600 uppercase tracking-wide">
                            National Cyber Crime Portal
                        </p>
                        <p className="text-lg font-bold text-blue-800 flex items-center gap-1">
                            cybercrime.gov.in <ExternalLink className="w-4 h-4" />
                        </p>
                        <p className="text-xs text-blue-500 mt-0.5">Official Government of India portal for online complaints</p>
                    </div>
                </a>
            </div>

            {/* ── Report a Cyber Issue ── */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="bg-card border border-border rounded-2xl p-6 md:p-8 shadow-sm"
            >
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-cyan-100 rounded-lg">
                        <Send className="w-5 h-5 text-cyan-700" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-foreground">Report a Cyber Issue</h2>
                        <p className="text-sm text-muted-foreground">
                            Describe your issue and we'll guide you to the right resource
                        </p>
                    </div>
                </div>

                <AnimatePresence mode="wait">
                    {submitted ? (
                        <motion.div
                            key="success"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0 }}
                            className="flex flex-col items-center justify-center py-12 text-center"
                        >
                            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                                <CheckCircle className="w-8 h-8 text-green-600" />
                            </div>
                            <h3 className="text-lg font-bold text-green-800 mb-2">Report Submitted Successfully</h3>
                            <p className="text-sm text-green-600 max-w-md">
                                Your cyber issue has been logged. You will receive guidance and next steps shortly.
                                For urgent cases, please call <strong>1930</strong> immediately.
                            </p>
                        </motion.div>
                    ) : (
                        <motion.form
                            key="form"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onSubmit={handleSubmit}
                            className="space-y-5"
                        >
                            {/* Category */}
                            <div>
                                <label className="block text-sm font-medium mb-2">
                                    Type of Cyber Issue <span className="text-red-500">*</span>
                                </label>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                    {cyberCategories.map((cat) => {
                                        const IconComp = cat.icon;
                                        const selected = formData.category === cat.value;
                                        return (
                                            <button
                                                key={cat.value}
                                                type="button"
                                                onClick={() => setFormData({ ...formData, category: cat.value })}
                                                className={`flex items-center gap-3 p-3 rounded-lg border text-left transition-all text-sm ${selected
                                                        ? "border-cyan-500 bg-cyan-50 ring-2 ring-cyan-400 shadow-sm"
                                                        : "border-border bg-card hover:bg-accent/50 hover:border-cyan-300"
                                                    }`}
                                            >
                                                <IconComp className={`w-5 h-5 flex-shrink-0 ${selected ? "text-cyan-600" : "text-muted-foreground"}`} />
                                                <span className={selected ? "font-semibold text-cyan-800" : "text-foreground"}>
                                                    {cat.label}
                                                </span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Description */}
                            <div>
                                <label className="block text-sm font-medium mb-1">
                                    Describe the Issue <span className="text-red-500">*</span>
                                </label>
                                <textarea
                                    className="w-full h-28 p-3 rounded-lg border bg-input resize-none focus:ring-2 focus:ring-cyan-400 focus:outline-none transition"
                                    placeholder="Briefly describe what happened — e.g. received a phishing link, money deducted without authorization, account was hacked..."
                                    required
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                />
                            </div>

                            {/* Urgency */}
                            <div>
                                <label className="block text-sm font-medium mb-2">Urgency Level</label>
                                <div className="flex flex-wrap gap-2">
                                    {urgencyLevels.map((level) => (
                                        <button
                                            key={level.value}
                                            type="button"
                                            onClick={() => setFormData({ ...formData, urgency: level.value })}
                                            className={`px-4 py-2 rounded-full text-xs font-semibold border transition-all ${formData.urgency === level.value
                                                    ? `${level.color} ring-2 ring-offset-1`
                                                    : "bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100"
                                                }`}
                                        >
                                            {level.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Contact Email */}
                            <div>
                                <label className="block text-sm font-medium mb-1">
                                    Contact Email (optional)
                                </label>
                                <input
                                    type="email"
                                    className="w-full p-3 rounded-lg border bg-input focus:ring-2 focus:ring-cyan-400 focus:outline-none transition"
                                    placeholder="your.email@example.com"
                                    value={formData.contactEmail}
                                    onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={!formData.category || !formData.description}
                                className="w-full py-3 bg-gradient-to-r from-cyan-600 to-blue-700 text-white font-bold rounded-lg hover:from-cyan-700 hover:to-blue-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg flex items-center justify-center gap-2"
                            >
                                <Send className="w-4 h-4" />
                                Submit Report
                            </button>
                        </motion.form>
                    )}
                </AnimatePresence>
            </motion.div>

            {/* ── Instant Guidance ── */}
            <div>
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-indigo-100 rounded-lg">
                        <AlertTriangle className="w-5 h-5 text-indigo-700" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-foreground">Instant Guidance</h2>
                        <p className="text-sm text-muted-foreground">
                            Quick steps and legal references for common cyber crimes
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {guidanceCards.map((card, idx) => {
                        const IconComp = card.icon;
                        const isExpanded = expandedGuide === idx;
                        return (
                            <motion.div
                                key={idx}
                                layout
                                className="rounded-xl border border-border bg-card overflow-hidden hover:shadow-md transition-shadow"
                            >
                                <button
                                    onClick={() => setExpandedGuide(isExpanded ? null : idx)}
                                    className="w-full flex items-center gap-4 p-5 text-left"
                                >
                                    <div className={`p-3 rounded-xl bg-gradient-to-br ${card.gradient} shadow-md flex-shrink-0`}>
                                        <IconComp className="w-5 h-5 text-white" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-bold text-foreground">{card.title}</h3>
                                        <p className="text-xs text-muted-foreground mt-0.5">{card.description}</p>
                                    </div>
                                    {isExpanded ? (
                                        <ChevronUp className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                                    ) : (
                                        <ChevronDown className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                                    )}
                                </button>

                                <AnimatePresence>
                                    {isExpanded && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: "auto", opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            transition={{ duration: 0.25 }}
                                            className="overflow-hidden"
                                        >
                                            <div className="px-5 pb-5 space-y-3">
                                                <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                                                    <p className="text-xs font-semibold text-amber-700">
                                                        📜 Legal Reference: {card.legalRef}
                                                    </p>
                                                </div>
                                                <div className="space-y-2">
                                                    <p className="text-xs font-semibold text-foreground uppercase tracking-wide">
                                                        Immediate Steps:
                                                    </p>
                                                    {card.steps.map((step, sIdx) => (
                                                        <div key={sIdx} className="flex items-start gap-2">
                                                            <span className="w-5 h-5 rounded-full bg-cyan-100 text-cyan-700 text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                                                                {sIdx + 1}
                                                            </span>
                                                            <p className="text-sm text-foreground/80">{step}</p>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </motion.div>
                        );
                    })}
                </div>
            </div>

            {/* ── Legal Disclaimer ── */}
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-5 text-center">
                <p className="text-xs text-gray-500 leading-relaxed">
                    <strong>Disclaimer:</strong> This Cyber Help Center provides general guidance and resource links.
                    For formal complaints, please use the{" "}
                    <a
                        href="https://cybercrime.gov.in"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline font-medium"
                    >
                        National Cyber Crime Portal
                    </a>{" "}
                    or call <strong>1930</strong>. In case of immediate danger, dial <strong>112</strong>.
                </p>
            </div>
        </div>
    );
};

export default CyberHelpCenter;
