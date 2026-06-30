#!/usr/bin/env bash
# Issue or rotate a Mosquitto credential for a tenant device principal and
# append/update it in the password file. The username should be the tenant slug
# so the ACL `pattern write tenants/%u/iot/#` confines it to that tenant.
#
# Usage:
#   ./mosquitto/gen-credential.sh <tenant-slug> [password]
#
# If no password is given, a random one is generated and printed ONCE — store
# it in the tenant's secret manager; it is hashed in the password file and
# cannot be recovered afterwards.
set -euo pipefail

USERNAME="${1:?usage: gen-credential.sh <tenant-slug> [password]}"
PASSWORD="${2:-$(openssl rand -base64 24)}"
PWFILE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/secrets/passwordfile"

if ! command -v docker >/dev/null 2>&1; then
  echo "docker is required (uses the eclipse-mosquitto image's mosquitto_passwd)." >&2
  exit 1
fi

# Use mosquitto_passwd from the running broker container so the hash format
# matches the broker exactly. -b = batch (password on CLI), no -c so we append.
docker exec -i sentinel-mosquitto mosquitto_passwd -b /mosquitto/secrets/passwordfile "$USERNAME" "$PASSWORD"

echo
echo "Credential issued for MQTT user: $USERNAME"
echo "Password (store securely, shown once): $PASSWORD"
echo
echo "Device connection (TLS):"
echo "  host=<broker-host> port=8883 username=$USERNAME password=<above>"
echo "  publish topic: tenants/$USERNAME/iot/<building>/<room>/<device_id>/telemetry"
echo
echo "Reload broker ACL/passwords:  docker compose restart mosquitto"
