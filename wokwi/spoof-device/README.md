# Wokwi Device Spoofing Attack

ESP32 that publishes to another device's topic to trigger a `device_spoofing` security event.

## Behavior

Connects with valid `sentinel_device` credentials but sends telemetry to `tenants/default/iot/sensor/temp-sensor-001/telemetry` while embedding `device_id: "wokwi-spoof-attacker"` in the payload.

The ingestor detects the mismatch between topic device_id and payload device_id:

- **Event type:** `device_spoofing`
- **Severity:** `high`

## Usage

1. Open in Wokwi
2. Configure `MQTT_HOST` in sketch.ino
3. Press Run
4. Check `/security-events` in Sentinel-IoT dashboard
