/*
 * Sentinel-IoT Wokwi Device Spoofing Attack
 * ESP32 that publishes to a topic with another device's ID in the path.
 *
 * Connects as `sentinel_device` (valid credentials) but sends messages
 * to `tenants/default/iot/sensor/temp-sensor-001/telemetry` while
 * embedding a different device_id in the payload.
 *
 * Expected result: ingestor detects the mismatch and creates
 *   security_events row with event_type='device_spoofing', severity='high'.
 */

#include <WiFi.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>

const char* WIFI_SSID = "Wokwi-GUEST";
const char* WIFI_PASS = "";

const char* MQTT_HOST = "host.wokwi.internal";
const int   MQTT_PORT = 1883;
const char* MQTT_USER = "sentinel_device";
const char* MQTT_PASS = "sentinel_mqtt_password";

// Spoofed: topic says temp-sensor-001 but payload says attacker
const char* SPOOFED_TOPIC = "tenants/default/iot/sensor/temp-sensor-001/telemetry";

WiFiClient   wifiClient;
PubSubClient mqttClient(wifiClient);

unsigned long lastPublish = 0;
const unsigned long INTERVAL = 15000; // 15s between spoofed messages

void setup() {
  Serial.begin(115200);
  Serial.println("\n=== Sentinel-IoT Device Spoofing Attack ===");

  WiFi.begin(WIFI_SSID, WIFI_PASS, 6);
  while (WiFi.status() != WL_CONNECTED) { delay(100); Serial.print("."); }
  Serial.printf(" Connected! IP: %s\n", WiFi.localIP().toString().c_str());

  mqttClient.setServer(MQTT_HOST, MQTT_PORT);
  mqttClient.setBufferSize(512);
}

void reconnectMQTT() {
  while (!mqttClient.connected()) {
    Serial.print("Connecting to MQTT...");
    if (mqttClient.connect("esp32-spoof-attack", MQTT_USER, MQTT_PASS)) {
      Serial.println(" Connected!");
    } else {
      Serial.printf(" Failed (rc=%d), retry in 5s\n", mqttClient.state());
      delay(5000);
    }
  }
}

void publishSpoofed() {
  JsonDocument doc;
  doc["device_id"] = "wokwi-spoof-attacker"; // Doesn't match topic's temp-sensor-001
  doc["type"]      = "temperature";
  doc["location"]  = "server-room";
  doc["value"]     = 99.9;
  doc["unit"]      = "celsius";
  doc["battery"]   = 100;
  doc["timestamp"] = millis();

  char payload[256];
  serializeJson(doc, payload, sizeof(payload));

  Serial.printf("Spoofing topic=%s payload_device=wokwi-spoof-attacker\n", SPOOFED_TOPIC);
  mqttClient.publish(SPOOFED_TOPIC, payload);
}

void loop() {
  if (!mqttClient.connected()) reconnectMQTT();
  mqttClient.loop();

  unsigned long now = millis();
  if (now - lastPublish >= INTERVAL) {
    lastPublish = now;
    publishSpoofed();
  }
}
