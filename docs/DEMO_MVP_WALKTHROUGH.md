# Sentinel-IoT — MVP Demo Walkthrough

> **Presenter:** Nabiil Nuryassar — ITB Bina Sarana Global, Semester 4  
> **Date:** 1 Juli 2026  
> **Duration:** ~15 menit  
> **Live URL:** http://localhost:8000

---

## Pre-Demo Checklist

```bash
# 1. Pastikan semua container running
docker compose ps
# Expected: 5 containers, all Up

# 2. Health check
curl -s http://localhost:8000/api/health
# Expected: {"status":"ok"}

# 3. Seed demo data (jika belum)
docker exec sentinel-laravel php artisan db:seed --class=DemoSeeder

# 4. Telegram bot running
docker logs sentinel-telegram-bot --tail 3
```

---

## Demo Flow (11 Steps)

### Step 1: Landing Page
- **URL:** http://localhost:8000
- **Yang ditunjukkan:** Cyberpunk landing page dengan branding Sentinel-IoT
- **Talking point:** "Ini adalah platform monitoring keamanan IoT yang saya buat untuk project kampus"
- **Screenshot:** `demo-screenshots/01-landing.png`

### Step 2: Authentication
- **URL:** http://localhost:8000/login
- **Credential:** `admin@sentinel.local` / `password`
- **Yang ditunjukkan:** Login form, rate limiting (20 attempts/menit)
- **Talking point:** "Menggunakan Laravel Sanctum untuk API token management"
- **Screenshot:** `demo-screenshots/02-login.png`

### Step 3: Dashboard (SOC)
- **URL:** http://localhost:8000/dashboard
- **Yang ditunjukkan:** Summary cards — devices online, security events, open incidents, telemetry chart
- **Talking point:** "Dashboard ini ibarat Security Operations Center — semua monitoring di satu tempat"
- **Screenshot:** `demo-screenshots/03-dashboard.png`

### Step 4: Device Management
- **URL:** http://localhost:8000/devices
- **Yang ditunjukkan:** 5 IoT devices — temp-sensor-001, door-lock-001, power-meter-001, air-quality-001, water-leak-001
- **Talking point:** "5 perangkat virtual yang dijalankan oleh Python simulator, mengirim data via MQTT setiap 2 menit"
- **Screenshot:** `demo-screenshots/04-devices.png`

### Step 5: Device Detail
- **URL:** http://localhost:8000/devices/{id}
- **Yang ditunjukkan:** Metadata perangkat, lokasi, firmware, telemetry terakhir, tombol quarantine
- **Talking point:** "Admin bisa quarantine perangkat yang mencurigakan — langsung memutus koneksi MQTT"
- **Screenshot:** `demo-screenshots/05-device-detail.png`

### Step 6: Security Events
- **URL:** http://localhost:8000/security-events
- **Yang ditunjukkan:** 5 security events — 2 malformed payload, 1 device spoofing, 1 publish flood, 1 unauthorized publish
- **Talking point:** "MQTT Ingestor mendeteksi 4 jenis serangan secara real-time. Setiap event punya severity level"
- **Demo:** Filter by severity, klik event untuk detail
- **Screenshot:** `demo-screenshots/06-security-events.png`

### Step 7: Incident Management
- **URL:** http://localhost:8000/incidents
- **Yang ditunjukkan:** 2 open incidents — unauthorized publish (high) dan malformed payloads (medium)
- **Talking point:** "Insiden di-track dari deteksi sampai resolusi. AI agent bisa generate incident report otomatis"
- **Screenshot:** `demo-screenshots/07-incidents.png`

### Step 8: Telemetry Data
- **URL:** http://localhost:8000/telemetry
- **Yang ditunjukkan:** 150 data points dari 5 devices — temperature, humidity, battery, RSSI
- **Talking point:** "Data sensor real-time. Anomali di sini bisa trigger AI agent untuk analisis"
- **Screenshot:** `demo-screenshots/08-telemetry.png`

### Step 9: AI Agent (ChatOps)
- **URL:** http://localhost:8000/agent
- **Yang ditunjukkan:** Chat interface, ketik pertanyaan, AI memanggil tools
- **Demo script:**
  1. Ketik: "Bagaimana status semua device?"
  2. AI memanggil `GetDeviceStatus` tool
  3. Ketik: "Apakah ada anomali di data sensor terakhir?"
  4. AI memanggil `GetRecentTelemetry` + `AnalyzeAnomaly`
- **Talking point:** "3 AI agents dengan 8 tools. Powered by cx/gpt-5.5 via OpenAI-compatible API. Bisa audit broker, analisis anomali, generate laporan insiden"
- **Screenshot:** `demo-screenshots/09-agent.png`

### Step 10: Telegram Bot
- **URL:** Telegram app → cari bot sentinel
- **Demo script:**
  1. `/status` — ringkasan operasi & risk level
  2. `/devices` — daftar perangkat IoT
  3. `/events` — security events terkini
  4. `/audit` — AI-powered broker audit (tunggu ~30 detik)
- **Talking point:** "7 commands, inline keyboard buttons, 18/18 tests pass. Monitoring bisa dari mana saja via Telegram"

### Step 11: Docker Stack Health
- **Terminal command:**
  ```bash
  docker compose ps
  curl http://localhost:8000/api/health
  docker exec sentinel-laravel php artisan sentinel:health
  ```
- **Talking point:** "5 container Docker, single-server deployment. Health check otomatis"

---

## Architecture Talking Points

```
┌─────────────┐  ┌─────────────┐  ┌─────────────┐
│   Browser    │  │ Telegram Bot│  │ IoT Simulat.│
│  Dashboard   │  │  7 Commands │  │ 5 Devices   │
└──────┬───────┘  └──────┬──────┘  └──────┬───────┘
       │                 │                │
       ▼                 ▼                ▼  MQTT
┌─────────────────────────────────────────────────┐
│           Laravel 13 (AI Agent + API)            │
│           :8000 — OpenAI-compatible               │
├─────────────────────┬───────────────────────────┤
│   MQTT Ingestor     │   PostgreSQL 16           │
│   (Python validator) │   :5433                   │
├─────────────────────┤                           │
│ Eclipse Mosquitto   │                           │
│ :1883               │                           │
└─────────────────────┴───────────────────────────┘
```

---

## Q&A Preparation

| Pertanyaan | Jawaban |
|---|---|
| Kenapa Docker? | Single-server deployment, reproducible, mudah di-manage |
| Kenapa Laravel? | Ecosystem mature, AI agent integration via Laravel AI, Sanctum auth |
| Kenapa AI? | Automatisasi analisis keamanan — admin tidak perlu cek manual |
| Biaya API? | Pakai custom endpoint (localhost:20128), biaya minimal |
| Scaling? | Horizontal: tambah worker container. Vertical: upgrade VPS |
| Keamanan data? | Multi-tenant, rate limiting, ACL, Sanctum tokens |
| Kenapa MQTT? | Standard protocol untuk IoT, lightweight, pub/sub model |

---

## File Locations

| Item | Path |
|---|---|
| HTML Presentation | `docs/demo-presentation.html` |
| Slide PNGs | `/tmp/demo-ppt-slides/slide-01.png` ... `slide-20.png` |
| Demo Screenshots | `public/demo-screenshots/01-landing.png` ... `09-agent.png` |
| Logo | `public/images/sentinel-logo.svg` |
| Playwright capture script | `tests/e2e/capture-demo.mjs` |
| Slide export script | `tests/e2e/export-slides.mjs` |

---

## Post-Demo

```bash
# Stop HTTP server (if still running)
kill $(pgrep -f "python3 -m http.server 8899")

# Clean temp files
rm -rf /tmp/demo-screenshots /tmp/demo-ppt-slides
```
