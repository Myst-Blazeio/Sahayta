// Curated BNS (Bharatiya Nyaya Sanhita, 2023) sections with keyword mappings
// Source: research/fir_research/testing1.csv

export interface BNSSection {
    section: string;
    title: string;
    description: string;
    keywords: string[];
    punishment: string;
    category: string;
}

export const bnsCategories = [
    "Offences Against Body",
    "Offences Against Women",
    "Offences Against Property",
    "Offences Against Public Tranquility",
    "Cyber & Organized Crime",
    "Defamation & Intimidation",
    "Offences Against State",
    "Offences Related to Documents",
    "Offences Related to Public Servants",
    "Miscellaneous",
];

export const bnsSections: BNSSection[] = [
    // === Offences Against Body ===
    {
        section: "BNS 100",
        title: "Culpable Homicide",
        description:
            "Causing death by doing an act with intention or knowledge that it is likely to cause death.",
        keywords: [
            "kill", "killed", "murder", "death", "homicide", "die", "died",
            "dead", "manslaughter", "slay", "slain",
        ],
        punishment: "Imprisonment for life, or up to 10 years + fine",
        category: "Offences Against Body",
    },
    {
        section: "BNS 101",
        title: "Murder",
        description:
            "Culpable homicide is murder if the act is done with intention of causing death or such bodily injury as is likely to cause death.",
        keywords: [
            "murder", "murdered", "killing", "intentional killing", "premeditated",
            "assassinate", "assassinated",
        ],
        punishment: "Death or imprisonment for life + fine",
        category: "Offences Against Body",
    },
    {
        section: "BNS 103",
        title: "Punishment for Murder",
        description:
            "Whoever commits murder shall be punished with death or imprisonment for life. Group murder on grounds of caste, race, etc. attracts death penalty.",
        keywords: [
            "murder punishment", "mob lynching", "lynching", "group murder",
            "caste killing", "honor killing", "honour killing",
        ],
        punishment: "Death or imprisonment for life + fine",
        category: "Offences Against Body",
    },
    {
        section: "BNS 105",
        title: "Death by Negligence",
        description:
            "Causing death by rash or negligent act not amounting to culpable homicide.",
        keywords: [
            "negligence", "negligent", "accident", "reckless", "careless",
            "rash driving", "road accident", "hit and run", "car accident",
            "vehicle accident", "drunk driving",
        ],
        punishment: "Up to 5 years imprisonment + fine; up to 10 years for rash driving escape",
        category: "Offences Against Body",
    },
    {
        section: "BNS 108",
        title: "Abetment of Suicide",
        description:
            "If any person commits suicide, whoever abets the commission of such suicide shall be punished.",
        keywords: [
            "suicide", "abetment", "abet suicide", "drove to suicide",
            "mental harassment", "forced suicide",
        ],
        punishment: "Up to 10 years imprisonment + fine",
        category: "Offences Against Body",
    },
    {
        section: "BNS 114",
        title: "Causing Hurt",
        description:
            "Whoever causes bodily pain, disease or infirmity to any person is said to cause hurt.",
        keywords: [
            "hurt", "pain", "hit", "beat", "punch", "slap", "kick",
            "injury", "injured", "wound", "attack", "assault", "beaten",
        ],
        punishment: "Up to 1 year imprisonment or fine up to ₹10,000 or both",
        category: "Offences Against Body",
    },
    {
        section: "BNS 115",
        title: "Voluntarily Causing Hurt",
        description:
            "Whoever does any act intending to cause hurt, or knowing it likely to cause hurt, and does cause hurt.",
        keywords: [
            "voluntarily hurt", "intentional hurt", "deliberately hit",
            "attacked intentionally", "beat up",
        ],
        punishment: "Up to 1 year imprisonment or fine up to ₹10,000 or both",
        category: "Offences Against Body",
    },
    {
        section: "BNS 117",
        title: "Voluntarily Causing Grievous Hurt",
        description:
            "Whoever voluntarily causes hurt, if the hurt is grievous (fracture, permanent damage to sight/hearing, disfigurement etc.).",
        keywords: [
            "grievous hurt", "fracture", "broken bone", "permanent injury",
            "blind", "deaf", "disfigure", "serious injury", "severe injury",
            "stabbed", "stab", "knife attack", "acid",
        ],
        punishment: "Up to 7 years imprisonment + fine",
        category: "Offences Against Body",
    },
    {
        section: "BNS 124",
        title: "Acid Attack",
        description:
            "Causing permanent damage, burns, maims, disfigures or disables by throwing acid or administering acid.",
        keywords: [
            "acid attack", "acid throw", "acid burn", "disfigure",
            "acid victim", "chemical attack",
        ],
        punishment: "Not less than 10 years, extendable to life imprisonment + fine",
        category: "Offences Against Body",
    },
    {
        section: "BNS 125",
        title: "Rash Act Endangering Life",
        description:
            "Whoever does any act so rashly or negligently as to endanger human life or personal safety.",
        keywords: [
            "rash act", "endanger life", "dangerous act", "reckless",
            "negligent act", "risk life",
        ],
        punishment: "Up to 3 months imprisonment or fine up to ₹250 or both",
        category: "Offences Against Body",
    },
    // === Offences Against Women ===
    {
        section: "BNS 63",
        title: "Rape",
        description:
            "Definition of rape — penetration, insertion of objects, manipulation of body, or application of mouth without consent.",
        keywords: [
            "rape", "raped", "sexual assault", "sexual violence",
            "forced sex", "non-consensual", "molestation",
        ],
        punishment: "Not less than 10 years, extendable to life imprisonment + fine",
        category: "Offences Against Women",
    },
    {
        section: "BNS 74",
        title: "Assault on Woman to Outrage Modesty",
        description:
            "Whoever assaults or uses criminal force to any woman intending to outrage her modesty.",
        keywords: [
            "modesty", "outrage modesty", "groping", "touched inappropriately",
            "molestation", "molested", "eve teasing", "inappropriate touch",
        ],
        punishment: "Not less than 1 year, extendable to 5 years + fine",
        category: "Offences Against Women",
    },
    {
        section: "BNS 75",
        title: "Sexual Harassment",
        description:
            "Physical contact with sexual overtures, demand for sexual favours, showing pornography, making sexual remarks.",
        keywords: [
            "sexual harassment", "sexual favour", "pornography",
            "sexual remark", "workplace harassment", "unwelcome advance",
        ],
        punishment: "Up to 3 years imprisonment or fine or both",
        category: "Offences Against Women",
    },
    {
        section: "BNS 78",
        title: "Stalking",
        description:
            "Following a woman, contacting despite disinterest, monitoring internet/electronic use.",
        keywords: [
            "stalking", "stalker", "following", "monitoring", "tracking",
            "cyber stalking", "online stalking", "harassing online",
        ],
        punishment: "Up to 3 years imprisonment + fine; up to 5 years for repeat offence",
        category: "Offences Against Women",
    },
    {
        section: "BNS 80",
        title: "Dowry Death",
        description:
            "Death of a woman within 7 years of marriage caused by burns or injury, where she was subjected to cruelty for dowry.",
        keywords: [
            "dowry death", "dowry", "bride burning", "dowry harassment",
            "dowry demand", "dowry torture",
        ],
        punishment: "Not less than 7 years, extendable to life imprisonment",
        category: "Offences Against Women",
    },
    {
        section: "BNS 85",
        title: "Cruelty by Husband or Relatives",
        description:
            "Husband or relatives of husband subjecting a woman to cruelty.",
        keywords: [
            "domestic violence", "cruelty", "husband abuse", "in-laws",
            "marital cruelty", "wife beating", "domestic abuse",
        ],
        punishment: "Up to 3 years imprisonment + fine",
        category: "Offences Against Women",
    },
    // === Offences Against Property ===
    {
        section: "BNS 303",
        title: "Theft",
        description:
            "Dishonestly taking movable property out of possession of any person without consent.",
        keywords: [
            "theft", "steal", "stole", "stolen", "thief", "rob",
            "robbed", "pickpocket", "snatch", "snatched", "shoplifting",
            "phone stolen", "wallet stolen", "bike stolen", "car stolen",
        ],
        punishment: "Up to 3 years imprisonment or fine or both",
        category: "Offences Against Property",
    },
    {
        section: "BNS 304",
        title: "Snatching",
        description:
            "Theft by suddenly or forcibly seizing property from a person.",
        keywords: [
            "snatching", "snatch", "grabbed", "chain snatching",
            "purse snatching", "mobile snatching", "forcibly took",
        ],
        punishment: "Up to 3 years imprisonment + fine",
        category: "Offences Against Property",
    },
    {
        section: "BNS 305",
        title: "Theft in Dwelling/Vehicle",
        description:
            "Theft in a building, tent, vessel, or of transport/articles of value.",
        keywords: [
            "burglary", "home theft", "house theft", "car theft",
            "vehicle theft", "break in", "broke in",
        ],
        punishment: "Up to 7 years imprisonment + fine",
        category: "Offences Against Property",
    },
    {
        section: "BNS 308",
        title: "Extortion",
        description:
            "Putting any person in fear of injury and dishonestly inducing them to deliver property.",
        keywords: [
            "extortion", "extort", "blackmail", "ransom", "threat for money",
            "demanding money", "threats", "threatening",
        ],
        punishment: "Up to 3 years imprisonment or fine or both",
        category: "Offences Against Property",
    },
    {
        section: "BNS 309",
        title: "Robbery",
        description:
            "Theft or extortion accompanied by force or fear of instant death/hurt.",
        keywords: [
            "robbery", "robbed", "armed robbery", "loot", "looted",
            "mugged", "mugging", "hold up", "holdup", "daylight robbery",
        ],
        punishment: "Up to 10 years imprisonment + fine; up to 14 years if on highway",
        category: "Offences Against Property",
    },
    {
        section: "BNS 310",
        title: "Dacoity",
        description:
            "Robbery committed by five or more persons conjointly.",
        keywords: [
            "dacoity", "dacoit", "gang robbery", "armed gang",
            "group robbery", "bandit",
        ],
        punishment: "Up to 10 years imprisonment + fine",
        category: "Offences Against Property",
    },
    {
        section: "BNS 316",
        title: "Criminal Breach of Trust",
        description:
            "Being entrusted with property and dishonestly misappropriating or converting it for own use.",
        keywords: [
            "breach of trust", "misappropriation", "embezzlement",
            "cheated by employee", "trusted person cheated", "misuse funds",
        ],
        punishment: "Up to 5 years imprisonment or fine or both; up to 10 years if by public servant/banker",
        category: "Offences Against Property",
    },
    {
        section: "BNS 318",
        title: "Cheating",
        description:
            "Deceiving any person and dishonestly inducing them to deliver property or alter/destroy valuable security.",
        keywords: [
            "cheating", "cheated", "fraud", "scam", "scammed",
            "deceived", "deception", "con", "duped", "tricked",
            "fake", "fraudulent", "ponzi", "investment fraud",
        ],
        punishment: "Up to 3 years imprisonment or fine or both",
        category: "Offences Against Property",
    },
    {
        section: "BNS 319",
        title: "Cheating by Personation",
        description:
            "Cheating by pretending to be some other person or substituting one person for another.",
        keywords: [
            "impersonation", "identity theft", "fake identity",
            "pretending to be", "personation", "impersonate",
        ],
        punishment: "Up to 5 years imprisonment or fine or both",
        category: "Offences Against Property",
    },
    {
        section: "BNS 324",
        title: "Mischief",
        description:
            "Intentionally causing destruction or damage to property, or making it less useful.",
        keywords: [
            "mischief", "vandalism", "property damage", "destroyed property",
            "damaged", "breaking property", "arson", "fire", "set fire",
        ],
        punishment: "Up to 3 months imprisonment or fine or both",
        category: "Offences Against Property",
    },
    {
        section: "BNS 329",
        title: "Criminal Trespass",
        description:
            "Entering property in possession of another with intent to commit offence, intimidate, insult or annoy.",
        keywords: [
            "trespass", "trespassing", "entered my property",
            "broke into house", "entered without permission",
            "unlawful entry", "intrusion",
        ],
        punishment: "Up to 3 months imprisonment or fine up to ₹500 or both",
        category: "Offences Against Property",
    },
    // === Cyber & Organized Crime ===
    {
        section: "BNS 111",
        title: "Organized Crime",
        description:
            "Continuing unlawful activity including kidnapping, robbery, extortion, cyber-crimes, trafficking, contract killing etc.",
        keywords: [
            "organized crime", "gang", "mafia", "syndicate",
            "criminal organization", "contract killing", "drug trafficking",
            "human trafficking", "arms trafficking",
        ],
        punishment: "Imprisonment for life or death (if resulting in death); otherwise up to 10 years + fine",
        category: "Cyber & Organized Crime",
    },
    {
        section: "BNS 112",
        title: "Petty Organized Crime",
        description:
            "Group committing theft, snatching, cheating, unauthorised selling of tickets, illegal betting, selling exam papers etc.",
        keywords: [
            "petty crime", "ticket scalping", "illegal betting",
            "exam paper leak", "gambling", "organised snatching",
        ],
        punishment: "1 to 7 years imprisonment + fine",
        category: "Cyber & Organized Crime",
    },
    {
        section: "BNS 318",
        title: "Online Fraud / Cyber Cheating",
        description:
            "Deceiving any person through electronic means and dishonestly inducing them to hand over property or money.",
        keywords: [
            "cyber fraud", "online fraud", "phishing", "online scam",
            "hacking", "hacked", "cyber crime", "internet fraud",
            "UPI fraud", "bank fraud", "OTP fraud", "digital fraud",
            "cryptocurrency scam", "crypto scam",
        ],
        punishment: "Up to 3 years imprisonment or fine or both; up to 7 years if cheated of property",
        category: "Cyber & Organized Crime",
    },
    // === Defamation & Intimidation ===
    {
        section: "BNS 351",
        title: "Criminal Intimidation",
        description:
            "Threatening any person with injury to person, reputation or property to cause alarm or compel action.",
        keywords: [
            "threat", "threaten", "threatening", "intimidation",
            "intimidate", "death threat", "life threat", "scared",
            "warned", "warn", "menace",
        ],
        punishment: "Up to 2 years imprisonment or fine or both",
        category: "Defamation & Intimidation",
    },
    {
        section: "BNS 356",
        title: "Defamation",
        description:
            "Making or publishing any imputation concerning any person intended to harm reputation.",
        keywords: [
            "defamation", "defamed", "reputation", "false accusation",
            "slander", "libel", "character assassination", "public shaming",
        ],
        punishment: "Up to 2 years imprisonment or fine or both",
        category: "Defamation & Intimidation",
    },
    // === Kidnapping & Abduction ===
    {
        section: "BNS 137",
        title: "Kidnapping",
        description:
            "Conveying any person beyond India without consent, or taking a minor or person of unsound mind out of lawful guardianship.",
        keywords: [
            "kidnap", "kidnapped", "kidnapping", "abduction", "abducted",
            "missing person", "taken away", "child missing", "hostage",
        ],
        punishment: "Up to 7 years imprisonment + fine",
        category: "Offences Against Body",
    },
    {
        section: "BNS 140",
        title: "Kidnapping for Murder/Ransom",
        description:
            "Kidnapping or abducting any person in order to murder, or subject to grievous hurt, or slavery, or ransom.",
        keywords: [
            "kidnap for ransom", "ransom", "held hostage",
            "kidnap and murder", "abducted for money",
        ],
        punishment: "Imprisonment for life or rigorous imprisonment up to 10 years + fine",
        category: "Offences Against Body",
    },
    // === Offences Against State ===
    {
        section: "BNS 152",
        title: "Sedition / Acts Against Unity of India",
        description:
            "Exciting or attempting to excite secession, armed rebellion, or subversive activities against sovereignty and unity of India.",
        keywords: [
            "sedition", "treason", "anti-national", "secession",
            "armed rebellion", "subversive",
        ],
        punishment: "Imprisonment for life or up to 7 years + fine",
        category: "Offences Against State",
    },
    {
        section: "BNS 113",
        title: "Terrorist Act",
        description:
            "Any act with intent to threaten unity, integrity, sovereignty, or security of India, or to strike terror in people.",
        keywords: [
            "terrorism", "terrorist", "bomb", "explosion", "terror attack",
            "blast", "biological weapon", "chemical weapon",
        ],
        punishment: "Death or imprisonment for life + fine (if death is caused); otherwise up to 10 years",
        category: "Offences Against State",
    },
    // === Offences Related to Documents ===
    {
        section: "BNS 336",
        title: "Forgery",
        description:
            "Making any false document or electronic record with intent to cause damage or to support false claim.",
        keywords: [
            "forgery", "forged", "fake document", "false document",
            "counterfeit", "fabricated", "forged signature",
            "fake certificate", "fake ID",
        ],
        punishment: "Up to 2 years imprisonment or fine or both",
        category: "Offences Related to Documents",
    },
    {
        section: "BNS 337",
        title: "Forgery of Government Document",
        description:
            "Forging a court record, government ID (Aadhaar, voter ID), register of birth/death etc.",
        keywords: [
            "fake aadhaar", "fake voter id", "forged passport",
            "fake government document", "forged court record",
            "fake birth certificate",
        ],
        punishment: "Up to 7 years imprisonment + fine",
        category: "Offences Related to Documents",
    },
    // === Public Tranquility ===
    {
        section: "BNS 189",
        title: "Unlawful Assembly",
        description:
            "Assembly of 5+ persons with common object to overawe by criminal force, resist law, commit mischief, or criminal trespass.",
        keywords: [
            "unlawful assembly", "mob", "riot", "riotous", "gathering",
            "violent protest", "mob violence",
        ],
        punishment: "Up to 6 months imprisonment or fine or both",
        category: "Offences Against Public Tranquility",
    },
    {
        section: "BNS 191",
        title: "Rioting",
        description:
            "When force or violence is used by an unlawful assembly or its members.",
        keywords: [
            "rioting", "riot", "mob attack", "communal violence",
            "stone pelting", "violent mob",
        ],
        punishment: "Up to 2 years imprisonment or fine or both",
        category: "Offences Against Public Tranquility",
    },
    {
        section: "BNS 196",
        title: "Promoting Enmity Between Groups",
        description:
            "Promoting disharmony or hatred on grounds of religion, race, caste, sex, place of birth, language etc.",
        keywords: [
            "communal hatred", "religious hatred", "caste discrimination",
            "hate speech", "communal tension", "incitement",
        ],
        punishment: "Up to 3 years imprisonment or fine or both; up to 5 years if in place of worship",
        category: "Offences Against Public Tranquility",
    },
    // === Offences Related to Public Servants ===
    {
        section: "BNS 217",
        title: "Giving False Information",
        description:
            "Giving false information to a public servant intending to cause them to use lawful power to injure another.",
        keywords: [
            "false information", "false report", "fake complaint",
            "false FIR", "false accusation to police",
        ],
        punishment: "Up to 2 years imprisonment or fine or both",
        category: "Offences Related to Public Servants",
    },
    // === Miscellaneous ===
    {
        section: "BNS 281",
        title: "Rash Driving on Public Way",
        description:
            "Driving any vehicle or riding on public way in a rash or negligent manner endangering human life.",
        keywords: [
            "rash driving", "reckless driving", "dangerous driving",
            "speeding", "over speed", "road rage", "hit and run",
            "drunk driving", "traffic accident",
        ],
        punishment: "Up to 6 months imprisonment or fine up to ₹1000 or both",
        category: "Miscellaneous",
    },
    {
        section: "BNS 270",
        title: "Public Nuisance",
        description:
            "Any act or illegal omission causing common injury, danger or annoyance to the public.",
        keywords: [
            "nuisance", "public nuisance", "noise pollution",
            "disturbance", "public disturbance", "annoyance",
        ],
        punishment: "Fine up to ₹1000",
        category: "Miscellaneous",
    },
    {
        section: "BNS 354",
        title: "Criminal Force / Compulsion",
        description:
            "Voluntarily causing or attempting to cause any person to do anything they are not legally bound to do.",
        keywords: [
            "forced", "compelled", "coercion", "forced labour",
            "bonded labour", "illegal detention", "wrongful confinement",
        ],
        punishment: "Up to 1 year imprisonment or fine or both",
        category: "Miscellaneous",
    },
];

// Utility function to search BNS sections by crime description
export function searchBNSSections(query: string): (BNSSection & { relevanceScore: number })[] {
    if (!query || query.trim().length < 3) return [];

    const queryLower = query.toLowerCase();
    const queryWords = queryLower
        .split(/[\s,.\-;:!?'"()]+/)
        .filter((w) => w.length > 2);

    const results: (BNSSection & { relevanceScore: number })[] = [];

    for (const section of bnsSections) {
        let score = 0;

        for (const keyword of section.keywords) {
            const kwLower = keyword.toLowerCase();
            // Exact phrase match in query
            if (queryLower.includes(kwLower)) {
                score += kwLower.split(" ").length > 1 ? 3 : 2; // multi-word keywords score higher
            }
            // Individual word matches
            for (const word of queryWords) {
                if (kwLower.includes(word) || word.includes(kwLower)) {
                    score += 1;
                }
            }
        }

        // Also check title and description for weaker matches
        const titleLower = section.title.toLowerCase();
        const descLower = section.description.toLowerCase();
        for (const word of queryWords) {
            if (titleLower.includes(word)) score += 1;
            if (descLower.includes(word)) score += 0.5;
        }

        if (score > 0) {
            results.push({ ...section, relevanceScore: score });
        }
    }

    // Sort by relevance score, take top results
    results.sort((a, b) => b.relevanceScore - a.relevanceScore);

    // De-duplicate by section number (keep highest score)
    const seen = new Set<string>();
    const deduped = results.filter((r) => {
        if (seen.has(r.section)) return false;
        seen.add(r.section);
        return true;
    });

    return deduped.slice(0, 8);
}
