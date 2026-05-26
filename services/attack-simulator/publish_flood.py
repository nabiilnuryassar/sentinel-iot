"""Attack: publish flood (Phase 6 / P6.4).

Connects with valid `sentinel_device` credentials and publishes 200 valid
telemetry messages over ~5 seconds (~40 msg/s, well above the 50/10s
threshold). Payloads are well-formed; only the rate is abnormal \u2014 this
exercises the ingestor's rate limiter, not the validators.

Expected outcome:
- ONE row in `security_events` with `event_type='publish_flood'`,
  `severity='high'`. The 1-event-per-minute-per-partition cooldown caps
  reporting even though we send 200 messages.
"""

from __future__ import annotations

import json
import logging
import os
import sys
import time
from datetime import datetime, timezone

import paho.mqtt.client as mqtt

LOG = logging.getLogger("sentinel.attack.publish_flood")

TOPIC = "iot/building-a/lab-a/temp-sensor-001/telemetry"
DEVICE_ID = "temp-sensor-001"
TOTAL_MESSAGES = 200
WINDOW_SECONDS = 5.0  # spread across this many seconds
INTER_MESSAGE_DELAY = WINDOW_SECONDS / TOTAL_MESSAGES  # ~25ms => ~40 msg/s


def _build_payload(i: int) -> dict:
    return {
        "device_id": DEVICE_ID,
        "type": "temperature_sensor",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "location": "lab-a",
        "temperature": 24.0 + (i % 5) * 0.1,
        "humidity": 60,
        "battery": 90,
        "rssi": -60,
    }


def main() -> int:
    logging.basicConfig(
        level=os.getenv("ATTACK_LOG_LEVEL", "INFO"),
        format="%(asctime)s %(levelname)s %(message)s",
    )

    host = os.getenv("MQTT_HOST", "localhost")
    port = int(os.getenv("MQTT_PORT", "1883"))
    username = os.getenv("MQTT_USERNAME", "sentinel_device")
    password = os.getenv("MQTT_PASSWORD", "sentinel_mqtt_password")

    client = mqtt.Client(
        callback_api_version=mqtt.CallbackAPIVersion.VERSION2,
        client_id="attack-publish-flood",
        protocol=mqtt.MQTTv311,
        clean_session=True,
    )
    client.username_pw_set(username, password)

    def on_connect(c, u, f, reason_code, p):  # noqa: ANN001
        if reason_code == 0:
            LOG.info("connected to %s:%s as %s", host, port, username)
        else:
            LOG.error("connect failed: %s", reason_code)

    client.on_connect = on_connect

    LOG.info("connecting to %s:%s", host, port)
    client.connect(host, port, keepalive=30)
    client.loop_start()
    time.sleep(0.5)

    LOG.info(
        "flooding %d messages to %s over ~%.1fs (\u2248%.0f msg/s)",
        TOTAL_MESSAGES,
        TOPIC,
        WINDOW_SECONDS,
        TOTAL_MESSAGES / WINDOW_SECONDS,
    )
    started = time.monotonic()
    failures = 0
    for i in range(TOTAL_MESSAGES):
        body = json.dumps(_build_payload(i))
        info = client.publish(TOPIC, body, qos=0, retain=False)
        if info.rc != mqtt.MQTT_ERR_SUCCESS:
            failures += 1
        time.sleep(INTER_MESSAGE_DELAY)

    elapsed = time.monotonic() - started
    LOG.info(
        "flood complete: %d sent, %d publish failures, elapsed=%.2fs",
        TOTAL_MESSAGES,
        failures,
        elapsed,
    )

    # Give the ingestor a moment to process the tail of the queue.
    time.sleep(2.0)
    client.loop_stop()
    client.disconnect()
    LOG.info(
        "done. expect ONE security_events row: event_type=publish_flood severity=high"
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())
