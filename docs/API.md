# API

The MVP exposes a slim REST surface (8 endpoints) for the Telegram bot and
external automation. The full PRD §14 list is reproduced below; endpoints
that are **not** wired in this MVP are marked accordingly.

## Authentication

All `/api/*` routes except `/api/health` are gated by `auth:sanctum`. Issue
a token for the bot user with:

```bash
php artisan sentinel:issue-tokens --user=admin@sentinel.local
# emits: BOT_API_TOKEN=<plaintext>
```

Send the token as a bearer header on every request:

```http
Authorization: Bearer <BOT_API_TOKEN>
```

The web dashboard uses the standard session cookie (`auth` middleware), not
Sanctum.

## Implemented endpoints (Phase 3d)

| Method | Path                                       | Purpose                                  |
|--------|--------------------------------------------|------------------------------------------|
| GET    | `/api/health`                              | Liveness probe (no auth)                 |
| GET    | `/api/dashboard/summary`                   | Counts for the Telegram `/status`        |
| GET    | `/api/devices`                             | Device list with last-seen timestamps    |
| GET    | `/api/incidents`                           | Open + recent incidents                  |
| GET    | `/api/security-events`                     | Security event log (filtered)            |
| POST   | `/api/agent/ask`                           | Free-form prompt → SentinelAgent         |
| POST   | `/api/agent/audit`                         | Run AuditAgent (read-only audit)         |
| POST   | `/api/agent/analyze-incident/{incident}`   | Run IncidentAnalyst against an incident  |

### `GET /api/dashboard/summary`

```json
{
  "total_devices": 5,
  "online_devices": 4,
  "offline_devices": 1,
  "security_events_today": 3,
  "open_incidents": 1,
  "risk_level": "medium"
}
```

### `POST /api/agent/ask`

Request:

```json
{ "prompt": "Cek status semua device dan jelaskan risiko keamanan terbaru." }
```

Response:

```json
{
  "response": "Terdapat 1 device offline dan 2 event keamanan medium...",
  "conversation_id": "01J..."
}
```

The agent persists the message in `agent_messages` and the conversation in
`agent_conversations` / `agent_conversation_messages` (SDK-managed tables).

### `POST /api/agent/analyze-incident/{incident}`

Runs the structured-output `IncidentAnalyst` agent. Response shape mirrors
the schema in `app/Ai/Agents/IncidentAnalyst.php::schema()`:

```json
{
  "severity": "high",
  "summary": "...",
  "root_cause": "...",
  "impact": "...",
  "recommendation": "...",
  "recommendations": ["..."],
  "report_markdown": "# Incident Report\n..."
}
```

The web equivalent (`POST /incidents/{incident}/generate-report`) calls the
same agent, persists `incident_reports`, and updates the incident.

## PRD-only reference (not implemented in the MVP)

The PRD §14 surface lists more endpoints than the MVP needs. The following
remain reference-only:

| Method | Path                                       | Status                              |
|--------|--------------------------------------------|-------------------------------------|
| GET    | `/api/devices/{device_id}`                 | Not implemented (PRD reference only)|
| POST   | `/api/devices`                             | Not implemented                     |
| PUT    | `/api/devices/{device_id}`                 | Not implemented                     |
| DELETE | `/api/devices/{device_id}`                 | Not implemented                     |
| GET    | `/api/telemetry`                           | Not implemented                     |
| GET    | `/api/telemetry/{device_id}`               | Not implemented                     |
| GET    | `/api/telemetry/{device_id}/latest`        | Not implemented                     |
| GET    | `/api/security-events/{id}`                | Not implemented                     |
| POST   | `/api/security-events`                     | Not implemented (ingestor writes only)|
| GET    | `/api/incidents/{id}`                      | Not implemented (use web)           |
| POST   | `/api/incidents`                           | Not implemented (use web)           |
| PUT    | `/api/incidents/{id}`                      | Not implemented (use web)           |
| POST   | `/api/incidents/{id}/generate-report`      | Web-only: `POST /incidents/{id}/generate-report` |
| POST   | `/api/agent/recommendation`                | Not implemented (folded into `/ask`)|

The bot and dashboard cover the MVP scope; expansion lives behind future
phases.

## Web routes (sessions, not Sanctum)

For completeness — these power the Inertia dashboard and aren't part of the
REST surface:

| Method   | Path                                       | Controller                              |
|----------|--------------------------------------------|-----------------------------------------|
| GET      | `/dashboard`                               | `DashboardController@index`             |
| GET      | `/devices`                                 | `DeviceController@index`                |
| GET      | `/devices/{device_id}`                     | `DeviceController@show`                 |
| GET      | `/telemetry`                               | `TelemetryController@index`             |
| GET      | `/security-events`                         | `SecurityEventController@index`         |
| GET      | `/incidents`                               | `IncidentController@index`              |
| GET      | `/incidents/{incident}`                    | `IncidentController@show`               |
| POST     | `/incidents`                               | `IncidentController@store`              |
| PUT      | `/incidents/{incident}`                    | `IncidentController@update`             |
| POST     | `/incidents/{incident}/generate-report`    | `IncidentController@generateReport`     |
| GET      | `/agent`                                   | `AgentController@index`                 |
| POST     | `/agent/ask`                               | `AgentController@ask`                   |

Type-safe helpers live in `resources/js/actions/App/Http/Controllers/` and
`resources/js/routes/` (Wayfinder).
