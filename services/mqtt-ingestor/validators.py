"""Topic + payload validation for the Sentinel-IoT ingestor.

Pure functions, zero I/O. Easy to unit-test against the simulator's payload
shape without spinning up a broker or a database.
"""

from __future__ import annotations

import re
from typing import Any

# iot/{building}/{room}/{device_id}/(telemetry|event)
_TOPIC_RE = re.compile(r"^iot/([^/]+)/([^/]+)/([^/]+)/(telemetry|event)$")

# PRD §12.3 required telemetry payload fields.
REQUIRED_FIELDS: tuple[str, ...] = ("device_id", "type", "timestamp", "location")

# Numeric columns we promote to typed columns on telemetry_logs.
NUMERIC_FIELDS: tuple[str, ...] = ("temperature", "humidity", "battery", "rssi")


def parse_topic(topic: str) -> tuple[str, str, str, str] | None:
    """Match `iot/{building}/{room}/{device_id}/(telemetry|event)`.

    Returns (building, room, device_id, kind) or None if the topic does not
    match the contract. `kind` is either "telemetry" or "event".
    """
    if not isinstance(topic, str):
        return None
    match = _TOPIC_RE.match(topic)
    if not match:
        return None
    building, room, device_id, kind = match.groups()
    return building, room, device_id, kind


def validate_telemetry(
    payload: dict[str, Any], topic: str
) -> tuple[bool, str | None]:
    """Validate a telemetry payload against PRD §12.3.

    Returns (True, None) on success.

    On failure returns (False, reason) where reason is:
    - "missing_<field>" for a missing required field
    - "device_spoofing" when the topic device_id != payload device_id
    - "invalid_topic" if the topic itself is malformed (defensive)
    """
    if not isinstance(payload, dict):
        return False, "invalid_payload"

    for field in REQUIRED_FIELDS:
        if field not in payload or payload[field] in (None, ""):
            return False, f"missing_{field}"

    parsed = parse_topic(topic)
    if parsed is None:
        return False, "invalid_topic"

    _, _, topic_device_id, _ = parsed
    if topic_device_id != payload["device_id"]:
        return False, "device_spoofing"

    return True, None


def extract_typed_columns(payload: dict[str, Any]) -> dict[str, float | None]:
    """Pull temperature/humidity/battery/rssi out of the payload as floats.

    Non-numeric values are treated as missing. Always returns all four keys so
    `db.insert_telemetry(**extract_typed_columns(...))` is safe.
    """
    out: dict[str, float | None] = {field: None for field in NUMERIC_FIELDS}
    if not isinstance(payload, dict):
        return out

    for field in NUMERIC_FIELDS:
        if field not in payload:
            continue
        value = payload[field]
        if isinstance(value, bool):
            # bools are ints in Python — explicitly skip to avoid surprises.
            continue
        if isinstance(value, (int, float)):
            out[field] = float(value)
    return out
