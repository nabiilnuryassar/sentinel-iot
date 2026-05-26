"""Attack: malformed payload (Phase 6 / P6.2).

Connects with valid `sentinel_device` credentials, then publishes a JSON
object missing every required field to a valid telemetry topic.

Expected outcome:
- One row in `security_events` with `event_type='malformed_payload'`,
  `severity='medium'`, description like `missing_device_id`.

Maps to PRD \u00a723 Scenario 2 (Malformed Payload Attack).
"""

from __future__ import annotations

import json
import logging
import os
import sys
import time

import paho.mqtt.client as mqtt

LOG = logging.getLogger("sentinel.attack.malformed_payload")

TOPIC = "iot/building-a/lab-a/temp-sensor-001/telemetry"
PAYLOAD = {"foo": "bar"}


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
        client_id="attack-malformed-payload",
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
    client.connect(host, port, keepalive=10)
    client.loop_start()
    time.sleep(0.5)

    body = json.dumps(PAYLOAD)
    LOG.info("publishing malformed payload to %s: %s", TOPIC, body)
    info = client.publish(TOPIC, body, qos=1, retain=False)
    info.wait_for_publish(timeout=5)
    LOG.info("published rc=%s", info.rc)

    time.sleep(2.0)
    client.loop_stop()
    client.disconnect()
    LOG.info(
        "done. expect security_events row: event_type=malformed_payload severity=medium"
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())
