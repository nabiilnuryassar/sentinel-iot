/*
 * Sentinel-IoT Wokwi Multi-Sensor
 * ESP32 + DHT22 + PIR motion + LDR light sensor.
 *
 * Publishes three telemetry types:
 *   - temperature/humidity (DHT22) every 5s
 *   - motion detection (PIR) on state change
 *   - light level (LDR) every 10s
 *
 * Broker: Set MQTT_HOST to your Sentinel-IoT Mosquitto address.
 * Topic:  tenants/default/iot/sensor/{DEVICE_ID}/telemetry
 */

#include <WiFi.h>
#include <PubSubClient.h>
#include <DHTesp.h>
#include <ArduinoJson.h>

// ── Configuration ──────────────────────────────────────────────
const char* WIFI_SSID = "Wokwi-GUEST";
const char* WIFI_PASS = "";

const char* MQTT_HOST = "host.wokwi.internal";
const int   MQTT_PORT = 1883;
const char* MQTT_USER = "sentinel_device";
const char* MQTT_PASS = "sentinel_mqtt_password";

const char* DEVICE_ID = "wokwi-multi-001";
const char* LOCATION  = "wokwi-lab";

const char* TELEMETRY_TOPIC = "tenants/default/iot/sensor/wokwi-multi-001/telemetry";
const char* EVENT_TOPIC     = "tenants/default/iot/sensor/wokwi-multi-001/event";

// ── Pins ───────────────────────────────────────────────────────
const int DHT_PIN  = 23;
const int PIR_PIN  = 15;
const int LDR_PIN  = 34;

// ── Globals ────────────────────────────────────────────────────
WiFiClient   wifiClient;
PubSubClient mqttClient(wifiClient);
DHTesp       dht;

unsigned long lastTelemetry = 0;
unsigned long lastLight     = 0;
const unsigned long TELEMETRY_INTERVAL = 5000;
const unsigned long LIGHT_INTERVAL     = 10000;

bool lastMotionState = false;

// ── Setup ──────────────────────────────────────────────────────
void setup() {
  Serial.begin(115200);
  Serial.println("\n=== Sentinel-IoT Multi-Sensor ===");

  pinMode(PIR_PIN, INPUT);
  pinMode(LDR_PIN, INPUT);

  Serial.print("Connecting to WiFi");
  WiFi.begin(WIFI_SSID, WIFI_PASS, 6);
  while (WiFi.status() != WL_CONNECTED) {
    delay(100);
    Serial.print(".");
  }
  Serial.printf(" Connected! IP: %s\n", WiFi.localIP().toString().c_str());

  dht.setup(DHT_PIN, DHTesp::DHT22);
  delay(1000); // Allow sensor to stabilize
  Serial.println("Sensors initialized: DHT22, PIR, LDR");

  mqttClient.setServer(MQTT_HOST, MQTT_PORT);
  mqttClient.setBufferSize(768);
  Serial.printf("MQTT: %s:%d\n", MQTT_HOST, MQTT_PORT);
}

// ── MQTT reconnect ─────────────────────────────────────────────
void reconnectMQTT() {
  while (!mqttClient.connected()) {
    Serial.print("Connecting to MQTT...");
    String clientId = "esp32-multi-" + String((uint32_t)ESP.getEfuseMac(), HEX);
    if (mqttClient.connect(clientId.c_str(), MQTT_USER, MQTT_PASS)) {
      Serial.println(" Connected!");
    } else {
      Serial.printf(" Failed (rc=%d), retry in 5s\n", mqttClient.state());
      delay(5000);
    }
  }
}

// ── Publish telemetry (DHT22) ──────────────────────────────────
void publishTelemetry() {
  TempAndHumidity data = dht.getTempAndHumidity();
  if (dht.getStatus() != DHTesp::ERROR_NONE) {
    Serial.printf("DHT22 error: %s\n", dht.getStatusString());
    return;
  }

  JsonDocument doc;
  doc["device_id"] = DEVICE_ID;
  doc["type"]      = "temperature";
  doc["location"]  = LOCATION;
  doc["value"]     = round(data.temperature * 10) / 10.0;
  doc["unit"]      = "celsius";
  doc["humidity"]  = round(data.humidity * 10) / 10.0;
  doc["battery"]   = 95;
  doc["timestamp"] = millis();

  char payload[384];
  serializeJson(doc, payload, sizeof(payload));
  Serial.printf("Telemetry: %s\n", payload);
  mqttClient.publish(TELEMETRY_TOPIC, payload);
}

// ── Publish light level (LDR) ──────────────────────────────────
void publishLightLevel() {
  int raw = analogRead(LDR_PIN);
  float lux = map(raw, 0, 4095, 0, 10000) / 100.0;

  JsonDocument doc;
  doc["device_id"]  = DEVICE_ID;
  doc["type"]       = "light_sensor";
  doc["location"]   = LOCATION;
  doc["value"]      = round(lux * 10) / 10.0;
  doc["unit"]       = "lux";
  doc["raw_adc"]    = raw;
  doc["battery"]    = 95;
  doc["timestamp"]  = millis();

  char payload[384];
  serializeJson(doc, payload, sizeof(payload));
  Serial.printf("Light: %s\n", payload);
  mqttClient.publish(TELEMETRY_TOPIC, payload);
}

// ── Publish motion event (PIR) ─────────────────────────────────
void publishMotionEvent(bool motion) {
  JsonDocument doc;
  doc["device_id"] = DEVICE_ID;
  doc["type"]      = "motion_detected";
  doc["location"]  = LOCATION;
  doc["motion"]    = motion;
  doc["severity"]  = motion ? "medium" : "low";
  doc["timestamp"] = millis();

  char payload[256];
  serializeJson(doc, payload, sizeof(payload));
  Serial.printf("Motion event: %s\n", payload);
  mqttClient.publish(EVENT_TOPIC, payload);
}

// ── Main loop ──────────────────────────────────────────────────
void loop() {
  if (!mqttClient.connected()) {
    reconnectMQTT();
  }
  mqttClient.loop();

  unsigned long now = millis();

  // DHT22 telemetry every 5s
  if (now - lastTelemetry >= TELEMETRY_INTERVAL) {
    lastTelemetry = now;
    publishTelemetry();
  }

  // LDR light level every 10s
  if (now - lastLight >= LIGHT_INTERVAL) {
    lastLight = now;
    publishLightLevel();
  }

  // PIR motion — event on state change
  bool motion = digitalRead(PIR_PIN) == HIGH;
  if (motion != lastMotionState) {
    lastMotionState = motion;
    publishMotionEvent(motion);
  }
}
