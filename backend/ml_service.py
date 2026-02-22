
print("MLService: importing os/pickle...")
import os
import pickle
print("MLService: importing numpy...")
import numpy as np
print("MLService: importing pandas...")
import pandas as pd
# from sentence_transformers import SentenceTransformer
# import faiss

print("MLService: importing config...")
from config import Config

class MLService:
    _instance = None
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(MLService, cls).__new__(cls)
            cls._instance.initialized = False
        return cls._instance
    
    def __init__(self):
        if self.initialized:
            return
        self.initialized = True
        self.crime_model = None
        self.bns_df = None
        self.bns_index = None
        self.bns_model = None # SentenceTransformer model for encoding queries
        self.use_mock = False
        self._load_models()
        
    def _load_models(self):
        from sentence_transformers import SentenceTransformer
        import faiss
        import numpy as np
        import pandas as pd

        print("Loading ML Models...")
        
        # Load Crime Model
        try:
            if os.path.exists(Config.CRIME_MODEL_PATH):
                with open(Config.CRIME_MODEL_PATH, 'rb') as f:
                    self.crime_model = pickle.load(f)
                print("Crime model loaded successfully.")
            else:
                print(f"Warning: Crime model not found at {Config.CRIME_MODEL_PATH}")
                self.use_mock = True # Or just for that specific feature
        except Exception as e:
            print(f"Error loading crime model: {e}")
            self.use_mock = True

        # Load BNS Assets
        try:
            if os.path.exists(Config.BNS_ASSETS_PATH):
                with open(Config.BNS_ASSETS_PATH, 'rb') as f:
                    assets = pickle.load(f)
                    self.bns_df = assets['df']
                    embeddings = assets['embeddings']
                    
                    # Build FAISS index
                    dimension = embeddings.shape[1]
                    self.bns_index = faiss.IndexFlatL2(dimension)
                    self.bns_index.add(embeddings.astype(np.float32))
                    
                    # Load SentenceTransformer for query encoding
                    # We load it here to avoid reloading if possible, but for query we need it.
                    # Ideally we should save the model too or use a singleton for it.
                    # Since it's large, we'll load it.
                    print("Loading Sentence-BERT for query encoding...")
                    self.bns_model = SentenceTransformer('all-MiniLM-L6-v2') 
                    print("BNS system loaded successfully.")
            else:
                print(f"Warning: BNS assets not found at {Config.BNS_ASSETS_PATH}")
        except Exception as e:
            print(f"Error loading BNS assets: {e}")

    def predict_crime(self, ward, year, month):
        if self.crime_model:
            try:
                # Expecting input as DataFrame with correct columns
                input_data = pd.DataFrame([[ward, year, month]], columns=['Ward', 'Year', 'Month'])
                prediction = self.crime_model.predict(input_data)[0]
                return round(prediction)
            except Exception as e:
                print(f"Prediction error: {e}")
                return None
        return None

    def predict_bns(self, query, k=5):
        if self.bns_index and self.bns_model and self.bns_df is not None:
            try:
                # Gibberish detection disabled per user request
                # if len(query) > 10: ...

                query_vec = self.bns_model.encode([query]).astype(np.float32)
                distances, indices = self.bns_index.search(query_vec, k)
                
                results = []
                for i, idx in enumerate(indices[0]):
                    if idx < len(self.bns_df):
                        item = self.bns_df.iloc[idx]
                        # Convert to dict and handle NaN
                        item_dict = item.to_dict()
                        # Clean up NaN values for JSON
                        clean_dict = {k: (v if pd.notna(v) else None) for k, v in item_dict.items()}
                        
                        result = clean_dict
                        
                        # Convert L2 distance to Similarity Score (0 to 1)
                        # valid range for L2 is 0 to infinity. 
                        # 1 / (1 + distance) maps 0->1, inf->0. 
                        # This avoids negative percentages.
                        dist = float(distances[0][i])
                        similarity = 1 / (1 + dist)
                        
                        result['distance'] = dist
                        result['similarity'] = similarity
                        result['rank'] = i + 1
                        
                        # Ensure core fields exist for frontend
                        if 'section' not in result and 'Section' in result:
                            result['section'] = result['Section']
                        if 'description' not in result and 'Description' in result:
                            result['description'] = result['Description']
                            
                        results.append(result)
                return results
            except Exception as e:
                print(f"BNS Prediction error: {e}")
                return []
        return []

# Singleton instance
ml_service = MLService()
