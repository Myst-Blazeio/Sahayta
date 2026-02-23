"""
keep_alive.py
─────────────
Pings the /api/health endpoint every 5 minutes to prevent the Render
free-tier server from going to sleep due to inactivity.

This runs in a daemon background thread — it will stop automatically
when the main process exits.

Usage: import and call `start_keep_alive()` once during app startup.
       Set the RENDER_URL environment variable to your deployed URL, e.g.:
           RENDER_URL=https://your-app.onrender.com
"""

import threading
import time
import os
import logging
import requests

logger = logging.getLogger(__name__)

PING_INTERVAL_SECONDS = 5 * 60   # 5 minutes
HEALTH_PATH            = "/api/health"


def _ping_loop(url: str) -> None:
    """Background loop that pings the health endpoint on a fixed interval."""
    while True:
        time.sleep(PING_INTERVAL_SECONDS)
        try:
            response = requests.get(url, timeout=10)
            logger.info(f"[keep_alive] Ping → {url} | {response.status_code}")
        except Exception as exc:
            logger.warning(f"[keep_alive] Ping failed → {url} | {exc}")


def start_keep_alive() -> None:
    """
    Start the keep-alive background thread.

    Only activates when RENDER_URL is set in the environment, so it is
    completely harmless in local development (where the variable is absent).
    """
    render_url = os.environ.get("RENDER_URL", "").rstrip("/")

    if not render_url:
        logger.info("[keep_alive] RENDER_URL not set — keep-alive disabled (local mode).")
        return

    target = render_url + HEALTH_PATH
    logger.info(f"[keep_alive] Starting — will ping {target} every {PING_INTERVAL_SECONDS // 60} min.")

    thread = threading.Thread(target=_ping_loop, args=(target,), daemon=True)
    thread.start()
