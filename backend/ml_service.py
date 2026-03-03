"""
ml_service.py
-------------
Render-safe ML service (512 MB RAM / 1 CPU).  No torch / faiss.

BNS section search uses three layered improvements over plain TF-IDF:
  1. FIRPreprocessor  — strips FIR boilerplate, surfaces crime keywords
  2. BM25Okapi        — better term-saturation ranking than TF-IDF cosine
  3. Keyword re-rank  — post-retrieval boost for sections whose text contains
                        the extracted crime keywords

Falls back to TF-IDF cosine if bns_bm25.pkl is missing.

Models are LAZY-LOADED on first request to keep startup RAM minimal.
"""

import os
import re
import pickle
import numpy as np
import pandas as pd

from config import Config

# ── Stop-word list (identical to build_bns_index.py — no NLTK download) ───────
_EN_STOPWORDS = {
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

# ── Crime keyword list ─────────────────────────────────────────────────────────
_CRIME_KEYWORDS = {
    'abducting','abduction','abetment','abetment to suicide','abetting',
    'abuse','acid attack','adulteration','aggravated assault','arson',
    'assault','attempt to murder','attempted murder','battery','bigamy',
    'blackmail','bomb','bombing','bribery','burglary',
    'causing miscarriage','cheating','child abuse','concealment',
    'confinement','conspiracy','corruption','counterfeit','counterfeiting',
    'criminal breach of trust','criminal intimidation','criminal trespass',
    'cruelty','culpable homicide','cyber fraud','cybercrime','cyberstalking',
    'dacoity','damage','death by negligence','defamation','domestic violence',
    'dowry','dowry death','drug trafficking','drunk driving','embezzlement',
    'extortion','fabricating false evidence','false evidence','forgery',
    'fraud','gambling','grievous hurt','harassment','hijacking',
    'hit and run','homicide','hostage','housebreaking','human trafficking',
    'hurt','identity fraud','identity theft','impersonation','intimidation',
    'kidnapping','kidnap for ransom','larceny','manslaughter','mischief',
    'molestation','money laundering','murder','mutilation','narcotics',
    'obscene','obstruction','perjury','phishing','poisoning','prostitution',
    'rape','rash driving','robbery','sedition','sexual assault',
    'sexual harassment','shoplifting','smuggling','snatching','stalking',
    'theft','stole','tampering with evidence','terrorism','torture',
    'trafficking','trespass','vandalism','vehicle theft','voyeurism',
    'violence','weapon','wrongful confinement','wrongful restraint',
}


class FIRPreprocessor:
    """Normalize raw FIR text for better retrieval."""

    def __init__(self):
        self.keywords = _CRIME_KEYWORDS

    def clean(self, text: str) -> str:
        text = text.lower()
        text = re.sub(r'\d{1,2}[/-]\d{1,2}[/-]\d{2,4}', ' ', text)  # dates
        text = re.sub(r'\d{1,2}:\d{2}\s*(?:am|pm)?', ' ', text)       # times
        # boilerplate phrases
        for phrase in [r'to the station house officer', r'subject\s*:',
                        r'respected sir', r'i am writing to report',
                        r'a case has been registered']:
            text = re.sub(phrase, ' ', text)
        text = re.sub(r'[^a-z\s]', ' ', text)
        return re.sub(r'\s+', ' ', text).strip()

    def tokenize(self, text: str) -> list:
        return [w for w in self.clean(text).split()
                if w not in _EN_STOPWORDS and len(w) > 2]

    def extract_keywords(self, text: str) -> list:
        text_lower = text.lower()
        return [kw for kw in self.keywords if kw in text_lower]

    def build_query(self, text: str):
        """Return (normalized_string, token_list, found_keyword_list)."""
        found = self.extract_keywords(text)
        cleaned = self.clean(text)
        tokens = self.tokenize(text)
        if found:
            unique = list(set(found))
            # Repeat keywords extra times so BM25 gives them higher weight
            kw_tokens = ' '.join(unique * 3)
            normalized = f"{kw_tokens} {cleaned}"
            extra_tokens = [t for kw in unique for t in kw.split()] * 3
            tokens = extra_tokens + tokens
        else:
            normalized = cleaned
        return normalized, tokens, found


_preprocessor = FIRPreprocessor()


class MLService:
    """Singleton with lazy model loading."""

    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance._ready = False
        return cls._instance

    def __init__(self):
        pass  # guard handled by _ready flag

    @property
    def initialized(self):
        return self._ready

    def _ensure_loaded(self):
        if self._ready:
            return
        self._ready = True
        self.crime_model    = None
        # BM25 (primary)
        self.bns_bm25       = None
        self.bns_bm25_df    = None
        self.bns_token_corp = None
        # TF-IDF (fallback)
        self.bns_vectorizer = None
        self.bns_matrix     = None
        self.bns_df         = None
        self.bns_text_col   = None
        self._load_models()

    def _load_models(self):
        print("MLService: loading models (first request) ...")

        # ── Crime prediction ──────────────────────────────────────────────────
        try:
            path = Config.CRIME_MODEL_PATH
            if os.path.exists(path):
                with open(path, 'rb') as f:
                    self.crime_model = pickle.load(f)
                print("Crime model loaded.")
            else:
                print(f"Warning: crime model not found at {path}")
        except Exception as e:
            print(f"Error loading crime model: {e}")

        # ── BM25 index (preferred) ────────────────────────────────────────────
        try:
            bm25_path = Config.BNS_BM25_PATH
            if os.path.exists(bm25_path):
                with open(bm25_path, 'rb') as f:
                    payload = pickle.load(f)
                self.bns_bm25       = payload['bm25']
                self.bns_bm25_df    = payload['df']
                self.bns_token_corp = payload['token_corpus']
                n = len(self.bns_bm25_df)
                print(f"BNS BM25 index loaded ({n} entries).")
                return          # BM25 loaded — skip TF-IDF load entirely
            else:
                print("bns_bm25.pkl not found — will use TF-IDF fallback.")
        except Exception as e:
            print(f"Error loading BM25: {e}")

        # ── TF-IDF fallback ───────────────────────────────────────────────────
        try:
            tfidf_path  = Config.BNS_TFIDF_PATH
            legacy_path = Config.BNS_ASSETS_PATH

            if os.path.exists(tfidf_path):
                with open(tfidf_path, 'rb') as f:
                    payload = pickle.load(f)
                self.bns_vectorizer = payload['vectorizer']
                self.bns_matrix     = payload['matrix']
                self.bns_df         = payload['df']
                self.bns_text_col   = payload.get('text_col', 'Description')
                print(f"BNS TF-IDF index loaded ({self.bns_matrix.shape[0]} entries).")
            elif os.path.exists(legacy_path):
                print("Building TF-IDF from bns_assets.pkl ...")
                self._build_tfidf_from_legacy(legacy_path)
            else:
                print("Warning: no BNS assets found.")
        except Exception as e:
            print(f"Error loading BNS TF-IDF: {e}")

    def _build_tfidf_from_legacy(self, legacy_path: str):
        from sklearn.feature_extraction.text import TfidfVectorizer
        with open(legacy_path, 'rb') as f:
            assets = pickle.load(f)
        df = assets['df']
        text_col = next((c for c in ['Description', 'description', 'text']
                         if c in df.columns), None)
        if text_col is None:
            str_cols = [c for c in df.columns if df[c].dtype == object]
            df['_combined_text'] = df[str_cols].fillna('').agg(' '.join, axis=1)
            text_col = '_combined_text'
        corpus = [_preprocessor.clean(t)
                  for t in df[text_col].fillna('').astype(str)]
        vec = TfidfVectorizer(ngram_range=(1, 2), max_features=20_000,
                              sublinear_tf=True, strip_accents='unicode', min_df=1)
        matrix = vec.fit_transform(corpus)
        self.bns_vectorizer = vec
        self.bns_matrix     = matrix
        self.bns_df         = df
        self.bns_text_col   = text_col
        print(f"BNS TF-IDF built on-the-fly ({matrix.shape[0]} entries).")

    # ── Predictions ───────────────────────────────────────────────────────────

    def predict_crime(self, ward, year, month):
        self._ensure_loaded()
        if self.crime_model is None:
            return None
        try:
            input_df = pd.DataFrame([[ward, year, month]],
                                    columns=['Ward', 'Year', 'Month'])
            return round(self.crime_model.predict(input_df)[0])
        except Exception as e:
            print(f"Crime prediction error: {e}")
            return None

    def predict_bns(self, query: str, k: int = 5):
        self._ensure_loaded()

        if self.bns_bm25 is not None:
            return self._predict_bns_bm25(query, k)
        elif self.bns_vectorizer is not None:
            return self._predict_bns_tfidf(query, k)
        return []

    # ── BM25 path ─────────────────────────────────────────────────────────────

    def _predict_bns_bm25(self, query: str, k: int):
        try:
            df = self.bns_bm25_df
            _norm_str, query_tokens, found_keywords = _preprocessor.build_query(query)

            if not query_tokens:
                query_tokens = query.lower().split()

            # BM25 scores
            scores = self.bns_bm25.get_scores(query_tokens)

            # ── Keyword re-rank boost ──────────────────────────────────────
            # For each candidate, count how many detected crime keywords appear
            # in the section's own description text → add a proportional bonus.
            BOOST = 0.25   # fraction of top BM25 score added per keyword hit
            if found_keywords:
                text_col = self.bns_token_corp  # tokenized corpus
                for i, tokens in enumerate(text_col):
                    token_set = set(tokens)
                    # each keyword that appears in the section boosts by BOOST
                    hits = sum(
                        1 for kw in found_keywords
                        for part in kw.split() if part in token_set
                    )
                    if hits:
                        scores[i] += scores.max() * BOOST * hits

            # pick top-k (fetch extra to allow filtering)
            fetch = min(k * 3, len(scores))
            top_idx = scores.argsort()[-fetch:][::-1]

            # normalise scores for display (top → ~0.92, floor ~0.40)
            top_score = float(scores[top_idx[0]]) if scores[top_idx[0]] > 0 else 1.0

            results = []
            for rank, idx in enumerate(top_idx[:k], start=1):
                item_dict = df.iloc[idx].to_dict()
                clean = {}
                for key, val in item_dict.items():
                    if isinstance(val, float) and pd.isna(val):
                        clean[key] = None
                    elif hasattr(val, 'item'):
                        clean[key] = val.item()
                    else:
                        clean[key] = val

                raw_score = float(scores[idx])
                normalized = (0.40 + (raw_score / top_score) * 0.52
                              if top_score > 0 else 0.40)
                clean['similarity'] = float(round(min(1.0, normalized), 4))
                clean['distance']   = float(round(1.0 - clean['similarity'], 4))
                clean['rank']       = rank

                if 'section' not in clean and 'Section' in clean:
                    clean['section'] = clean['Section']
                if 'description' not in clean and 'Description' in clean:
                    clean['description'] = clean['Description']

                results.append(clean)

            return results
        except Exception as e:
            print(f"BM25 prediction error: {e}")
            return []

    # ── TF-IDF fallback path ──────────────────────────────────────────────────

    def _predict_bns_tfidf(self, query: str, k: int):
        try:
            from sklearn.metrics.pairwise import cosine_similarity
            # preprocess query before TF-IDF transform
            norm_query, _tokens, _kws = _preprocessor.build_query(query)

            query_vec = self.bns_vectorizer.transform([norm_query])
            scores    = cosine_similarity(query_vec, self.bns_matrix).flatten()
            top_k     = int(min(k, len(scores)))
            top_idx   = scores.argsort()[-top_k:][::-1]

            results = []
            top_sim = float(scores[top_idx[0]]) if scores[top_idx[0]] > 0 else 1.0
            for rank, idx in enumerate(top_idx, start=1):
                item_dict = self.bns_df.iloc[idx].to_dict()
                clean = {key: (val if pd.notna(val) else None)
                         for key, val in item_dict.items()}
                sim = float(scores[idx])
                normalized = 0.40 + (sim / top_sim) * 0.50 if top_sim > 0 else 0.40
                clean['similarity'] = round(min(1.0, normalized), 4)
                clean['distance']   = round(1.0 - clean['similarity'], 4)
                clean['rank']       = rank
                if 'section' not in clean and 'Section' in clean:
                    clean['section'] = clean['Section']
                if 'description' not in clean and 'Description' in clean:
                    clean['description'] = clean['Description']
                results.append(clean)
            return results
        except Exception as e:
            print(f"TF-IDF prediction error: {e}")
            return []


# Module-level singleton — NO heavy imports happen here
ml_service = MLService()
