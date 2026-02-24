"""
main.py — Gunicorn entry point.

Usage (as set in Procfile / render.yaml):
    gunicorn main:app --bind 0.0.0.0:$PORT --workers 2 --threads 4
"""

from app import app  # noqa: F401 — re-exported for gunicorn
