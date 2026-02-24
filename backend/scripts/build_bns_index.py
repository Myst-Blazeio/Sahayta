"""
build_bns_index.py
------------------
One-time script run during Render's build phase (or locally) to convert the
heavy sentence-transformer embeddings in bns_assets.pkl into a lightweight
TF-IDF index that requires no torch/faiss at runtime.

Output: assets/bns_tfidf.pkl  →  { 'vectorizer': TfidfVectorizer,
                                    'matrix':     sparse TF-IDF matrix,
                                    'df':         BNS DataFrame }

Usage:
    python scripts/build_bns_index.py
"""

import os
import sys
import pickle

# Make sure we can import from the backend root
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sklearn.feature_extraction.text import TfidfVectorizer
from config import Config

# ── Load source data ──────────────────────────────────────────────────────────
src = Config.BNS_ASSETS_PATH
if not os.path.exists(src):
    print(f"ERROR: Source file not found: {src}")
    sys.exit(1)

print(f"Loading {src} ...")
with open(src, 'rb') as f:
    assets = pickle.load(f)

df = assets['df']
print(f"DataFrame shape: {df.shape}")
print(f"Columns: {list(df.columns)}")

# ── Pick text column ──────────────────────────────────────────────────────────
# Try common column names (case-insensitive)
text_col = None
for candidate in ['description', 'Description', 'offense', 'Offense',
                  'section_title', 'title', 'Title', 'text', 'Text']:
    if candidate in df.columns:
        text_col = candidate
        break

if text_col is None:
    # Fall back: concatenate all string columns
    str_cols = [c for c in df.columns if df[c].dtype == object]
    print(f"No standard text column found. Concatenating: {str_cols}")
    df['_combined_text'] = df[str_cols].fillna('').agg(' '.join, axis=1)
    text_col = '_combined_text'
else:
    print(f"Using text column: '{text_col}'")

corpus = df[text_col].fillna('').astype(str).tolist()

# ── Fit TF-IDF ────────────────────────────────────────────────────────────────
print("Fitting TF-IDF vectorizer ...")
vectorizer = TfidfVectorizer(
    ngram_range=(1, 2),   # unigrams + bigrams for better recall
    max_features=20_000,
    sublinear_tf=True,    # apply log normalization
    strip_accents='unicode',
    analyzer='word',
    min_df=1,
)
matrix = vectorizer.fit_transform(corpus)
print(f"TF-IDF matrix: {matrix.shape}  ({matrix.nnz} non-zero entries)")

# ── Save ──────────────────────────────────────────────────────────────────────
out = Config.BNS_TFIDF_PATH
payload = {
    'vectorizer': vectorizer,
    'matrix': matrix,
    'df': df,
    'text_col': text_col,
}
with open(out, 'wb') as f:
    pickle.dump(payload, f)

size_kb = os.path.getsize(out) / 1024
print(f"\n[OK] Saved {out}  ({size_kb:.1f} KB)")
