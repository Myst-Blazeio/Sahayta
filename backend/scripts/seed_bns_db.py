"""
seed_bns_db.py
--------------
One-time script to seed the official BNS (Bharatiya Nyaya Sanhita) database
from bns_assets.pkl into MongoDB.

Creates / replaces the `bns_sections` collection with 358 BNS sections,
each stored as a structured document for fast lookup and full-text use.

Usage:
    # From the backend/ directory, with venv active:
    python scripts/seed_bns_db.py

    # Or with a custom Mongo URI:
    MONGO_URI=mongodb+srv://... python scripts/seed_bns_db.py

The script is idempotent — running it multiple times will update existing
documents rather than creating duplicates (upsert on `section_id`).
"""

import os
import sys
import pickle
import re

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from dotenv import load_dotenv
load_dotenv()

from pymongo import MongoClient, UpdateOne
from config import Config

# ── Connect ───────────────────────────────────────────────────────────────────
MONGO_URI = os.environ.get("MONGO_URI", Config.MONGO_URI)
print(f"Connecting to MongoDB ...")
client = MongoClient(MONGO_URI, serverSelectionTimeoutMS=10_000)

# Ping to verify connection
client.admin.command("ping")
print("Connected OK.\n")

db   = client.get_default_database()
col  = db["bns_sections"]

# ── Load BNS data from pkl ────────────────────────────────────────────────────
assets_path = Config.BNS_ASSETS_PATH
if not os.path.exists(assets_path):
    print(f"ERROR: {assets_path} not found. Run build_bns_index.py first.")
    sys.exit(1)

print(f"Loading {assets_path} ...")
with open(assets_path, "rb") as f:
    assets = pickle.load(f)

df = assets["df"]
print(f"Loaded {len(df)} BNS sections.\n")


def parse_section_number(section_id: str) -> str:
    """Extract the numeric part from 'BNS_103' → '103'"""
    m = re.search(r"(\d+)", section_id)
    return m.group(1) if m else section_id


def split_simple_text(full_text: str) -> tuple[str, str]:
    """
    The description field contains both the full legal text and
    a 'BNS X in Simple Words' summary at the end.
    Split them apart.
    """
    marker = " - - - "
    if marker in full_text:
        parts = full_text.split(marker, 1)
        legal = parts[0].strip()
        simple = parts[1].strip()
        # Remove the "BNS X in Simple Words" prefix
        simple = re.sub(r"^BNS[_ ]\w+\s+in Simple Words\s*", "", simple, flags=re.IGNORECASE).strip()
        return legal, simple
    return full_text.strip(), ""


# ── Build upsert operations ───────────────────────────────────────────────────
ops = []
for _, row in df.iterrows():
    section_id  = str(row.get("Section", "")).strip()
    full_text   = str(row.get("Description", "")).strip()

    section_num = parse_section_number(section_id)
    legal_text, simple_text = split_simple_text(full_text)

    # Build a human-readable section name from the first sentence of legal text
    first_sentence = re.split(r"\.\s", legal_text)[0][:200].strip()

    doc = {
        "section_id":    section_id,          # e.g. "BNS_103"
        "section_num":   section_num,          # e.g. "103"
        "title":         f"BNS Section {section_num}",
        "description":   legal_text,           # Full official legal text
        "simple_words":  simple_text,          # Plain-language summary
        "summary":       first_sentence,       # First sentence (for list views)
        "searchable":    f"{section_id} {legal_text} {simple_text}".lower(),
    }

    ops.append(
        UpdateOne(
            {"section_id": section_id},
            {"$set": doc},
            upsert=True,
        )
    )

# ── Execute bulk upsert ───────────────────────────────────────────────────────
print(f"Upserting {len(ops)} documents into `bns_sections` ...")
result = col.bulk_write(ops, ordered=False)
print(f"  Matched:  {result.matched_count}")
print(f"  Upserted: {result.upserted_count}")
print(f"  Modified: {result.modified_count}")

# ── Create indexes ────────────────────────────────────────────────────────────
col.create_index("section_id", unique=True)
col.create_index("section_num")
col.create_index([("searchable", "text")])
print("\nIndexes created: section_id (unique), section_num, text index on searchable")

total = col.count_documents({})
print(f"\n[OK] bns_sections collection now has {total} documents.")
print("     BNS database seeding complete.")
