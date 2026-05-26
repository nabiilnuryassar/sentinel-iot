"""Attack: unauthorized publish (Phase 6 / P6.1).

Connects to the broker as `attacker-client` with a password that is NOT in
mosquitto/config/passwordfile. The broker rejects the connection at auth, so
no message ever reaches a subscriber.

Expected outcome:
- paho on_connect fires with a non-zero reason_code (typically 5 / NotAuthorized).
- A "BROKER REJECTED" line is logged.
- No new row in security_events (the broker stops the message before any
  subscriber sees it).
- Mosquitto logs a connection refusal for client `attacker-client`.

Maps to PRD \u00a723 Scenario 3 (Unauthorized Publish) and \u00a712.7 security tester.
"""

from __future__ import annotations

import logging
import os
import sys
import threading
import time

import paho.mqtt.client as mqtt

LOG = logging.getLogger("sentinel.attack.unauthorized_publish")

TOPIC = "iot/building-a/lab-a/temp-sensor-001/telemetry"
PAYLOAD = (
    '{"device_id":"temp-sensor-001","type":"temperature_sensor",'
    '"timestamp":"2026-05-16T08:00:00+00:00","location":"lab-a",'
    '"temperature":22.0}'
)
USERNAME = "attacker-client"
PASSWORD = "wrong-password"


def main() -> int:
    logging.basicConfig(
        level=os.getenv("ATTACK_LOG_LEVEL", "INFO"),
        format="%(asctime)s %(levelname)s %(message)s",
    )

    host = os.getenv("MQTT_HOST", "localhost")
    port = int(os.getenv("MQTT_PORT", "1883"))

    connected_flag = threading.Event()
    rejected_flag = threading.Event()
    reason_holder: dict[str, object] = {"code": None}

    def on_connect(client, userdata, flags, reason_code, properties):  # noqa: ANN001
        reason_holder["code"] = reason_code
        if getattr(reason_code, "is_failure", None) is True or (
            isinstance(reason_code, int) and reason_code != 0
        ):
            LOG.warning("BROKER REJECTED connection: reason=%s", reason_code)
            rejected_flag.set()
        elif reason_code == 0 or (
            hasattr(reason_code, "value") and reason_code.value == 0
        ):
            LOG.error(
                "BROKER ALLOWED connection \u2014 ACL/passwordfile is misconfigured!"
            )
            connected_flag.set()
        else:
            LOG.warning("BROKER REJECTED connection: reason=%s", reason_code)
            rejected_flag.set()

    client = mqtt.Client(
        callback_api_version=mqtt.CallbackAPIVersion.VERSION2,
        client_id="attacker-client",
        protocol=mqtt.MQTTv311,
        clean_session=True,
    )
    client.username_pw_set(USERNAME, PASSWORD)
    client.on_connect = on_connect

    LOG.info("connecting to %s:%s as %s (expecting rejection)", host, port, USERNAME)
    try:
        client.connect(host, port, keepalive=10)
    except Exception as exc:  # noqa: BLE001
        LOG.warning("BROKER REJECTED at TCP/auth handshake: %s", exc)
        return 0

    client.loop_start()
    # Wait briefly for either outcome.
    deadline = time.time() + 5.0
    while time.time() < deadline:
        if rejected_flag.is_set() or connected_flag.is_set():
            break
        time.sleep(0.1)

    # Whatever happened, try a publish so the broker logs the attempt.
    LOG.info("attempting publish to %s", TOPIC)
    info = client.publish(TOPIC, PAYLOAD, qos=0, retain=False)
    LOG.info("publish rc=%s mid=%s", info.rc, info.mid)

    time.sleep(1.0)
    client.loop_stop()
    try:
        client.disconnect()
    except Exception:  # noqa: BLE001
        pass

    if connected_flag.is_set():
        LOG.error("UNEXPECTED: broker accepted attacker-client \u2014 review ACL/passwordfile")
        return 1
    LOG.info("done. final reason=%s", reason_holder["code"])
    return 0


if __name__ == "__main__":
    sys.exit(main())
