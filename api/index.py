import sys
import os

# Add backend directory to path for module-style imports used in backend/main.py
BACKEND_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend"))
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

from main import app

# Vercel serverless function handler
handler = app
