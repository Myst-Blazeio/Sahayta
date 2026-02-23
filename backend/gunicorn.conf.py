import os

# ── Binding ──────────────────────────────────────────────────────────────────
bind = f"0.0.0.0:{os.environ.get('PORT', '5000')}"

# ── Workers ──────────────────────────────────────────────────────────────────
# Render free plan has limited CPU; 2 workers is a safe default.
# Formula: (2 x CPU cores) + 1  → free plan has 1 vCPU → 3 workers max
workers = int(os.environ.get('WEB_CONCURRENCY', 2))
worker_class = 'sync'          # sync workers are fine for Flask
threads = 2                     # extra threads per worker for I/O wait
timeout = 120                   # 2 min timeout (ML inference can be slow)
keepalive = 5

# ── Logging ──────────────────────────────────────────────────────────────────
accesslog = '-'   # stdout
errorlog  = '-'   # stderr
loglevel  = os.environ.get('LOG_LEVEL', 'info')

# ── Process naming ───────────────────────────────────────────────────────────
proc_name = 'fir-automation-backend'
