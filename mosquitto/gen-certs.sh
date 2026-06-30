#!/usr/bin/env bash
# Generate a self-signed CA + server certificate for the Mosquitto TLS listener
# (port 8883). For production, replace the self-signed CA with a real one (e.g.
# Let's Encrypt for a public broker, or your org PKI for private deployments).
#
# Usage:
#   ./mosquitto/gen-certs.sh [broker_hostname]
#
# broker_hostname defaults to "localhost". Set it to the DNS name or IP your
# devices will use to reach the broker, otherwise TLS hostname verification
# fails on the device side.
set -euo pipefail

HOSTNAME="${1:-localhost}"
CERT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/certs"
DAYS=825

mkdir -p "$CERT_DIR"
cd "$CERT_DIR"

if [[ -f server.crt ]]; then
  echo "certs already exist in $CERT_DIR — refusing to overwrite. Delete them first to regenerate." >&2
  exit 1
fi

echo "Generating CA..."
openssl genrsa -out ca.key 4096
openssl req -x509 -new -nodes -key ca.key -sha256 -days "$DAYS" \
  -subj "/O=Sentinel-IoT/CN=Sentinel-IoT Local CA" -out ca.crt

echo "Generating server key + CSR for CN=$HOSTNAME..."
openssl genrsa -out server.key 4096
openssl req -new -key server.key \
  -subj "/O=Sentinel-IoT/CN=$HOSTNAME" -out server.csr

cat > server.ext <<EOF
subjectAltName = DNS:$HOSTNAME, DNS:mosquitto, IP:127.0.0.1
EOF

echo "Signing server cert..."
openssl x509 -req -in server.csr -CA ca.crt -CAkey ca.key -CAcreateserial \
  -days "$DAYS" -sha256 -extfile server.ext -out server.crt

rm -f server.csr server.ext ca.srl

# Mosquitto runs as uid 1883 inside the container; make the key readable to it.
chmod 640 server.key ca.key 2>/dev/null || true

echo
echo "Done. Certs written to $CERT_DIR:"
echo "  ca.crt      — distribute to devices (they verify the broker with this)"
echo "  server.crt  — broker presents this on :8883"
echo "  server.key  — broker private key (keep secret, never distribute)"
echo
echo "Restart the broker to pick up the TLS listener:  docker compose restart mosquitto"
