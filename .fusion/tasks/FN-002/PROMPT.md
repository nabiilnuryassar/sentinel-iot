# FN-002

Phase 2 of Sentinel-IoT: build the Python MQTT Ingestor that subscribes to telemetry topics, validates payloads, and persists to Postgres. Also lands the Phase 3a migration prerequisites the ingestor needs to write into.

## Source of truth
- Plan: `thoughts/shared/plans/sentinel-iot-plan.md` Phase 2 + the "Cross-phase note"
- Design: `thoughts/shared/designs/sentinel-iot-design.md` slice S3, decisions D2/D6/D7
- PRD: `docs/PRD.md` §12.3 (ingestor), §13.2 (table columns)

## Cross-phase prerequisite (do these FIRST)
The ingestor needs three tables to exist. Per the plan's "Cross-phase note", run only the migrations from P3.1–P3.7 that the ingestor writes into — no models, no factories, no seeders. Specifically:
- **P3.1** `create_devices_table`
- **P3.2** `create_telemetry_logs_table` (with index `(device_id, received_at desc)`)
- **P3.3** `create_security_events_table` (with index `(severity, detected_at desc)`)

Skip P3.4–P3.7 (incidents, incident_reports, agent_messages, device_policies) — those land in Phase 3 proper.

## Tasks (P2.1–P2.8)
- **P2.1** `services/mqtt-ingestor/db.py` — psycopg connection pool, `insert_telemetry`, `update_device_last_seen`, `insert_security_event`.
- **P2.2** `services/mqtt-ingestor/validators.py` — `validate_telemetry(payload, topic) -> Tuple[bool, Optional[str]]`. Required fields: `device_id`, `type`, `timestamp`, `location`. Topic device_id must match payload device_id; mismatch → reason `device_spoofing`.
- **P2.3** `services/mqtt-ingestor/app.py` — paho-mqtt 2.x subscriber with `sentinel_ingestor` creds. Subscribes to `iot/+/+/+/telemetry` and `iot/+/+/+/event`. For each message: parse → validate → write telemetry or security event. Exponential reconnect.
- **P2.4** `services/mqtt-ingestor/Dockerfile` — python:3.12-slim base.
- **P2.5** `services/mqtt-ingestor/requirements.txt` — `paho-mqtt>=2.1,<3`, `psycopg[binary]>=3.2,<4`, `python-dotenv>=1.0,<2`.
- **P2.6** `services/mqtt-ingestor/tests/test_validators.py` — pytest cases: valid payload, missing device_id, topic/payload mismatch, non-JSON.
- **P2.7** Wire ingestor into `docker-compose.yml` with `depends_on: [postgres, mosquitto]`.
- **P2.8** End-to-end check: bring stack + simulator up, after 30s `select count(*) from telemetry_logs;` > 0 with rows for all 5 devices and `last_seen_at` updated. Then publish a malformed payload and confirm a `security_events` row with `event_type='malformed_payload'`.

## Success criteria
- `pytest services/mqtt-ingestor/tests/` passes.
- After 30s of simulator run: `telemetry_logs` has rows for all 5 devices, each device's `last_seen_at` is within the last minute.
- A malformed publish creates one row in `security_events` with `severity='medium'` and `event_type='malformed_payload'`.
- A topic/payload device_id mismatch creates a `device_spoofing` event.

## Constraints
- Do not modify Phase 0 or Phase 1 deliverables.
- Do not create models, factories, or seeders — that's Phase 3.
- Do not create migrations P3.4–P3.7 (incidents and friends).
- Schema must match PRD §13.2 exactly so Phase 3 models can map cleanly.
- Use `sentinel_ingestor` MQTT credentials, not `sentinel_device`.
- Postgres is reachable inside the compose network as `postgres:5432` with creds from `.env`.
