#!/usr/bin/env bash
# Generates CA, server, and device certificates for Mosquitto mTLS.
# Usage: ./scripts/gen-mqtt-certs.sh [device_id]
# Run from repo root: ./scripts/gen-mqtt-certs.sh esp32-device-001

set -euo pipefail

CERT_DIR="${CERT_DIR:-./mosquitto/certs}"
DEVICE_ID="${1:-}"

mkdir -p "$CERT_DIR"
cd "$CERT_DIR"

# ── CA ──────────────────────────────────────────────────────
if [ ! -f ca.key ]; then
  echo "Generating CA..."
  openssl genrsa -out ca.key 4096
  openssl req -new -x509 -key ca.key -out ca.crt -days 3650 \
    -subj "/C=ID/O=Sentinel-IoT/CN=Sentinel-IoT-CA"
  echo "CA cert: $CERT_DIR/ca.crt"
else
  echo "CA already exists, skipping."
fi

# ── Server cert ─────────────────────────────────────────────
if [ ! -f server.key ]; then
  echo "Generating server cert..."
  openssl genrsa -out server.key 2048
  openssl req -new -key server.key -out server.csr \
    -subj "/C=ID/O=Sentinel-IoT/CN=*.sentinel-iot.local"
  openssl x509 -req -in server.csr -CA ca.crt -CAkey ca.key \
    -CAcreateserial -out server.crt -days 825 \
    -extfile <(printf "subjectAltName=DNS:*.sentinel-iot.local,DNS:mosquitto,DNS:localhost")
  rm -f server.csr
  echo "Server cert: $CERT_DIR/server.crt"
else
  echo "Server cert already exists, skipping."
fi

# ── Device cert (optional) ──────────────────────────────────
if [ -n "$DEVICE_ID" ]; then
  echo "Generating device cert for: $DEVICE_ID"
  openssl genrsa -out "device-${DEVICE_ID}.key" 2048
  openssl req -new -key "device-${DEVICE_ID}.key" \
    -out "device-${DEVICE_ID}.csr" \
    -subj "/C=ID/O=Sentinel-IoT/CN=${DEVICE_ID}"
  openssl x509 -req -in "device-${DEVICE_ID}.csr" \
    -CA ca.crt -CAkey ca.key -CAcreateserial \
    -out "device-${DEVICE_ID}.crt" -days 365
  rm -f "device-${DEVICE_ID}.csr"
  echo "Device cert: $CERT_DIR/device-${DEVICE_ID}.crt"
  echo "Device key:  $CERT_DIR/device-${DEVICE_ID}.key"
fi

echo ""
echo "Done. Files in: $CERT_DIR"
echo "Distribute ca.crt to all devices. Keep ca.key secure."
