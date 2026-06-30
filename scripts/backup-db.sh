#!/usr/bin/env bash
# Backs up the Sentinel-IoT Postgres database into a gzip-compressed SQL dump.
# Usage: ./scripts/backup-db.sh [backup_dir]
# Cron example: 0 2 * * * cd /path/to/sentinel-iot && ./scripts/backup-db.sh

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BACKUP_DIR="${1:-${ROOT_DIR}/backups}"
TIMESTAMP="$(date +%Y%m%d-%H%M%S)"
BACKUP_FILE="${BACKUP_DIR}/sentinel-${TIMESTAMP}.sql.gz"
COMPOSE_FILES=(-f docker-compose.yml -f docker-compose.prod.yml)

mkdir -p "${BACKUP_DIR}"
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

echo "[$(date)] Starting database backup..."

docker compose "${COMPOSE_FILES[@]}" exec -T postgres pg_dump \
    -U "${DB_USERNAME:-sentinel}" \
    -d "${DB_DATABASE:-sentinel_iot}" \
    --no-owner \
    --no-privileges | gzip > "${BACKUP_FILE}"

if [[ ! -s "${BACKUP_FILE}" ]]; then
    echo "[$(date)] ERROR: Backup file is empty"
    exit 1
fi

SIZE="$(du -h "${BACKUP_FILE}" | cut -f1)"
echo "[$(date)] Backup complete: ${BACKUP_FILE} (${SIZE})"

find "${BACKUP_DIR}" -maxdepth 1 -type f -name 'sentinel-*.sql.gz' -printf '%T@ %p\n' \
    | sort -nr \
    | awk 'NR > 30 { print $2 }' \
    | xargs -r rm --

echo "[$(date)] Retention: kept last 30 backups"
