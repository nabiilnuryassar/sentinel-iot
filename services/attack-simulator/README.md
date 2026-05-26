# Sentinel-IoT Attack Simulator

Four short scripts that drive the security event pipeline end-to-end. Each one
maps to a demo scenario in PRD §23 and triggers exactly one observable outcome
(broker rejection or `security_events` row).

| Script                    | Credentials used                                | Expected outcome                                                      | PRD §23 scenario      |
|---------------------------|-------------------------------------------------|-----------------------------------------------------------------------|-----------------------|
| `unauthorized_publish.py` | `attacker-client` / `wrong-password` (no row in passwordfile) | Broker refuses connection (reason code 5). No `security_events` row. Mosquitto logs the rejection. | Scenario 3 (part 1)  |
| `malformed_payload.py`    | `sentinel_device` (valid)                       | One `security_events` row, `event_type='malformed_payload'`, `severity='medium'`. | Scenario 2            |
| `spoof_device.py`         | `sentinel_device` (valid)                       | One `security_events` row, `event_type='device_spoofing'`, `severity='high'`. | Scenario 3 (part 2)  |
| `publish_flood.py`        | `sentinel_device` (valid)                       | Exactly one `security_events` row, `event_type='publish_flood'`, `severity='high'` (rate-limit detected by the ingestor). | Bonus / availability  |

`unauthorized_publish.py` is rejected at the broker — the message never reaches
the ingestor, so no security event row is written. The proof is in
`docker logs sentinel-mosquitto`.

`publish_flood.py` sends 200 messages in ~5 seconds (~40 msg/s) and the
ingestor's `RateLimiter` (sliding window, 50 msgs / 10 s, 60 s cooldown per
topic device_id partition) fires once.

## How to run

### Option A — host Python (recommended for local dev)

Requires Python 3.10+ and the broker reachable at `localhost:1883`.

```bash
cd services/attack-simulator
pip install -r requirements.txt

MQTT_HOST=localhost MQTT_PORT=1883 python malformed_payload.py
MQTT_HOST=localhost MQTT_PORT=1883 python spoof_device.py
MQTT_HOST=localhost MQTT_PORT=1883 python publish_flood.py
MQTT_HOST=localhost MQTT_PORT=1883 python unauthorized_publish.py
```

The default username/password env vars (`MQTT_USERNAME`, `MQTT_PASSWORD`)
match the project's `.env` for `sentinel_device`. Override only if you've
changed broker credentials.

### Option B — one-shot Docker container (no host Python required)

Run inside the existing compose network so `mosquitto` resolves by name:

```bash
docker run --rm --network sentinel-iot_default \
  -v "$PWD/services/attack-simulator:/app" -w /app \
  -e MQTT_HOST=mosquitto -e MQTT_PORT=1883 \
  python:3.12-slim sh -c 'pip install --quiet paho-mqtt && python malformed_payload.py'
```

Replace `malformed_payload.py` with any of the four scripts.

### Option C — run them all in sequence

`run_all.sh` runs every script with a 5 s gap between them so the ingestor has
time to process and write events:

```bash
cd services/attack-simulator
./run_all.sh                 # Option A — needs host Python + paho-mqtt
ATTACK_DOCKER=1 ./run_all.sh # Option B — uses docker run
```

## Verifying outcomes

After a run, check Postgres:

```bash
docker compose exec postgres psql -U sentinel -d sentinel_iot -c \
  "select event_type, severity, description, detected_at from security_events order by detected_at desc limit 5;"
```

For the unauthorized run, check Mosquitto:

```bash
docker logs sentinel-mosquitto --tail 20 | grep -i "attacker-client\|denied\|refused"
```

## Environment variables

| Variable           | Default       | Notes                                                  |
|--------------------|---------------|--------------------------------------------------------|
| `MQTT_HOST`        | `localhost`   | Use `mosquitto` when running inside the compose network. |
| `MQTT_PORT`        | `1883`        |                                                        |
| `MQTT_USERNAME`    | `sentinel_device` | Used by malformed/spoof/flood. Not used by unauthorized. |
| `MQTT_PASSWORD`    | `sentinel_mqtt_password` | Same.                                          |
| `ATTACK_LOG_LEVEL` | `INFO`        |                                                        |

These scripts deliberately do NOT add a new MQTT user. The unauthorized test's
whole point is that `attacker-client` is **absent** from
`mosquitto/config/passwordfile`, which is why the broker rejects it.
