# Sentinel-IoT Deployment Manual v3

**Audience:** DevOps / SysAdmin
**Phase:** 1-3 — Full Hardening

---

## 1. Prerequisites

| Requirement | Minimum | Recommended |
|---|---|---|
| CPU | 2 vCPU | 4 vCPU |
| RAM | 4 GB | 8 GB |
| Disk | 40 GB SSD | 80 GB SSD |
| OS | Ubuntu 22.04+ / Debian 12+ | Ubuntu 24.04 LTS |
| Docker | 24.0+ | 26.0+ |
| Docker Compose | v2.20+ | v2.29+ |
| DNS | A record pointing to VPS IP | — |

**Required access:**
- SSH (key-based auth recommended)
- Root or sudo privileges
- Domain name with DNS managed (for Let's Encrypt TLS)

**Install Docker (Ubuntu):**
```bash
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
# Log out and back in for group change to take effect
docker compose version  # Verify v2.x
```

---

## 2. Architecture Overview

```
                    ┌─────────────┐
    :443 HTTPS ───► │   Caddy      │ (auto-TLS Let's Encrypt, reverse proxy)
                    └──────┬──────┘
                           │ :9000 (FastCGI)
                    ┌──────▼──────┐
                    │  Laravel    │ (PHP-FPM 8.4)
                    │  + Inertia  │
                    └──┬───┬───┬──┘
                       │   │   │
              ┌────────┘   │   └────────┐
              ▼            ▼            ▼
        ┌──────────┐ ┌──────────┐ ┌──────────┐
        │ Postgres │ │ Mosquitto│ │ Ingestor │
        │  :5432   │ │  :1883   │ │ (Python) │
        └──────────┘ └──────────┘ └──────────┘
                            │ :8883 (TLS, external devices)
```

**Services:**

| Service | Container | Port | Purpose |
|---|---|---|---|
| Caddy | sentinel-caddy | 80, 443 | Reverse proxy, auto-TLS |
| Laravel | sentinel-laravel | 9000 (internal) | PHP-FPM application |
| PostgreSQL | sentinel-postgres | 5433 (host) | Database |
| Mosquitto | sentinel-mosquitto | 1883, 8883 | MQTT broker |
| Ingestor | sentinel-mqtt-ingestor | — | Telemetry processor |
| Telegram Bot | sentinel-telegram-bot | — | ChatOps (optional, `--profile bot`) |

**Data flow:**
1. Devices publish telemetry via MQTT (port 1883 or 8883 TLS)
2. Python ingestor subscribes, validates, persists to PostgreSQL
3. Laravel serves the web dashboard via Caddy HTTPS
4. AI agent analyzes incidents and generates reports

---

## 3. Initial Deployment

### 3.1 Clone and configure

```bash
cd /opt
sudo mkdir -p sentinel-iot && sudo chown $USER:$USER sentinel-iot
git clone <your-repo-url> sentinel-iot
cd sentinel-iot
```

### 3.2 Create production environment

```bash
cp .env.production.example .env.production
$EDITOR .env.production
```

**Required changes:**
- `APP_KEY` — Generate: `php artisan key:generate --show` (copy the `base64:...` value)
- `APP_URL` — Your domain: `https://sentinel.yourdomain.com`
- `DOMAIN` — Same domain without protocol
- `ACME_EMAIL` — Your email for Let's Encrypt
- `DB_PASSWORD` — Strong unique password
- `MQTT_PASSWORD` — Strong unique password for device auth
- `MQTT_INGESTOR_PASSWORD` — Strong unique password for ingestor
- All other `CHANGE_ME` fields

### 3.3 Build and start

```bash
# Build the production image and start all services
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
```

### 3.4 Initialize the database

```bash
# Wait for Postgres to be healthy (check: docker compose ps)
docker compose -f docker-compose.yml -f docker-compose.prod.yml \
  exec laravel-app php artisan migrate --force

# Seed demo data (optional)
docker compose -f docker-compose.yml -f docker-compose.prod.yml \
  exec laravel-app php artisan db:seed --force
```

### 3.5 Verify

```bash
# Check all containers are healthy
docker compose -f docker-compose.yml -f docker-compose.prod.yml ps

# Test the API health endpoint
curl -s http://localhost:8080/health
# Expected: "ok"

# Test Laravel health
docker compose -f docker-compose.yml -f docker-compose.prod.yml \
  exec laravel-app php artisan sentinel:health

# Open in browser
open https://sentinel.yourdomain.com
```

**Expected output from `sentinel:health`:**
```
✓  Database               connected (pgsql)
✓  MQTT broker             reachable at mosquitto:1883
⚠  AI provider             no key set (agent will use mock)
ℹ  Devices last 5m         no devices reporting in last 5 min
ℹ  Open incidents           0
```

---

## 4. TLS/HTTPS Configuration

Caddy handles TLS automatically via Let's Encrypt. No manual certificate management needed.

### How it works

1. Caddy reads `DOMAIN` and `ACME_EMAIL` from environment variables
2. On first request, Caddy contacts Let's Encrypt to issue a certificate
3. Certificates auto-renew before expiry
4. HTTP (port 80) automatically redirects to HTTPS (port 443)

### Caddyfile location

`docker/caddy/Caddyfile` — mounted read-only into the Caddy container.

### Security headers (included by default)

- `Strict-Transport-Security` — forces HTTPS for 1 year
- `X-Content-Type-Options: nosniff` — prevents MIME sniffing
- `X-Frame-Options: DENY` — prevents clickjacking
- `Referrer-Policy: strict-origin-when-cross-origin`

### Verify TLS

```bash
curl -I https://sentinel.yourdomain.com 2>&1 | head -5
# Expected: HTTP/2 200, strict-transport-security header present
```

### Troubleshooting TLS

- **Port 80/443 blocked:** Check firewall: `sudo ufw allow 80,443/tcp`
- **DNS not propagated:** Verify: `dig +short sentinel.yourdomain.com` should return your VPS IP
- **Rate limited:** Let's Encrypt has rate limits. Use staging for testing:
  Add `acme_ca https://acme-staging-v02.api.letsencrypt.org/directory` to the Caddyfile global block

---

## 5. Database Backup & Restore

### 5.1 Automated backup

The included script backs up PostgreSQL via `pg_dump` with gzip compression and 30-day retention.

**Manual run:**
```bash
./scripts/backup-db.sh
# Output: [date] Backup complete: ./backups/sentinel-20260629-020000.sql.gz (1.2M)
```

**Set up cron (daily at 2 AM):**
```bash
crontab -e
# Add:
0 2 * * * cd /opt/sentinel-iot && ./scripts/backup-db.sh >> /var/log/sentinel-backup.log 2>&1
```

**Backup location:** `./backups/` (configurable as first argument)

### 5.2 Restore from backup

```bash
./scripts/restore-db.sh ./backups/sentinel-20260629-020000.sql.gz
# Prompts for confirmation before overwriting
```

**After restore, run migrations:**
```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml \
  exec laravel-app php artisan migrate --force
```

### 5.3 Backup verification

Periodically verify backups are restorable:
```bash
# List backups
ls -lh backups/

# Check a backup is valid gzip
gunzip -t backups/sentinel-*.sql.gz && echo "Backup OK"
```

---

## 8. Troubleshooting

### Container won't start

```bash
# Check logs
docker compose -f docker-compose.yml -f docker-compose.prod.yml logs laravel-app
docker compose -f docker-compose.yml -f docker-compose.prod.yml logs postgres

# Common causes:
# - Missing .env.production → copy from .env.production.example
# - Invalid APP_KEY → regenerate with php artisan key:generate
# - Port conflict → check: sudo ss -tlnp | grep -E '80|443|5433'
```

### Database connection refused

```bash
# Check Postgres is healthy
docker compose -f docker-compose.yml -f docker-compose.prod.yml ps postgres

# Check credentials match between .env.production and compose
grep DB_PASSWORD .env.production
grep POSTGRES_PASSWORD docker-compose.yml
```

### MQTT broker not receiving messages

```bash
# Check Mosquitto is running
docker compose -f docker-compose.yml -f docker-compose.prod.yml ps mosquitto

# Check Mosquitto logs
docker compose -f docker-compose.yml -f docker-compose.prod.yml logs mosquitto

# Test publish manually
docker compose -f docker-compose.yml -f docker-compose.prod.yml \
  exec mosquitto mosquitto_pub -h localhost -p 1883 \
  -u sentinel_device -P <your-password> \
  -t "tenants/default/iot/sensor/test/telemetry" -m '{"type":"test"}'

# Check passwordfile exists
ls -la mosquitto/secrets/passwordfile
```

### Build fails

```bash
# Clear Docker build cache
docker builder prune -af

# Rebuild from scratch
docker compose -f docker-compose.yml -f docker-compose.prod.yml build --no-cache

# Check disk space
df -h /var/lib/docker
```

### Caddy TLS issues

```bash
# Check Caddy logs
docker compose -f docker-compose.yml -f docker-compose.prod.yml logs caddy

# Verify DNS
dig +short your-domain.com

# Test from outside
curl -v https://your-domain.com 2>&1 | grep -E 'SSL|certificate|HTTP'
```

### SELinux (RHEL/CentOS)

If containers can't access mounted volumes:
```bash
# Allow Docker to access project files
sudo setsebool -P container_manage_cgroup true
# Or use :z suffix on volume mounts (already applied in compose)
```

### Health check failing

```bash
# Run health check manually
docker compose -f docker-compose.yml -f docker-compose.prod.yml \
  exec laravel-app php artisan sentinel:health

# If "MQTT broker unreachable" — check ingestor container is on same network
docker network inspect sentinel-iot_default
```

### Useful commands

```bash
# Restart a single service
docker compose -f docker-compose.yml -f docker-compose.prod.yml restart laravel-app

# View real-time logs
docker compose -f docker-compose.yml -f docker-compose.prod.yml logs -f laravel-app

# Enter a container shell
docker compose -f docker-compose.yml -f docker-compose.prod.yml exec laravel-app bash

# Check resource usage
docker stats --no-stream
```

---

## 6. Configuration Reference

### Environment Variables (`.env.production`)

| Variable | Required | Description | Example |
|---|---|---|---|
| `APP_KEY` | Yes | Laravel encryption key | `base64:...` (generate with `php artisan key:generate`) |
| `APP_URL` | Yes | Public application URL | `https://sentinel.yourdomain.com` |
| `APP_ENV` | Yes | Environment name | `production` |
| `APP_DEBUG` | Yes | Debug mode | `false` |
| `DOMAIN` | Yes | Caddy domain for TLS | `sentinel.yourdomain.com` |
| `ACME_EMAIL` | Yes | Let's Encrypt email | `admin@yourdomain.com` |
| `DB_CONNECTION` | Yes | Database driver | `pgsql` |
| `DB_HOST` | Yes | Database host | `postgres` |
| `DB_PORT` | Yes | Database port | `5432` |
| `DB_DATABASE` | Yes | Database name | `sentinel_iot` |
| `DB_USERNAME` | Yes | Database user | `sentinel` |
| `DB_PASSWORD` | Yes | Database password | `CHANGE_ME` |
| `SESSION_DRIVER` | Yes | Session storage | `database` |
| `CACHE_STORE` | Yes | Cache backend | `database` |
| `QUEUE_CONNECTION` | Yes | Queue driver | `database` |
| `MQTT_HOST` | Yes | Mosquitto hostname | `mosquitto` |
| `MQTT_PORT` | Yes | Mosquitto port | `1883` |
| `MQTT_USERNAME` | Yes | Device MQTT username | `sentinel_device` |
| `MQTT_PASSWORD` | Yes | Device MQTT password | `CHANGE_ME` |
| `MQTT_INGESTOR_USERNAME` | Yes | Ingestor MQTT user | `sentinel_ingestor` |
| `MQTT_INGESTOR_PASSWORD` | Yes | Ingestor MQTT password | `CHANGE_ME` |
| `TELEGRAM_BOT_TOKEN` | No | Telegram bot API token | `123456:ABC...` |
| `TELEGRAM_ADMIN_CHAT_ID` | No | Admin Telegram chat ID | `123456789` |
| `OPENAI_API_KEY` | No | OpenAI key for AI agent | `sk-...` |
| `ANTHROPIC_API_KEY` | No | Anthropic key for AI agent | `sk-ant-...` |
| `GEMINI_API_KEY` | No | Gemini key for AI agent | `AIza...` |

### Docker Compose Overrides

The production stack uses a two-file compose setup:

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
```

- `docker-compose.yml` — Base services (Postgres, Mosquitto, Ingestor, Telegram bot)
- `docker-compose.prod.yml` — Production overlay (Caddy, FPM, queue worker, scheduler, log rotation)

To add resource limits, create `docker-compose.override.yml`:

```yaml
services:
  laravel-app:
    deploy:
      resources:
        limits:
          memory: 512M
          cpus: '1.0'
```

### Log Rotation

All production containers log to `json-file` driver with rotation:
- **Max size:** 10 MB per file
- **Max files:** 3 per container
- **Total per container:** ~30 MB

Configure via Docker daemon (`/etc/docker/daemon.json`) or per-container in compose.
See `docker/daemon-logging.json` for daemon-level config.

---

## 7. Monitoring & Healthchecks

### Health Endpoints

| Endpoint | Auth | Purpose | Response |
|---|---|---|---|
| `GET /api/health` | None | Liveness probe (load balancer) | `200 {"status":"ok"}` |
| `GET /api/health/detailed` | None | Deep health check | `200/503 {"status":"ok/degraded","checks":{...}}` |
| `:8080/health` (Caddy) | None | Caddy internal check | `200 "ok"` |
| `php artisan sentinel:health` | CLI | Pre-demo readiness | Structured output with DB, MQTT, AI status |

### Docker Container Healthchecks

| Container | Check | Interval |
|---|---|---|
| sentinel-laravel | `php artisan sentinel:health` | 30s |
| sentinel-postgres | `pg_isready` | 10s |
| sentinel-mosquitto | MQTT pub/sub ping | 30s |
| sentinel-queue | `php artisan queue:status` | 60s |

### Uptime Kuma (Recommended)

For external monitoring, deploy [Uptime Kuma](https://github.com/louislam/uptime-kuma):

```bash
docker run -d --restart=always -p 3001:3001 \
  -v uptime-kuma:/app/data --name uptime-kuma \
  louislam/uptime-kuma:1
```

Add monitors for:
- `https://sentinel.yourdomain.com/api/health` (HTTP, 200)
- `https://sentinel.yourdomain.com` (HTTP, 200)
- TCP `your-vps-ip:1883` (MQTT broker)

---

## 9. Upgrade Procedure

### Standard Upgrade

```bash
cd /opt/sentinel-iot

# 1. Backup first
./scripts/backup-db.sh

# 2. Pull latest changes
git pull origin main

# 3. Rebuild and restart
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build

# 4. Run migrations
docker compose -f docker-compose.yml -f docker-compose.prod.yml \
  exec laravel-app php artisan migrate --force

# 5. Clear caches
docker compose -f docker-compose.yml -f docker-compose.prod.yml \
  exec laravel-app php artisan config:cache
docker compose -f docker-compose.yml -f docker-compose.prod.yml \
  exec laravel-app php artisan route:cache
docker compose -f docker-compose.yml -f docker-compose.prod.yml \
  exec laravel-app php artisan event:cache

# 6. Verify
curl -s https://sentinel.yourdomain.com/api/health
docker compose -f docker-compose.yml -f docker-compose.prod.yml ps
```

### Rollback

```bash
cd /opt/sentinel-iot

# 1. Restore database
./scripts/restore-db.sh ./backups/sentinel-<timestamp>.sql.gz

# 2. Checkout previous version
git log --oneline -5  # Find the commit to rollback to
git checkout <previous-commit>

# 3. Rebuild
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build

# 4. Run migrations (if needed)
docker compose -f docker-compose.yml -f docker-compose.prod.yml \
  exec laravel-app php artisan migrate --force

# 5. Return to main
git checkout main
```

---

## Appendix A: CI/CD Pipeline Setup

### GitHub Actions

The CI/CD pipeline (`.github/workflows/ci.yml`) runs on every push to `main` and `develop`:

1. **Lint** — ESLint + TypeScript type check
2. **PHP Test** — Pint style check + Pest test suite
3. **Build** — Vite frontend build
4. **Docker Build** — Production image build (no push on PR)
5. **Deploy** — SSH deploy to VPS (main branch only)

### Required GitHub Secrets

| Secret | Description |
|---|---|
| `DEPLOY_HOST` | VPS IP address or hostname |
| `DEPLOY_USER` | SSH username on VPS |
| `DEPLOY_SSH_KEY` | SSH private key for deployment |

### Setting Up Secrets

```bash
# Generate SSH key pair for deployment
ssh-keygen -t ed25519 -C "github-deploy" -f ~/.ssh/sentinel-deploy
# Add public key to VPS: ~/.ssh/authorized_keys
# Add private key as DEPLOY_SSH_KEY in GitHub repo settings
```

---

## Appendix B: Secret Management

### Validation Script

Before deploying, validate all required secrets are configured:

```bash
./scripts/check-secrets.sh
```

This checks `APP_KEY`, `DB_PASSWORD`, `MQTT_PASSWORD`, and `MQTT_INGESTOR_PASSWORD` are set and not placeholders.

### Best Practices

1. **Never commit `.env.production`** — it's in `.gitignore`
2. **Use `.env.production.example`** as a template — tracked in git
3. **Rotate secrets** periodically:
   - DB password: `ALTER USER sentinel PASSWORD 'new_password';`
   - MQTT password: Update `mosquitto/secrets/passwordfile` with `mosquitto_passwd`
   - APP_KEY: `php artisan key:generate` (invalidates all sessions)
4. **Docker secrets** (Phase 3): For higher security, use Docker secrets or external secret managers

---

## Appendix C: MQTT mTLS Setup

### Overview

Mutual TLS (mTLS) ensures both the broker and device verify each other's identity via X.509 certificates. Sentinel-IoT enforces `require_certificate true` on the TLS listener (port 8883).

### Certificate Generation

```bash
# Generate CA + server cert
./scripts/gen-mqtt-certs.sh

# Generate a device cert for a specific device
./scripts/gen-mqtt-certs.sh esp32-device-001
```

This creates in `mosquitto/certs/`:
- `ca.crt` / `ca.key` — CA certificate and key (keep ca.key secure)
- `server.crt` / `server.key` — Broker certificate
- `device-{id}.crt` / `device-{id}.key` — Per-device certificates

### Device Enrollment

1. Generate a device cert: `./scripts/gen-mqtt-certs.sh <device-id>`
2. Copy to the device: `ca.crt`, `device-{id}.crt`, `device-{id}.key`
3. Configure the device's MQTT client:
   ```
   CA cert: ca.crt
   Client cert: device-{id}.crt
   Client key: device-{id}.key
   Port: 8883
   TLS version: 1.2+
   ```

### Mosquitto Configuration

The 8883 listener in `mosquitto/config/mosquitto.conf`:
```
listener 8883
allow_anonymous false
cafile /mosquitto/certs/ca.crt
certfile /mosquitto/certs/server.crt
keyfile /mosquitto/certs/server.key
tls_version tlsv1.2
require_certificate true
password_file /mosquitto/secrets/passwordfile
```

### Testing mTLS

```bash
# Test with valid device cert
mosquitto_pub -h localhost -p 8883 \
  --cafile mosquitto/certs/ca.crt \
  --cert mosquitto/certs/device-esp32-device-001.crt \
  --key mosquitto/certs/device-esp32-device-001.key \
  -t "tenants/default/iot/sensor/esp32-device-001/telemetry" \
  -m '{"type":"test","value":1}' \
  -u sentinel_device -P <password>

# Test without cert (should fail)
mosquitto_pub -h localhost -p 8883 \
  --cafile mosquitto/certs/ca.crt \
  -t "test" -m "fail" \
  -u sentinel_device -P <password>
# Expected: Connection refused
```

---

## Appendix D: Rate Limiting Configuration

### Login Throttle

```
POST /login → throttle:5,1 (5 attempts per minute per IP)
```

After 5 failed login attempts in 1 minute, the server returns HTTP 429 Too Many Requests.

### API Throttle

```
/api/* routes → throttle:60,1 (60 requests per minute per user/token)
```

### AI Agent Throttle

```
POST /agent/ask → throttle:10,1 (10 prompts per minute)
POST /agent/stream → throttle:10,1 (10 streams per minute)
```

### MQTT Rate Limiter (Ingestor)

The Python ingestor includes a built-in rate limiter:
- **Window:** 10 seconds
- **Threshold:** 50 messages per device topic
- **Cooldown:** 60 seconds between security events
- **Action:** Creates a `publish_flood` security event (severity: high)

### Customizing Limits

To change limits, edit the middleware in route files:
```php
// routes/web.php
Route::post('/login', ...)->middleware('throttle:10,1'); // 10/min

// routes/api.php
Route::middleware(['auth:sanctum', 'throttle:120,1'])... // 120/min
```

For the ingestor, edit `services/mqtt-ingestor/rate_limiter.py`:
```python
_RATE_LIMITER = RateLimiter(window_seconds=10, threshold=100, cooldown_seconds=60)
```

---

## Appendix E: Security Scan & Pentest Checklist

### CI Security Scanning

The GitHub Actions pipeline includes:

1. **Trivy** — Scans the Docker image for CRITICAL and HIGH vulnerabilities
2. **pnpm audit** — Checks npm dependencies for known vulnerabilities

### Running Scans Locally

```bash
# Trivy image scan
docker build -f docker/laravel.prod.Dockerfile -t sentinel-iot:scan .
trivy image --severity CRITICAL,HIGH sentinel-iot:scan

# Dependency audit
pnpm audit --audit-level=high
composer audit
```

### Pentest Checklist

See `docs/pentest-checklist.md` for the full OWASP Top 10 self-assessment covering:
- A01: Broken Access Control
- A02: Cryptographic Failures
- A03: Injection
- A04: Insecure Design
- A05: Security Misconfiguration
- A06: Vulnerable Components
- A07: Authentication Failures
- A08: Data Integrity Failures
- A09: Logging & Monitoring Failures
- A10: SSRF

---

*Generated for Sentinel-IoT Phase 3 — Full Hardening*
