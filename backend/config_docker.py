import os
from pathlib import Path

# Base path resolves to /app inside the container
BASE_PATH = Path(__file__).resolve().parent.parent

SESSIONS_BASE = str(BASE_PATH / "frontend" / "python_debug_sessions")
PATH_TO_THEORY = str(BASE_PATH / "frontend" / "theory")
BASE_PATH = str(BASE_PATH)
PATH_TO_APP = str(Path(BASE_PATH) / "backend" / "app")
PATH_TO_FRONTEND = str(Path(BASE_PATH) / "frontend")

# External address the container is exposed on (overridable)
BASE_LINK = os.getenv("BASE_LINK", "http://localhost:5612")
