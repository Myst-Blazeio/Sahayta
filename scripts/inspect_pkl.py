"""
inspect_pkl.py
--------------
Universal inspector for all .pkl files in the Sahayta project.

Usage:
    python scripts/inspect_pkl.py <path_to_pkl_file>

Examples:
    python scripts/inspect_pkl.py backend/assets/models/bns/bns_bm25.pkl
    python scripts/inspect_pkl.py backend/assets/models/bns/bns_assets.pkl
    python scripts/inspect_pkl.py backend/assets/models/crime_prediction/crime_model.pkl
"""

import pickle
import sys
import os


def inspect_pkl(file_path: str):
    abs_path = os.path.abspath(file_path)
    print(f"\n{'='*60}")
    print(f"  File : {abs_path}")
    print(f"  Size : {os.path.getsize(abs_path) / 1024:.1f} KB")
    print(f"{'='*60}\n")

    try:
        with open(abs_path, "rb") as f:
            data = pickle.load(f)
    except Exception as e:
        print(f"[ERROR] Could not load file: {e}")
        sys.exit(1)

    _describe(data, name="<root>", depth=0)


def _describe(obj, name: str, depth: int):
    indent = "  " * depth
    type_name = type(obj).__name__

    try:
        import pandas as pd
        import numpy as np
    except ImportError:
        pd = None
        np = None

    # ── dict ──────────────────────────────────────────────────────────────────
    if isinstance(obj, dict):
        print(f"{indent}{name}  →  dict  ({len(obj)} keys)")
        for k, v in obj.items():
            _describe(v, name=str(k), depth=depth + 1)

    # ── list / tuple ──────────────────────────────────────────────────────────
    elif isinstance(obj, (list, tuple)):
        print(f"{indent}{name}  →  {type_name}  (len={len(obj)})")
        if len(obj) > 0:
            _describe(obj[0], name="[0]", depth=depth + 1)

    # ── numpy ndarray ─────────────────────────────────────────────────────────
    elif np is not None and isinstance(obj, np.ndarray):
        print(f"{indent}{name}  →  ndarray  shape={obj.shape}  dtype={obj.dtype}")

    # ── pandas DataFrame ──────────────────────────────────────────────────────
    elif pd is not None and isinstance(obj, pd.DataFrame):
        print(f"{indent}{name}  →  DataFrame  shape={obj.shape}")
        print(f"{indent}    Columns: {list(obj.columns)}")
        print(f"{indent}    Head:")
        for line in obj.head(2).to_string().split("\n"):
            print(f"{indent}      {line}")

    # ── sklearn / BM25 / other objects ───────────────────────────────────────
    elif hasattr(obj, "get_params"):          # sklearn models
        print(f"{indent}{name}  →  sklearn {type_name}")
        print(f"{indent}    Params: {obj.get_params()}")
    elif hasattr(obj, "get_scores"):          # BM25Okapi
        print(f"{indent}{name}  →  BM25Okapi  (corpus_size={len(obj.corpus_size if hasattr(obj, 'corpus_size') else [])})")
    else:
        short = repr(obj)
        if len(short) > 120:
            short = short[:117] + "..."
        print(f"{indent}{name}  →  {type_name}  {short}")


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(__doc__)
        sys.exit(0)
    inspect_pkl(sys.argv[1])
