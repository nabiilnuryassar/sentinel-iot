"""Sentinel-IoT MQTT ingestor.

Subscriber loop that:
1. Receives messages from `iot/+/+/+/telemetry` and `iot/+/+/+/event`.
2. Decodes UTF-8, parses JSON, validates topic + payload.
3. Persists telemetry rows (with typed columns) and updates `devices.last_seen_at`.
4. Records every failure mode as a `security_events` row with severity from PRD §12.3.

Phase 2 deliverable per thoughts/shared/plans/sentinel-iot-plan.md.
"""

from __future__ import annotations

import json
import logging
import os
import signal
import sys
from datetime import datetime, timezone
from typing import Any

import paho.mqtt.client as mqtt
from dotenv import load_dotenv

import db
import validators
from rate_limiter import RateLimiter

LOG = logging.getLogger("sentinel.ingestor")

TELEMETRY_TOPIC = "iot/+/+/+/telemetry"
EVENT_TOPIC = "iot/+/+/+/event"

# Phase 6 / D7: detect publish floods on a per-topic-device_id partition.
# >50 messages in 10s → one security_events row, capped at 1 per minute per partition.
# Partitioning by topic device_id (not source_client_id) is forced by paho-mqtt v2 not
# exposing the broker username in on_message. See rate_limiter.py module docstring.
_RATE_LIMITER = RateLimiter(window_seconds=10, threshold=50, cooldown_seconds=60)

# Map a missing-field/spoofing reason to (event_type, severity) for security_events.
_REASON_MAP: dict[str, tuple[str, str]] = {
    "device_spoofing": ("device_spoofing", "high"),
    "invalid_topic": ("invalid_topic", "low"),
    "invalid_payload": ("malformed_payload", "medium"),
}

_shutdown = False


def _now_utc() -> datetime:
    return datetime.now(timezone.utc)


def _log_event(level: int, kind: str, **fields: Any) -> None:
    """Emit a single-line JSON-ish log record."""
    parts = [f"{k}={fields[k]!r}" for k in sorted(fields)]
    LOG.log(level, "%s %s", kind, " ".join(parts))


def _record_security_event(
    *,
    event_type: str,
    severity: str,
    topic: str | None,
    payload: dict[str, Any] | None,
    description: str,
) -> None:
    """Persist a security event, swallowing DB errors so the loop keeps running."""
    try:
        db.insert_security_event(
            event_type=event_type,
            severity=severity,
            topic=topic,
            payload_json=payload,
            description=description,
            detected_at=_now_utc(),
        )
        _log_event(
            logging.WARNING,
            "security_event",
            event_type=event_type,
            severity=severity,
            topic=topic,
            description=description,
        )
    except Exception as exc:  # noqa: BLE001
        LOG.error("failed to persist security event: %s", exc)


def _handle_telemetry(
    topic: str,
    payload: dict[str, Any],
    device_id: str,
) -> None:
    """Validate + persist a telemetry payload. Emits security events on failure."""
    ok, reason = validators.validate_telemetry(payload, topic)
    if not ok:
        assert reason is not None
        if reason.startswith("missing_"):
            event_type, severity, description = (
                "malformed_payload",
                "medium",
                reason,
            )
        else:
            event_type, severity = _REASON_MAP.get(reason, ("malformed_payload", "medium"))
            description = reason
        _record_security_event(
            event_type=event_type,
            severity=severity,
            topic=topic,
            payload=payload,
            description=description,
        )
        return

    typed = validators.extract_typed_columns(payload)
    received_at = _now_utc()
    try:
        db.insert_telemetry(
            device_id=device_id,
            topic=topic,
            payload_json=payload,
            received_at=received_at,
            **typed,
        )
        db.update_device_last_seen(
            device_id=device_id,
            last_seen_at=received_at,
            type=payload.get("type"),
            location=payload.get("location"),
            status="online",
        )
        _log_event(
            logging.INFO,
            "telemetry_persisted",
            device_id=device_id,
            topic=topic,
            **{k: typed[k] for k in typed if typed[k] is not None},
        )
    except Exception as exc:  # noqa: BLE001
        LOG.error("failed to persist telemetry from %s: %s", device_id, exc)


def _handle_event(topic: str, payload: dict[str, Any], device_id: str) -> None:
    """Persist a `iot/.../event` message as a generic device_event security row.

    PRD §12.3 leaves event semantics open; storing them with low severity keeps
    them visible without making policy decisions. Future phases can refine.
    """
    _record_security_event(
        event_type="device_event",
        severity="low",
        topic=topic,
        payload=payload,
        description=f"event from {device_id}",
    )


def on_connect(client, userdata, flags, reason_code, properties):  # noqa: ANN001
    if reason_code == 0:
        client.subscribe([(TELEMETRY_TOPIC, 1), (EVENT_TOPIC, 1)])
        LOG.info(
            "connected and subscribed: %s, %s", TELEMETRY_TOPIC, EVENT_TOPIC
        )
    else:
        LOG.error("connect failed: %s", reason_code)


def on_disconnect(client, userdata, flags, reason_code, properties):  # noqa: ANN001
    LOG.warning("disconnected: %s", reason_code)


def on_message(client, userdata, msg):  # noqa: ANN001
    topic = msg.topic
    raw = msg.payload

    # Step 1: decode bytes
    try:
        text = raw.decode("utf-8")
    except UnicodeDecodeError:
        _record_security_event(
            event_type="malformed_payload",
            severity="medium",
            topic=topic,
            payload=None,
            description="non-utf8 payload",
        )
        return

    # Step 2: parse JSON
    try:
        payload = json.loads(text)
    except json.JSONDecodeError:
        _record_security_event(
            event_type="malformed_payload",
            severity="medium",
            topic=topic,
            payload=None,
            description="non-json payload",
        )
        return

    if not isinstance(payload, dict):
        _record_security_event(
            event_type="malformed_payload",
            severity="medium",
            topic=topic,
            payload=None,
            description="payload not a json object",
        )
        return

    # Step 3: parse topic
    parsed = validators.parse_topic(topic)
    if parsed is None:
        _record_security_event(
            event_type="invalid_topic",
            severity="low",
            topic=topic,
            payload=payload,
            description="topic does not match iot/+/+/+/(telemetry|event)",
        )
        return

    _, _, topic_device_id, kind = parsed

    # Flood detection runs before the per-kind handler so a malformed flood is
    # still caught. Detection is observational — we never drop the message.
    if _RATE_LIMITER.observe(topic_device_id):
        _record_security_event(
            event_type="publish_flood",
            severity="high",
            topic=topic,
            payload=None,
            description=(
                f"flood detected: >50 msgs in 10s on topic_device_id={topic_device_id}"
            ),
        )

    if kind == "telemetry":
        _handle_telemetry(topic, payload, topic_device_id)
    elif kind == "event":
        _handle_event(topic, payload, topic_device_id)
    else:  # defensive — regex restricts kind already
        _record_security_event(
            event_type="invalid_topic",
            severity="low",
            topic=topic,
            payload=payload,
            description=f"unknown kind: {kind}",
        )


def _install_signal_handlers(client: mqtt.Client) -> None:
    def handler(signum, frame):  # noqa: ANN001
        global _shutdown
        LOG.info("signal %s received, disconnecting", signum)
        _shutdown = True
        try:
            client.disconnect()
        except Exception:  # noqa: BLE001
            pass

    for sig in (signal.SIGINT, signal.SIGTERM):
        try:
            signal.signal(sig, handler)
        except (ValueError, OSError):
            pass


def main() -> int:
    logging.basicConfig(
        level=os.getenv("INGESTOR_LOG_LEVEL", "INFO").upper(),
        format="%(asctime)s %(levelname)s %(name)s %(message)s",
    )

    load_dotenv()  # no-op when /app/.env is absent

    host = os.getenv("MQTT_HOST", "mosquitto")
    port = int(os.getenv("MQTT_PORT", "1883"))
    username = os.getenv("MQTT_INGESTOR_USERNAME", "sentinel_ingestor")
    password = os.getenv("MQTT_INGESTOR_PASSWORD", "sentinel_ingestor_password")

    # Eagerly open the DB pool so connection errors fail fast on boot.
    db.get_pool()

    client = mqtt.Client(
        callback_api_version=mqtt.CallbackAPIVersion.VERSION2,
        client_id="sentinel-ingestor",
        protocol=mqtt.MQTTv311,
        clean_session=True,
    )
    client.username_pw_set(username, password)
    client.reconnect_delay_set(min_delay=1, max_delay=30)
    client.on_connect = on_connect
    client.on_disconnect = on_disconnect
    client.on_message = on_message

    _install_signal_handlers(client)

    LOG.info("connecting to broker %s:%s as %s", host, port, username)
    client.connect_async(host, port, keepalive=60)

    try:
        client.loop_forever(retry_first_connection=True)
    except KeyboardInterrupt:
        pass
    finally:
        try:
            client.disconnect()
        except Exception:  # noqa: BLE001
            pass
        db.close_pool()

    LOG.info("ingestor exited cleanly")
    return 0


if __name__ == "__main__":
    sys.exit(main())
