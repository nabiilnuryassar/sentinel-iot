# Sentinel-IoT User Guide v2

**Audience:** Operators, security analysts, and non-technical stakeholders
**Version:** 2.0

---

## 1. Welcome to Sentinel-IoT

Sentinel-IoT is a Security Operations Center (SOC) designed for IoT environments. It monitors your connected devices in real-time, detects security threats, and provides AI-assisted incident management.

### Key Capabilities

- **Real-time device monitoring** — See which devices are online, offline, or compromised
- **Telemetry visualization** — Temperature, humidity, motion, and custom sensor data
- **Security event detection** — Automatic alerts for malformed payloads, device spoofing, and unauthorized access
- **Incident management** — Create, track, and resolve security incidents with AI-generated reports
- **AI Agent** — Ask questions about your IoT network and get instant analysis
- **Telegram alerts** — Receive notifications directly in Telegram

---

## 2. Getting Started

### Logging In

1. Navigate to your Sentinel-IoT URL (e.g., `https://sentinel.yourdomain.com`)
2. Enter your email and password
3. Click **Authenticate**

[SCREENSHOT: Login page with email/password fields]

### Dashboard Overview

After logging in, you'll see the operations dashboard:

[SCREENSHOT: Dashboard with summary cards]

**Summary Cards (top):**
- **Total Devices** — Number of registered devices
- **Online Devices** — Devices reporting in the last 5 minutes
- **Open Incidents** — Active security incidents requiring attention
- **Security Events** — Events detected today

**Charts (middle):**
- **Telemetry Timeline** — Message volume per minute over the last hour
- **Device Health** — Distribution of online/offline/warning devices
- **Security Score** — Current risk assessment

**Live Feed (bottom right):**
- Real-time security events as they happen
- Color-coded by severity (low/medium/high/critical)

---

## 3. Device Management

### Viewing Devices

Navigate to **Devices** from the sidebar to see all registered IoT devices.

[SCREENSHOT: Devices list with status indicators]

**Each device shows:**
- Device ID and name
- Type (temperature sensor, door lock, power meter, etc.)
- Location
- Status indicator: 🟢 Online / 🔴 Offline / 🟡 Warning / ⛔ Quarantined
- Last seen timestamp

### Device Details

Click on any device to see its detailed page:

[SCREENSHOT: Device detail page with telemetry chart]

**Details include:**
- Full device metadata
- Real-time telemetry chart (temperature, humidity, etc.)
- Recent security events for this device
- Quarantine controls

### Quarantining a Device

If a device behaves suspiciously:

1. Open the device detail page
2. Click **Quarantine Device**
3. The device status changes to "quarantined"
4. Quarantined devices are flagged in all security reports

To release a quarantine, click the same button again.

---

## 4. Telemetry Monitoring

### Viewing Telemetry

Navigate to **Telemetry** from the sidebar to see all sensor readings.

[SCREENSHOT: Telemetry page with filters]

**Available filters:**
- **Device** — Filter by specific device
- **Date range** — From/to timestamps
- **Sensor type** — Temperature, humidity, light, motion, etc.

### Understanding Telemetry Data

Each telemetry message contains:
- **Device ID** — Which device sent the data
- **Type** — What kind of measurement (temperature, humidity, etc.)
- **Value** — The reading (e.g., 23.5)
- **Unit** — Measurement unit (celsius, percent, lux, etc.)
- **Timestamp** — When the reading was taken
- **Battery** — Device battery level (if supported)

### Typical Sensor Types

| Type | Unit | Normal Range | Alert Threshold |
|---|---|---|---|
| Temperature | celsius | 18-30 | >35 or <10 |
| Humidity | percent | 30-70 | >85 or <20 |
| Light | lux | 100-500 | Context-dependent |
| Motion | boolean | false | true (unexpected) |
| Battery | percent | 20-100 | <20 |

---

## 5. Security Events

### Event Types

Sentinel-IoT detects the following security event types:

| Type | Severity | Description |
|---|---|---|
| Malformed Payload | Medium | Device sent invalid JSON or missing required fields |
| Device Spoofing | High | Message device_id doesn't match the MQTT topic |
| Unauthorized Publish | High | Connection rejected by broker (invalid credentials) |
| Publish Flood | High | >50 messages in 10 seconds from one device |
| Device Event | Low | Normal device event (motion detected, etc.) |

### Viewing Events

Navigate to **Security Events** from the sidebar.

[SCREENSHOT: Security events list with severity badges]

**Filters available:**
- Severity (low / medium / high / critical)
- Event type
- Date range

### Responding to Events

1. **Review** the event details (click on the event)
2. **Assess** if it's a false positive or real threat
3. **Create an Incident** if further investigation is needed (use the "Create Incident" button)
4. **Acknowledge** events you've reviewed

---

## 6. Incident Management

### Creating an Incident

1. Navigate to **Incidents** from the sidebar
2. Click **New Incident**
3. Fill in:
   - **Title** — Brief description of the issue
   - **Severity** — Low / Medium / High / Critical
   - **Summary** — Detailed description
   - **Affected Device** — Link to the relevant device (optional)
4. Click **Create Incident**

[SCREENSHOT: New incident dialog]

### Incident Lifecycle

An incident goes through these stages:

```
Open → Investigating → Mitigated → Closed
```

- **Open** — Newly created, needs attention
- **Investigating** — Someone is actively looking into it
- **Mitigated** — Root cause identified, temporary fix in place
- **Closed** — Fully resolved and documented

### Updating Incident Status

1. Open the incident detail page
2. Change the **Status** dropdown to the new state
3. Add notes about what was done
4. Click **Update**

### AI-Generated Reports

For any incident, you can request an AI-generated analysis:

1. Open the incident detail page
2. Click **Generate Report**
3. The AI agent will:
   - Analyze the incident context
   - Check related telemetry and security events
   - Generate a markdown report with findings and recommendations
4. The report appears in the incident's **Reports** section

[SCREENSHOT: Incident detail with AI-generated report]

---

## 7. AI Agent Console

### What It Does

The AI Agent is your security co-pilot. It can:
- Analyze security incidents and suggest remediation
- Summarize current threat levels and open incidents
- Audit the MQTT broker configuration
- Answer questions about your IoT network

[SCREENSHOT: Agent console with chat interface]

### Using the Agent

1. Navigate to **Agent** from the sidebar
2. Type your question or command in the text area
3. Click **Send** or press Enter
4. The agent will process your request and stream a response

### Example Prompts

| Prompt | What It Does |
|---|---|
| "What is the current risk level?" | Summarizes overall security posture |
| "Show open incidents from the last 24 hours" | Lists recent incidents with severity |
| "Audit the MQTT broker and report findings" | Runs a security audit on broker config |
| "Recommend mitigation for unauthorized publishes" | Suggests security improvements |
| "Summarize telemetry for temp-sensor-001" | Shows device health and readings |

### Audit Trail

Every agent interaction is logged in the `agent_messages` table:
- The prompt you sent
- The agent's response
- Which tools the agent used
- Timestamp and user who initiated the request

This audit trail is available to administrators for compliance and review.

---

## 8. Telegram Bot

### Overview

Sentinel-IoT includes an optional Telegram bot for receiving alerts and querying the system from your phone.

### Setup

1. Create a Telegram bot via [@BotFather](https://t.me/BotFather)
2. Set `TELEGRAM_BOT_TOKEN` in `.env.production`
3. Set `TELEGRAM_ADMIN_CHAT_ID` to your chat ID
4. Start the bot container: `docker compose --profile bot up -d`

### Commands

| Command | Description |
|---|---|
| `/start` | Welcome message and help |
| `/status` | Current system health summary |
| `/incidents` | List open incidents |
| `/devices` | List registered devices |
| `/ask <question>` | Query the AI agent |

### Alerts

The bot automatically sends alerts when:
- A new security event is detected
- An incident is created or changes status
- A device goes offline unexpectedly

[SCREENSHOT: Telegram bot conversation with alerts]

---

## 9. FAQ

### General

**Q: How often does telemetry update?**
A: Devices typically report every 5 seconds. The dashboard updates in real-time.

**Q: What happens when a device goes offline?**
A: Devices that haven't reported in 5 minutes are marked as "offline." You'll see this in the Devices list and on the dashboard.

**Q: Can I add more users?**
A: Yes. Use `php artisan tinker` or create users via the database. Multi-user management UI is planned for a future release.

### Security

**Q: What should I do when I see a security event?**
A: Review the event details. If it's a real threat, create an Incident from the event. If it's a false positive, you can acknowledge it.

**Q: How do I quarantine a suspicious device?**
A: Go to the device detail page and click "Quarantine Device." This flags the device and changes its status.

**Q: Is my data encrypted?**
A: HTTPS encrypts all web traffic. MQTT uses TLS on port 8883. Database connections use SSL in production. Passwords are bcrypt-hashed.

### Troubleshooting

**Q: I can't log in**
A: Verify your email and password. If locked out, reset via `php artisan tinker`: `User::where('email', 'admin@sentinel.local')->update(['password' => Hash::make('new-password')]);`

**Q: Dashboard shows no data**
A: Check that devices are publishing to the correct MQTT topic format: `tenants/default/iot/sensor/{device_id}/telemetry`

**Q: Security events aren't appearing**
A: Check the ingestor is running: `docker compose logs mqtt-ingestor`. Verify MQTT credentials match between device config and `.env.production`.

**Q: AI agent gives generic responses**
A: Ensure you have an API key configured (`OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, or `GEMINI_API_KEY`). Without a key, the agent uses a mock provider.

---

*Generated for Sentinel-IoT Phase 3 — Full Hardening*
