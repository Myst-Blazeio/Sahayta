# Gunicorn configuration — auto-loaded by Gunicorn from the working directory.
# Render runs: gunicorn app:app --bind 0.0.0.0:$PORT --workers 1 --threads 4
# These settings extend/override what's on the command line from the dashboard.

# ── Worker config ─────────────────────────────────────────────────────────────
workers = 1          # Free tier: 1 worker to stay within 512 MB RAM
threads = 4          # Thread-based concurrency within the single worker
worker_class = "gthread"

# ── Critical fixes for Render free tier ───────────────────────────────────────
# preload_app: Load Flask app + all ML models ONCE in the master process.
# Workers are forked from master using Linux copy-on-write — no double RAM load.
# Without this, each worker re-imports the app, doubling memory and causing OOM.
preload_app = True

# timeout: ML models (BM25 + crime pkl) can take 30–60s to load on cold start.
# Default Gunicorn timeout is 30s — workers get killed before they're ready.
timeout = 120

# ── Logging ───────────────────────────────────────────────────────────────────
accesslog = "-"    # stdout
errorlog  = "-"    # stdout
loglevel  = "info"
