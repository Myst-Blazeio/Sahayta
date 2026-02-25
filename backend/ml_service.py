"""
ml_service.py
-------------
Lightweight ML service using:
  - scikit-learn TF-IDF + cosine similarity  (BNS section search)
  - scikit-learn pickled model               (crime prediction)

No torch / sentence-transformers / faiss — safe for Render 512 MB.
Models are LAZY-LOADED on first request to keep startup RAM minimal.
"""

import os
import pickle
import numpy as np
import pandas as pd

from config import Config


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

    # ── Public ────────────────────────────────────────────────────────────────

    @property
    def initialized(self):
        return self._ready

    # ── Internal ──────────────────────────────────────────────────────────────

    def _ensure_loaded(self):
        """Load models exactly once, on first prediction call."""
        if self._ready:
            return
        self._ready = True          # set early to prevent re-entrant calls
        self.crime_model  = None
        self.bns_vectorizer = None
        self.bns_matrix   = None
        self.bns_df       = None
        self.bns_text_col = None
        self._load_models()

    def _load_models(self):
        print("MLService: loading models (first request) ...")

        # ── Crime prediction model ────────────────────────────────────────────
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

        # ── BNS TF-IDF index ─────────────────────────────────────────────────
        try:
            tfidf_path = Config.BNS_TFIDF_PATH
            legacy_path = Config.BNS_ASSETS_PATH

            if os.path.exists(tfidf_path):
                # Preferred: pre-built lightweight index
                with open(tfidf_path, 'rb') as f:
                    payload = pickle.load(f)
                self.bns_vectorizer = payload['vectorizer']
                self.bns_matrix     = payload['matrix']
                self.bns_df         = payload['df']
                self.bns_text_col   = payload.get('text_col', 'description')
                print(f"BNS TF-IDF index loaded ({self.bns_matrix.shape[0]} entries).")

            elif os.path.exists(legacy_path):
                # Fallback: build TF-IDF on-the-fly from the old assets
                print("bns_tfidf.pkl not found — building TF-IDF from bns_assets.pkl ...")
                self._build_tfidf_from_legacy(legacy_path)
            else:
                print("Warning: no BNS assets found.")
        except Exception as e:
            print(f"Error loading BNS assets: {e}")

    def _build_tfidf_from_legacy(self, legacy_path: str):
        """Build TF-IDF index at runtime from bns_assets.pkl (fallback)."""
        from sklearn.feature_extraction.text import TfidfVectorizer

        with open(legacy_path, 'rb') as f:
            assets = pickle.load(f)

        df = assets['df']

        # Auto-detect text column
        text_col = None
        for candidate in ['description', 'Description', 'offense', 'Offense',
                          'section_title', 'title', 'Title', 'text']:
            if candidate in df.columns:
                text_col = candidate
                break
        if text_col is None:
            str_cols = [c for c in df.columns if df[c].dtype == object]
            df['_combined_text'] = df[str_cols].fillna('').agg(' '.join, axis=1)
            text_col = '_combined_text'

        corpus = df[text_col].fillna('').astype(str).tolist()
        vectorizer = TfidfVectorizer(ngram_range=(1, 2), max_features=20_000,
                                     sublinear_tf=True, strip_accents='unicode',
                                     min_df=1)
        matrix = vectorizer.fit_transform(corpus)

        self.bns_vectorizer = vectorizer
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
        if self.bns_vectorizer is None or self.bns_matrix is None or self.bns_df is None:
            return []
        try:
            from sklearn.metrics.pairwise import cosine_similarity

            query_vec = self.bns_vectorizer.transform([query])
            scores    = cosine_similarity(query_vec, self.bns_matrix).flatten()
            top_k     = int(min(k, len(scores)))
            top_idx   = scores.argsort()[-top_k:][::-1]  # highest first

            results = []
            for rank, idx in enumerate(top_idx, start=1):
                item_dict = self.bns_df.iloc[idx].to_dict()
                clean = {key: (val if pd.notna(val) else None)
                         for key, val in item_dict.items()}

                similarity = float(scores[idx])
                clean['similarity'] = similarity
                clean['distance']   = 1.0 - similarity   # kept for API compat
                clean['rank']       = rank

                # Normalise field names for the frontend
                if 'section' not in clean and 'Section' in clean:
                    clean['section'] = clean['Section']
                if 'description' not in clean and 'Description' in clean:
                    clean['description'] = clean['Description']

                results.append(clean)

            # ── Normalize scores for display ──────────────────────────────
            # Raw TF-IDF cosine is naturally low (0.05–0.15).
            # Remap so top result ≈ 90% and others scale proportionally,
            # with a floor of 40% for any result that made the top-k list.
            if results:
                top_sim = results[0]['similarity']   # already sorted highest→first
                for r in results:
                    if top_sim > 0:
                        normalized = 0.40 + (r['similarity'] / top_sim) * 0.50
                    else:
                        normalized = 0.40
                    r['similarity'] = round(min(1.0, normalized), 4)
                    r['distance']   = round(1.0 - r['similarity'], 4)

            return results
        except Exception as e:
            print(f"BNS prediction error: {e}")
            return []


# Module-level singleton — NO heavy imports happen here
ml_service = MLService()
