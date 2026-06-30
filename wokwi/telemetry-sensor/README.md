# Sentinel-IoT Wokwi Telemetry Sensor

ESP32 + DHT22 simulator that publishes temperature/humidity telemetry to the Sentinel-IoT MQTT broker.

## Quick Start

1. Open project in [Wokwi](https://wokwi.com)
2. (For local broker) Run the [Wokwi IoT Gateway](https://github.com/wokwi/wokwigw)
3. Set `MQTT_HOST` in `sketch.ino`:
   - Local dev: `host.wokwi.internal` (with Private Gateway)
   - VPS production: your VPS domain (port 8883, TLS)
4. Press Run
5. Watch telemetry appear in Sentinel-IoT dashboard at `/devices`

## Payload Format

```json
{
  "type": "temperature",
  "location": "wokwi-lab",
  "value": 23.5,
  "unit": "celsius",
  "humidity": 55.2,
  "battery": 92,
  "timestamp": 12345
}
```

## Circuit

- ESP32 DevKit V1
- DHT22 temperature/humidity sensor (pin 4)
