/*
 * Sentinel-IoT Wokwi Malformed Payload Attack
 * ESP32 that sends invalid JSON to trigger "malformed_payload" security event.
 *
 * Publishes truncated / invalid JSON to a valid telemetry topic.
 * Expected result: ingestor creates security_events row with
 *   event_type='malformed_payload', severity='medium'.
 */

#include <WiFi.h>
#include <PubSubClient.h>

const char* WIFI_SSID = "Wokwi-GUEST";
const char* WIFI_PASS = "";

const char* MQTT_HOST = "host.wokwi.internal";
const int   MQTT_PORT = 1883;
const char* MQTT_USER = "sentinel_device";
const char* MQTT_PASS = "sentinel_mqtt_password";
const char* TOPIC     = "tenants/default/iot/sensor/wokwi-attack-001/telemetry";

WiFiClient   wifiClient;
PubSubClient mqttClient(wifiClient);

unsigned long lastPublish = 0;
const unsigned long INTERVAL = 10000; // 10s between malformed payloads

void setup() {
  Serial.begin(115200);
  Serial.println("\n=== Sentinel-IoT Malformed Payload Attack ===");

  WiFi.begin(WIFI_SSID, WIFI_PASS, 6);
  while (WiFi.status() != WL_CONNECTED) { delay(100); Serial.print("."); }
  Serial.printf(" Connected! IP: %s\n", WiFi.localIP().toString().c_str());

  mqttClient.setServer(MQTT_HOST, MQTT_PORT);
  mqttClient.setBufferSize(512);
}

void reconnectMQTT() {
  while (!mqttClient.connected()) {
    Serial.print("Connecting to MQTT...");
    if (mqttClient.connect("esp32-malformed-attack", MQTT_USER, MQTT_PASS)) {
      Serial.println(" Connected!");
    } else {
      Serial.printf(" Failed (rc=%d), retry in 5s\n", mqttClient.state());
      delay(5000);
    }
  }
}

void publishMalformed() {
  // Invalid JSON: missing required fields, truncated, wrong types
  const char* payloads[] = {
    "{invalid json",
    "{}",
    "{\"type\": 123}",
    "{\"value\": \"not-a-number\", \"location\": null}",
    "NOT_JSON_AT_ALL",
  };
  static int idx = 0;
  const char* payload = payloads[idx % 5];
  idx++;

  Serial.printf("Publishing malformed: %s\n", payload);
  mqttClient.publish(TOPIC, payload);
}

void loop() {
  if (!mqttClient.connected()) reconnectMQTT();
  mqttClient.loop();

  unsigned long now = millis();
  if (now - lastPublish >= INTERVAL) {
    lastPublish = now;
    publishMalformed();
  }
}
