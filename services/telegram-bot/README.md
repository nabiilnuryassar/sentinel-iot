# Sentinel-IoT Telegram Bot

Thin Python relay between Telegram and the Sentinel-IoT Laravel REST API. Long-polling, single-admin allowlist, no webhooks.

Phase 5 deliverable per `thoughts/shared/plans/sentinel-iot-plan.md`. Slice **S8** in `thoughts/shared/designs/sentinel-iot-design.md`. Decision **D4**: bot is a thin relay; all business logic lives in Laravel.

## What it does

| Trigger | Backend call | Reply |
| --- | --- | --- |
| `/start` | none | Static welcome |
| `/help` | none | Command list |
| `/status` | `GET /api/dashboard/summary` | Counters + risk level |
| `/devices` | `GET /api/devices?per_page=20` | Up to 20 devices, online/offline dot, last seen relative |
| `/incidents` | `GET /api/incidents?status=open` | Open incidents with severity marker |
| `/audit` | `POST /api/agent/audit` | Audit agent's markdown reply |
| free text | `POST /api/agent/ask` body `{prompt}` | Sentinel agent's markdown reply |

`/audit` and free-text prompts produce `agent_messages` rows with `source='telegram'` automatically — Laravel's `LogAgentInteractions` middleware logs every `/api/agent/*` call, no extra endpoint required.

## Required environment variables

```
TELEGRAM_BOT_TOKEN        # from @BotFather
TELEGRAM_ADMIN_CHAT_ID    # numeric chat ID — only this chat may use the bot
LARAVEL_API_URL           # default http://laravel-app:8000 (compose internal)
LARAVEL_API_TOKEN         # Sanctum bot token, see below
```

The bot exits non-zero on startup if any of `TELEGRAM_BOT_TOKEN`, `TELEGRAM_ADMIN_CHAT_ID`, or `LARAVEL_API_TOKEN` is missing.

### Getting a bot token from @BotFather

1. In Telegram, open a chat with [@BotFather](https://t.me/BotFather).
2. `/newbot`, follow prompts, copy the token.
3. Put it into the project root `.env` as `TELEGRAM_BOT_TOKEN`.

### Finding your admin chat ID

1. Send any message to [@userinfobot](https://t.me/userinfobot) and copy the numeric ID.
2. Or message your new bot once, then `curl https://api.telegram.org/bot<TOKEN>/getUpdates` and read `result[].message.chat.id`.
3. Put it into `.env` as `TELEGRAM_ADMIN_CHAT_ID`.

### Issuing the Laravel API token

```
php artisan sentinel:issue-tokens
```

Copy the `BOT_API_TOKEN=...` value into `.env` as `LARAVEL_API_TOKEN`.

## Run via Docker Compose

The service is gated behind the `bot` profile so a missing token does not break the rest of the stack:

```
docker compose --profile bot up -d telegram-bot
docker compose logs -f sentinel-telegram-bot
```

## Allowlist behaviour

Every handler runs through `@admin_only`. Updates from any chat other than `TELEGRAM_ADMIN_CHAT_ID` are dropped silently (no reply) and a single structured warning line is logged:

```
WARNING sentinel.telegram rejected_chat chat_id=<id> command=<cmd>
```

This keeps the bot's existence private from outsiders.

## Markdown choice

Replies use `ParseMode.MARKDOWN` (V1) for simplicity. Long replies are capped at Telegram's 4096-character limit by `formatters.truncate`, with a `…(truncated)` suffix.

## Local tests

A non-Telegram test harness exercises the handler logic with `httpx.MockTransport` and hand-built `Update` doubles:

```
docker compose run --rm \
  --entrypoint pytest \
  -v \
  -e TELEGRAM_BOT_TOKEN=stub \
  -e TELEGRAM_ADMIN_CHAT_ID=42 \
  -e LARAVEL_API_TOKEN=stub \
  telegram-bot test_bot_logic.py
```

Or, with a local Python:

```
cd services/telegram-bot
pip install -r requirements.txt
pytest test_bot_logic.py
```

## File layout

```
services/telegram-bot/
├── bot.py               # Application entrypoint, handlers, allowlist
├── sentinel_api.py      # Async httpx client around the Laravel API
├── formatters.py        # Pure formatters for command replies
├── conftest.py          # Pytest sys.path fix
├── pytest.ini           # asyncio_mode=auto
├── test_bot_logic.py    # Non-Telegram test harness
├── requirements.txt
├── Dockerfile
└── README.md
```
