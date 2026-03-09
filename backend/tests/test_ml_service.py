from ml_service import ml_service

# ── BNS search ────────────────────────────────────────────────────────────────
print("=== BNS predict_bns ===")
results = ml_service.predict_bns("theft of vehicle motorcycle stolen", k=3)
print(f"Got {len(results)} results")
for r in results:
    sec = r.get("Section") or r.get("section") or "?"
    desc = str(r.get("Description") or r.get("description") or "")[:60]
    print(f"  rank={r['rank']}  sim={r['similarity']:.3f}  section={sec}")
    print(f"    {desc}")

assert len(results) > 0, "BNS returned no results!"
assert results[0]["similarity"] > 0, "Top similarity should be > 0"

# ── Crime prediction ─────────────────────────────────────────────────────────
print("\n=== Crime predict_crime ===")
p = ml_service.predict_crime(ward=5, year=2024, month=3)
print(f"Prediction (ward=5, 2024, March): {p}")
# crime model may be None if pkl not loadable — that's OK for this test
# just ensure no exception was raised

print("\n[PASS] All smoke tests passed.")
