# Laporan Project 2 — Design Specification

**Project:** Sentinel-IoT (IoT Security Operation Center)
**Institut:** Institut Teknologi dan Bisnis Bina Sarana Global
**Program Studi:** Teknik Informatika — Konsentrasi Software Engineering
**Tanggal:** 30 Juni 2026

---

## 1. Problem Statement

Laporan Project 2 harus disusun sesuai panduan kampus untuk memenuhi tugas mata kuliah Project 2. Konten sudah tersedia di codebase, docs, dan design specs project Sentinel-IoT, tetapi belum terstruktur dalam format laporan akademik yang sesuai panduan.

## 2. Scope

### In Scope
- 11 file markdown (cover sampai daftar pustaka)
- Setiap file siap di-export ke DOCX
- Mapping konten Sentinel-IoT ke struktur laporan kampus
- Elisitasi kebutuhan 3 tahap + final draft
- Diagram UML (Use Case, Activity, Class)
- ERD + struktur tabel database
- Screenshot implementasi (dashboard, device, telemetry)
- Referensi ilmiah (buku, jurnal, website resmi)

### Out of Scope
- Pembuatan file DOCX final (user export sendiri)
- Surat bukti project, kartu bimbingan, CV (user siapkan sendiri)
- Tanda tangan dosen (user urus sendiri)

## 3. File Structure

```
docs/report/
├── 00-cover.md                    # Cover page
├── 01-lembar-pengesahan.md        # Lembar pengesahan (template)
├── 02-kata-pengantar.md           # Kata pengantar
├── 03-daftar-isi.md               # Daftar isi, gambar, tabel, lampiran
├── 04-bab1-pendahuluan.md         # BAB I — Pendahuluan
├── 05-bab2-landasan-teori.md      # BAB II — Landasan Teori
├── 06-bab3-tinjauan-objek.md      # BAB III — Tinjauan Objek
├── 07-bab4-implementasi.md        # BAB IV — Implementasi & Pembahasan
├── 08-bab5-penutup.md             # BAB V — Penutup
├── 09-lampiran.md                 # Lampiran
└── 10-daftar-pustaka.md           # Daftar Pustaka
```

## 4. Content Mapping

### 4.1 BAB I — Pendahuluan

| Section | Sumber | Status |
|---------|--------|--------|
| 1.1 Latar Belakang | PRD, design spec, project context | ✅ Ada |
| 1.2 Rumusan Masalah | Derived dari latar belakang | ✅ Bisa generate |
| 1.3 Batasan Masalah | Design spec scope | ✅ Ada |
| 1.4 Tujuan Penulisan | Project goals | ✅ Ada |
| 1.5 Metode Pengumpulan Data | Observasi + studi pustaka | ✅ Template |
| 1.6 Sistematika Penulisan | Struktur BAB I-V | ✅ Template |

### 4.2 BAB II — Landasan Teori

| Teori | Sumber |
|-------|--------|
| Pengertian Website | Studi pustaka |
| Pengertian Sistem Informasi | Studi pustaka |
| Pengertian Database | Studi pustaka |
| Pengertian Internet | Studi pustaka |
| Pengertian UML | Studi pustaka |
| Pengertian Framework | Studi pustaka |
| Pengertian Bahasa Pemrograman | Studi pustaka |
| Laravel | Dokumentasi resmi |
| React | Dokumentasi resmi |
| PostgreSQL | Dokumentasi resmi |
| MQTT | Dokumentasi resmi |
| ESP32 | Dokumentasi resmi |
| Docker | Dokumentasi resmi |
| IoT (Internet of Things) | Studi pustaka |

### 4.3 BAB III — Tinjauan Objek

| Section | Sumber |
|---------|--------|
| 3.1 Deskripsi Tempat | Fictional: Sentinel-IoT (sistem monitoring IoT) |
| 3.2 Struktur Organisasi | Fictional: 3 role (Admin, Operator, Viewer) |
| 3.3 Sistem Berjalan | UML: Use Case + Activity (current state) |
| 3.4 Masalah | Manual monitoring, no alerting, no audit trail |
| 3.5 Alternatif | Web-based IoT dashboard, automated alerting |
| 3.6 Elisitasi | Derived dari PRD features |

### 4.4 BAB IV — Implementasi

| Section | Sumber |
|---------|--------|
| 4.1 Usulan Prosedur Baru | UML: Use Case + Activity (proposed state) |
| 4.2 Diagram Rancangan | Use Case, Activity, Class, ERD |
| 4.3 Rancangan Basis Data | migrations/ + ERD |
| 4.4 Prototype | Screenshot Figma/implementasi |
| 4.5 Implementasi | Screenshot dashboard, devices, telemetry |

### 4.5 BAB V — Penutup

| Section | Sumber |
|---------|--------|
| 5.1 Kesimpulan | Jawab rumusan masalah BAB I |
| 5.2 Saran | Derived dari analysis gaps |

## 5. Elisitasi Kebutuhan

### Tahap I — Daftar Semua Kebutuhan
| # | Kebutuhan |
|---|-----------|
| 1 | Login admin |
| 2 | Dashboard monitoring |
| 3 | Manajemen device |
| 4 | Telemetry real-time |
| 5 | Security event detection |
| 6 | Incident management |
| 7 | AI agent assistant |
| 8 | Device quarantine |
| 9 | Laporan keamanan |
| 10 | Notifikasi alert |
| 11 | Multi-tenant support |
| 12 | API REST |
| 13 | MQTT integration |
| 14 | Wokwi simulator |
| 15 | Playwright E2E testing |

### Tahap II — Pengelompokkan
| Kategori | Kebutuhan |
|----------|-----------|
| Autentikasi | Login admin, multi-tenant |
| Monitoring | Dashboard, telemetry, security event |
| Manajemen | Device, incident, quarantine |
| Integrasi | MQTT, API REST, Wokwi |
| Pengujian | Playwright E2E |
| AI | Agent assistant |

### Tahap III — Prioritas
| Prioritas | Kebutuhan |
|-----------|-----------|
| Tinggi | Login, dashboard, device, telemetry, MQTT |
| Sedang | Security event, incident, quarantine |
| Rendah | AI agent, API REST, multi-tenant |

### Final Draft
| # | Fitur | Prioritas |
|---|-------|-----------|
| 1 | Login & autentikasi | Tinggi |
| 2 | Dashboard monitoring | Tinggi |
| 3 | Manajemen device | Tinggi |
| 4 | Telemetry real-time | Tinggi |
| 5 | MQTT integration | Tinggi |
| 6 | Security event detection | Sedang |
| 7 | Incident management | Sedang |
| 8 | Device quarantine | Sedang |
| 9 | AI agent assistant | Rendah |
| 10 | Playwright E2E testing | Rendah |

## 6. Diagram Requirements

### UML Diagrams (BAB III + BAB IV)
- Use Case Diagram (current + proposed)
- Activity Diagram (current + proposed)
- Class Diagram (proposed)
- Sequence Diagram (opsional)

### ERD (BAB IV)
- devices
- telemetry_logs
- security_events
- incidents
- incident_reports
- users
- device_policies
- agent_messages
- agent_conversations
- agent_conversation_messages

## 7. Screenshot Requirements

### BAB IV — Implementasi
- [ ] Login page
- [ ] Dashboard (full page)
- [ ] Devices list
- [ ] Device detail + telemetry chart
- [ ] Security events
- [ ] Incidents
- [ ] AI agent chat
- [ ] Wokwi simulator (ESP32 + DHT22)

## 8. Daftar Pustaka

### Buku
- [ ] Roger S. Pressman. Software Engineering: A Practitioner's Approach.
- [ ] Ian Sommerville. Software Engineering.

### Jurnal
- [ ] Cari jurnal terkait IoT security monitoring

### Website Resmi
- [ ] https://laravel.com/docs
- [ ] https://react.dev
- [ ] https://www.postgresql.org/docs
- [ ] https://mqtt.org
- [ ] https://www.espressif.com/en/products/socs/esp32
- [ ] https://docs.docker.com
- [ ] https://tailwindcss.com/docs

## 9. Constraints

- Format sesuai panduan kampus (`docs/report_guide_project.md`)
- Bahasa: Indonesia formal akademik
- Referensi: minimal 5 sumber (buku + jurnal + website)
- Diagram: gunakan PlantUML atau Mermaid untuk consistency
- Screenshot: gunakan screenshot aktual dari implementasi
- Elisitasi: 3 tahap + final draft wajib ada

## 10. Success Criteria

- [ ] Semua 11 file markdown terisi konten
- [ ] Tidak ada placeholder text tersisa
- [ ] Rumusan masalah BAB I ↔ Kesimpulan BAB V match
- [ ] Elisitasi 3 tahap + final draft lengkap
- [ ] Diagram UML + ERD ada
- [ ] Screenshot implementasi ada
- [ ] Daftar pustaka minimal 5 referensi
- [ ] Siap di-export ke DOCX

---

**Approved:** 30 Juni 2026
**Next:** Implementation plan → `docs/plans/2026-06-30-laporan-project2.md`
