#!/usr/bin/env bash
# Restores the Sentinel-IoT Postgres database from a gzip-compressed SQL dump.
# Usage: ./scripts/restore-db.sh <backup_file.sql.gz>

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BACKUP_FILE="${1:?Usage: $0 <backup_file.sql.gz>}"
COMPOSE_FILES=(-f docker-compose.yml -f docker-compose.prod.yml)

if [[ ! -f "${BACKUP_FILE}" ]]; then
    echo "ERROR: File not found: ${BACKUP_FILE}"
    exit 1
fi

cd "${ROOT_DIR}"

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

DATABASE="${DB_DATABASE:-sentinel_iot}"
USERNAME="${DB_USERNAME:-sentinel}"

echo "[$(date)] Restoring database from: ${BACKUP_FILE}"
echo "WARNING: This will overwrite database '${DATABASE}'."
read -r -p "Type 'yes' to continue: " confirm

if [[ "${confirm}" != "yes" ]]; then
    echo "Restore cancelled."
    exit 0
fi

docker compose "${COMPOSE_FILES[@]}" exec -T postgres psql \
    -U "${USERNAME}" \
    -d postgres \
    -v ON_ERROR_STOP=1 \
    -c "DROP DATABASE IF EXISTS \"${DATABASE}\";" \
    -c "CREATE DATABASE \"${DATABASE}\";"

gunzip -c "${BACKUP_FILE}" | docker compose "${COMPOSE_FILES[@]}" exec -T postgres psql \
    -U "${USERNAME}" \
    -d "${DATABASE}" \
    -v ON_ERROR_STOP=1

echo "[$(date)] Restore complete."
echo "Run migrations if the backup predates current code:"
echo "  docker compose -f docker-compose.yml -f docker-compose.prod.yml exec laravel-app php artisan migrate --force"
