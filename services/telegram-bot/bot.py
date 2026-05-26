"""Sentinel-IoT Telegram bot.

Long-polling python-telegram-bot v21 process. Restricts every interaction to
the configured admin chat ID and forwards commands to the Laravel REST API.

Audit logging is implicit: `/audit` and free-text prompts hit
`/api/agent/{audit,ask}`, where Laravel's `LogAgentInteractions` middleware
already records `agent_messages` rows with `source='telegram'`.
"""

from __future__ import annotations

import logging
import os
import sys
from dataclasses import dataclass
from typing import Awaitable, Callable

from dotenv import load_dotenv
from telegram import Update
from telegram.constants import ChatAction, ParseMode
from telegram.error import BadRequest
from telegram.ext import (
    Application,
    CommandHandler,
    ContextTypes,
    MessageHandler,
    filters,
)

import formatters
from sentinel_api import SentinelApiClient, SentinelApiConfig, SentinelApiError

LOG = logging.getLogger("sentinel.telegram")

# Bot data key under which the SentinelApiClient lives so handlers can reach it.
API_CLIENT_KEY = "sentinel_api"
ADMIN_CHAT_ID_KEY = "admin_chat_id"


@dataclass(frozen=True)
class BotSettings:
    telegram_token: str
    admin_chat_id: int
    laravel_api_url: str
    laravel_api_token: str

    @classmethod
    def from_env(cls) -> "BotSettings":
        missing: list[str] = []

        token = os.getenv("TELEGRAM_BOT_TOKEN", "").strip()
        if not token:
            missing.append("TELEGRAM_BOT_TOKEN")

        admin_raw = os.getenv("TELEGRAM_ADMIN_CHAT_ID", "").strip()
        admin_chat_id = 0
        if not admin_raw:
            missing.append("TELEGRAM_ADMIN_CHAT_ID")
        else:
            try:
                admin_chat_id = int(admin_raw)
            except ValueError as exc:
                raise SystemExit(
                    f"TELEGRAM_ADMIN_CHAT_ID must be an integer, got {admin_raw!r}"
                ) from exc

        laravel_token = os.getenv("LARAVEL_API_TOKEN", "").strip()
        if not laravel_token:
            missing.append("LARAVEL_API_TOKEN")

        laravel_url = os.getenv("LARAVEL_API_URL", "http://laravel-app:8000").rstrip("/")

        if missing:
            raise SystemExit(
                "missing required environment variables: " + ", ".join(missing)
            )

        return cls(
            telegram_token=token,
            admin_chat_id=admin_chat_id,
            laravel_api_url=laravel_url,
            laravel_api_token=laravel_token,
        )


HandlerFn = Callable[[Update, ContextTypes.DEFAULT_TYPE], Awaitable[None]]


def admin_only(func: HandlerFn) -> HandlerFn:
    """Drop any update that doesn't originate from the configured admin chat.

    Silent reject by design: a non-admin gets no response, only a structured
    log line, so the bot's existence is not advertised.
    """

    async def wrapper(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
        admin_id = context.application.bot_data.get(ADMIN_CHAT_ID_KEY)
        chat = update.effective_chat
        chat_id = chat.id if chat else None

        if admin_id is None or chat_id != admin_id:
            command = "<unknown>"
            if update.message and update.message.text:
                command = update.message.text.split()[0][:32]
            LOG.warning("rejected_chat chat_id=%s command=%s", chat_id, command)
            return

        await func(update, context)

    wrapper.__name__ = func.__name__
    wrapper.__doc__ = func.__doc__
    return wrapper


async def _reply_markdown(update: Update, text: str) -> None:
    """Send a markdown reply, splitting at paragraph breaks if oversized."""
    if not update.message:
        return
    capped = formatters.truncate(text)
    if len(capped) <= formatters.TELEGRAM_MAX_LEN:
        try:
            await update.message.reply_text(capped, parse_mode=ParseMode.MARKDOWN)
        except BadRequest as exc:
            if "can't parse entities" not in str(exc).lower():
                raise
            await update.message.reply_text(capped)
        return

    # Defensive — `truncate` should already keep us under the limit, but if a
    # caller bypasses it we split on paragraph boundaries.
    chunks: list[str] = []
    remaining = capped
    while remaining:
        if len(remaining) <= formatters.TELEGRAM_MAX_LEN:
            chunks.append(remaining)
            break
        cut = remaining.rfind("\n\n", 0, formatters.TELEGRAM_MAX_LEN)
        if cut == -1:
            cut = formatters.TELEGRAM_MAX_LEN
        chunks.append(remaining[:cut])
        remaining = remaining[cut:].lstrip("\n")

    for chunk in chunks:
        try:
            await update.message.reply_text(chunk, parse_mode=ParseMode.MARKDOWN)
        except BadRequest as exc:
            if "can't parse entities" not in str(exc).lower():
                raise
            await update.message.reply_text(chunk)


def _api(context: ContextTypes.DEFAULT_TYPE) -> SentinelApiClient:
    client = context.application.bot_data.get(API_CLIENT_KEY)
    if client is None:
        raise RuntimeError("Sentinel API client not initialised")
    return client


@admin_only
async def start_handler(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    await _reply_markdown(update, formatters.format_start())


@admin_only
async def help_handler(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    await _reply_markdown(update, formatters.format_help())


@admin_only
async def status_handler(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    try:
        payload = await _api(context).dashboard_summary()
        text = formatters.format_status(payload)
    except SentinelApiError as exc:
        LOG.exception("status request failed")
        text = formatters.format_error(str(exc))
    await _reply_markdown(update, text)


@admin_only
async def devices_handler(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    try:
        payload = await _api(context).list_devices()
        text = formatters.format_devices(payload)
    except SentinelApiError as exc:
        LOG.exception("devices request failed")
        text = formatters.format_error(str(exc))
    await _reply_markdown(update, text)


@admin_only
async def incidents_handler(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    try:
        payload = await _api(context).list_open_incidents()
        text = formatters.format_incidents(payload)
    except SentinelApiError as exc:
        LOG.exception("incidents request failed")
        text = formatters.format_error(str(exc))
    await _reply_markdown(update, text)


@admin_only
async def audit_handler(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    chat = update.effective_chat
    if chat:
        await context.bot.send_chat_action(chat_id=chat.id, action=ChatAction.TYPING)
    try:
        payload = await _api(context).agent_audit()
        text = formatters.format_agent_response(payload)
    except SentinelApiError as exc:
        LOG.exception("audit request failed")
        text = formatters.format_error(str(exc))
    await _reply_markdown(update, text)


@admin_only
async def free_text_handler(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    if not update.message or not update.message.text:
        return
    chat = update.effective_chat
    if chat:
        await context.bot.send_chat_action(chat_id=chat.id, action=ChatAction.TYPING)
    try:
        payload = await _api(context).agent_ask(update.message.text)
        text = formatters.format_agent_response(payload)
    except SentinelApiError as exc:
        LOG.exception("agent ask failed")
        text = formatters.format_error(str(exc))
    await _reply_markdown(update, text)


def build_application(settings: BotSettings, *, api_client: SentinelApiClient | None = None) -> Application:
    """Wire handlers and bot_data. Exposed for tests."""
    application = Application.builder().token(settings.telegram_token).build()

    if api_client is None:
        api_client = SentinelApiClient(
            SentinelApiConfig(
                base_url=settings.laravel_api_url,
                token=settings.laravel_api_token,
            )
        )

    application.bot_data[API_CLIENT_KEY] = api_client
    application.bot_data[ADMIN_CHAT_ID_KEY] = settings.admin_chat_id

    application.add_handler(CommandHandler("start", start_handler))
    application.add_handler(CommandHandler("help", help_handler))
    application.add_handler(CommandHandler("status", status_handler))
    application.add_handler(CommandHandler("devices", devices_handler))
    application.add_handler(CommandHandler("incidents", incidents_handler))
    application.add_handler(CommandHandler("audit", audit_handler))
    application.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, free_text_handler))

    return application


def main() -> int:
    logging.basicConfig(
        level=os.getenv("BOT_LOG_LEVEL", "INFO").upper(),
        format="%(asctime)s %(levelname)s %(name)s %(message)s",
    )
    load_dotenv()  # No-op when run inside Docker with env_file already loaded.

    try:
        settings = BotSettings.from_env()
    except SystemExit as exc:
        LOG.error("startup failed: %s", exc)
        return 1

    application = build_application(settings)

    LOG.info(
        "starting telegram bot (admin_chat=%s, api=%s)",
        settings.admin_chat_id,
        settings.laravel_api_url,
    )
    application.run_polling(allowed_updates=Update.ALL_TYPES)
    return 0


if __name__ == "__main__":
    sys.exit(main())
