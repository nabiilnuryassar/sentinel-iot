import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '..', '..', '..');
const COMPOSE_CMD = 'docker compose -f docker-compose.yml -f docker-compose.dev.yml';
const MQTT_USER = process.env.MQTT_USERNAME ?? 'sentinel_device';
const MQTT_PASS = process.env.MQTT_PASSWORD ?? 'sentinel_mqtt_password';

function runMqttPub(topic: string, payload: string): void {
  const escapedPayload = payload.replace(/'/g, "'\\''");
  execSync(
    `${COMPOSE_CMD} exec -T mosquitto mosquitto_pub ` +
    `-h localhost -p 1883 -u "${MQTT_USER}" -P "${MQTT_PASS}" ` +
    `-t "${topic}" -m '${escapedPayload}'`,
    { stdio: 'pipe', timeout: 15_000, cwd: PROJECT_ROOT },
  );
}

// Legacy topic format: iot/{building}/{room}/{device_id}/(telemetry|event)
// sentinel_device ACL only permits iot/# — NOT tenants/#
// Required payload fields: device_id, type, timestamp, location
export function publishTelemetry(
  deviceId = 'test-device-001',
  payload?: Record<string, unknown>,
): void {
  const topic = `iot/test-building/test-room/${deviceId}/telemetry`;
  const data = JSON.stringify(
    payload ?? {
      device_id: deviceId,
      type: 'temperature',
      location: 'test-lab',
      value: 23.5,
      unit: 'celsius',
      battery: 87,
      timestamp: new Date().toISOString(),
    },
  );
  runMqttPub(topic, data);
}

export function publishMalformedPayload(deviceId = 'test-device-001'): void {
  const topic = `iot/test-building/test-room/${deviceId}/telemetry`;
  runMqttPub(topic, 'NOT-VALID-JSON');
}
