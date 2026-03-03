"""
build_bns_index.py
------------------
One-time script run to convert the BNS CSV dataset into SentenceTransformer 
embeddings and save the heavy bns_assets.pkl.

Output: assets/bns_assets.pkl  →  { 'df': BNS DataFrame,
                                    'embeddings': numpy array of embeddings }

Usage:
    python scripts/build_bns_index.py
"""

import os
import sys
import pickle
import pandas as pd

# Make sure we can import from the backend root
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from config import Config

CSV_FILENAME = 'testing1.csv'

def build_bns_assets():
    if not os.path.exists(CSV_FILENAME):
        print(f"Error: {CSV_FILENAME} not found in the current directory.")
        print("Please ensure the BNS dataset CSV is present to rebuild the models.")
        sys.exit(1)

    print(f"Loading data from {CSV_FILENAME}...")
    df = pd.read_csv(CSV_FILENAME, encoding='latin1')
    
    # Auto-detect text column
    text_col = None
    for candidate in ['description', 'Description', 'offense', 'Offense', 'text']:
        if candidate in df.columns:
            text_col = candidate
            break
            
    if text_col is None:
        str_cols = [c for c in df.columns if df[c].dtype == object]
        df['_combined_text'] = df[str_cols].fillna('').agg(' '.join, axis=1)
        text_col = '_combined_text'

    print("Loading Sentence-BERT model 'all-MiniLM-L6-v2'...")
    try:
        from sentence_transformers import SentenceTransformer
        model = SentenceTransformer('all-MiniLM-L6-v2')
    except ImportError:
        print("Error: sentence-transformers is not installed. Please install it first.")
        sys.exit(1)
        
    print("Generating embeddings for BNS descriptions...")
    descriptions = df[text_col].fillna('').astype(str).tolist()
    embeddings = model.encode(descriptions)
    
    out_path = Config.BNS_ASSETS_PATH
    os.makedirs(os.path.dirname(out_path), exist_ok=True)
    
    payload = {
        'df': df,
        'embeddings': embeddings
    }
    
    print("Saving heavy SentenceTransformer assets...")
    with open(out_path, 'wb') as f:
        pickle.dump(payload, f)
        
    size_mb = os.path.getsize(out_path) / (1024 * 1024)
    print(f"\n[OK] Saved {out_path} ({size_mb:.2f} MB)")
    print("bns_assets.pkl successfully remodified.")

if __name__ == "__main__":
    build_bns_assets()
