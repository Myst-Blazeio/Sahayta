
import os
import pickle
import numpy as np
import pandas as pd

from config import Config


class MLService:
    """
    Singleton ML service with LAZY model loading.

    Models are NOT loaded at import / startup time — they are loaded on the
    first call to predict_crime() or predict_bns().  This keeps the Render
    free-tier instance well inside its 512 MB RAM limit during boot.
    """

    _instance = None

    # ── Singleton ─────────────────────────────────────────────────────────────
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance._ready = False   # models not yet loaded
        return cls._instance

    def __init__(self):
        # __init__ is called every time MLService() is invoked, guard with flag
        pass

    # ── Public property ───────────────────────────────────────────────────────
    @property
    def initialized(self):
        """Returns True once _load_models() has been called (even if some
        models failed to load — we don't want health-checks to block)."""
        return self._ready

    # ── Lazy loader ───────────────────────────────────────────────────────────
    def _ensure_loaded(self):
        """Called before any prediction; loads models exactly once."""
        if self._ready:
            return
        self._ready = True          # set first so re-entrant calls skip this
        self.crime_model = None
        self.bns_df = None
        self.bns_index = None
        self.bns_model = None
        self._load_models()

    def _load_models(self):
        print("MLService: lazy-loading models on first request...")

        # ── Crime Model ───────────────────────────────────────────────────────
        try:
            if os.path.exists(Config.CRIME_MODEL_PATH):
                with open(Config.CRIME_MODEL_PATH, 'rb') as f:
                    self.crime_model = pickle.load(f)
                print("Crime model loaded successfully.")
            else:
                print(f"Warning: Crime model not found at {Config.CRIME_MODEL_PATH}")
        except Exception as e:
            print(f"Error loading crime model: {e}")

        # ── BNS Assets ────────────────────────────────────────────────────────
        try:
            if os.path.exists(Config.BNS_ASSETS_PATH):
                # These imports are heavy — delayed until needed
                from sentence_transformers import SentenceTransformer
                import faiss

                with open(Config.BNS_ASSETS_PATH, 'rb') as f:
                    assets = pickle.load(f)

                self.bns_df = assets['df']
                embeddings = assets['embeddings'].astype(np.float32)

                dimension = embeddings.shape[1]
                self.bns_index = faiss.IndexFlatL2(dimension)
                self.bns_index.add(embeddings)

                print("Loading Sentence-BERT for query encoding...")
                self.bns_model = SentenceTransformer('all-MiniLM-L6-v2')
                print("BNS system loaded successfully.")
            else:
                print(f"Warning: BNS assets not found at {Config.BNS_ASSETS_PATH}")
        except Exception as e:
            print(f"Error loading BNS assets: {e}")

    # ── Predictions ───────────────────────────────────────────────────────────
    def predict_crime(self, ward, year, month):
        self._ensure_loaded()
        if self.crime_model is None:
            return None
        try:
            input_data = pd.DataFrame(
                [[ward, year, month]], columns=['Ward', 'Year', 'Month']
            )
            return round(self.crime_model.predict(input_data)[0])
        except Exception as e:
            print(f"Prediction error: {e}")
            return None

    def predict_bns(self, query, k=5):
        self._ensure_loaded()
        if not (self.bns_index and self.bns_model and self.bns_df is not None):
            return []
        try:
            query_vec = self.bns_model.encode([query]).astype(np.float32)
            distances, indices = self.bns_index.search(query_vec, k)

            results = []
            for i, idx in enumerate(indices[0]):
                if idx < len(self.bns_df):
                    item_dict = self.bns_df.iloc[idx].to_dict()
                    clean = {k: (v if pd.notna(v) else None) for k, v in item_dict.items()}

                    dist = float(distances[0][i])
                    clean['distance'] = dist
                    clean['similarity'] = 1 / (1 + dist)
                    clean['rank'] = i + 1

                    if 'section' not in clean and 'Section' in clean:
                        clean['section'] = clean['Section']
                    if 'description' not in clean and 'Description' in clean:
                        clean['description'] = clean['Description']

                    results.append(clean)
            return results
        except Exception as e:
            print(f"BNS Prediction error: {e}")
            return []


# Module-level singleton — no model loading happens here
ml_service = MLService()
