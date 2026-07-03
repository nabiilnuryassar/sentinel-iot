#!/usr/bin/env bash
# Run all four Phase 6 attack scripts in sequence.
#
# Usage:
#   ./run_all.sh              # Option A: host Python + paho-mqtt
#   ATTACK_DOCKER=1 ./run_all.sh   # Option B: one-shot docker run on the compose network
#
# Defaults assume MQTT_HOST=localhost (Option A) or MQTT_HOST=mosquitto (Option B).

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

SCRIPTS=(
  malformed_payload.py
  spoof_device.py
  publish_flood.py
  unauthorized_publish.py
)

run_host() {
  local script="$1"
  echo "==> [host] python $script"
  MQTT_HOST="${MQTT_HOST:-localhost}" \
  MQTT_PORT="${MQTT_PORT:-1883}" \
    python "$script"
}

run_docker() {
  local script="$1"
  echo "==> [docker] $script"
  docker run --rm --network sentinel-iot_default \
    -v "$SCRIPT_DIR:/app" -w /app \
    -e MQTT_HOST="${MQTT_HOST:-mosquitto}" \
    -e MQTT_PORT="${MQTT_PORT:-1883}" \
    python:3.12-slim sh -c "pip install --quiet paho-mqtt && python $script"
}

for s in "${SCRIPTS[@]}"; do
  if [[ "${ATTACK_DOCKER:-0}" == "1" ]]; then
    run_docker "$s"
  else
    run_host "$s"
  fi
  echo "--- waiting 5s for ingestor to process ---"
  sleep 5
done

echo "All four attack scripts completed."
echo "Check security_events:"
echo "  docker compose exec postgres psql -U sentinel -d sentinel_iot -c \\"
echo "    \"select event_type, severity, description, detected_at from security_events order by detected_at desc limit 10;\""
echo "Check Mosquitto rejection log:"
echo "  docker logs sentinel-mosquitto --tail 20 | grep -i attacker-client"
