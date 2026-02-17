import React, { useState } from "react";
import {
    Shield,
    ShieldAlert,
    BookOpen,
    AlertTriangle,
    Phone,
    MapPin,
    Lock,
    Eye,
    Users,
    Wifi,
    Car,
    Home,
    Briefcase,
    Heart,
    Scale,
    FileText,
    Info,
    ChevronRight,
} from "lucide-react";

interface SafetyTip {
    icon: React.ReactNode;
    title: string;
    tips: string[];
    gradient: string;
    bgLight: string;
}

interface LegalResource {
    title: string;
    description: string;
    sections: string;
    icon: React.ReactNode;
    gradient: string;
}

// ===== FEMALE SAFETY DATA =====
const femaleSafetyTips: SafetyTip[] = [
    {
        icon: <MapPin className="w-5 h-5" />,
        title: "Travel & Commute Safety",
        tips: [
            "Share your live location with a trusted person when travelling alone.",
            "Avoid isolated roads or poorly lit areas, especially at night.",
            "Use verified ride services and share trip details with family.",
            "Sit behind the driver's seat in cabs; avoid the front seat.",
            "Keep emergency numbers on speed dial (112, 181, 100).",
        ],
        gradient: "from-pink-500 to-rose-600",
        bgLight: "bg-pink-50",
    },
    {
        icon: <Wifi className="w-5 h-5" />,
        title: "Online & Cyber Safety",
        tips: [
            "Do not share personal photos or location details with strangers online.",
            "Be cautious of online friendships that escalate too quickly.",
            "Report cyber stalking, morphed images, or online threats to Cybercrime Helpline (1930).",
            "Block and report suspicious accounts instead of engaging.",
            "Use strong, unique passwords for all social media accounts.",
        ],
        gradient: "from-purple-500 to-purple-700",
        bgLight: "bg-purple-50",
    },
    {
        icon: <Home className="w-5 h-5" />,
        title: "Domestic Safety",
        tips: [
            "If facing domestic violence, reach out to Women Helpline (181) or file a complaint.",
            "Keep important documents (Aadhaar, Passport, Bank documents) in a safe place.",
            "Inform a trusted relative or friend about any distress at home.",
            "Seek legal aid from District Legal Services Authority (DLSA) if needed.",
            "Protection orders can be obtained under the Domestic Violence Act, 2005.",
        ],
        gradient: "from-amber-500 to-orange-600",
        bgLight: "bg-amber-50",
    },
    {
        icon: <Briefcase className="w-5 h-5" />,
        title: "Workplace Safety",
        tips: [
            "Know your right to file a complaint with the Internal Complaints Committee (ICC).",
            "Document any harassment with dates, screenshots, and witnesses.",
            "Sexual harassment at workplace is punishable — don't hesitate to report.",
            "SHe-box (Sexual Harassment e-complaint box) is available online for complaints.",
            "Employers are legally required to have a POSH (Prevention of Sexual Harassment) policy.",
        ],
        gradient: "from-teal-500 to-teal-700",
        bgLight: "bg-teal-50",
    },
    {
        icon: <Eye className="w-5 h-5" />,
        title: "Self-Defense & Awareness",
        tips: [
            "Learn basic self-defense techniques — many NGOs offer free training.",
            "Carry personal safety items like a whistle or pepper spray where legal.",
            "Stay alert and trust your instincts — if something feels wrong, leave immediately.",
            "In crowded areas, be aware of pickpockets and molesters.",
            "Take note of nearest police stations, hospitals, and safe spaces in your area.",
        ],
        gradient: "from-indigo-500 to-indigo-700",
        bgLight: "bg-indigo-50",
    },
];

const femaleLegalResources: LegalResource[] = [
    {
        title: "Protection of Women from Domestic Violence Act, 2005",
        description:
            "Provides civil remedies including protection orders, residence orders, and monetary relief for women facing domestic violence.",
        sections: "Sections 12–29",
        icon: <Shield className="w-5 h-5" />,
        gradient: "from-pink-500 to-rose-600",
    },
    {
        title: "Sexual Harassment at Workplace (POSH Act), 2013",
        description:
            "Mandates Internal Complaints Committees at workplaces. Defines sexual harassment and provides redressal mechanisms.",
        sections: "Sections 2, 3, 4, 9",
        icon: <Briefcase className="w-5 h-5" />,
        gradient: "from-purple-500 to-purple-700",
    },
    {
        title: "BNS 63–72: Rape & Sexual Offences",
        description:
            "Covers definition of rape, punishment, gang rape, repeat offenders, and victim identity protection under BNS 2023.",
        sections: "BNS 63, 64, 65, 70, 72",
        icon: <Scale className="w-5 h-5" />,
        gradient: "from-red-500 to-red-700",
    },
    {
        title: "BNS 74–79: Modesty, Stalking, Voyeurism",
        description:
            "Assault to outrage modesty, sexual harassment, stalking, voyeurism, and insulting modesty of a woman.",
        sections: "BNS 74, 75, 77, 78, 79",
        icon: <ShieldAlert className="w-5 h-5" />,
        gradient: "from-amber-500 to-amber-700",
    },
    {
        title: "BNS 80–86: Dowry & Cruelty",
        description:
            "Dowry death, cruelty by husband/relatives, and the Dowry Prohibition Act — women have legal protection against dowry demands.",
        sections: "BNS 80, 85, 86",
        icon: <Heart className="w-5 h-5" />,
        gradient: "from-teal-500 to-teal-700",
    },
    {
        title: "Women Helpline & Support",
        description:
            "Women Helpline: 181 (24/7) | NCW Helpline: 7827-170-170 | SHe-box online portal for workplace harassment complaints.",
        sections: "Helpline Numbers",
        icon: <Phone className="w-5 h-5" />,
        gradient: "from-emerald-500 to-emerald-700",
    },
];

// ===== MALE SAFETY DATA =====
const maleSafetyTips: SafetyTip[] = [
    {
        icon: <Car className="w-5 h-5" />,
        title: "Road & Travel Safety",
        tips: [
            "Always wear a seatbelt and helmet — violation is punishable under Motor Vehicles Act.",
            "Avoid confrontations during road rage; note vehicle numbers and report instead.",
            "Do not drink and drive — punishment includes up to 6 months imprisonment.",
            "Keep vehicle documents and insurance updated to avoid legal hassles.",
            "While travelling late, inform family and share your live location.",
        ],
        gradient: "from-blue-500 to-blue-700",
        bgLight: "bg-blue-50",
    },
    {
        icon: <Lock className="w-5 h-5" />,
        title: "Financial & Cyber Crime Safety",
        tips: [
            "Never share OTP, bank PIN, or CVV with anyone — banks never ask for these.",
            "Verify UPI payment requests carefully; avoid scanning unknown QR codes.",
            "Be wary of lottery, job, or loan scams — if it seems too good, it's a trap.",
            "Regularly check your credit report for unauthorized activities.",
            "Report cyber fraud immediately to 1930 (Cybercrime Helpline) and your bank.",
        ],
        gradient: "from-emerald-500 to-emerald-700",
        bgLight: "bg-emerald-50",
    },
    {
        icon: <Users className="w-5 h-5" />,
        title: "Social & Public Safety",
        tips: [
            "Avoid engaging in street fights — even in self-defense, excessive force is punishable.",
            "Filming or photographing anyone without consent can lead to legal issues.",
            "Be cautious at ATMs late at night; use ATMs inside bank premises when possible.",
            "Do not forward unverified messages on WhatsApp — spreading fake news is a crime.",
            "Report suspicious activities to your nearest police station or call 112.",
        ],
        gradient: "from-slate-500 to-slate-700",
        bgLight: "bg-slate-50",
    },
    {
        icon: <Briefcase className="w-5 h-5" />,
        title: "Workplace & Professional Safety",
        tips: [
            "Maintain professional boundaries — document all interactions when possible.",
            "Know your rights under labor laws — wrongful termination can be contested.",
            "If falsely accused at workplace, collect evidence and seek legal counsel immediately.",
            "Whistleblower Protection Act protects those who report corruption.",
            "Employment contracts should be read carefully before signing.",
        ],
        gradient: "from-amber-500 to-amber-700",
        bgLight: "bg-amber-50",
    },
    {
        icon: <Shield className="w-5 h-5" />,
        title: "Self-Protection & Legal Awareness",
        tips: [
            "Right to private defense (BNS 34–44) allows reasonable force if under threat.",
            "Always file an FIR if you're a victim — it's your legal right under BNSS.",
            "Carry a valid ID when out — helps if stopped for identity verification.",
            "Know the bail process — most bailable offences allow immediate release on bond.",
            "If arrested, you have the right to contact a lawyer (Article 22 of Constitution).",
        ],
        gradient: "from-indigo-500 to-indigo-700",
        bgLight: "bg-indigo-50",
    },
];

const maleLegalResources: LegalResource[] = [
    {
        title: "BNS 114–125: Offences Against the Body",
        description:
            "Covers hurt, grievous hurt, acid attacks, and endangering life. Know the legal framework if you're assaulted or involved in altercations.",
        sections: "BNS 114, 115, 117, 124, 125",
        icon: <AlertTriangle className="w-5 h-5" />,
        gradient: "from-red-500 to-red-700",
    },
    {
        title: "BNS 303–313: Theft, Robbery & Dacoity",
        description:
            "Understand the legal distinction between theft, snatching, robbery, and dacoity. Know how to report and what evidence to preserve.",
        sections: "BNS 303, 304, 309, 310",
        icon: <Shield className="w-5 h-5" />,
        gradient: "from-blue-500 to-blue-700",
    },
    {
        title: "BNS 308, 318: Extortion & Cheating",
        description:
            "If threatened for money or cheated in a transaction, these sections provide legal recourse.",
        sections: "BNS 308, 318, 319",
        icon: <Scale className="w-5 h-5" />,
        gradient: "from-amber-500 to-amber-700",
    },
    {
        title: "BNS 34–44: Right to Private Defense",
        description:
            "Every person has the right to defend their body and property. Includes when deadly force is justified under law.",
        sections: "BNS 34, 35, 38, 41",
        icon: <ShieldAlert className="w-5 h-5" />,
        gradient: "from-emerald-500 to-emerald-700",
    },
    {
        title: "BNS 351, 356: Intimidation & Defamation",
        description:
            "Criminal intimidation (threats) and defamation are punishable offences — you can file a complaint if targeted.",
        sections: "BNS 351, 356",
        icon: <FileText className="w-5 h-5" />,
        gradient: "from-purple-500 to-purple-700",
    },
    {
        title: "Emergency & Legal Aid",
        description:
            "National Emergency: 112 | Police: 100 | Cybercrime: 1930 | NALSA (Free Legal Aid): 15100 | District Legal Services Authority for free lawyer.",
        sections: "Helpline Numbers",
        icon: <Phone className="w-5 h-5" />,
        gradient: "from-slate-600 to-slate-800",
    },
];

const SafetyGuidelines: React.FC = () => {
    const [activeGender, setActiveGender] = useState<"female" | "male">("female");

    const safetyTips = activeGender === "female" ? femaleSafetyTips : maleSafetyTips;
    const legalResources = activeGender === "female" ? femaleLegalResources : maleLegalResources;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 p-6 sm:p-8 text-white shadow-xl">
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0djZoLTJ2LTZoMnptMC0xMHY2aC0ydi02aDJ6bTAtMTB2NmgtMnYtNmgyeiIvPjwvZz48L2c+PC9zdmc+')] opacity-30" />
                <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="p-2.5 bg-white/20 rounded-xl backdrop-blur-sm">
                            <Shield className="w-6 h-6" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold tracking-tight">
                                Safety Guidelines & Awareness
                            </h2>
                            <p className="text-white/80 text-sm mt-0.5">
                                Crime prevention tips & legal awareness resources
                            </p>
                        </div>
                    </div>
                    <p className="text-white/70 text-sm max-w-2xl leading-relaxed">
                        Stay informed, stay safe. Browse practical safety tips and know your
                        legal rights under the Bharatiya Nyaya Sanhita (BNS), 2023.
                    </p>
                </div>
            </div>

            {/* Gender Toggle */}
            <div className="flex justify-center">
                <div className="inline-flex rounded-xl bg-gray-100 p-1.5 shadow-inner">
                    <button
                        onClick={() => setActiveGender("female")}
                        className={`px-6 py-2.5 rounded-lg text-sm font-semibold transition-all duration-300 flex items-center gap-2 ${activeGender === "female"
                            ? "bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-lg shadow-pink-200"
                            : "text-gray-600 hover:text-gray-800 hover:bg-gray-200"
                            }`}
                    >
                        <span>👩</span> Women's Safety
                    </button>
                    <button
                        onClick={() => setActiveGender("male")}
                        className={`px-6 py-2.5 rounded-lg text-sm font-semibold transition-all duration-300 flex items-center gap-2 ${activeGender === "male"
                            ? "bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-lg shadow-blue-200"
                            : "text-gray-600 hover:text-gray-800 hover:bg-gray-200"
                            }`}
                    >
                        <span>👨</span> Men's Safety
                    </button>
                </div>
            </div>

            {/* Crime Prevention Tips */}
            <div>
                <div className="flex items-center gap-2 mb-4">
                    <div className={`p-1.5 rounded-lg ${activeGender === "female" ? "bg-pink-100" : "bg-blue-100"}`}>
                        <AlertTriangle className={`w-4 h-4 ${activeGender === "female" ? "text-pink-600" : "text-blue-600"}`} />
                    </div>
                    <h3 className="text-lg font-bold text-gray-800">
                        Crime Prevention Tips
                    </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {safetyTips.map((category, idx) => (
                        <div
                            key={idx}
                            className={`rounded-xl border border-gray-200 ${category.bgLight} shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden`}
                        >
                            {/* Gradient bar */}
                            <div className={`h-1.5 bg-gradient-to-r ${category.gradient}`} />

                            <div className="p-5">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className={`p-2 rounded-lg bg-gradient-to-br ${category.gradient} text-white shadow-md`}>
                                        {category.icon}
                                    </div>
                                    <h4 className="font-bold text-gray-800 text-sm">
                                        {category.title}
                                    </h4>
                                </div>

                                <ul className="space-y-2.5">
                                    {category.tips.map((tip, tipIdx) => (
                                        <li key={tipIdx} className="flex items-start gap-2">
                                            <ChevronRight className="w-3.5 h-3.5 text-gray-400 mt-0.5 shrink-0" />
                                            <span className="text-xs text-gray-700 leading-relaxed">
                                                {tip}
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Legal Awareness Resources */}
            <div>
                <div className="flex items-center gap-2 mb-4">
                    <div className={`p-1.5 rounded-lg ${activeGender === "female" ? "bg-pink-100" : "bg-blue-100"}`}>
                        <BookOpen className={`w-4 h-4 ${activeGender === "female" ? "text-pink-600" : "text-blue-600"}`} />
                    </div>
                    <h3 className="text-lg font-bold text-gray-800">
                        Legal Awareness Resources
                    </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {legalResources.map((resource, idx) => (
                        <div
                            key={idx}
                            className="group rounded-xl border border-gray-200 bg-white shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden"
                        >
                            <div className={`h-1.5 bg-gradient-to-r ${resource.gradient}`} />

                            <div className="p-5">
                                <div className="flex items-start gap-3 mb-3">
                                    <div className={`p-2 rounded-lg bg-gradient-to-br ${resource.gradient} text-white shadow-md shrink-0`}>
                                        {resource.icon}
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-gray-800 text-sm leading-snug">
                                            {resource.title}
                                        </h4>
                                        <span className="inline-block mt-1 text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 border border-gray-200 font-medium">
                                            {resource.sections}
                                        </span>
                                    </div>
                                </div>

                                <p className="text-xs text-gray-600 leading-relaxed">
                                    {resource.description}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Helpline Quick Access */}
            <div className={`rounded-xl border-2 ${activeGender === "female" ? "border-pink-200 bg-pink-50" : "border-blue-200 bg-blue-50"} p-5 shadow-sm`}>
                <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg ${activeGender === "female" ? "bg-pink-200" : "bg-blue-200"} shrink-0`}>
                        <Phone className={`w-5 h-5 ${activeGender === "female" ? "text-pink-700" : "text-blue-700"}`} />
                    </div>
                    <div>
                        <h4 className={`font-bold text-sm ${activeGender === "female" ? "text-pink-800" : "text-blue-800"} mb-2`}>
                            Quick Emergency Numbers
                        </h4>
                        <div className="flex flex-wrap gap-3">
                            {[
                                { label: "National Emergency", number: "112" },
                                { label: "Police", number: "100" },
                                { label: "Ambulance", number: "102" },
                                ...(activeGender === "female"
                                    ? [
                                        { label: "Women Helpline", number: "181" },
                                        { label: "NCW", number: "7827-170-170" },
                                    ]
                                    : [
                                        { label: "Cybercrime", number: "1930" },
                                        { label: "Legal Aid (NALSA)", number: "15100" },
                                    ]),
                            ].map((item) => (
                                <a
                                    key={item.number}
                                    href={`tel:${item.number.replace(/-/g, "")}`}
                                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${activeGender === "female"
                                        ? "bg-pink-200 text-pink-800 hover:bg-pink-300"
                                        : "bg-blue-200 text-blue-800 hover:bg-blue-300"
                                        }`}
                                >
                                    <Phone className="w-3 h-3" />
                                    {item.label}: <strong>{item.number}</strong>
                                </a>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Disclaimer */}
            <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl border border-gray-200">
                <Info className="w-5 h-5 text-gray-500 mt-0.5 shrink-0" />
                <p className="text-xs text-gray-600 leading-relaxed">
                    <span className="font-semibold text-gray-700">Note:</span> This information is for general awareness only.
                    For specific legal advice, please consult a qualified legal professional or contact your nearest
                    District Legal Services Authority (DLSA).
                </p>
            </div>
        </div>
    );
};

export default SafetyGuidelines;
