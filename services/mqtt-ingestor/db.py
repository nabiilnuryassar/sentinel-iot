"""Database access for the Sentinel-IoT MQTT ingestor.

Owns a small psycopg v3 connection pool and exposes three idempotent helpers:
- insert_telemetry()
- update_device_last_seen() (UPSERT on device_id)
- insert_security_event()

All payload JSON arguments are Python dicts; psycopg.types.json.Jsonb adapts
them on the wire. Every query is fully parameterised — no string formatting.
"""

from __future__ import annotations

import logging
import os
from datetime import datetime, timezone
from typing import Any

from psycopg.types.json import Jsonb
from psycopg_pool import ConnectionPool

LOG = logging.getLogger("sentinel.ingestor.db")

_pool: ConnectionPool | None = None


def _conninfo() -> str:
    """Build a libpq connection string from DB_* env vars."""
    host = os.getenv("DB_HOST", "postgres")
    port = os.getenv("DB_PORT", "5432")
    dbname = os.getenv("DB_DATABASE", "sentinel_iot")
    user = os.getenv("DB_USERNAME", "sentinel")
    password = os.getenv("DB_PASSWORD", "sentinel_password")
    return (
        f"host={host} port={port} dbname={dbname} "
        f"user={user} password={password} application_name=sentinel-ingestor"
    )


def get_pool() -> ConnectionPool:
    """Lazy-open the connection pool. Reused for the lifetime of the process."""
    global _pool
    if _pool is None:
        _pool = ConnectionPool(
            conninfo=_conninfo(),
            min_size=1,
            max_size=4,
            kwargs={"autocommit": True},
            open=False,
        )
        _pool.open()
        _pool.wait(timeout=15.0)
        LOG.info("db pool opened (min=1 max=4)")
    return _pool


def close_pool() -> None:
    """Close the pool on shutdown. Safe to call when the pool was never opened."""
    global _pool
    if _pool is not None:
        _pool.close()
        _pool = None
        LOG.info("db pool closed")


def _now_utc() -> datetime:
    return datetime.now(timezone.utc)


def get_tenant_id(tenant_slug: str | None, default_tenant_id: int = 1) -> int | None:
    """Lookup tenant_id by slug. Falls back to default_tenant_id (1) for legacy topics."""
    if tenant_slug is None:
        return default_tenant_id
    try:
        pool = get_pool()
        with pool.connection() as conn, conn.cursor() as cur:
            cur.execute("SELECT id FROM tenants WHERE slug = %s", (tenant_slug,))
            row = cur.fetchone()
            return row[0] if row else None
    except Exception as exc:  # noqa: BLE001
        LOG.error("failed to lookup tenant %s: %s", tenant_slug, exc)
        return None


def insert_telemetry(
    device_id: str,
    topic: str,
    payload_json: dict[str, Any],
    *,
    temperature: float | None = None,
    humidity: float | None = None,
    battery: float | None = None,
    rssi: float | None = None,
    received_at: datetime | None = None,
    tenant_slug: str | None = None,
) -> int:
    """Insert a single row into telemetry_logs and return the new id."""
    received_at = received_at or _now_utc()
    tenant_id = get_tenant_id(tenant_slug)
    sql = (
        "INSERT INTO telemetry_logs "
        "(device_id, topic, payload_json, temperature, humidity, battery, rssi, received_at, tenant_id) "
        "VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s) RETURNING id"
    )
    pool = get_pool()
    with pool.connection() as conn, conn.cursor() as cur:
        cur.execute(
            sql,
            (
                device_id,
                topic,
                Jsonb(payload_json),
                temperature,
                humidity,
                battery,
                rssi,
                received_at,
                tenant_id,
            ),
        )
        row = cur.fetchone()
        return int(row[0]) if row else 0


def update_device_last_seen(
    device_id: str,
    last_seen_at: datetime,
    *,
    name: str | None = None,
    type: str | None = None,
    location: str | None = None,
    status: str = "online",
    tenant_slug: str | None = None,
) -> None:
    """UPSERT into devices keyed by device_id.

    On insert, name defaults to device_id when not supplied. On update, only
    last_seen_at, status, location, and type are refreshed; name and metadata
    are left intact so manual edits in the dashboard are not overwritten.
    """
    tenant_id = get_tenant_id(tenant_slug)
    sql = (
        "INSERT INTO devices "
        "(device_id, name, type, location, status, last_seen_at, created_at, updated_at, tenant_id) "
        "VALUES (%s, %s, %s, %s, %s, %s, NOW(), NOW(), %s) "
        "ON CONFLICT (device_id) DO UPDATE SET "
        "  status = EXCLUDED.status, "
        "  last_seen_at = EXCLUDED.last_seen_at, "
        "  location = COALESCE(EXCLUDED.location, devices.location), "
        "  type = COALESCE(EXCLUDED.type, devices.type), "
        "  updated_at = NOW()"
    )
    pool = get_pool()
    with pool.connection() as conn, conn.cursor() as cur:
        cur.execute(
            sql,
            (
                device_id,
                name or device_id,
                type or "unknown",
                location,
                status,
                last_seen_at,
                tenant_id,
            ),
        )


def insert_security_event(
    event_type: str,
    severity: str,
    *,
    source_client_id: str | None = None,
    topic: str | None = None,
    payload_json: dict[str, Any] | None = None,
    description: str | None = None,
    detected_at: datetime | None = None,
    tenant_slug: str | None = None,
) -> int:
    """Insert a single row into security_events and return the new id."""
    detected_at = detected_at or _now_utc()
    tenant_id = get_tenant_id(tenant_slug)
    sql = (
        "INSERT INTO security_events "
        "(event_type, severity, source_client_id, topic, payload_json, description, detected_at, tenant_id) "
        "VALUES (%s, %s, %s, %s, %s, %s, %s, %s) RETURNING id"
    )
    payload_param = Jsonb(payload_json) if payload_json is not None else None
    pool = get_pool()
    with pool.connection() as conn, conn.cursor() as cur:
        cur.execute(
            sql,
            (
                event_type,
                severity,
                source_client_id,
                topic,
                payload_param,
                description,
                detected_at,
                tenant_id,
            ),
        )
        row = cur.fetchone()
        return int(row[0]) if row else 0
