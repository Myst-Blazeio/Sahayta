import React from "react";
import { CheckCircle2, Clock, XCircle, FileText, Shield, Gavel } from "lucide-react";
import { motion } from "framer-motion";

interface FIRTimelineProps {
    status: string;
    statusHistory: {
        status: string;
        timestamp: string;
        note?: string;
    }[];
}

const steps = [
    { id: "submitted", label: "Submitted", icon: FileText },
    { id: "under_review", label: "Under Review", icon: Clock },
    { id: "registered", label: "Registered", icon: Shield },
    { id: "investigating", label: "Investigating", icon: CheckCircle2 }, // Using CheckCircle as generic active icon
    { id: "closed", label: "Closed", icon: Gavel },
];

const FIRTimeline: React.FC<FIRTimelineProps> = ({ status, statusHistory }) => {
    if (status === "rejected") {
        return (
            <div className="flex items-center gap-2 text-red-600 bg-red-50 p-4 rounded-lg border border-red-200">
                <XCircle size={24} />
                <div>
                    <h4 className="font-bold">FIR Rejected</h4>
                    <p className="text-sm">This FIR has been rejected. Please review the notes for more details.</p>
                </div>
            </div>
        );
    }

    // Find the index of the current status
    const currentStepIndex = steps.findIndex((s) => s.id === status);
    const activeIndex = currentStepIndex === -1 ? 0 : currentStepIndex;

    return (
        <div className="w-full py-4">
            <div className="flex justify-between items-start relative px-2">
                {/* Connecting Line */}
                <div className="absolute top-4 left-0 w-full h-1 bg-gray-200 -z-0 rounded-full" />

                {/* Progress Line */}
                <motion.div
                    className="absolute top-4 left-0 h-1 bg-blue-600 -z-0 rounded-full"
                    initial={{ width: "0%" }}
                    animate={{ width: `${(activeIndex / (steps.length - 1)) * 100}%` }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                />

                {steps.map((step, index) => {
                    const isCompleted = index <= activeIndex;
                    const isActive = index === activeIndex;
                    const historyItem = statusHistory.find(h => h.status === step.id);

                    return (
                        <div key={step.id} className="flex flex-col items-center relative z-10 w-24">
                            <motion.div
                                initial={{ scale: 0.8, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ delay: index * 0.1 }}
                                className={`w-8 h-8 rounded-full flex items-center justify-center border-2 
                    ${isCompleted ? "bg-blue-600 border-blue-600 text-white" : "bg-white border-gray-300 text-gray-300"}
                    ${isActive ? "ring-4 ring-blue-100" : ""}
                    transition-all duration-300
                `}
                            >
                                <step.icon size={14} />
                            </motion.div>
                            <div className="mt-2 text-center">
                                <p className={`text-xs font-bold ${isCompleted ? "text-blue-900" : "text-gray-400"}`}>
                                    {step.label}
                                </p>
                                {historyItem && (
                                    <p className="text-[10px] text-gray-500 mt-0.5">
                                        {new Date(historyItem.timestamp).toLocaleDateString()}
                                    </p>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default FIRTimeline;
