import React, { useState, useRef } from "react";
import { searchBNSSections, bnsCategories } from "../data/bnsData";
import type { BNSSection } from "../data/bnsData";
import {
    Search,
    Scale,
    BookOpen,
    AlertTriangle,
    Loader2,
    ChevronRight,
    Sparkles,
    Info,
    Shield,
} from "lucide-react";

const categoryIcons: Record<string, React.ReactNode> = {
    "Offences Against Body": <AlertTriangle className="w-4 h-4" />,
    "Offences Against Women": <Shield className="w-4 h-4" />,
    "Offences Against Property": <BookOpen className="w-4 h-4" />,
    "Offences Against Public Tranquility": <AlertTriangle className="w-4 h-4" />,
    "Cyber & Organized Crime": <AlertTriangle className="w-4 h-4" />,
    "Defamation & Intimidation": <AlertTriangle className="w-4 h-4" />,
    "Offences Against State": <Shield className="w-4 h-4" />,
    "Offences Related to Documents": <BookOpen className="w-4 h-4" />,
    "Offences Related to Public Servants": <Scale className="w-4 h-4" />,
    "Miscellaneous": <Info className="w-4 h-4" />,
};

const categoryColors: Record<string, string> = {
    "Offences Against Body": "from-red-500 to-rose-600",
    "Offences Against Women": "from-purple-500 to-purple-700",
    "Offences Against Property": "from-amber-500 to-orange-600",
    "Offences Against Public Tranquility": "from-teal-500 to-teal-700",
    "Cyber & Organized Crime": "from-cyan-500 to-blue-600",
    "Defamation & Intimidation": "from-pink-500 to-rose-600",
    "Offences Against State": "from-slate-600 to-slate-800",
    "Offences Related to Documents": "from-indigo-500 to-indigo-700",
    "Offences Related to Public Servants": "from-emerald-500 to-emerald-700",
    "Miscellaneous": "from-gray-500 to-gray-700",
};

const categoryBadgeColors: Record<string, string> = {
    "Offences Against Body": "bg-red-100 text-red-700 border-red-200",
    "Offences Against Women": "bg-purple-100 text-purple-700 border-purple-200",
    "Offences Against Property": "bg-amber-100 text-amber-700 border-amber-200",
    "Offences Against Public Tranquility": "bg-teal-100 text-teal-700 border-teal-200",
    "Cyber & Organized Crime": "bg-cyan-100 text-cyan-700 border-cyan-200",
    "Defamation & Intimidation": "bg-pink-100 text-pink-700 border-pink-200",
    "Offences Against State": "bg-slate-100 text-slate-700 border-slate-200",
    "Offences Related to Documents": "bg-indigo-100 text-indigo-700 border-indigo-200",
    "Offences Related to Public Servants": "bg-emerald-100 text-emerald-700 border-emerald-200",
    "Miscellaneous": "bg-gray-100 text-gray-700 border-gray-200",
};

const AILegalSuggestion: React.FC = () => {
    const [crimeDescription, setCrimeDescription] = useState("");
    const [results, setResults] = useState<(BNSSection & { relevanceScore: number })[]>([]);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [hasSearched, setHasSearched] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const handleAnalyze = async () => {
        if (!crimeDescription.trim() || crimeDescription.trim().length < 3) return;

        setIsAnalyzing(true);
        setHasSearched(false);
        setResults([]);

        // Simulate AI processing delay for UX feel
        await new Promise((resolve) => setTimeout(resolve, 1500));

        const matched = searchBNSSections(crimeDescription);
        setResults(matched);
        setIsAnalyzing(false);
        setHasSearched(true);
        setSelectedCategory(null);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleAnalyze();
        }
    };

    const filteredResults = selectedCategory
        ? results.filter((r) => r.category === selectedCategory)
        : results;

    const resultCategories = [...new Set(results.map((r) => r.category))];

    const getRelevanceBadge = (score: number) => {
        if (score >= 6) return { label: "High Match", color: "bg-green-100 text-green-700 border-green-300" };
        if (score >= 3) return { label: "Medium Match", color: "bg-yellow-100 text-yellow-700 border-yellow-300" };
        return { label: "Possible Match", color: "bg-blue-100 text-blue-700 border-blue-300" };
    };

    const exampleQueries = [
        "Someone stole my phone from my pocket",
        "My neighbor is threatening to harm me",
        "I was cheated online through a fake website",
        "My husband and in-laws demand dowry",
        "Someone is stalking me on social media",
        "A person attacked me with a knife",
    ];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600 p-6 sm:p-8 text-white shadow-xl">
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0djZoLTJ2LTZoMnptMC0xMHY2aC0ydi02aDJ6bTAtMTB2NmgtMnYtNmgyeiIvPjwvZz48L2c+PC9zdmc+')] opacity-30" />
                <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="p-2.5 bg-white/20 rounded-xl backdrop-blur-sm">
                            <Scale className="w-6 h-6" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold tracking-tight">
                                AI Legal Section Finder
                            </h2>
                            <p className="text-white/80 text-sm mt-0.5">
                                Powered by BNS (Bharatiya Nyaya Sanhita, 2023)
                            </p>
                        </div>
                    </div>
                    <p className="text-white/70 text-sm max-w-2xl leading-relaxed">
                        Describe the crime or incident in your own words, and our AI will suggest the most
                        relevant legal sections from the Bharatiya Nyaya Sanhita (BNS), 2023 — India's new criminal code.
                    </p>
                </div>
            </div>

            {/* Input Section */}
            <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
                <div className="p-5 sm:p-6">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                        <Sparkles className="w-4 h-4 inline-block mr-1.5 text-purple-500" />
                        Describe the Crime or Incident
                    </label>
                    <textarea
                        ref={textareaRef}
                        value={crimeDescription}
                        onChange={(e) => setCrimeDescription(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="e.g., Someone broke into my house and stole my laptop and jewelry..."
                        rows={4}
                        className="w-full px-4 py-3 rounded-xl border border-gray-300 bg-gray-50 text-gray-800 placeholder-gray-400 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 focus:bg-white transition-all duration-200 resize-none text-sm leading-relaxed"
                    />

                    {/* Example Queries */}
                    <div className="mt-3">
                        <p className="text-xs text-gray-500 mb-2">Try an example:</p>
                        <div className="flex flex-wrap gap-2">
                            {exampleQueries.map((q, i) => (
                                <button
                                    key={i}
                                    onClick={() => {
                                        setCrimeDescription(q);
                                        textareaRef.current?.focus();
                                    }}
                                    className="text-xs px-3 py-1.5 rounded-full bg-gray-100 text-gray-600 hover:bg-purple-100 hover:text-purple-700 transition-colors duration-200 border border-gray-200 hover:border-purple-300"
                                >
                                    {q}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Analyze Button */}
                <div className="px-5 sm:px-6 pb-5 sm:pb-6">
                    <button
                        onClick={handleAnalyze}
                        disabled={isAnalyzing || crimeDescription.trim().length < 3}
                        className="w-full sm:w-auto px-8 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 flex items-center justify-center gap-2"
                    >
                        {isAnalyzing ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                Analyzing Crime Description...
                            </>
                        ) : (
                            <>
                                <Search className="w-5 h-5" />
                                Analyze & Find Sections
                            </>
                        )}
                    </button>
                </div>
            </div>

            {/* Analyzing State */}
            {isAnalyzing && (
                <div className="rounded-xl border border-purple-200 bg-purple-50 p-8 text-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-purple-100 mb-4">
                        <Loader2 className="w-8 h-8 text-purple-600 animate-spin" />
                    </div>
                    <h3 className="text-lg font-semibold text-purple-800 mb-1">
                        Analyzing your description...
                    </h3>
                    <p className="text-sm text-purple-600">
                        Matching against BNS sections to find the most relevant legal provisions
                    </p>
                </div>
            )}

            {/* Results */}
            {hasSearched && !isAnalyzing && (
                <div className="space-y-4">
                    {results.length > 0 ? (
                        <>
                            {/* Results Header */}
                            <div className="flex items-center justify-between flex-wrap gap-3">
                                <div className="flex items-center gap-2">
                                    <div className="p-1.5 bg-green-100 rounded-lg">
                                        <Scale className="w-4 h-4 text-green-600" />
                                    </div>
                                    <h3 className="text-lg font-bold text-gray-800">
                                        {results.length} Relevant Section{results.length > 1 ? "s" : ""} Found
                                    </h3>
                                </div>
                            </div>

                            {/* Category Filter Pills */}
                            {resultCategories.length > 1 && (
                                <div className="flex flex-wrap gap-2">
                                    <button
                                        onClick={() => setSelectedCategory(null)}
                                        className={`text-xs px-3 py-1.5 rounded-full border transition-all duration-200 ${!selectedCategory
                                                ? "bg-gray-800 text-white border-gray-800"
                                                : "bg-white text-gray-600 border-gray-300 hover:bg-gray-100"
                                            }`}
                                    >
                                        All ({results.length})
                                    </button>
                                    {resultCategories.map((cat) => (
                                        <button
                                            key={cat}
                                            onClick={() => setSelectedCategory(cat === selectedCategory ? null : cat)}
                                            className={`text-xs px-3 py-1.5 rounded-full border transition-all duration-200 ${selectedCategory === cat
                                                    ? "bg-gray-800 text-white border-gray-800"
                                                    : "bg-white text-gray-600 border-gray-300 hover:bg-gray-100"
                                                }`}
                                        >
                                            {cat} ({results.filter((r) => r.category === cat).length})
                                        </button>
                                    ))}
                                </div>
                            )}

                            {/* Result Cards */}
                            <div className="grid gap-4">
                                {filteredResults.map((result, index) => {
                                    const relevance = getRelevanceBadge(result.relevanceScore);
                                    const gradient = categoryColors[result.category] || "from-gray-500 to-gray-700";
                                    const badgeColor = categoryBadgeColors[result.category] || "bg-gray-100 text-gray-700 border-gray-200";

                                    return (
                                        <div
                                            key={`${result.section}-${index}`}
                                            className="group relative rounded-xl border border-gray-200 bg-white shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden"
                                        >
                                            {/* Gradient top bar */}
                                            <div className={`h-1.5 bg-gradient-to-r ${gradient}`} />

                                            <div className="p-5 sm:p-6">
                                                <div className="flex items-start justify-between gap-4 mb-3">
                                                    <div className="flex items-center gap-3">
                                                        <div className={`p-2 rounded-lg bg-gradient-to-br ${gradient} text-white shadow-md`}>
                                                            {categoryIcons[result.category] || <Scale className="w-4 h-4" />}
                                                        </div>
                                                        <div>
                                                            <h4 className="font-bold text-gray-900 text-base">
                                                                {result.section} — {result.title}
                                                            </h4>
                                                            <span className={`inline-flex items-center text-xs px-2 py-0.5 rounded-full border mt-1 ${badgeColor}`}>
                                                                {result.category}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <span className={`shrink-0 inline-flex items-center text-xs px-2.5 py-1 rounded-full border font-medium ${relevance.color}`}>
                                                        {relevance.label}
                                                    </span>
                                                </div>

                                                <p className="text-sm text-gray-600 leading-relaxed mb-4">
                                                    {result.description}
                                                </p>

                                                <div className="flex items-start gap-2 p-3 bg-amber-50 rounded-lg border border-amber-200">
                                                    <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                                                    <div>
                                                        <span className="text-xs font-semibold text-amber-800">Punishment: </span>
                                                        <span className="text-xs text-amber-700">{result.punishment}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Disclaimer */}
                            <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-xl border border-blue-200">
                                <Info className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
                                <div>
                                    <p className="text-sm font-semibold text-blue-800 mb-0.5">Disclaimer</p>
                                    <p className="text-xs text-blue-700 leading-relaxed">
                                        These suggestions are for informational purposes only and are based on keyword matching.
                                        For accurate legal advice, please consult a qualified legal professional.
                                        The actual applicable sections may vary based on the complete facts of the case.
                                    </p>
                                </div>
                            </div>
                        </>
                    ) : (
                        /* No Results */
                        <div className="rounded-xl border border-gray-200 bg-white p-8 text-center shadow-sm">
                            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
                                <Search className="w-8 h-8 text-gray-400" />
                            </div>
                            <h3 className="text-lg font-semibold text-gray-700 mb-2">
                                No Matching Sections Found
                            </h3>
                            <p className="text-sm text-gray-500 max-w-md mx-auto leading-relaxed">
                                Try describing the incident in more detail, or use different words.
                                For example, mention specific actions like "stole", "attacked", "threatened", etc.
                            </p>
                        </div>
                    )}
                </div>
            )}

            {/* Initial State - Category Overview */}
            {!hasSearched && !isAnalyzing && (
                <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
                    <div className="p-5 sm:p-6">
                        <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
                            <BookOpen className="w-4 h-4 text-gray-500" />
                            BNS Categories Covered
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {bnsCategories.map((cat) => {
                                const gradient = categoryColors[cat] || "from-gray-500 to-gray-700";
                                return (
                                    <div
                                        key={cat}
                                        className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors duration-200"
                                    >
                                        <div className={`p-1.5 rounded-md bg-gradient-to-br ${gradient} text-white`}>
                                            {categoryIcons[cat] || <Scale className="w-3.5 h-3.5" />}
                                        </div>
                                        <span className="text-sm text-gray-700 font-medium">{cat}</span>
                                        <ChevronRight className="w-3.5 h-3.5 text-gray-400 ml-auto" />
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AILegalSuggestion;
