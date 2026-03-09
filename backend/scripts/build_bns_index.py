import os
import re
import sys
import pickle

# Make sure we can import from the backend root
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sklearn.feature_extraction.text import TfidfVectorizer
from rank_bm25 import BM25Okapi
from config import Config

# ── Stop-word list (no NLTK download needed on Render) ────────────────────────
EN_STOPWORDS = {
    'a','an','the','and','or','but','if','in','on','at','to','for','of','with',
    'by','from','up','about','into','through','during','is','are','was','were',
    'be','been','being','have','has','had','do','does','did','will','would',
    'could','should','may','might','shall','can','this','that','these','those',
    'i','me','my','we','our','you','your','he','his','she','her','they','their',
    'it','its','who','which','what','when','where','how','not','no','nor','so',
    'yet','both','either','neither','said','also','as','than','then','there',
    'here','again','further','most','such','same','very','just','because',
    'complainant','respondent','officer','police','station','house','fir','report'
}

def clean_text(text: str) -> str:
    """Lowercase, strip dates/times/noise, remove stop-words."""
    text = text.lower()
    # Remove dates and times
    text = re.sub(r'\d{1,2}[/-]\d{1,2}[/-]\d{2,4}', ' ', text)
    text = re.sub(r'\d{1,2}:\d{2}\s*(?:am|pm)?', ' ', text)
    # Remove punctuation
    text = re.sub(r'[^a-z\s]', ' ', text)
    # Collapse whitespace
    text = re.sub(r'\s+', ' ', text).strip()
    return text

def tokenize(text: str) -> list:
    """Clean and tokenize, removing stop-words."""
    return [w for w in clean_text(text).split() if w not in EN_STOPWORDS and len(w) > 2]


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
text_col = None
for candidate in ['Description', 'description', 'Offense', 'offense',
                  'section_title', 'Title', 'title', 'text']:
    if candidate in df.columns:
        text_col = candidate
        break

if text_col is None:
    str_cols = [c for c in df.columns if df[c].dtype == object]
    print(f"No standard text column found. Concatenating: {str_cols}")
    df['_combined_text'] = df[str_cols].fillna('').agg(' '.join, axis=1)
    text_col = '_combined_text'
else:
    print(f"Using text column: '{text_col}'")

raw_corpus   = df[text_col].fillna('').astype(str).tolist()
clean_corpus = [clean_text(t) for t in raw_corpus]
token_corpus = [tokenize(t) for t in raw_corpus]

# ── 1. TF-IDF (kept as fallback) ──────────────────────────────────────────────
print("\nFitting TF-IDF vectorizer ...")
vectorizer = TfidfVectorizer(
    ngram_range=(1, 2),
    max_features=20_000,
    sublinear_tf=True,
    strip_accents='unicode',
    analyzer='word',
    min_df=1,
)
matrix = vectorizer.fit_transform(clean_corpus)   # use CLEANED corpus, not raw
print(f"TF-IDF matrix: {matrix.shape}  ({matrix.nnz} non-zero entries)")

tfidf_out = Config.BNS_TFIDF_PATH
with open(tfidf_out, 'wb') as f:
    pickle.dump({'vectorizer': vectorizer, 'matrix': matrix,
                 'df': df, 'text_col': text_col}, f)
size_kb = os.path.getsize(tfidf_out) / 1024
print(f"[OK] Saved TF-IDF index  {tfidf_out}  ({size_kb:.1f} KB)")

# ── 2. BM25 index (primary) ───────────────────────────────────────────────────
print("\nBuilding BM25Okapi index ...")
bm25 = BM25Okapi(token_corpus)
print(f"BM25 index built with {len(token_corpus)} documents.")

bm25_out = Config.BNS_BM25_PATH
with open(bm25_out, 'wb') as f:
    pickle.dump({'bm25': bm25, 'df': df, 'text_col': text_col,
                 'token_corpus': token_corpus}, f)
size_kb = os.path.getsize(bm25_out) / 1024
print(f"[OK] Saved BM25 index    {bm25_out}  ({size_kb:.1f} KB)")

print("\n[OK] Both indexes built successfully.")
