# Sentinel-IoT Wokwi Multi-Sensor

ESP32 + DHT22 + PIR motion sensor + LDR light sensor for comprehensive telemetry demos.

## Sensors

| Sensor | Pin | Telemetry Type | Interval |
|--------|-----|----------------|----------|
| DHT22 | GPIO 4 | temperature, humidity | 5 seconds |
| PIR | GPIO 15 | motion_detected (event) | On state change |
| LDR | GPIO 34 | light_sensor (lux) | 10 seconds |

## Quick Start

1. Open project in [Wokwi](https://wokwi.com)
2. Run Wokwi IoT Gateway for local broker connectivity
3. Set `MQTT_HOST` in `sketch.ino` (default: `host.wokwi.internal`)
4. Press Run
5. Watch multi-sensor data in Sentinel-IoT dashboard at `/devices`

## Topics

- Telemetry: `tenants/default/iot/sensor/wokwi-multi-001/telemetry`
- Events: `tenants/default/iot/sensor/wokwi-multi-001/event`

## Circuit

- ESP32 DevKit V1
- DHT22 temperature/humidity sensor (pin 4)
- PIR motion sensor (pin 15)
- Photoresistor LDR (pin 34, analog)
