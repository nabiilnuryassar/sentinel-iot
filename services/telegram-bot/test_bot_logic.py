"""Logic tests for the Sentinel-IoT Telegram bot.

Exercises:
- The HTTP client routes against the right Laravel endpoints with the bearer token.
- The reply formatters produce the expected markdown shape.
- The admin allowlist silently drops non-admin updates and handlers run for admins.

Telegram is not contacted: handlers are invoked with hand-built `Update` and
`Context` doubles. The Laravel API is stubbed with `httpx.MockTransport`.
"""

from __future__ import annotations

import json
from dataclasses import dataclass, field
from typing import Any
from unittest.mock import AsyncMock

import httpx
import pytest
from telegram.error import BadRequest

import bot
import formatters
from sentinel_api import SentinelApiClient, SentinelApiConfig


# ---------------------------------------------------------------------------
# Fakes
# ---------------------------------------------------------------------------


@dataclass
class FakeMessage:
    text: str = ""
    replies: list[tuple[str, str | None]] = field(default_factory=list)
    fail_on_markdown: bool = False

    async def reply_text(self, text: str, parse_mode: str | None = None) -> None:
        if self.fail_on_markdown and parse_mode == "Markdown":
            raise BadRequest("Can't parse entities: can't find end of the entity")
        self.replies.append((text, parse_mode))


@dataclass
class FakeChat:
    id: int


@dataclass
class FakeUpdate:
    effective_chat: FakeChat | None
    message: FakeMessage | None


@dataclass
class FakeBot:
    actions: list[tuple[int, str]] = field(default_factory=list)

    async def send_chat_action(self, *, chat_id: int, action: str) -> None:
        self.actions.append((chat_id, action))


@dataclass
class FakeApplication:
    bot_data: dict[str, Any]


@dataclass
class FakeContext:
    application: FakeApplication
    bot: FakeBot = field(default_factory=FakeBot)


def _build_context(api_client: SentinelApiClient, admin_chat_id: int = 42) -> FakeContext:
    return FakeContext(
        application=FakeApplication(
            bot_data={
                bot.API_CLIENT_KEY: api_client,
                bot.ADMIN_CHAT_ID_KEY: admin_chat_id,
            }
        )
    )


def _make_client(handler) -> SentinelApiClient:
    transport = httpx.MockTransport(handler)
    http_client = httpx.AsyncClient(
        base_url="http://laravel-app:8000",
        headers={"Authorization": "Bearer test-token", "Accept": "application/json"},
        transport=transport,
    )
    return SentinelApiClient(
        SentinelApiConfig(base_url="http://laravel-app:8000", token="test-token"),
        client=http_client,
    )


# ---------------------------------------------------------------------------
# HTTP client routing tests
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_status_handler_calls_dashboard_summary_with_bearer():
    captured: dict[str, Any] = {}

    def handler(request: httpx.Request) -> httpx.Response:
        captured["method"] = request.method
        captured["path"] = request.url.path
        captured["authorization"] = request.headers.get("authorization")
        return httpx.Response(
            200,
            json={
                "total_devices": 5,
                "online_devices": 4,
                "offline_devices": 1,
                "security_events_today": 3,
                "open_incidents": 1,
                "risk_level": "medium",
            },
        )

    client = _make_client(handler)
    update = FakeUpdate(effective_chat=FakeChat(id=42), message=FakeMessage("/status"))
    context = _build_context(client)

    await bot.status_handler(update, context)
    await client.aclose()

    assert captured["method"] == "GET"
    assert captured["path"] == "/api/dashboard/summary"
    assert captured["authorization"] == "Bearer test-token"
    assert update.message is not None
    text, parse_mode = update.message.replies[0]
    assert "Sentinel-IoT status" in text
    assert "4/5 online" in text
    assert "Risk level: *medium*" in text
    assert parse_mode == "Markdown"


@pytest.mark.asyncio
async def test_devices_handler_calls_devices_endpoint():
    captured: dict[str, Any] = {}

    def handler(request: httpx.Request) -> httpx.Response:
        captured["method"] = request.method
        captured["path"] = request.url.path
        captured["query"] = dict(request.url.params)
        return httpx.Response(
            200,
            json={
                "data": [
                    {
                        "device_id": "temp-sensor-001",
                        "type": "sensor",
                        "is_online": True,
                        "last_seen_at": "2026-05-16T08:00:00+00:00",
                    },
                    {
                        "device_id": "lock-002",
                        "type": "lock",
                        "is_online": False,
                        "last_seen_at": None,
                    },
                ]
            },
        )

    client = _make_client(handler)
    update = FakeUpdate(effective_chat=FakeChat(id=42), message=FakeMessage("/devices"))
    context = _build_context(client)

    await bot.devices_handler(update, context)
    await client.aclose()

    assert captured["method"] == "GET"
    assert captured["path"] == "/api/devices"
    assert captured["query"] == {"per_page": "20"}
    assert update.message is not None
    text, _ = update.message.replies[0]
    assert "temp-sensor-001" in text
    assert "lock-002" in text
    # Online vs offline dots are present.
    assert "🟢" in text
    assert "🔴" in text


@pytest.mark.asyncio
async def test_incidents_handler_filters_to_open():
    captured: dict[str, Any] = {}

    def handler(request: httpx.Request) -> httpx.Response:
        captured["path"] = request.url.path
        captured["query"] = dict(request.url.params)
        return httpx.Response(
            200,
            json={
                "data": [
                    {
                        "id": 7,
                        "title": "Suspicious publish flood",
                        "severity": "high",
                        "summary": "200 messages in 5 seconds from attacker-client.",
                    }
                ]
            },
        )

    client = _make_client(handler)
    update = FakeUpdate(effective_chat=FakeChat(id=42), message=FakeMessage("/incidents"))
    context = _build_context(client)

    await bot.incidents_handler(update, context)
    await client.aclose()

    assert captured["path"] == "/api/incidents"
    assert captured["query"]["status"] == "open"
    assert update.message is not None
    text, _ = update.message.replies[0]
    assert "Suspicious publish flood" in text
    assert "(#7)" in text


@pytest.mark.asyncio
async def test_audit_handler_posts_to_agent_audit():
    captured: dict[str, Any] = {}

    def handler(request: httpx.Request) -> httpx.Response:
        captured["method"] = request.method
        captured["path"] = request.url.path
        captured["body"] = json.loads(request.content.decode() or "{}")
        return httpx.Response(
            200,
            json={"response": "Broker audit OK.", "conversation_id": "conv-1"},
        )

    client = _make_client(handler)
    update = FakeUpdate(effective_chat=FakeChat(id=42), message=FakeMessage("/audit"))
    context = _build_context(client)

    await bot.audit_handler(update, context)
    await client.aclose()

    assert captured["method"] == "POST"
    assert captured["path"] == "/api/agent/audit"
    assert captured["body"] == {}
    assert update.message is not None
    text, _ = update.message.replies[0]
    assert text == "Broker audit OK."
    # Typing indicator was emitted.
    assert (42, "typing") in context.bot.actions


@pytest.mark.asyncio
async def test_free_text_handler_posts_prompt_to_agent_ask():
    captured: dict[str, Any] = {}

    def handler(request: httpx.Request) -> httpx.Response:
        captured["method"] = request.method
        captured["path"] = request.url.path
        captured["body"] = json.loads(request.content.decode() or "{}")
        return httpx.Response(
            200,
            json={"response": "Working on it.", "conversation_id": "conv-2"},
        )

    client = _make_client(handler)
    update = FakeUpdate(
        effective_chat=FakeChat(id=42),
        message=FakeMessage("how is the broker doing"),
    )
    context = _build_context(client)

    await bot.free_text_handler(update, context)
    await client.aclose()

    assert captured["method"] == "POST"
    assert captured["path"] == "/api/agent/ask"
    assert captured["body"] == {"prompt": "how is the broker doing"}
    assert update.message is not None
    text, parse_mode = update.message.replies[0]
    assert text == "Working on it."
    assert parse_mode == "Markdown"


@pytest.mark.asyncio
async def test_free_text_handler_falls_back_to_plain_text_when_markdown_is_invalid():
    def handler(request: httpx.Request) -> httpx.Response:
        return httpx.Response(
            200,
            json={
                "response": "Security event: malformed_payload from temp_sensor_001",
                "conversation_id": "conv-3",
            },
        )

    client = _make_client(handler)
    update = FakeUpdate(
        effective_chat=FakeChat(id=42),
        message=FakeMessage("summarize latest event", fail_on_markdown=True),
    )
    context = _build_context(client)

    await bot.free_text_handler(update, context)
    await client.aclose()

    assert update.message is not None
    text, parse_mode = update.message.replies[0]
    assert "malformed_payload" in text
    assert parse_mode is None


@pytest.mark.asyncio
async def test_help_handler_does_not_call_api():
    """`/help` is static — no network calls and no chat action."""
    calls: list[httpx.Request] = []

    def handler(request: httpx.Request) -> httpx.Response:
        calls.append(request)
        return httpx.Response(500, json={})

    client = _make_client(handler)
    update = FakeUpdate(effective_chat=FakeChat(id=42), message=FakeMessage("/help"))
    context = _build_context(client)

    await bot.help_handler(update, context)
    await client.aclose()

    assert calls == []
    assert update.message is not None
    text, _ = update.message.replies[0]
    assert "/status" in text and "/devices" in text


# ---------------------------------------------------------------------------
# Allowlist tests
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_non_admin_chat_is_silently_dropped(caplog):
    inner = AsyncMock()

    @bot.admin_only
    async def guarded(update, context):
        await inner(update, context)

    update = FakeUpdate(
        effective_chat=FakeChat(id=999),
        message=FakeMessage("/status"),
    )
    context = _build_context(_make_client(lambda r: httpx.Response(500)), admin_chat_id=42)

    with caplog.at_level("WARNING", logger="sentinel.telegram"):
        await guarded(update, context)

    inner.assert_not_called()
    assert update.message is not None
    assert update.message.replies == []
    assert any("rejected_chat" in record.message for record in caplog.records)
    assert any("chat_id=999" in record.message for record in caplog.records)


@pytest.mark.asyncio
async def test_admin_chat_invokes_handler():
    inner = AsyncMock()

    @bot.admin_only
    async def guarded(update, context):
        await inner(update, context)

    update = FakeUpdate(
        effective_chat=FakeChat(id=42),
        message=FakeMessage("/status"),
    )
    context = _build_context(_make_client(lambda r: httpx.Response(500)), admin_chat_id=42)

    await guarded(update, context)

    inner.assert_awaited_once()


# ---------------------------------------------------------------------------
# Formatter unit tests
# ---------------------------------------------------------------------------


def test_format_status_renders_all_counters():
    text = formatters.format_status(
        {
            "total_devices": 5,
            "online_devices": 4,
            "offline_devices": 1,
            "security_events_today": 7,
            "open_incidents": 2,
            "risk_level": "high",
        }
    )
    assert "4/5 online" in text
    assert "Security events today: 7" in text
    assert "Open incidents: 2" in text
    assert "Risk level: *high*" in text


def test_format_devices_handles_empty_payload():
    assert formatters.format_devices({"data": []}) == "No devices registered."


def test_format_incidents_truncates_overflow_list():
    payload = {
        "data": [
            {"id": i, "title": f"Incident {i}", "severity": "low", "summary": "x"}
            for i in range(25)
        ]
    }
    text = formatters.format_incidents(payload, limit=5)
    assert "_…and 20 more_" in text


def test_truncate_caps_long_replies():
    big = "x" * (formatters.TELEGRAM_MAX_LEN + 500)
    out = formatters.truncate(big)
    assert len(out) <= formatters.TELEGRAM_MAX_LEN
    assert out.endswith("…(truncated)")


# ---------------------------------------------------------------------------
# Settings parsing
# ---------------------------------------------------------------------------


def test_settings_from_env_requires_all_keys(monkeypatch):
    for key in ("TELEGRAM_BOT_TOKEN", "TELEGRAM_ADMIN_CHAT_ID", "LARAVEL_API_TOKEN"):
        monkeypatch.delenv(key, raising=False)
    with pytest.raises(SystemExit):
        bot.BotSettings.from_env()


def test_settings_from_env_parses_admin_chat_as_int(monkeypatch):
    monkeypatch.setenv("TELEGRAM_BOT_TOKEN", "tg")
    monkeypatch.setenv("TELEGRAM_ADMIN_CHAT_ID", "42")
    monkeypatch.setenv("LARAVEL_API_TOKEN", "bot")
    monkeypatch.setenv("LARAVEL_API_URL", "http://laravel-app:8000/")
    settings = bot.BotSettings.from_env()
    assert settings.admin_chat_id == 42
    # Trailing slash is stripped to keep base_url + path joins clean.
    assert settings.laravel_api_url == "http://laravel-app:8000"
