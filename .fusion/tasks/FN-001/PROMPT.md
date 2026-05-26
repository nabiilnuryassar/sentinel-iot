# FN-001

Phase 1 of Sentinel-IoT: build the Python Virtual IoT Device Simulator that runs on the developer laptop and publishes telemetry to the Mosquitto broker.

## Source of truth
- Plan: `thoughts/shared/plans/sentinel-iot-plan.md` Phase 1
- Design: `thoughts/shared/designs/sentinel-iot-design.md` slice S2
- PRD: `docs/PRD.md` §12.1 (device profiles, payload shape)

## Tasks (P1.1–P1.5)
- **P1.1** Create `simulator/device_profiles.json` listing the five devices from PRD §12.1: temp-sensor-001, door-lock-001, power-meter-001, air-quality-001, water-leak-001. Each entry: `device_id`, `type`, `building`, `room`, `topic`, `payload_template`.
- **P1.2** Create `simulator/virtual_devices.py` using `paho-mqtt`:
  - Loads `device_profiles.json`.
  - For each device, spawns a thread that publishes telemetry every `interval` seconds (default 5).
  - Supports `--anomaly device_id` flag to force out-of-range values for that device.
  - Reads broker host/port/user/pass from env (`MQTT_HOST`, `MQTT_PORT`, `MQTT_USERNAME`, `MQTT_PASSWORD`).
- **P1.3** Create `simulator/requirements.txt` (`paho-mqtt`, `python-dotenv`).
- **P1.4** Create `simulator/README.md` with `pip install -r requirements.txt` and `python virtual_devices.py` usage.
- **P1.5** Verify with MQTTX or `mosquitto_sub`: subscribe to `iot/#`, run the simulator, confirm 5 streams of messages with valid JSON shape.

## Success criteria
- `python simulator/virtual_devices.py` publishes at least one message per device within 10 seconds of start.
- `mosquitto_sub` shows messages on `iot/{building}/{room}/{device_id}/telemetry` for all five devices.
- `--anomaly temp-sensor-001` produces a payload with `temperature` outside 0–60 °C.

## Constraints
- Do not modify Phase 0 deliverables (`docker-compose.yml`, `mosquitto/`, `.env`, `docker/`).
- Do not introduce new top-level folders other than `simulator/`.
- Keep dependencies minimal; only `paho-mqtt` and `python-dotenv`.
- Use the `sentinel_device` MQTT credentials already in `.env` (MQTT_USERNAME / MQTT_PASSWORD).
- Broker is reachable on host `localhost:1883` from the developer laptop.

## Tracking
Pi subagent (general-purpose) is doing the implementation. This Fusion task tracks the work for the board.
