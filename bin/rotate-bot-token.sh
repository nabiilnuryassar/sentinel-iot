#!/usr/bin/env bash
#
# Rotate the Sanctum bot token used by the Telegram bot.
#
# Pipeline (idempotent):
#   1. Run `php artisan sentinel:issue-tokens` inside the laravel container.
#      That revokes existing `bot` tokens for admin@sentinel.local and prints
#      `BOT_API_TOKEN=<plaintext>` to stdout.
#   2. Extract the token, write it to .env as LARAVEL_API_TOKEN.
#      (Existing `LARAVEL_API_TOKEN=...` line is replaced; nothing else changes.)
#   3. Recreate sentinel-telegram-bot via `docker compose up --force-recreate`
#      so it picks up the new value. (Plain `docker restart` would NOT reload
#      env_file — env vars are baked at container CREATE time, not restart.)
#   4. Tail bot logs to confirm Application started.
#
# Usage:
#   ./bin/rotate-bot-token.sh           # admin@sentinel.local (default user)
#   ./bin/rotate-bot-token.sh --user alice@sentinel.local
#
# Exit codes:
#   0  success
#   1  container not running / artisan failed
#   2  token not found in artisan output
#   3  .env update failed
#   4  bot restart failed
set -euo pipefail

CONTAINER_LARAVEL="sentinel-laravel"
CONTAINER_BOT="sentinel-telegram-bot"
ENV_FILE="$(cd "$(dirname "$0")/.." && pwd)/.env"

# Parse args
USER_EMAIL=""
while [[ $# -gt 0 ]]; do
    case "$1" in
        --user)
            USER_EMAIL="$2"
            shift 2
            ;;
        -h|--help)
            head -n 25 "$0" | tail -n +2 | sed 's/^# \?//'
            exit 0
            ;;
        *)
            echo "Unknown arg: $1" >&2
            exit 1
            ;;
    esac
done

# 1. Container alive?
if ! docker ps --format '{{.Names}}' | grep -qx "$CONTAINER_LARAVEL"; then
    echo "✗ Container $CONTAINER_LARAVEL is not running. Start it with: docker compose up -d laravel-app" >&2
    exit 1
fi

echo "▸ Issuing fresh token (revokes previous bot tokens)..."
ARTISAN_CMD="php artisan sentinel:issue-tokens"
if [[ -n "$USER_EMAIL" ]]; then
    ARTISAN_CMD="$ARTISAN_CMD --user=$USER_EMAIL"
fi

ARTISAN_OUTPUT="$(docker exec "$CONTAINER_LARAVEL" $ARTISAN_CMD 2>&1)" || {
    echo "✗ Artisan command failed:" >&2
    echo "$ARTISAN_OUTPUT" >&2
    exit 1
}

# 2. Extract BOT_API_TOKEN=<value>
TOKEN="$(printf '%s\n' "$ARTISAN_OUTPUT" | grep -oE 'BOT_API_TOKEN=[^[:space:]]+' | head -n1 | sed 's/^BOT_API_TOKEN=//')"

if [[ -z "$TOKEN" ]]; then
    echo "✗ Could not extract token from artisan output:" >&2
    echo "$ARTISAN_OUTPUT" >&2
    exit 2
fi

echo "✓ Token issued ($(echo -n "$TOKEN" | wc -c) chars)"

# 3. Update .env
if [[ ! -f "$ENV_FILE" ]]; then
    echo "✗ .env not found at $ENV_FILE" >&2
    exit 3
fi

# In-place replace LARAVEL_API_TOKEN line. Use temp file for portability (macOS sed differs).
TMP_ENV="$(mktemp)"
trap 'rm -f "$TMP_ENV"' EXIT

if grep -qE '^LARAVEL_API_TOKEN=' "$ENV_FILE"; then
    awk -v t="$TOKEN" '
        BEGIN { OFS=FS="" }
        /^LARAVEL_API_TOKEN=/ { print "LARAVEL_API_TOKEN=" t; next }
        { print }
    ' "$ENV_FILE" > "$TMP_ENV"
else
    cp "$ENV_FILE" "$TMP_ENV"
    echo "LARAVEL_API_TOKEN=$TOKEN" >> "$TMP_ENV"
fi

cp "$TMP_ENV" "$ENV_FILE"
echo "✓ Updated $ENV_FILE"

# 4. Recreate telegram bot to pick up the new env (restart alone won't reload env_file)
echo "▸ Recreating $CONTAINER_BOT (force-recreate to reload env_file)..."

PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$PROJECT_DIR"

# Use docker.exe so this works from WSL too (Windows host docker).
DOCKER_BIN="docker"
if command -v docker.exe >/dev/null 2>&1 && [[ "$(uname -r)" == *microsoft* || "$(uname -r)" == *WSL* ]]; then
    DOCKER_BIN="docker.exe"
fi

if ! $DOCKER_BIN compose --profile bot up -d --force-recreate telegram-bot > /tmp/recreate-bot.log 2>&1; then
    echo "✗ Failed to recreate $CONTAINER_BOT" >&2
    cat /tmp/recreate-bot.log >&2
    exit 4
fi

# Wait briefly + check log + verify env actually has new token
sleep 3
NEW_TOKEN_IN_CONTAINER="$($DOCKER_BIN exec "$CONTAINER_BOT" printenv LARAVEL_API_TOKEN 2>/dev/null || true)"
if [[ "$NEW_TOKEN_IN_CONTAINER" != "$TOKEN" ]]; then
    echo "✗ Container env did not pick up new token. Try manually:" >&2
    echo "    cd $PROJECT_DIR && $DOCKER_BIN compose --profile bot up -d --force-recreate telegram-bot" >&2
    exit 4
fi

echo "✓ Bot recreated, env reloaded. Last 5 log lines:"
$DOCKER_BIN logs --tail 5 "$CONTAINER_BOT" 2>&1 | sed 's/^/    /'

echo
echo "✓ Token rotation complete."
