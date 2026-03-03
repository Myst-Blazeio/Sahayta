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
import re
from config import Config

CRIME_KEYWORDS = [
    'abducting', 'abduction', 'abetment', 'abetment to suicide', 'abetting', 'abetting mutiny',
    'abuse', 'acid attack', 'adminstration', 'adulteration', 'aggravated assault', 'arson',
    'arsonist', 'assault', 'attempt to murder', 'attempted murder', 'battery', 'bigamy',
    'blackmail', 'bomb', 'bombing', 'breach of contract', 'bribery', 'bribing', 'burglary',
    'causing miscarriage', 'cheating', 'child abuse', 'child pornography', 'concealment',
    'confinement', 'conspiracy', 'corruption', 'counterfeit', 'counterfeiting',
    'criminal breach of trust', 'criminal intimidation', 'criminal trespass', 'cruelty',
    'culpable homicide', 'cyber fraud', 'cybercrime', 'cyberstalking', 'dacoity', 'damage',
    'data breach', 'death by negligence', 'defamation', 'defiling', 'defiling place worship',
    'desertion', 'disappearance of evidence', 'dishonestly', 'domestic violence', 'dowry',
    'dowry death', 'drug trafficking', 'drunk driving', 'embezzlement', 'eve teasing', 'exciting',
    'extorting', 'extortion', 'fabricating false evidence', 'false charge', 'false claim',
    'false evidence', 'false personation', 'false statement', 'forgery', 'fornication',
    'fraud','gambling','grievous hurt', 'harassment', 'hijacking', 'hit and run', 'homicide', 'hostage',
    'housebreaking', 'human trafficking', 'hurt', 'identity fraud', 'identity theft', 'illegal weapon',
    'impersonation', 'imputation', 'indecent', 'intimidation', 'kidnap for ransom', 'kidnapping',
    'larceny','liquor', 'manslaughter', 'mischief', 'molestation', 'money', 'money laundering', 'murder',
    'mutilating', 'mutilation', 'mutiny', 'narcotics','narcotics possession', 'obscene', 'obstructing public servant',
    'obstruction', 'organized crime', 'perjury', 'phishing', 'piratical', 'poisoning', 'prostitution',
    'public nuisance', 'rape', 'rash driving', 'receiving', 'receiving stolen property', 'restraint',
    'rioting','ritualism', 'robbery', 'sedition', 'seducing', 'sexual assault', 'sexual harassment', 'shoplifting',
    'smuggling', 'snatching', 'stalking', 'stole', 'tampering with evidence', 'terrorism', 'theft',
    'threats', 'torture', 'trafficking', 'trespass', 'unauthorized access', 'unlawful assembly',
    'unnatural', 'uttering', 'vandalism', 'vehicle theft','voyeurism', 'violence', 'weapon', 'weapons',
    'wildlife crimes', 'wrongful', 'wrongful confinement', 'wrongful restraint'
]

class FIRPreprocessor:
    def __init__(self, keywords):
        self.keywords = set(k.lower() for k in keywords)

    def normalize(self, text):
        text_lower = text.lower()
        found_keywords = [kw for kw in self.keywords if kw in text_lower]

        text_clean = re.sub(r'\d{1,2}[/-]\d{1,2}[/-]\d{2,4}', '', text) # Dates
        text_clean = re.sub(r'\d{1,2}:\d{2}\s*(?:AM|PM|am|pm)?', '', text_clean) # Times

        noise_phrases = [
            r'to the station house officer', r'subject:', r'respeceted sir',
            r'i am writing to report', r'located at', r'a case has been registered'
        ]
        for phrase in noise_phrases:
            text_clean = re.sub(phrase, '', text_clean, flags=re.IGNORECASE)

        text_clean = re.sub(r'\s+', ' ', text_clean).strip()

        if found_keywords:
            unique_kws = list(set(found_keywords))
            normalized_query = f"Crime Categories: {', '.join(unique_kws)}. Context: {text_clean}"
        else:
            normalized_query = text_clean

        return normalized_query, found_keywords

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
        self.bns_model    = None
        self.bns_index    = None
        self.bns_df       = None
        self.preprocessor = FIRPreprocessor(CRIME_KEYWORDS)
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

        # ── BNS FAISS Index using SentenceTransformer ────────────────────────
        try:
            import faiss
            from sentence_transformers import SentenceTransformer
            
            bns_assets_path = Config.BNS_ASSETS_PATH
            if os.path.exists(bns_assets_path):
                with open(bns_assets_path, 'rb') as f:
                    assets = pickle.load(f)
                
                self.bns_df = assets['df']
                embeddings = assets['embeddings']
                
                dimension = embeddings.shape[1]
                self.bns_index = faiss.IndexFlatL2(dimension)
                self.bns_index.add(embeddings.astype(np.float32))
                
                print("Loading SentenceTransformer model 'all-MiniLM-L6-v2'...")
                self.bns_model = SentenceTransformer('all-MiniLM-L6-v2')
                print(f"BNS FAISS index ready ({len(self.bns_df)} entries, dim {dimension}).")
            else:
                print(f"Warning: BNS assets not found at {bns_assets_path}")
        except Exception as e:
            print(f"Error loading BNS SentenceTransformer/FAISS: {e}")

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
        if self.bns_model is None or self.bns_index is None or self.bns_df is None:
            return []
        try:
            # Normalize prompt using the FIRPreprocessor
            normalized_query, detected_crimes = self.preprocessor.normalize(query)
            
            # Encode query and search FAISS
            query_vec = self.bns_model.encode([normalized_query]).astype(np.float32)
            distances, indices = self.bns_index.search(query_vec, k)
            
            results = []
            max_dist = distances[0][-1] if len(distances[0]) > 0 and distances[0][-1] > 0 else 1.0
            
            for rank, (dist, idx) in enumerate(zip(distances[0], indices[0]), start=1):
                if idx >= len(self.bns_df):
                    continue
                    
                item_dict = self.bns_df.iloc[idx].to_dict()
                clean = {}
                for key, val in item_dict.items():
                    if pd.isna(val):
                        clean[key] = None
                    elif hasattr(val, 'item'): 
                        clean[key] = val.item() # converts numpy float/int to python types
                    else:
                        clean[key] = val

                # We approximate similarity based on L2 distance.
                # Smaller distance = higher similarity
                # Max dist is the farthest neighbor returned.
                sim_score = max(0.0, 1.0 - (float(dist) / (max_dist * 1.5 + 1e-5))) 
                
                clean['similarity'] = float(round(sim_score, 4))
                clean['distance']   = float(round(float(dist), 4))
                clean['rank']       = int(rank)

                # Normalise field names for the frontend
                if 'section' not in clean and 'Section' in clean:
                    clean['section'] = clean['Section']
                if 'description' not in clean and 'Description' in clean:
                    clean['description'] = clean['Description']

                results.append(clean)

            return results
        except Exception as e:
            print(f"BNS prediction error: {e}")
            return []


# Module-level singleton — NO heavy imports happen here
ml_service = MLService()
