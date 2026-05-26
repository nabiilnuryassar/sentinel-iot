"""HTTP client wrapping the Sentinel-IoT Laravel REST API.

Thin async layer over httpx so handlers stay free of transport concerns and
tests can swap the underlying transport via `httpx.MockTransport`.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Any

import httpx


class SentinelApiError(RuntimeError):
    """Raised when the Laravel API returns a non-2xx response."""

    def __init__(self, status_code: int, body: str) -> None:
        super().__init__(f"sentinel api {status_code}: {body[:200]}")
        self.status_code = status_code
        self.body = body


@dataclass(frozen=True)
class SentinelApiConfig:
    base_url: str
    token: str
    timeout: float = 30.0

    def headers(self) -> dict[str, str]:
        return {
            "Authorization": f"Bearer {self.token}",
            "Accept": "application/json",
        }


class SentinelApiClient:
    """Async client for the endpoints the Telegram bot needs.

    A single shared `httpx.AsyncClient` is reused across calls. Inject a custom
    transport (e.g. `httpx.MockTransport`) via the `client` constructor arg in
    tests.
    """

    def __init__(
        self,
        config: SentinelApiConfig,
        client: httpx.AsyncClient | None = None,
    ) -> None:
        self._config = config
        self._client = client or httpx.AsyncClient(
            base_url=config.base_url,
            headers=config.headers(),
            timeout=config.timeout,
        )
        # Track ownership so callers passing a client don't get it closed under them.
        self._owns_client = client is None

    async def aclose(self) -> None:
        if self._owns_client:
            await self._client.aclose()

    @property
    def base_url(self) -> str:
        return self._config.base_url

    async def _get(self, path: str, params: dict[str, Any] | None = None) -> Any:
        response = await self._client.get(path, params=params)
        if response.status_code >= 400:
            raise SentinelApiError(response.status_code, response.text)
        return response.json()

    async def _post(self, path: str, json_body: dict[str, Any]) -> Any:
        response = await self._client.post(path, json=json_body)
        if response.status_code >= 400:
            raise SentinelApiError(response.status_code, response.text)
        return response.json()

    async def dashboard_summary(self) -> dict[str, Any]:
        return await self._get("/api/dashboard/summary")

    async def list_devices(self, *, per_page: int = 20) -> dict[str, Any]:
        return await self._get("/api/devices", params={"per_page": per_page})

    async def list_open_incidents(self, *, per_page: int = 20) -> dict[str, Any]:
        return await self._get(
            "/api/incidents",
            params={"status": "open", "per_page": per_page},
        )

    async def agent_ask(self, prompt: str) -> dict[str, Any]:
        return await self._post("/api/agent/ask", {"prompt": prompt})

    async def agent_audit(self) -> dict[str, Any]:
        return await self._post("/api/agent/audit", {})
