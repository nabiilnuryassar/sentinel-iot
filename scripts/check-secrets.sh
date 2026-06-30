#!/usr/bin/env bash
# Validates that required production secrets are configured.
# Usage: ./scripts/check-secrets.sh
# Exit 0 if all secrets are set; exit 1 otherwise.

set -euo pipefail

if [[ -f .env.production ]]; then
    set -a
    # shellcheck disable=SC1091
    source .env.production
    set +a
elif [[ -f .env ]]; then
    set -a
    # shellcheck disable=SC1091
    source .env
    set +a
fi

ERRORS=0

check_var() {
    local name="$1"
    local val="${!name:-}"
    if [[ -z "${val}" || "${val}" == "CHANGE_ME"* || "${val}" == "YOUR_API_KEY"* ]]; then
        echo "ERROR: ${name} is not set or still placeholder"
        ERRORS=$((ERRORS + 1))
    else
        echo "OK: ${name}"
    fi
}

check_var APP_KEY
check_var DB_PASSWORD
check_var MQTT_PASSWORD
check_var MQTT_INGESTOR_PASSWORD

if [[ "${ERRORS}" -gt 0 ]]; then
    echo ""
    echo "${ERRORS} secret(s) need attention."
    exit 1
fi

echo ""
echo "All secrets configured."
