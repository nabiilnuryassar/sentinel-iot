"""Pytest path setup so `import bot`/`import sentinel_api` resolve to the service modules."""

from __future__ import annotations

import sys
from pathlib import Path

SERVICE_DIR = Path(__file__).resolve().parent
if str(SERVICE_DIR) not in sys.path:
    sys.path.insert(0, str(SERVICE_DIR))
