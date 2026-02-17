import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    MessageSquarePlus,
    Star,
    MapPin,
    Clock,
    X,
    Send,
    CheckCircle2,
    Eye,
    ThumbsUp,
    ThumbsDown,
    MessageCircle,
    AlertCircle,
    ChevronDown,
} from "lucide-react";

type FeedbackType = "complaint" | "suggestion" | "appreciation" | "grievance";
type FeedbackDepartment = "traffic" | "investigation" | "patrol" | "cyber_cell" | "women_helpdesk" | "general";

interface FeedbackReport {
    id: string;
    type: FeedbackType;
    department: FeedbackDepartment;
    subject: string;
    description: string;
    rating: number;
    status: "submitted" | "in_progress" | "resolved" | "closed";
    submitted_at: string;
    response?: string;
}

const feedbackTypeConfig: Record<
    FeedbackType,
    { label: string; icon: React.ReactNode; color: string }
> = {
    complaint: {
        label: "Complaint",
        icon: <ThumbsDown className="w-5 h-5" />,
        color: "bg-primary/5 text-primary border-primary/10",
    },
    grievance: {
        label: "Grievance",
        icon: <AlertCircle className="w-5 h-5" />,
        color: "bg-primary/5 text-primary border-primary/10",
    },
    suggestion: {
        label: "Suggestion",
        icon: <MessageCircle className="w-5 h-5" />,
        color: "bg-primary/5 text-primary border-primary/10",
    },
    appreciation: {
        label: "Appreciation",
        icon: <ThumbsUp className="w-5 h-5" />,
        color: "bg-primary/5 text-primary border-primary/10",
    },
};

const departmentOptions: { value: FeedbackDepartment; label: string }[] = [
    { value: "general", label: "General Administration" },
    { value: "traffic", label: "Traffic Police" },
    { value: "investigation", label: "Investigation Wing" },
    { value: "patrol", label: "Patrol & Response" },
    { value: "cyber_cell", label: "Cyber Crime Cell" },
    { value: "women_helpdesk", label: "Women's Helpdesk" },
];

const statusConfig: Record<string, { bg: string; text: string; label: string }> = {
    submitted: { bg: "bg-gray-100", text: "text-gray-800", label: "Submitted" },
    in_progress: { bg: "bg-primary/10", text: "text-primary", label: "In Progress" },
    resolved: { bg: "bg-green-50", text: "text-green-700", label: "Resolved" },
    closed: { bg: "bg-gray-100", text: "text-gray-600", label: "Closed" },
};

const FeedbackGrievance: React.FC = () => {
    const [feedbacks, setFeedbacks] = useState<FeedbackReport[]>([]);
    const [showForm, setShowForm] = useState(false);
    const [selectedType, setSelectedType] = useState<FeedbackType>("complaint");
    const [rating, setRating] = useState(0);
    const [hoverRating, setHoverRating] = useState(0);
    const [formData, setFormData] = useState({
        subject: "",
        description: "",
        department: "general" as FeedbackDepartment,
    });
    const [msg, setMsg] = useState("");
    const [submitted, setSubmitted] = useState(false);
    const [expandedId, setExpandedId] = useState<string | null>(null);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const newFeedback: FeedbackReport = {
            id: "GRV-" + Date.now().toString(36).toUpperCase() + Math.random().toString(36).slice(2, 5).toUpperCase(),
            type: selectedType,
            department: formData.department,
            subject: formData.subject,
            description: formData.description,
            rating: rating,
            status: "submitted",
            submitted_at: new Date().toISOString(),
        };
        setFeedbacks([newFeedback, ...feedbacks]);
        setSubmitted(true);
        setMsg("Your feedback has been submitted successfully! You will receive updates on the resolution status.");
        setFormData({ subject: "", description: "", department: "general" });
        setRating(0);
        setSelectedType("complaint");

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
                        <MessageSquarePlus className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-foreground">
                            Feedback & Grievance
                        </h2>
                        <p className="text-sm text-muted-foreground">
                            Submit feedback or complaints about police services and track resolution
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
                            <Send className="w-4 h-4" /> Submit Feedback
                        </>
                    )}
                </button>
            </div>

            {/* Info Banner */}
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-5">
                <div className="flex items-start gap-3">
                    <div className="p-2 bg-white border border-gray-200 rounded-lg mt-0.5">
                        <MessageSquarePlus className="w-5 h-5 text-gray-700" />
                    </div>
                    <div>
                        <h3 className="font-bold text-gray-900 text-sm uppercase tracking-wide">
                            Your Voice Matters
                        </h3>
                        <p className="text-sm text-gray-600 mt-1 leading-relaxed">
                            Help us improve policing services. Submit complaints, suggestions, or
                            appreciation. Every submission is reviewed and tracked with a unique
                            grievance ID for transparency.
                        </p>
                    </div>
                </div>
            </div>

            {/* Feedback Form */}
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
                                        Feedback Submitted
                                    </h3>
                                    <p className="text-sm text-muted-foreground max-w-md mx-auto">
                                        {msg}
                                    </p>
                                </motion.div>
                            ) : (
                                <>
                                    <h3 className="text-lg font-bold mb-5 text-gray-900 dark:text-foreground flex items-center gap-2">
                                        <MessageSquarePlus className="w-5 h-5 text-violet-600" />
                                        New Submission
                                    </h3>

                                    <form onSubmit={handleSubmit} className="space-y-5">
                                        {/* Feedback Type Selection */}
                                        <div>
                                            <label className="block text-sm font-medium mb-2">
                                                Feedback Type <span className="text-red-500">*</span>
                                            </label>
                                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                                {(Object.keys(feedbackTypeConfig) as FeedbackType[]).map((type) => {
                                                    const config = feedbackTypeConfig[type];
                                                    return (
                                                        <button
                                                            key={type}
                                                            type="button"
                                                            onClick={() => setSelectedType(type)}
                                                            className={`p-3 rounded-xl border-2 text-center transition-all ${selectedType === type
                                                                ? "border-primary bg-primary/5 shadow-sm ring-1 ring-primary/20"
                                                                : "border-gray-200 dark:border-gray-700 hover:border-gray-300"
                                                                }`}
                                                        >
                                                            <div className={`mx-auto mb-1.5 w-fit ${selectedType === type ? "text-primary" : "text-gray-400"}`}>
                                                                {config.icon}
                                                            </div>
                                                            <p className="font-semibold text-xs">{config.label}</p>
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>

                                        {/* Department */}
                                        <div>
                                            <label className="block text-sm font-medium mb-1 flex items-center gap-1.5">
                                                Department <span className="text-red-500">*</span>
                                            </label>
                                            <div className="relative">
                                                <select
                                                    className="w-full p-2.5 rounded-lg border bg-input appearance-none pr-10"
                                                    value={formData.department}
                                                    onChange={(e) =>
                                                        setFormData({
                                                            ...formData,
                                                            department: e.target.value as FeedbackDepartment,
                                                        })
                                                    }
                                                >
                                                    {departmentOptions.map((dept) => (
                                                        <option key={dept.value} value={dept.value}>
                                                            {dept.label}
                                                        </option>
                                                    ))}
                                                </select>
                                                <ChevronDown className="w-4 h-4 text-muted-foreground absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                                            </div>
                                        </div>

                                        {/* Subject */}
                                        <div>
                                            <label className="block text-sm font-medium mb-1">
                                                Subject <span className="text-red-500">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                className="w-full p-2.5 rounded-lg border bg-input"
                                                placeholder="Brief subject of your feedback"
                                                required
                                                value={formData.subject}
                                                onChange={(e) =>
                                                    setFormData({ ...formData, subject: e.target.value })
                                                }
                                            />
                                        </div>

                                        {/* Description */}
                                        <div>
                                            <label className="block text-sm font-medium mb-1">
                                                Detailed Description <span className="text-red-500">*</span>
                                            </label>
                                            <textarea
                                                className="w-full h-32 p-3 rounded-lg border bg-input"
                                                placeholder="Provide details about your experience, issue, or suggestion. Include dates, officer names (if applicable), and any reference numbers."
                                                required
                                                value={formData.description}
                                                onChange={(e) =>
                                                    setFormData({ ...formData, description: e.target.value })
                                                }
                                            />
                                        </div>

                                        {/* Star Rating */}
                                        <div>
                                            <label className="block text-sm font-medium mb-2">
                                                Rate Your Experience
                                            </label>
                                            <div className="flex items-center gap-1">
                                                {[1, 2, 3, 4, 5].map((star) => (
                                                    <button
                                                        key={star}
                                                        type="button"
                                                        onClick={() => setRating(star)}
                                                        onMouseEnter={() => setHoverRating(star)}
                                                        onMouseLeave={() => setHoverRating(0)}
                                                        className="p-1 transition-transform hover:scale-110"
                                                    >
                                                        <Star
                                                            className={`w-7 h-7 transition-colors ${star <= (hoverRating || rating)
                                                                ? "fill-amber-400 text-amber-400"
                                                                : "text-gray-300 dark:text-gray-600"
                                                                }`}
                                                        />
                                                    </button>
                                                ))}
                                                {rating > 0 && (
                                                    <span className="text-sm text-muted-foreground ml-2">
                                                        {rating === 1 && "Poor"}
                                                        {rating === 2 && "Fair"}
                                                        {rating === 3 && "Average"}
                                                        {rating === 4 && "Good"}
                                                        {rating === 5 && "Excellent"}
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        {/* Submit */}
                                        <button
                                            type="submit"
                                            className="w-full py-3 bg-primary text-white font-bold rounded-lg hover:bg-primary/90 transition-colors shadow-sm flex items-center justify-center gap-2"
                                        >
                                            <Send className="w-4 h-4" />
                                            Submit Feedback
                                        </button>
                                    </form>
                                </>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* My Submissions */}
            <div>
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                    <Eye className="w-5 h-5 text-muted-foreground" />
                    My Submissions
                </h3>

                {feedbacks.length === 0 ? (
                    <div className="text-center py-12 bg-muted/50 rounded-xl border border-dashed border-gray-300 dark:border-gray-700">
                        <MessageSquarePlus className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                        <p className="text-muted-foreground font-medium">
                            No submissions yet
                        </p>
                        <p className="text-sm text-muted-foreground mt-1">
                            Click "Submit Feedback" to share your experience or report a grievance
                        </p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {feedbacks.map((fb) => {
                            const status = statusConfig[fb.status];
                            const typeConf = feedbackTypeConfig[fb.type];
                            const deptLabel = departmentOptions.find((d) => d.value === fb.department)?.label || fb.department;
                            const isExpanded = expandedId === fb.id;

                            return (
                                <motion.div
                                    key={fb.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="border rounded-xl bg-card shadow-sm official-card overflow-hidden"
                                >
                                    <div
                                        onClick={() => setExpandedId(isExpanded ? null : fb.id)}
                                        className="p-5 cursor-pointer hover:bg-accent/30 transition flex flex-col md:flex-row justify-between gap-3"
                                    >
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-2 flex-wrap">
                                                <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border flex items-center gap-1 ${typeConf.color}`}>
                                                    {typeConf.icon}
                                                    {typeConf.label}
                                                </span>
                                                <span className="text-xs text-muted-foreground font-mono">
                                                    #{fb.id}
                                                </span>
                                            </div>
                                            <h4 className="font-bold text-base text-gray-900 dark:text-foreground">
                                                {fb.subject}
                                            </h4>
                                            <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground flex-wrap">
                                                <span className="flex items-center gap-1">
                                                    <MapPin className="w-3 h-3" />
                                                    {deptLabel}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <Clock className="w-3 h-3" />
                                                    {new Date(fb.submitted_at).toLocaleDateString()}
                                                </span>
                                                {fb.rating > 0 && (
                                                    <span className="flex items-center gap-0.5">
                                                        {Array.from({ length: fb.rating }).map((_, i) => (
                                                            <Star key={i} className="w-3 h-3 fill-amber-400 text-amber-400" />
                                                        ))}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3 self-end md:self-center">
                                            <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${status.bg} ${status.text}`}>
                                                {status.label}
                                            </span>
                                            <ChevronDown className={`w-5 h-5 text-muted-foreground transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                                        </div>
                                    </div>

                                    {/* Expanded Details */}
                                    <AnimatePresence>
                                        {isExpanded && (
                                            <motion.div
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: "auto", opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                transition={{ duration: 0.2 }}
                                                className="overflow-hidden"
                                            >
                                                <div className="px-5 pb-5 pt-2 border-t border-border">
                                                    <p className="text-sm text-foreground/80 leading-relaxed">
                                                        {fb.description}
                                                    </p>
                                                    {fb.response && (
                                                        <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                                                            <p className="text-xs font-bold text-blue-800 dark:text-blue-300 uppercase tracking-wide mb-1">
                                                                Official Response
                                                            </p>
                                                            <p className="text-sm text-blue-700 dark:text-blue-400">
                                                                {fb.response}
                                                            </p>
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

export default FeedbackGrievance;
