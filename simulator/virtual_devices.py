"""Sentinel-IoT virtual device simulator.

Loads device profiles from device_profiles.json, then for each profile spawns a
worker thread that publishes telemetry over MQTT at a configurable interval.

Phase 1 deliverable per thoughts/shared/plans/sentinel-iot-plan.md.
"""

from __future__ import annotations

import argparse
import json
import logging
import os
import random
import signal
import sys
import threading
import time
from datetime import datetime
from pathlib import Path
from typing import Any

import paho.mqtt.client as mqtt
from dotenv import load_dotenv

LOG = logging.getLogger("sentinel.simulator")

SCRIPT_DIR = Path(__file__).resolve().parent
PROFILES_PATH = SCRIPT_DIR / "device_profiles.json"
REPO_ROOT = SCRIPT_DIR.parent
ENV_PATH = REPO_ROOT / ".env"

REQUIRED_PAYLOAD_FIELDS = ("device_id", "type", "timestamp", "location")

_shutdown = threading.Event()


def load_profiles(path: Path) -> list[dict[str, Any]]:
    with path.open("r", encoding="utf-8") as fh:
        profiles = json.load(fh)
    if not isinstance(profiles, list) or not profiles:
        raise ValueError(f"{path} must contain a non-empty JSON array")
    return profiles


def _sample_field(spec: dict[str, Any]) -> Any:
    """Sample a single payload field from its template spec."""
    if "choices" in spec:
        return random.choice(spec["choices"])
    if "min" in spec and "max" in spec:
        value = random.uniform(spec["min"], spec["max"])
        precision = spec.get("round", 2)
        if precision == 0:
            return int(round(value))
        return round(value, precision)
    raise ValueError(f"Unsupported field spec: {spec}")


def build_payload(profile: dict[str, Any], anomaly: bool) -> dict[str, Any]:
    """Construct one telemetry payload for a device profile."""
    payload: dict[str, Any] = {
        "device_id": profile["device_id"],
        "type": profile["type"],
        "location": profile["location"],
        "timestamp": datetime.now().astimezone().isoformat(),
        "status": "anomaly" if anomaly else "normal",
    }

    template = profile["payload_template"]
    anomaly_overrides = profile.get("anomaly", {}) if anomaly else {}

    for field, spec in template.items():
        if anomaly and field in anomaly_overrides:
            payload[field] = anomaly_overrides[field]
        else:
            payload[field] = _sample_field(spec)

    missing = [f for f in REQUIRED_PAYLOAD_FIELDS if f not in payload]
    if missing:
        raise RuntimeError(
            f"Payload for {profile['device_id']} missing required fields: {missing}"
        )

    return payload


def _format_payload_summary(payload: dict[str, Any]) -> str:
    skip = {"device_id", "type", "timestamp", "location", "status"}
    parts = [f"{k}={v}" for k, v in payload.items() if k not in skip]
    return " ".join(parts)


def make_client(client_id: str, host: str, port: int, username: str, password: str) -> mqtt.Client:
    """Create a paho-mqtt 2.x client wired with credentials and reconnect policy."""
    client = mqtt.Client(
        callback_api_version=mqtt.CallbackAPIVersion.VERSION2,
        client_id=client_id,
        protocol=mqtt.MQTTv311,
        clean_session=True,
    )
    client.username_pw_set(username, password)
    client.reconnect_delay_set(min_delay=1, max_delay=30)

    def on_connect(client_, userdata, flags, reason_code, properties):  # noqa: ANN001
        if reason_code == 0:
            LOG.info("[%s] connected to %s:%s", client_id, host, port)
        else:
            LOG.error("[%s] connect failed: %s", client_id, reason_code)

    def on_disconnect(client_, userdata, flags, reason_code, properties):  # noqa: ANN001
        LOG.warning("[%s] disconnected: %s", client_id, reason_code)

    client.on_connect = on_connect
    client.on_disconnect = on_disconnect
    return client


def device_worker(
    profile: dict[str, Any],
    host: str,
    port: int,
    username: str,
    password: str,
    interval: float,
    once: bool,
    anomaly: bool,
) -> None:
    """Per-device thread: connect, publish, sleep, repeat."""
    device_id = profile["device_id"]
    topic = profile["topic"]
    client_id = f"sim-{device_id}"

    client = make_client(client_id, host, port, username, password)

    try:
        client.connect(host, port, keepalive=30)
    except Exception as exc:  # noqa: BLE001
        LOG.error("[%s] initial connect raised: %s", device_id, exc)
        return

    client.loop_start()
    try:
        while not _shutdown.is_set():
            payload = build_payload(profile, anomaly=anomaly)
            body = json.dumps(payload, separators=(",", ":"))
            result = client.publish(topic, body, qos=0, retain=False)
            try:
                result.wait_for_publish(timeout=5)
            except (RuntimeError, ValueError):
                pass

            if result.rc == mqtt.MQTT_ERR_SUCCESS:
                LOG.info(
                    "[%s] -> %s | %s",
                    device_id,
                    topic,
                    _format_payload_summary(payload),
                )
            else:
                LOG.error("[%s] publish failed rc=%s", device_id, result.rc)

            if once:
                break

            # Interruptible sleep
            if _shutdown.wait(interval):
                break
    finally:
        client.loop_stop()
        try:
            client.disconnect()
        except Exception:  # noqa: BLE001
            pass


def install_signal_handlers() -> None:
    def _handler(signum, frame):  # noqa: ANN001
        LOG.info("signal %s received, shutting down", signum)
        _shutdown.set()

    for sig in (signal.SIGINT, signal.SIGTERM):
        try:
            signal.signal(sig, _handler)
        except (ValueError, OSError):
            # SIGTERM is unavailable on some Windows shells; ignore
            pass


def parse_args(argv: list[str] | None = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Sentinel-IoT virtual device simulator.",
    )
    parser.add_argument(
        "--interval",
        type=float,
        default=5.0,
        help="Publish interval in seconds (default: 5)",
    )
    parser.add_argument(
        "--anomaly",
        action="append",
        default=[],
        metavar="DEVICE_ID",
        help="Force out-of-range payload for the given device id (repeatable)",
    )
    parser.add_argument(
        "--once",
        action="store_true",
        help="Publish exactly one message per device, then exit",
    )
    parser.add_argument(
        "--profiles",
        type=Path,
        default=PROFILES_PATH,
        help=f"Path to device profiles JSON (default: {PROFILES_PATH})",
    )
    parser.add_argument(
        "--log-level",
        default=os.getenv("SIMULATOR_LOG_LEVEL", "INFO"),
        help="Logging level (default: INFO)",
    )
    return parser.parse_args(argv)


def main(argv: list[str] | None = None) -> int:
    args = parse_args(argv)

    logging.basicConfig(
        level=args.log_level.upper(),
        format="%(asctime)s %(levelname)s %(message)s",
    )

    if ENV_PATH.exists():
        load_dotenv(ENV_PATH)
        LOG.debug("loaded env from %s", ENV_PATH)

    host = os.getenv("MQTT_HOST", "localhost")
    port = int(os.getenv("MQTT_PORT", "1883"))
    username = os.getenv("MQTT_USERNAME", "sentinel_device")
    password = os.getenv("MQTT_PASSWORD", "sentinel_mqtt_password")

    profiles = load_profiles(args.profiles)
    profile_ids = {p["device_id"] for p in profiles}

    unknown = [d for d in args.anomaly if d not in profile_ids]
    if unknown:
        LOG.error("unknown --anomaly device id(s): %s", ", ".join(unknown))
        LOG.error("known device ids: %s", ", ".join(sorted(profile_ids)))
        return 2

    anomaly_set = set(args.anomaly)

    LOG.info(
        "starting %d device(s), interval=%.1fs, once=%s, anomalies=%s, broker=%s:%s",
        len(profiles),
        args.interval,
        args.once,
        sorted(anomaly_set) or "none",
        host,
        port,
    )

    install_signal_handlers()

    threads: list[threading.Thread] = []
    for profile in profiles:
        thread = threading.Thread(
            target=device_worker,
            name=f"dev-{profile['device_id']}",
            kwargs={
                "profile": profile,
                "host": host,
                "port": port,
                "username": username,
                "password": password,
                "interval": args.interval,
                "once": args.once,
                "anomaly": profile["device_id"] in anomaly_set,
            },
            daemon=True,
        )
        thread.start()
        threads.append(thread)

    try:
        if args.once:
            for thread in threads:
                thread.join(timeout=15)
        else:
            while not _shutdown.is_set():
                _shutdown.wait(1.0)
            for thread in threads:
                thread.join(timeout=10)
    except KeyboardInterrupt:
        _shutdown.set()
        for thread in threads:
            thread.join(timeout=10)

    LOG.info("simulator exited cleanly")
    return 0


if __name__ == "__main__":
    sys.exit(main())
