# Wokwi Malformed Payload Attack

ESP32 that sends invalid JSON to trigger a `malformed_payload` security event.

## Behavior

Publishes truncated/invalid JSON to a valid telemetry topic every 10 seconds. The ingestor detects the invalid payload and creates a security event:

- **Event type:** `malformed_payload`
- **Severity:** `medium`

## Payloads Sent

1. `{invalid json` — truncated JSON
2. `{}` — empty object (missing required fields)
3. `{"type": 123}` — wrong type for value
4. `{"value": "not-a-number", "location": null}` — type mismatch
5. `NOT_JSON_AT_ALL` — completely invalid

## Usage

1. Open in Wokwi
2. Configure `MQTT_HOST` in sketch.ino
3. Press Run
4. Check `/security-events` in Sentinel-IoT dashboard
