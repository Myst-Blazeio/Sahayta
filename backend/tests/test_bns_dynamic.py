import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from ml_service import ml_service

cases = [
    # Very short
    ("murder", "ultra-short single word"),
    ("rape case", "2 words"),
    ("theft robbery", "2 keywords"),

    # Medium sentence
    ("The accused forcibly entered the house and assaulted the owner causing grievous hurt", "medium sentence"),

    # Full long FIR narrative
    (
        "To the Station House Officer, Subject: Complaint regarding theft and assault. "
        "Respected Sir, I am writing to report an incident that occurred on 14-05-2024 at 9:30 PM "
        "near Sector 5 Market. My name is Ramesh Kumar, residing at 22B MG Road. Two unknown persons "
        "on a motorcycle snatched my mobile phone and wallet containing Rs. 8500 cash and documents. "
        "When I resisted, one of them struck me with an iron rod causing grievous injuries to my right arm. "
        "The accused then fled towards the highway. I request you to kindly register an FIR and take action. "
        "Yours faithfully, Ramesh Kumar.",
        "full long FIR narrative"
    ),
]

print("=== Dynamic Input Length Tests ===\n")
all_passed = True
for query, label in cases:
    res = ml_service.predict_bns(query, k=3)
    print(f"[{label}]  ({len(query)} chars)")
    if not res:
        print("  FAIL: No results returned!")
        all_passed = False
    else:
        for r in res:
            sec  = r.get("Section", "?")
            sim  = r.get("similarity", 0)
            desc = str(r.get("Description") or r.get("description") or "")[:70]
            print(f"  rank={r['rank']}  sim={sim:.2%}  {sec}")
            print(f"    {desc}")
    print()

if all_passed:
    print("[PASS] All cases handled successfully.")
else:
    print("[FAIL] Some cases failed — check above.")
