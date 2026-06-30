/*
 * Sentinel-IoT Wokwi Telemetry Sensor
 * ESP32 + DHT22 → publishes temperature/humidity to MQTT broker.
 *
 * Broker: Set MQTT_HOST to your Sentinel-IoT Mosquitto address.
 * Topic:  tenants/default/iot/sensor/{DEVICE_ID}/telemetry
 *
 * Wokwi connectivity:
 *   - Local dev: Use Private Gateway, set MQTT_HOST="host.wokwi.internal"
 *   - VPS prod:  Set MQTT_HOST to your VPS domain, port 8883 (TLS)
 */

#include <WiFi.h>
#include <PubSubClient.h>
#include <DHTesp.h>
#include <ArduinoJson.h>

// ── Configuration ──────────────────────────────────────────────
const char* WIFI_SSID = "Wokwi-GUEST";
const char* WIFI_PASS = "";

const char* MQTT_HOST = "host.wokwi.internal";  // Change for production
const int   MQTT_PORT = 1883;
const char* MQTT_USER = "sentinel_device";
const char* MQTT_PASS = "sentinel_mqtt_password";

const char* DEVICE_ID  = "wokwi-dht22-001";
const char* DEVICE_TYPE = "temperature";
const char* LOCATION   = "wokwi-lab";

const char* TELEMETRY_TOPIC = "iot/wokwi-lab/room-1/wokwi-dht22-001/telemetry";

// ── Globals ────────────────────────────────────────────────────
WiFiClient   wifiClient;
PubSubClient mqttClient(wifiClient);
DHTesp       dht;

const int DHT_PIN = 15;
unsigned long lastPublish = 0;
const unsigned long PUBLISH_INTERVAL = 5000; // 5 seconds

// ── Setup ──────────────────────────────────────────────────────
void setup() {
  Serial.begin(115200);
  Serial.println("\n=== Sentinel-IoT Telemetry Sensor ===");

  // WiFi
  Serial.print("Connecting to WiFi");
  WiFi.begin(WIFI_SSID, WIFI_PASS, 6);
  while (WiFi.status() != WL_CONNECTED) {
    delay(100);
    Serial.print(".");
  }
  Serial.printf(" Connected! IP: %s\n", WiFi.localIP().toString().c_str());

  // DHT22
  dht.setup(DHT_PIN, DHTesp::DHT22);
  delay(1000); // Allow sensor to stabilize
  Serial.println("DHT22 initialized");

  // MQTT
  mqttClient.setServer(MQTT_HOST, MQTT_PORT);
  mqttClient.setBufferSize(512);
  Serial.printf("MQTT: %s:%d\n", MQTT_HOST, MQTT_PORT);
}

// ── MQTT reconnect ─────────────────────────────────────────────
void reconnectMQTT() {
  while (!mqttClient.connected()) {
    Serial.print("Connecting to MQTT...");
    String clientId = "esp32-" + String((uint32_t)ESP.getEfuseMac(), HEX);
    if (mqttClient.connect(clientId.c_str(), MQTT_USER, MQTT_PASS)) {
      Serial.println(" Connected!");
    } else {
      Serial.printf(" Failed (rc=%d), retry in 5s\n", mqttClient.state());
      delay(5000);
    }
  }
}

// ── Publish telemetry ──────────────────────────────────────────
void publishTelemetry() {
  TempAndHumidity data = dht.getTempAndHumidity();

  if (dht.getStatus() != DHTesp::ERROR_NONE) {
    Serial.printf("DHT22 error: %s\n", dht.getStatusString());
    return;
  }

  JsonDocument doc;
  doc["device_id"] = DEVICE_ID;
  doc["type"]      = DEVICE_TYPE;
  doc["location"]  = LOCATION;
  doc["value"]     = round(data.temperature * 10) / 10.0;
  doc["unit"]      = "celsius";
  doc["humidity"]  = round(data.humidity * 10) / 10.0;
  doc["battery"]   = 92;
  doc["timestamp"] = millis();

  char payload[256];
  serializeJson(doc, payload, sizeof(payload));

  Serial.printf("Publishing: %s → %s\n", TELEMETRY_TOPIC, payload);
  mqttClient.publish(TELEMETRY_TOPIC, payload);
}

// ── Main loop ──────────────────────────────────────────────────
void loop() {
  if (!mqttClient.connected()) {
    reconnectMQTT();
  }
  mqttClient.loop();

  unsigned long now = millis();
  if (now - lastPublish >= PUBLISH_INTERVAL) {
    lastPublish = now;
    publishTelemetry();
  }
}
