# Wokwi Flood Attack

ESP32 that sends 100+ messages in 10 seconds to trigger the ingestor's rate limiter.

## Behavior

Publishes 100 well-formed telemetry messages in ~5 seconds (20 msg/s). Messages are valid JSON — only the rate is abnormal.

The ingestor's `RateLimiter` (>50 msgs in 10s per device) detects the flood:

- **Event type:** `publish_flood`
- **Severity:** `high`

## Rate Limiter Logic

- Window: 10 seconds
- Threshold: 50 messages per device topic
- Cooldown: 60 seconds between security events
- Partition: by topic device_id segment

## Usage

1. Open in Wokwi
2. Configure `MQTT_HOST` in sketch.ino
3. Press Run
4. Check `/security-events` in Sentinel-IoT dashboard
