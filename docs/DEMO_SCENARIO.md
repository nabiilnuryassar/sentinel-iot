# Demo Scenarios

Adapted from PRD §23. Each scenario is a runbook — exact commands plus the
UI step. Run them in order against a freshly-seeded demo dataset:

```bash
docker compose exec -T laravel-app php artisan db:seed --class=DemoSeeder --no-interaction
docker compose exec -T laravel-app php artisan sentinel:health
```

`sentinel:health` should print all-green for `Database` and `MQTT broker`
before you start.

## Scenario 1 — Normal Telemetry

Show the dashboard with a steady stream of telemetry from five virtual
devices.

Steps:

1. From the host (laptop), start the simulator in the background. This
   keeps the dashboard chart moving for the rest of the demo:
   ```bash
   docker run --rm -d --name sim-bg \
     --network sentinel-iot_default \
     -v "$PWD/simulator:/app" -w /app \
     -e MQTT_HOST=mosquitto \
     -e MQTT_USERNAME=sentinel_device \
     -e MQTT_PASSWORD=sentinel_mqtt_password \
     python:3.12-slim \
     sh -c 'pip install --quiet -r requirements.txt && python virtual_devices.py --interval 3'
   ```
2. Open the dashboard at `http://localhost:8000/dashboard`. Confirm:
   - 5 devices online
   - Telemetry chart shows non-zero counts in the last hour
   - Today's events count reflects the seeded events (5)
3. Optional: visit `/devices`, click any device. Confirm the latest payload
   matches the simulator output.

Expected: dashboard reads as a healthy network with no open critical
findings until Scenario 2 runs.

## Scenario 2 — Malformed Payload Attack

A weakly-formed payload is rejected by the ingestor and recorded as a
medium-severity security event.

Steps:

1. From the host:
   ```bash
   cd services/attack-simulator
   MQTT_HOST=localhost MQTT_PORT=1883 python malformed_payload.py
   ```
   Or via one-shot Docker:
   ```bash
   docker run --rm --network sentinel-iot_default \
     -v "$PWD/services/attack-simulator:/app" -w /app \
     -e MQTT_HOST=mosquitto -e MQTT_PORT=1883 \
     python:3.12-slim sh -c 'pip install --quiet paho-mqtt && python malformed_payload.py'
   ```
2. Wait ~5 seconds for the ingestor to process and write the row.
3. Open `/security-events`. Confirm a fresh row with
   `event_type=malformed_payload`, `severity=medium`.
4. Click the row's "Create incident" action. Submit the pre-filled dialog.
5. The dashboard will show the new incident in the Open list.

Expected: one new `security_events` row, one new open incident.

## Scenario 3 — Unauthorized + Spoofed Publish

Two attacks: an unauthorized client gets rejected at the broker (no row
written, broker logs only), then a valid client tries to spoof another
device.

Steps:

1. Run the unauthorized publish:
   ```bash
   cd services/attack-simulator
   MQTT_HOST=localhost MQTT_PORT=1883 python unauthorized_publish.py
   ```
2. Confirm the broker rejected the publish:
   ```bash
   docker logs sentinel-mosquitto --tail 30 | grep -i "not authorised\|denied\|connect rejected"
   ```
   You should see a connection-rejected line for the bad credentials.
3. Now run the spoof:
   ```bash
   MQTT_HOST=localhost MQTT_PORT=1883 python spoof_device.py
   ```
4. Refresh `/security-events`. Confirm a fresh `device_spoofing` row with
   `severity=high`.
5. Click the spoof event row's "Create incident" action. Submit.

Expected: zero new rows from the unauthorized attempt (broker-rejected),
one new `device_spoofing` row, one new open incident.

## Scenario 4 — Incident Report Generation

Generate the full markdown report for the spoof incident with the in-process
`IncidentAnalyst` agent.

Steps:

1. From `/incidents`, open the incident created in Scenario 3.
2. Click "Generate report" in the Incident report card.
3. Wait ~5 seconds. The button shows a spinner; the report renders inline
   when the agent returns.
4. Verify on the page:
   - Severity / status badges reflect the agent's structured output.
   - Summary, root cause, and recommendation cards show non-empty text.
   - The markdown report renders below with sections matching PRD §22.2.
5. Optional: open Telegram and run `/status`. The bot should hit
   `/api/dashboard/summary` and report current counts including the new
   incident.

Expected: one row written to `incident_reports`; the incident's `severity`,
`summary`, `root_cause`, `recommendation` are updated in place.

If `OPENAI_API_KEY` (or `ANTHROPIC_API_KEY` / `GEMINI_API_KEY`) is not set
in `.env`, the SDK falls back to its testing fakes — the report still
generates but the body is canned. The wiring proof is the same: a row in
`incident_reports`, severity / recommendation populated.

## Cleanup

```bash
docker rm -f sim-bg
```

This stops the background simulator. The seeded demo data stays put until
the next `DemoSeeder` run.
