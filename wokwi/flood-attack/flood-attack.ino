/*
 * Sentinel-IoT Wokwi Flood Attack
 * ESP32 that sends 100+ messages in 10 seconds to trigger rate limiter.
 *
 * Messages are well-formed JSON — only the rate is abnormal.
 * The ingestor's RateLimiter (>50 msgs in 10s) detects the flood and
 * creates: security_events row with event_type='publish_flood', severity='high'.
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
const char* TOPIC     = "tenants/default/iot/sensor/wokwi-flood-001/telemetry";

WiFiClient   wifiClient;
PubSubClient mqttClient(wifiClient);

unsigned long lastBurst = 0;
const unsigned long BURST_INTERVAL = 15000; // 15s between bursts

void setup() {
  Serial.begin(115200);
  Serial.println("\n=== Sentinel-IoT Flood Attack ===");

  WiFi.begin(WIFI_SSID, WIFI_PASS, 6);
  while (WiFi.status() != WL_CONNECTED) { delay(100); Serial.print("."); }
  Serial.printf(" Connected! IP: %s\n", WiFi.localIP().toString().c_str());

  mqttClient.setServer(MQTT_HOST, MQTT_PORT);
  mqttClient.setBufferSize(512);
}

void reconnectMQTT() {
  while (!mqttClient.connected()) {
    Serial.print("Connecting to MQTT...");
    if (mqttClient.connect("esp32-flood-attack", MQTT_USER, MQTT_PASS)) {
      Serial.println(" Connected!");
    } else {
      Serial.printf(" Failed (rc=%d), retry in 5s\n", mqttClient.state());
      delay(5000);
    }
  }
}

void publishFlood() {
  Serial.println("Starting flood: 100 messages...");
  unsigned long start = millis();

  for (int i = 0; i < 100; i++) {
    JsonDocument doc;
    doc["device_id"] = "wokwi-flood-001";
    doc["type"]      = "temperature";
    doc["location"]  = "flood-test";
    doc["value"]     = 20.0 + (i % 10);
    doc["unit"]      = "celsius";
    doc["battery"]   = 90;
    doc["flood_seq"] = i;
    doc["timestamp"] = millis();

    char payload[256];
    serializeJson(doc, payload, sizeof(payload));
    mqttClient.publish(TOPIC, payload);
    mqttClient.loop();
    delay(50); // ~20 msgs/sec = 100 in ~5s
  }

  unsigned long elapsed = millis() - start;
  Serial.printf("Flood complete: 100 messages in %lu ms\n", elapsed);
}

void loop() {
  if (!mqttClient.connected()) reconnectMQTT();
  mqttClient.loop();

  unsigned long now = millis();
  if (now - lastBurst >= BURST_INTERVAL) {
    lastBurst = now;
    publishFlood();
  }
}
