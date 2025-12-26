import importlib
import os

# Choose config module; defaults to local dev config.
CONFIG_MODULE = os.getenv("ALGOLUME_CONFIG", "backend.config")
_config = importlib.import_module(CONFIG_MODULE)

SESSIONS_BASE = _config.SESSIONS_BASE
PATH_TO_THEORY = _config.PATH_TO_THEORY
BASE_PATH = _config.BASE_PATH
PATH_TO_APP = _config.PATH_TO_APP
PATH_TO_FRONTEND = _config.PATH_TO_FRONTEND
BASE_LINK = _config.BASE_LINK

__all__ = [
    "SESSIONS_BASE",
    "PATH_TO_THEORY",
    "BASE_PATH",
    "PATH_TO_APP",
    "PATH_TO_FRONTEND",
    "BASE_LINK",
]
