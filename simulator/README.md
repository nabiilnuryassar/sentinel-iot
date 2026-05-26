# Sentinel-IoT Virtual Device Simulator

Phase 1 deliverable. A small Python program that loads a list of synthetic IoT
devices from `device_profiles.json` and publishes JSON telemetry over MQTT
against the Mosquitto broker spun up by Phase 0.

## What it does

For each device in `device_profiles.json` it:

1. Connects to the broker using `MQTT_USERNAME` / `MQTT_PASSWORD` from `.env`.
2. Spawns a worker thread that builds a JSON payload (fields randomized within
   the device's normal range), then publishes to the device's `topic`.
3. Repeats every `--interval` seconds, until interrupted (Ctrl+C) or `--once`
   was passed.

Every payload carries the four fields the ingestor will require in Phase 2:
`device_id`, `type`, `timestamp` (ISO 8601 with timezone), `location`.

The `location` field uses the **room name only** (`lab-a`, `server-room`,
`lobby`) — same convention as the PRD §12.1 example payload. The full
`{building}/{room}/{device_id}` hierarchy still lives in the topic.

## Prerequisites

- Python 3.11+ on PATH.
- The Phase 0 stack running locally. Verify with:
  ```
  docker compose ps
  ```
  `sentinel-mosquitto`, `sentinel-postgres`, `sentinel-laravel` should all
  be up.
- Broker reachable on `localhost:1883` with user `sentinel_device` (the
  default in `.env`).

## Setup

```bash
cd simulator
python -m venv .venv

# macOS/Linux
source .venv/bin/activate

# Windows PowerShell
.venv\Scripts\Activate.ps1

# Windows Git Bash
source .venv/Scripts/activate

pip install -r requirements.txt
```

`.venv/` is git-ignored.

## Quickstart

Continuous publish, every 5 s, all 5 devices:

```bash
python virtual_devices.py
```

Press `Ctrl+C` to stop. The simulator stops the threads, disconnects cleanly,
and exits 0.

## CLI flags

| Flag | Default | Effect |
|------|---------|--------|
| `--interval SECONDS` | `5` | Publish interval per device |
| `--anomaly DEVICE_ID` | (none) | Force out-of-range values for that device id. Repeatable. `status` flips to `"anomaly"`. |
| `--once` | off | Publish exactly one message per device, then exit. Useful for CI / smoke tests. |
| `--profiles PATH` | `./device_profiles.json` | Override the profiles file |
| `--log-level` | `INFO` | Standard `logging` levels |

Examples:

```bash
# Single round of telemetry, then exit
python virtual_devices.py --once

# Force the temp sensor into anomaly mode
python virtual_devices.py --anomaly temp-sensor-001

# Two anomalies, faster cadence
python virtual_devices.py --interval 2 --anomaly temp-sensor-001 --anomaly power-meter-001
```

## Credentials

The simulator reads broker config from environment variables. It auto-loads
the repo-root `.env` via `python-dotenv` if present:

| Var | Default | Phase 0 value |
|-----|---------|---------------|
| `MQTT_HOST` | `localhost` | `localhost` |
| `MQTT_PORT` | `1883` | `1883` |
| `MQTT_USERNAME` | `sentinel_device` | `sentinel_device` |
| `MQTT_PASSWORD` | `sentinel_mqtt_password` | `sentinel_mqtt_password` |

Override via env var if you need to point at a different broker:

```bash
MQTT_HOST=192.168.1.20 python virtual_devices.py --once
```

## Verifying messages reach the broker

Open a second terminal as the ingestor user (broader read ACL) and subscribe
on the IoT tree:

```bash
mosquitto_sub -h localhost -p 1883 \
  -u sentinel_ingestor -P sentinel_ingestor_password \
  -t 'iot/#' -v
```

If you don't have `mosquitto_sub` on PATH, use the official image instead:

```bash
docker run --rm --network host eclipse-mosquitto:2 \
  mosquitto_sub -h localhost -p 1883 \
  -u sentinel_ingestor -P sentinel_ingestor_password \
  -t 'iot/#' -v
```

Then in the first terminal:

```bash
python virtual_devices.py --once
```

You should see five lines on the subscriber, one per device, with a JSON body.

## Anomaly mode

Each profile carries an `anomaly` block with sensible out-of-range values per
device type:

| Device | Field flipped | Anomaly value |
|--------|---------------|---------------|
| `temp-sensor-001` | `temperature` | `88.0` °C |
| `door-lock-001` | `access_status` | `"unauthorized"` |
| `power-meter-001` | `voltage` | `290.0` V |
| `air-quality-001` | `co2` | `2500` ppm |
| `water-leak-001` | `leak_status` | `"leak_detected"` |

When `--anomaly DEVICE_ID` is passed, the matching device's payload uses
those overrides and `status` becomes `"anomaly"` instead of `"normal"`.

## Troubleshooting

**`Connection Refused: not authorised`** — the broker rejected the credentials.
Confirm `.env` has `MQTT_USERNAME=sentinel_device` and
`MQTT_PASSWORD=sentinel_mqtt_password`, or pass them inline:

```bash
MQTT_USERNAME=sentinel_device MQTT_PASSWORD=sentinel_mqtt_password \
  python virtual_devices.py --once
```

**`[Errno 111] Connection refused` / `ConnectionRefusedError`** — the broker
isn't running. Run `docker compose up -d` from the repo root.

**`unknown --anomaly device id(s): ...`** — typo in the device id. Check the
top-level `device_id` keys in `device_profiles.json`.

**No messages on the subscriber** — make sure the subscriber is using
`sentinel_ingestor` (the device user `sentinel_device` only has publish
rights on `iot/#`, not subscribe). If you're using MQTTX or another GUI,
double-check the username field.
