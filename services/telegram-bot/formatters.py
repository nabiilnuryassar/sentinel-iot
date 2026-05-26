"""Reply formatters for Sentinel-IoT bot commands.

Pure functions over the JSON shapes returned by the Laravel API. Kept
separate from telegram-aware handlers so they can be unit-tested in
isolation without mocking PTB.
"""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Any, Iterable

# Telegram hard limits a single message to 4096 chars.
TELEGRAM_MAX_LEN = 4096
_TRUNCATE_SUFFIX = "\n…(truncated)"


def truncate(text: str, limit: int = TELEGRAM_MAX_LEN) -> str:
    """Cap a markdown reply at Telegram's per-message limit, suffixing a notice."""
    if len(text) <= limit:
        return text
    head = text[: max(0, limit - len(_TRUNCATE_SUFFIX))]
    return head.rstrip() + _TRUNCATE_SUFFIX


def _relative_time(iso_timestamp: str | None) -> str:
    """Render an ISO8601 timestamp as a coarse relative string ('2m ago')."""
    if not iso_timestamp:
        return "never"
    try:
        # `fromisoformat` handles `+00:00` natively. Normalise the Z form.
        normalized = iso_timestamp.replace("Z", "+00:00")
        seen = datetime.fromisoformat(normalized)
    except ValueError:
        return iso_timestamp

    if seen.tzinfo is None:
        seen = seen.replace(tzinfo=timezone.utc)

    delta = datetime.now(timezone.utc) - seen
    seconds = int(delta.total_seconds())
    if seconds < 0:
        return "just now"
    if seconds < 60:
        return f"{seconds}s ago"
    minutes = seconds // 60
    if minutes < 60:
        return f"{minutes}m ago"
    hours = minutes // 60
    if hours < 48:
        return f"{hours}h ago"
    days = hours // 24
    return f"{days}d ago"


def status_dot(is_online: bool) -> str:
    return "🟢" if is_online else "🔴"


def severity_marker(severity: str | None) -> str:
    return {
        "critical": "🔥",
        "high": "🔴",
        "medium": "🟠",
        "low": "🟡",
    }.get((severity or "").lower(), "⚪")


def format_help() -> str:
    return (
        "*Sentinel-IoT bot commands*\n"
        "/start — health check\n"
        "/status — operations summary\n"
        "/devices — list devices\n"
        "/incidents — list open incidents\n"
        "/audit — run a broker security audit\n"
        "/help — show this message\n"
        "_Free text is forwarded to the Sentinel agent._"
    )


def format_start() -> str:
    return "Sentinel-IoT bot ready. Use /help for commands."


def format_status(summary: dict[str, Any]) -> str:
    return (
        "*Sentinel-IoT status*\n"
        f"Devices: {summary.get('online_devices', 0)}/{summary.get('total_devices', 0)} online "
        f"({summary.get('offline_devices', 0)} offline)\n"
        f"Security events today: {summary.get('security_events_today', 0)}\n"
        f"Open incidents: {summary.get('open_incidents', 0)}\n"
        f"Risk level: *{summary.get('risk_level', 'unknown')}*"
    )


def _devices_iter(payload: dict[str, Any]) -> Iterable[dict[str, Any]]:
    data = payload.get("data") if isinstance(payload, dict) else None
    if isinstance(data, list):
        return data
    return []


def format_devices(payload: dict[str, Any], *, limit: int = 20) -> str:
    devices = list(_devices_iter(payload))
    if not devices:
        return "No devices registered."

    shown = devices[:limit]
    lines = ["*Devices*"]
    for device in shown:
        dot = status_dot(bool(device.get("is_online")))
        device_id = device.get("device_id", "?")
        device_type = device.get("type") or "unknown"
        seen = _relative_time(device.get("last_seen_at"))
        lines.append(f"{dot} `{device_id}` · {device_type} · {seen}")

    if len(devices) > limit:
        lines.append(f"_…and {len(devices) - limit} more_")
    return "\n".join(lines)


def format_incidents(payload: dict[str, Any], *, limit: int = 20) -> str:
    incidents = list(_devices_iter(payload))
    if not incidents:
        return "No open incidents."

    shown = incidents[:limit]
    lines = ["*Open incidents*"]
    for incident in shown:
        marker = severity_marker(incident.get("severity"))
        title = incident.get("title", "(untitled)")
        ident = incident.get("id", "?")
        lines.append(f"{marker} *{incident.get('severity', '?')}* · {title} (#{ident})")
        summary = incident.get("summary")
        if summary:
            # Trim long single-line summaries so the list stays scannable.
            short = summary.splitlines()[0]
            if len(short) > 160:
                short = short[:157] + "…"
            lines.append(f"   _{short}_")

    if len(incidents) > limit:
        lines.append(f"_…and {len(incidents) - limit} more_")
    return "\n".join(lines)


def format_agent_response(payload: dict[str, Any]) -> str:
    response = payload.get("response") if isinstance(payload, dict) else None
    if not isinstance(response, str) or not response.strip():
        return "_Agent returned no content._"
    return response.strip()


def format_error(detail: str) -> str:
    return f"⚠️ Sentinel API error: {detail}"
