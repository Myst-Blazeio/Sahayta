import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    BookOpen,
    Shield,
    Scale,
    Play,
    ChevronDown,
    ExternalLink,
    PhoneCall,
    AlertTriangle,
    Heart,
    Zap,
    Eye,
    Hand,
} from "lucide-react";

type ResourceCategory = "all" | "self_defense" | "emergency" | "legal_rights" | "awareness";

interface Resource {
    id: string;
    category: ResourceCategory;
    title: string;
    description: string;
    type: "guide" | "video" | "tip" | "article";
    content: string[];
    source?: string;
}

const categoryConfig: Record<
    Exclude<ResourceCategory, "all">,
    { label: string; icon: React.ReactNode; color: string }
> = {
    self_defense: {
        label: "Self-Defense",
        icon: <Hand className="w-4 h-4" />,
        color: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
    },
    emergency: {
        label: "Emergency Actions",
        icon: <Zap className="w-4 h-4" />,
        color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
    },
    legal_rights: {
        label: "Legal Rights",
        icon: <Scale className="w-4 h-4" />,
        color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    },
    awareness: {
        label: "Awareness",
        icon: <Eye className="w-4 h-4" />,
        color: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
    },
};

const typeConfig: Record<string, { label: string; icon: React.ReactNode }> = {
    guide: { label: "Guide", icon: <BookOpen className="w-3.5 h-3.5" /> },
    video: { label: "Video", icon: <Play className="w-3.5 h-3.5" /> },
    tip: { label: "Tips", icon: <Zap className="w-3.5 h-3.5" /> },
    article: { label: "Article", icon: <ExternalLink className="w-3.5 h-3.5" /> },
};

const resources: Resource[] = [
    {
        id: "1",
        category: "self_defense",
        title: "5 Basic Self-Defense Moves Every Woman Must Know",
        description: "Simple yet effective techniques to protect yourself in threatening situations.",
        type: "guide",
        content: [
            "🥊 Palm Strike — Use the base of your palm to strike the attacker's nose or chin upward. More effective than a fist punch and less likely to injure your hand.",
            "🦵 Groin Kick — If the attacker is close, drive your knee or foot upward into the groin area. Follow up by running to safety immediately.",
            "👁️ Eye Gouge — Use your thumbs or fingers to press into the attacker's eyes. This temporarily blinds them and creates an escape window.",
            "🗣️ Elbow Strike — If grabbed from behind, swing your elbow hard into the attacker's ribs or face. The elbow is one of the strongest points of your body.",
            "🦶 Heel Stomp — If someone grabs you from behind, stomp hard on the top of their foot with your heel. This causes intense pain and loosens their grip.",
        ],
    },
    {
        id: "2",
        category: "emergency",
        title: "What to Do If You're Being Followed",
        description: "Step-by-step actions to take when you suspect someone is following you.",
        type: "tip",
        content: [
            "Stay calm and do NOT go home — the follower may discover where you live.",
            "Change direction or cross the street to confirm if you're being followed.",
            "Head to the nearest crowded, well-lit public place (shop, restaurant, police station).",
            "Call 112 or 181 (Women Helpline) immediately and describe the person and your location.",
            "If in a vehicle, drive to the nearest police station. Do NOT stop in isolated areas.",
            "Make noise — shout 'FIRE!' instead of 'HELP!' as it draws more attention from bystanders.",
            "Share your live location with a trusted contact via WhatsApp or Google Maps.",
        ],
    },
    {
        id: "3",
        category: "legal_rights",
        title: "Your Legal Rights as a Woman in India",
        description: "Key laws that protect women — know your rights to stay empowered.",
        type: "article",
        content: [
            "⚖️ Section 354 BNS — Assault on a woman with intent to outrage her modesty is punishable with up to 2 years imprisonment.",
            "⚖️ Section 74 BNS (Stalking) — Following, contacting, or attempting to contact a woman repeatedly despite clear disinterest is punishable with up to 3 years imprisonment.",
            "⚖️ Section 78 BNS (Voyeurism) — Watching or capturing images of a woman in private acts without consent is punishable with up to 3 years imprisonment.",
            "⚖️ Zero FIR — You can file an FIR at ANY police station regardless of jurisdiction. The police CANNOT refuse.",
            "⚖️ Right to Complain Online — Women can file complaints through the National Commission for Women (NCW) online portal.",
            "⚖️ Free Legal Aid — Women are entitled to free legal aid regardless of income under the Legal Services Authorities Act.",
        ],
    },
    {
        id: "4",
        category: "self_defense",
        title: "Everyday Items You Can Use for Self-Defense",
        description: "Common objects that double as effective self-defense tools in emergencies.",
        type: "guide",
        content: [
            "🔑 Keys — Hold keys between your fingers in a fist to use as a jabbing weapon.",
            "🌂 Umbrella — Use the pointed end to jab or swing as a striking tool.",
            "📱 Phone — Use the corner edge of your phone to strike sensitive areas.",
            "✏️ Pen / Pencil — Grip firmly and jab towards the attacker's hand or arm.",
            "👜 Handbag — Swing a heavy handbag at the attacker's head or face.",
            "🧴 Perfume / Deodorant — Spray directly into the attacker's eyes to temporarily blind them.",
            "☕ Hot Beverage — Throw hot coffee or tea at the attacker's face as a distraction and run.",
        ],
    },
    {
        id: "5",
        category: "emergency",
        title: "Emergency Actions During an Attack",
        description: "Critical first-response actions to maximize your safety during an active threat.",
        type: "tip",
        content: [
            "🔊 Make as much noise as possible — scream, use a whistle, trigger a car alarm.",
            "🏃 Your #1 priority is to ESCAPE, not to fight. Run the moment you get an opening.",
            "📍 Memorize details — note the attacker's face, clothing, vehicle, and direction of escape.",
            "📞 Call 112 immediately after reaching safety — do NOT wait.",
            "🏥 Go to the nearest hospital if injured, even for minor wounds — this creates a medical record.",
            "📝 File a Zero FIR at the nearest police station — your statement is evidence.",
            "❌ Do NOT shower or change clothes after a sexual assault — preserve physical evidence.",
        ],
    },
    {
        id: "6",
        category: "awareness",
        title: "Digital Safety Tips for Women",
        description: "Protect yourself online from stalking, harassment, and cybercrime.",
        type: "article",
        content: [
            "🔒 Review privacy settings on all social media — set profiles to private/friends-only.",
            "📍 Disable geotagging on photos and check-ins — avoid revealing your real-time location.",
            "🚫 Never share personal details (address, workplace, daily routine) with strangers online.",
            "📸 Be cautious with video calls from unknown contacts — recordings can be misused.",
            "🛡️ Use two-factor authentication (2FA) on all accounts — prevents unauthorized access.",
            "⚠️ Report cyberstalking to the Cyber Crime Cell (cybercrime.gov.in) — it is a criminal offense under Section 74 BNS.",
            "💾 Take screenshots of harassment messages as evidence before blocking the person.",
        ],
    },
    {
        id: "7",
        category: "awareness",
        title: "Workplace Harassment — Know Your Rights",
        description: "Understanding the POSH Act and your protections against workplace harassment.",
        type: "article",
        content: [
            "The POSH Act, 2013 (Prevention of Sexual Harassment at Workplace) protects all women — permanent, temporary, contract, or intern.",
            "Every organization with 10+ employees MUST have an Internal Complaints Committee (ICC).",
            "Complaints must be addressed within 90 days — the employer is legally bound to act.",
            "You can complain to the Local Complaints Committee (LCC) if your workplace lacks an ICC.",
            "Retaliation against the complainant (transfer, demotion, termination) is illegal under the Act.",
            "Anonymous complaints ARE accepted by the ICC — your identity can be protected.",
        ],
    },
    {
        id: "8",
        category: "legal_rights",
        title: "How to File a Complaint at a Police Station",
        description: "Step-by-step guide to ensure your complaint is properly registered.",
        type: "guide",
        content: [
            "1️⃣ Go to ANY police station — you have the right to file a Zero FIR regardless of jurisdiction.",
            "2️⃣ Clearly state your complaint — the officer is LEGALLY BOUND to register it (Section 154 CrPC).",
            "3️⃣ If the officer refuses, escalate to the Station House Officer (SHO) or SP's office.",
            "4️⃣ You can also send your complaint by post/email to the SP — this constitutes a valid complaint.",
            "5️⃣ A woman complainant can give her statement at her residence to a female officer.",
            "6️⃣ Ask for a FREE copy of the FIR — the police must provide it under the law.",
            "7️⃣ If still refused, file a complaint on the state police website or through the NCW portal.",
        ],
    },
];

const helplines = [
    { name: "Women Helpline", number: "181", desc: "24×7 National Women's Helpline" },
    { name: "Police Emergency", number: "112", desc: "Universal Emergency Number" },
    { name: "Domestic Violence", number: "1091", desc: "Women in Distress" },
    { name: "NCW Helpline", number: "7827-170-170", desc: "National Commission for Women" },
    { name: "Cyber Crime", number: "1930", desc: "Cyber Fraud & Online Harassment" },
    { name: "Child Helpline", number: "1098", desc: "Children in Need of Care" },
];

const SelfDefenseResources: React.FC = () => {
    const [activeCategory, setActiveCategory] = useState<ResourceCategory>("all");
    const [expandedId, setExpandedId] = useState<string | null>(null);

    const filtered =
        activeCategory === "all"
            ? resources
            : resources.filter((r) => r.category === activeCategory);

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex items-center gap-3">
                <div className="p-2.5 bg-amber-100 rounded-xl dark:bg-amber-900/30">
                    <Shield className="w-6 h-6 text-amber-700 dark:text-amber-400" />
                </div>
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-foreground">
                        Self-Defense & Safety Resources
                    </h2>
                    <p className="text-sm text-muted-foreground">
                        Guides, tips & legal rights to empower and protect you
                    </p>
                </div>
            </div>

            {/* Empowerment Banner */}
            <div className="bg-gradient-to-r from-amber-50 via-orange-50 to-yellow-50 dark:from-amber-900/20 dark:via-orange-900/20 dark:to-yellow-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-5">
                <div className="flex items-start gap-3">
                    <div className="p-2 bg-amber-100 dark:bg-amber-900/40 rounded-lg mt-0.5">
                        <Heart className="w-5 h-5 text-amber-700 dark:text-amber-400" />
                    </div>
                    <div>
                        <h3 className="font-bold text-amber-800 dark:text-amber-300 text-sm uppercase tracking-wide">
                            Knowledge Is Your First Line of Defense
                        </h3>
                        <p className="text-sm text-amber-700 dark:text-amber-400 mt-1 leading-relaxed">
                            Being informed about your rights, knowing basic self-defense, and
                            understanding emergency protocols can save lives. Share these resources
                            with friends and family.
                        </p>
                    </div>
                </div>
            </div>

            {/* Emergency Helplines */}
            <div>
                <h3 className="text-lg font-bold mb-3 flex items-center gap-2">
                    <PhoneCall className="w-5 h-5 text-red-500" />
                    Emergency Helplines
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {helplines.map((hl) => (
                        <a
                            key={hl.number}
                            href={`tel:${hl.number.replace(/-/g, "")}`}
                            className="p-3 rounded-xl border border-border bg-card hover:shadow-md transition-shadow official-card flex items-center gap-3"
                        >
                            <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                                <PhoneCall className="w-4 h-4 text-red-600 dark:text-red-400" />
                            </div>
                            <div className="min-w-0">
                                <p className="font-black text-lg text-foreground leading-tight">{hl.number}</p>
                                <p className="text-[10px] text-muted-foreground uppercase font-semibold truncate">{hl.name}</p>
                            </div>
                        </a>
                    ))}
                </div>
            </div>

            {/* Category Filters */}
            <div>
                <div className="flex flex-wrap gap-2 mb-5">
                    <button
                        onClick={() => setActiveCategory("all")}
                        className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${activeCategory === "all"
                            ? "bg-amber-600 text-white shadow-sm"
                            : "bg-muted/60 text-muted-foreground hover:bg-muted"
                            }`}
                    >
                        All Resources
                    </button>
                    {(Object.keys(categoryConfig) as Exclude<ResourceCategory, "all">[]).map((cat) => {
                        const config = categoryConfig[cat];
                        return (
                            <button
                                key={cat}
                                onClick={() => setActiveCategory(cat)}
                                className={`px-4 py-2 rounded-full text-sm font-semibold transition-all flex items-center gap-1.5 ${activeCategory === cat
                                    ? "bg-amber-600 text-white shadow-sm"
                                    : "bg-muted/60 text-muted-foreground hover:bg-muted"
                                    }`}
                            >
                                {config.icon}
                                {config.label}
                            </button>
                        );
                    })}
                </div>

                {/* Resource Cards */}
                <div className="space-y-4">
                    {filtered.map((resource, idx) => {
                        const catConf = categoryConfig[resource.category as Exclude<ResourceCategory, "all">];
                        const typeConf = typeConfig[resource.type];
                        const isExpanded = expandedId === resource.id;

                        return (
                            <motion.div
                                key={resource.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.05 }}
                                className="border rounded-xl bg-card shadow-sm official-card overflow-hidden"
                            >
                                <div
                                    onClick={() => setExpandedId(isExpanded ? null : resource.id)}
                                    className="p-5 cursor-pointer hover:bg-accent/30 transition"
                                >
                                    <div className="flex flex-col md:flex-row justify-between gap-3">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-2 flex-wrap">
                                                <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold flex items-center gap-1 ${catConf.color}`}>
                                                    {catConf.icon}
                                                    {catConf.label}
                                                </span>
                                                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 flex items-center gap-1 uppercase">
                                                    {typeConf.icon}
                                                    {typeConf.label}
                                                </span>
                                            </div>
                                            <h4 className="font-bold text-base text-gray-900 dark:text-foreground">
                                                {resource.title}
                                            </h4>
                                            <p className="text-sm text-muted-foreground mt-1">
                                                {resource.description}
                                            </p>
                                        </div>
                                        <div className="flex items-center self-end md:self-center">
                                            <ChevronDown
                                                className={`w-5 h-5 text-muted-foreground transition-transform ${isExpanded ? "rotate-180" : ""
                                                    }`}
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Expanded Content */}
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
                                                <div className="space-y-2.5">
                                                    {resource.content.map((item, i) => (
                                                        <div
                                                            key={i}
                                                            className="text-sm p-3 bg-muted/40 rounded-lg leading-relaxed text-foreground/85"
                                                        >
                                                            {item}
                                                        </div>
                                                    ))}
                                                </div>
                                                {resource.source && (
                                                    <p className="text-xs text-muted-foreground mt-3 flex items-center gap-1">
                                                        <ExternalLink className="w-3 h-3" />
                                                        Source: {resource.source}
                                                    </p>
                                                )}
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </motion.div>
                        );
                    })}
                </div>
            </div>

            {/* Safety Reminder */}
            <div className="p-5 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
                <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <div>
                        <h4 className="font-bold text-red-800 dark:text-red-300 text-sm">
                            Remember: Your Safety Comes First
                        </h4>
                        <p className="text-sm text-red-700 dark:text-red-400 mt-1 leading-relaxed">
                            Self-defense is a last resort. Always prioritize escape over
                            confrontation. If you feel unsafe, call <strong>112</strong> or{" "}
                            <strong>181</strong> (Women Helpline) immediately. Share this page
                            with your loved ones.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SelfDefenseResources;
