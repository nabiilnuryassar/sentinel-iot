# BAB IV
# IMPLEMENTASI DAN PEMBAHASAN

## SISTEM MONITORING KEAMANAN INTERNET OF THINGS (IoT) BERBASIS WEB MENGGUNAKAN FRAMEWORK LARAVEL DAN REACT

---

## 4.1 Usulan Prosedur Baru

Berdasarkan hasil analisis kebutuhan dan perancangan sistem yang telah diuraikan pada bab-bab sebelumnya, penulis mengusulkan prosedur baru dalam pengelolaan dan pemantauan keamanan perangkat Internet of Things (IoT) melalui sistem berbasis web Sentinel-IoT. Prosedur baru ini dirancang untuk menggantikan pendekatan konvensional yang bersifat manual dan reaktif, menjadi prosedur yang terotomatisasi, terpusat, dan proaktif.

### 4.1.1 Alur Prosedur Baru Sistem Sentinel-IoT

Prosedur baru yang diusulkan mengikuti alur kerja (*workflow*) berikut yang digambarkan dalam bentuk *Activity Diagram*:

```
┌─────────────────────────────────────────────────────────┐
│                    ALUR PROSEDUR BARU                    │
│              Sistem Monitoring Sentinel-IoT              │
└─────────────────────────────────────────────────────────┘

    ┌───────────┐
    │   START   │
    └─────┬─────┘
          │
          ▼
  ╔═══════════════════╗
  ║   1. LOGIN        ║
  ║                   ║
  ║ Pengguna membuka  ║
  ║ halaman login,    ║
  ║ memasukkan email  ║
  ║ dan password,     ║
  ║ kemudian sistem   ║
  ║ memvalidasi       ║
  ║ kredensial        ║
  ╚═════════╤═════════╝
            │
            ▼
      ┌─────────────┐     ┌──────────────┐
      │ Kredensial  │─Tidak─▶ Kembali ke  │
      │  Valid?     │     │  Halaman     │
      └──────┬──────┘     │  Login       │
             │Ya          └──────────────┘
             ▼
  ╔═══════════════════╗
  ║  2. DASHBOARD     ║
  ║                   ║
  ║ Sistem menampilkan║
  ║ ringkasan status: ║
  ║ - Jumlah perangkat║
  ║ - Status online   ║
  ║ - Insiden aktif   ║
  ║ - Event keamanan  ║
  ║ - Grafik telemetry║
  ╚═════════╤═════════╝
            │
            ▼
  ╔═══════════════════╗
  ║ 3. MONITOR        ║
  ║    PERANGKAT      ║
  ║                   ║
  ║ Pengguna memantau ║
  ║ daftar perangkat  ║
  ║ IoT, melihat      ║
  ║ status, data      ║
  ║ telemetry, dan    ║
  ║ kesehatan perangkat║
  ╚═════════╤═════════╝
            │
            ▼
  ╔═══════════════════╗
  ║ 4. DETEKSI        ║
  ║    ANCAMAN        ║
  ║                   ║
  ║ Sistem secara     ║
  ║ otomatis mendeteksi║
  ║ anomali dan       ║
  ║ ancaman keamanan: ║
  ║ - Payload rusak   ║
  ║ - Spoofing        ║
  ║ - Publish flood   ║
  ║ - Akses tidak     ║
  ║   sah             ║
  ╚═════════╤═════════╝
            │
            ▼
  ╔═══════════════════╗
  ║ 5. KELOLA         ║
  ║    INSIDEN        ║
  ║                   ║
  ║ Pengguna membuat, ║
  ║ memperbarui, dan  ║
  ║ menyelesaikan     ║
  ║ insiden keamanan  ║
  ║ berdasarkan event ║
  ║ yang terdeteksi   ║
  ╚═════════╤═════════╝
            │
            ▼
  ╔═══════════════════╗
  ║ 6. HASILKAN       ║
  ║    LAPORAN        ║
  ║                   ║
  ║ Pengguna          ║
  ║ menghasilkan      ║
  ║ laporan keamanan, ║
  ║ baik secara manual║
  ║ maupun melalui    ║
  ║ bantuan AI Agent  ║
  ╚═════════╤═════════╝
            │
            ▼
    ┌───────────┐
    │    END    │
    └───────────┘
```

### 4.1.2 Penjelasan Alur Prosedur

Prosedur baru yang diusulkan terdiri dari enam tahap utama yang membentuk siklus pemantauan keamanan IoT yang berkelanjutan:

1. **Login (Autentikasi)** — Pengguna mengakses sistem melalui peramban web dan melakukan autentikasi menggunakan email dan password. Sistem memvalidasi kredensial melalui mekanisme *Laravel Sanctum* dan menentukan peran (*role*) pengguna (Admin, Operator, atau Viewer) yang menentukan tingkat akses terhadap fitur-fitur sistem.

2. **Dashboard (Ringkasan Operasional)** — Setelah berhasil masuk, pengguna disajikan *dashboard* utama yang menampilkan ringkasan kondisi keamanan secara keseluruhan, meliputi jumlah perangkat terdaftar, perangkat yang sedang *online*, jumlah insiden yang masih terbuka, serta *security event* terkini. *Dashboard* juga menyajikan visualisasi data dalam bentuk grafik dan *chart*.

3. **Monitor Perangkat** — Pengguna dapat memantau seluruh perangkat IoT yang terdaftar dalam sistem, melihat status koneksi (*online/offline/warning*), data telemetry terkini (suhu, kelembaban, level baterai, kekuatan sinyal), serta riwayat aktivitas setiap perangkat.

4. **Deteksi Ancaman** — Sistem secara otomatis dan berkelanjutan melakukan deteksi terhadap berbagai jenis ancaman keamanan, termasuk *malformed payload*, *device spoofing*, *publish flood*, dan akses tidak sah. Deteksi dilakukan oleh komponen *MQTT Ingestor* yang memvalidasi setiap pesan yang masuk dari perangkat IoT.

5. **Kelola Insiden** — Berdasarkan *security event* yang terdeteksi, pengguna (khususnya Operator dan Admin) dapat membuat insiden keamanan baru, menetapkan tingkat keparahan (*severity*), menugaskan penanggung jawab, memperbarui status insiden (*Open → Investigating → Mitigated → Closed*), serta mendokumentasikan proses penanganan.

6. **Hasilkan Laporan** — Pengguna dapat menghasilkan laporan keamanan secara manual atau dengan bantuan *AI Agent* yang menganalisis data insiden, *security event*, dan telemetry untuk menghasilkan laporan analisis beserta rekomendasi mitigasi.

---

## 4.2 Diagram Rancangan Sistem

### 4.2.1 Use Case Diagram

*Use Case Diagram* sistem Sentinel-IoT menggambarkan interaksi antara tiga aktor utama dengan fungsionalitas-fungsionalitas yang disediakan oleh sistem. Berikut adalah deskripsi *Use Case Diagram*:

```
┌─────────────────────────────────────────────────────────────────────┐
│                    Sistem Sentinel-IoT                              │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                                                             │   │
│  │   [UC01] Login                                              │   │
│  │   [UC02] Lihat Dashboard                                    │   │
│  │   [UC03] Kelola Pengguna                                    │   │
│  │   [UC04] Lihat Daftar Perangkat                             │   │
│  │   [UC05] Tambah/Edit/Hapus Perangkat                        │   │
│  │   [UC06] Karantina Perangkat                                │   │
│  │   [UC07] Lihat Detail Perangkat                             │   │
│  │   [UC08] Lihat Security Events                              │   │
│  │   [UC09] Buat Insiden dari Event                            │   │
│  │   [UC10] Kelola Insiden                                     │   │
│  │   [UC11] Gunakan AI Agent                                   │   │
│  │   [UC12] Generate Laporan                                   │   │
│  │   [UC13] Lihat Telemetry                                    │   │
│  │                                                             │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘

    Aktor: Admin                  Aktor: Operator              Aktor: Viewer
    ┌──────────┐                  ┌──────────┐                 ┌──────────┐
    │  Admin   │                  │ Operator │                 │  Viewer  │
    │          │                  │          │                 │          │
    │ Full     │                  │ Monitor  │                 │ Read-    │
    │ Access   │                  │ & Respond│                 │ Only     │
    └────┬─────┘                  └────┬─────┘                 └────┬─────┘
         │                             │                            │
         ├── UC01 Login                ├── UC01 Login               ├── UC01 Login
         ├── UC02 Lihat Dashboard      ├── UC02 Lihat Dashboard     ├── UC02 Lihat Dashboard
         ├── UC03 Kelola Pengguna      ├── UC04 Lihat Perangkat     ├── UC04 Lihat Perangkat
         ├── UC04 Lihat Perangkat      ├── UC05 Tambah/Edit         ├── UC07 Detail Perangkat
         ├── UC05 Tambah/Edit/Hapus    ├── UC06 Karantina           ├── UC08 Lihat Events
         ├── UC06 Karantina            ├── UC07 Detail Perangkat    ├── UC13 Lihat Telemetry
         ├── UC07 Detail Perangkat     ├── UC08 Lihat Events
         ├── UC08 Lihat Events         ├── UC09 Buat Insiden
         ├── UC09 Buat Insiden         ├── UC10 Kelola Insiden
         ├── UC10 Kelola Insiden       ├── UC11 AI Agent
         ├── UC11 AI Agent             ├── UC12 Generate Laporan
         ├── UC12 Generate Laporan     └── UC13 Lihat Telemetry
         └── UC13 Lihat Telemetry
```

**Keterangan Aktor:**

| Aktor | Deskripsi |
|-------|-----------|
| **Admin** | Pengguna dengan akses penuh terhadap seluruh fitur sistem, termasuk manajemen pengguna, konfigurasi sistem, dan seluruh fitur monitoring. |
| **Operator** | Pengguna yang bertanggung jawab atas operasional harian, meliputi pemantauan perangkat, respons terhadap *security event*, pengelolaan insiden, dan penggunaan AI Agent. |
| **Viewer** | Pengguna dengan akses hanya-baca (*read-only*) yang dapat melihat *dashboard*, daftar perangkat, *security event*, dan data telemetry tanpa hak melakukan modifikasi. |

**Keterangan Use Case:**

| Kode | Use Case | Deskripsi |
|------|----------|-----------|
| UC01 | Login | Pengguna melakukan autentikasi dengan email dan password |
| UC02 | Lihat Dashboard | Melihat ringkasan status keamanan dan statistik sistem |
| UC03 | Kelola Pengguna | Menambah, mengubah, menghapus, dan mengatur peran pengguna |
| UC04 | Lihat Daftar Perangkat | Melihat seluruh perangkat IoT beserta statusnya |
| UC05 | Tambah/Edit/Hapus Perangkat | Mengelola data perangkat IoT dalam sistem |
| UC06 | Karantina Perangkat | Mengkarantina perangkat yang terindikasi terkompromi |
| UC07 | Lihat Detail Perangkat | Melihat informasi detail dan telemetry perangkat |
| UC08 | Lihat Security Events | Melihat daftar dan detail *security event* |
| UC09 | Buat Insiden dari Event | Membuat insiden keamanan dari *security event* |
| UC10 | Kelola Insiden | Memperbarui status dan menangani insiden keamanan |
| UC11 | Gunakan AI Agent | Berinteraksi dengan AI Agent untuk analisis keamanan |
| UC12 | Generate Laporan | Menghasilkan laporan keamanan manual atau via AI |
| UC13 | Lihat Telemetry | Melihat data sensor dan telemetry perangkat |

### 4.2.2 Activity Diagram (Alur Utama Sistem)

Berikut adalah *Activity Diagram* yang menggambarkan alur kerja utama sistem Sentinel-IoT:

```
    ┌───────────┐
    │   START   │
    └─────┬─────┘
          │
          ▼
  ┌───────────────┐
  │ Buka halaman  │
  │ login sistem  │
  └───────┬───────┘
          │
          ▼
  ┌───────────────┐
  │ Masukkan      │
  │ email dan     │
  │ password      │
  └───────┬───────┘
          │
          ▼
  ◇ Autentikasi   ─── Gagal ──▶ [Tampilkan pesan error]
  │ Berhasil?                         │
  │ Ya                                ▼
  ▼                            ┌──────────────┐
  ┌───────────────┐            │ Kembali ke   │
  │ Sistem        │            │ halaman login│
  │ memuat        │            └──────────────┘
  │ dashboard     │
  │ sesuai role   │
  └───────┬───────┘
          │
          ▼
  ══════════════════════
  ║  PARALLEL FLOW     ║
  ║                    ║
  ║  ┌──────────────┐  ║
  ║  │ Pantau       │  ║
  ║  │ Dashboard    │  ║
  ║  └──────┬───────┘  ║
  ║         │          ║
  ║         ▼          ║
  ║  ┌──────────────┐  ║
  ║  │ Terima data  │  ║
  ║  │ telemetry    │  ║
  ║  │ real-time    │  ║
  ║  └──────┬───────┘  ║
  ║         │          ║
  ║  ┌──────────────┐  ║
  ║  │ Terima       │  ║
  ║  │ security     │  ║
  ║  │ event        │  ║
  ║  └──────┬───────┘  ║
  ═════════╤═══════════╝
           │
           ▼
  ◇ Ada security ─── Tidak ──▶ [Lanjutkan pemantauan]
  │ event baru?
  │ Ya
  ▼
  ┌───────────────┐
  │ Review event  │
  │ keamanan      │
  └───────┬───────┘
          │
          ▼
  ◇ Perlu buat ─── Tidak ──▶ [Akhiri/tutup event]
  │ insiden?
  │ Ya
  ▼
  ┌───────────────┐
  │ Buat insiden  │
  │ baru          │
  └───────┬───────┘
          │
          ▼
  ┌───────────────┐
  │ Tetapkan      │
  │ severity &    │
  │ assignee      │
  └───────┬───────┘
          │
          ▼
  ┌───────────────┐
  │ Investigasi   │
  │ & Mitigasi    │
  └───────┬───────┘
          │
          ▼
  ◇ Perlu ─── Tidak
  │ AI Agent?
  │ Ya
  ▼
  ┌───────────────┐
  │ Minta AI      │
  │ Agent buat    │
  │ laporan       │
  └───────┬───────┘
          │
          ▼
  ┌───────────────┐
  │ Tutup insiden │
  │ & dokumentasi │
  └───────┬───────┘
          │
          ▼
    ┌───────────┐
    │    END    │
    └───────────┘
```

### 4.2.3 Class Diagram

*Class Diagram* sistem Sentinel-IoT menggambarkan struktur kelas utama beserta atribut, metode, dan relasi antar kelas. Berikut adalah deskripsi lima kelas utama:

```
┌─────────────────────────────────────────────────────────────────┐
│                      CLASS DIAGRAM                              │
│                  Sistem Sentinel-IoT                            │
└─────────────────────────────────────────────────────────────────┘

┌──────────────────────┐       ┌──────────────────────┐
│       User           │       │       Device         │
├──────────────────────┤       ├──────────────────────┤
│ - id: int            │       │ - id: int            │
│ - name: string       │       │ - device_id: string  │
│ - email: string      │       │ - name: string       │
│ - password: string   │       │ - type: string       │
│ - role: enum         │       │ - location: string   │
│ - created_at: timestamp│     │ - status: enum       │
│ - updated_at: timestamp│     │ - last_seen_at: timestamp│
├──────────────────────┤       │ - tenant_id: string  │
│ + login()            │       ├──────────────────────┤
│ + logout()           │       │ + register()         │
│ + updateProfile()    │       │ + update()           │
│ + hasRole(): bool    │       │ + quarantine()       │
│ + isAdmin(): bool    │       │ + releaseQuarantine()│
└──────────┬───────────┘       │ + getTelemetry()     │
           │                   │ + getStatus(): string│
           │ 1                 └──────────┬───────────┘
           │                              │ 1
           │ manages                      │ has
           │ *                            │ *
┌──────────┴───────────┐   ┌──────────────┴───────────┐
│     Incident         │   │    TelemetryLog          │
├──────────────────────┤   ├──────────────────────┤
│ - id: int            │   │ - id: int            │
│ - title: string      │   │ - device_id: int     │
│ - description: text  │   │ - topic: string      │
│ - severity: enum     │   │ - temperature: float │
│ - status: enum       │   │ - humidity: float    │
│ - assigned_to: int   │   │ - battery: float     │
│ - created_at: timestamp│ │ - rssi: int          │
├──────────────────────┤   │ - received_at: timestamp│
│ + create()           │   ├──────────────────────┤
│ + update()           │   │ + getLatest()        │
│ + assign()           │   │ + getByDevice()      │
│ + changeStatus()     │   │ + getAggregates()    │
│ + generateReport()   │   └──────────────────────┘
│ + close()            │
└──────────┬───────────┘
           │ 1
           │ tracks
           │ *
┌──────────┴───────────┐
│   SecurityEvent      │
├──────────────────────┤
│ - id: int            │
│ - event_type: string │
│ - severity: enum     │
│ - topic: string      │
│ - source_client_id: string│
│ - detected_at: timestamp│
├──────────────────────┤
│ + create()           │
│ + getBySeverity()    │
│ + getByType()        │
│ + createIncident()   │
│ + acknowledge()      │
└──────────────────────┘
```

**Keterangan Kelas:**

1. **User** — Kelas yang merepresentasikan pengguna sistem. Memiliki atribut dasar seperti *name*, *email*, *password*, dan *role*. Metode utama meliputi autentikasi (*login/logout*), pengelolaan profil, dan pemeriksaan peran (*hasRole*, *isAdmin*). Kelas User memiliki relasi satu-ke-banyak (*one-to-many*) dengan kelas Incident, karena seorang pengguna dapat ditugaskan menangani banyak insiden.

2. **Device** — Kelas yang merepresentasikan perangkat IoT yang terdaftar dalam sistem. Memiliki atribut identitas (*device_id*, *name*, *type*), lokasi, status koneksi, dan waktu terakhir terlihat (*last_seen_at*). Metode utama meliputi registrasi, pembaruan data, karantina, dan pengambilan data telemetry. Kelas Device memiliki relasi satu-ke-banyak dengan TelemetryLog.

3. **TelemetryLog** — Kelas yang menyimpan data telemetry yang diterima dari perangkat IoT melalui protokol MQTT. Atribut utama mencakup *topic* MQTT, data sensor (*temperature*, *humidity*, *battery*, *rssi*), dan waktu penerimaan data (*received_at*). Kelas ini memiliki relasi banyak-ke-satu (*many-to-one*) dengan kelas Device.

4. **SecurityEvent** — Kelas yang merepresentasikan kejadian keamanan yang terdeteksi oleh sistem. Memiliki atribut *event_type* (seperti *malformed_payload*, *device_spoofing*, *publish_flood*), tingkat keparahan (*severity*), dan sumber kejadian. Metode utama meliputi pembuatan event, penyaringan berdasarkan severity dan tipe, serta pembuatan insiden dari event.

5. **Incident** — Kelas yang merepresentasikan insiden keamanan yang dikelola oleh pengguna. Memiliki atribut *title*, *description*, *severity*, dan *status* yang mengikuti siklus hidup (*Open → Investigating → Mitigated → Closed*). Metode utama meliputi pembuatan insiden, pembaruan status, penugasan (*assign*), dan pembuatan laporan (*generateReport*). Kelas ini memiliki relasi banyak-ke-satu dengan kelas User (sebagai *assignee*) dan relasi satu-ke-banyak dengan kelas SecurityEvent.

---

## 4.3 Rancangan Basis Data

### 4.3.1 Entity Relationship Diagram (ERD)

*Entity Relationship Diagram* (ERD) sistem Sentinel-IoT menggambarkan entitas-entitas utama dalam basis data beserta atribut dan relasi antar entitas. Sistem ini menggunakan *Relational Database Management System* (RDBMS) PostgreSQL sebagai basis data utama.

Berikut adalah deskripsi ERD sistem Sentinel-IoT:

```
┌─────────────────────────────────────────────────────────────────────────┐
│              ENTITY RELATIONSHIP DIAGRAM (ERD)                          │
│                    Sistem Sentinel-IoT                                  │
└─────────────────────────────────────────────────────────────────────────┘

  ┌──────────────┐         ┌──────────────────┐        ┌──────────────────┐
  │    USERS     │         │     DEVICES      │        │ TELEMETRY_LOGS   │
  ├──────────────┤         ├──────────────────┤        ├──────────────────┤
  │ PK id        │◄──┐     │ PK id            │◄──┐    │ PK id            │
  │    name      │   │     │    device_id     │   │    │ FK device_id     │──┐
  │    email     │   │     │    name          │   │    │    topic         │  │
  │    password  │   │     │    type          │   │    │    temperature   │  │
  │    role      │   │     │    location      │   │    │    humidity      │  │
  │    created_at│   │     │    status        │   │    │    battery       │  │
  │    updated_at│   │     │    last_seen_at  │   │    │    rssi          │  │
  └──────┬───────┘   │     │    tenant_id     │   │    │    received_at   │  │
         │           │     └──────────────────┘   │    └──────────────────┘  │
         │           │              │              │              │          │
         │           │              │ 1:N          │              │          │
         │           │              ▼              │              │          │
         │           │     ┌──────────────────┐   │              │          │
         │           │     │ SECURITY_EVENTS  │   │              │          │
         │           │     ├──────────────────┤   │              │          │
         │           │     │ PK id            │   │              │          │
         │           │     │    event_type    │   │              │          │
         │           │     │    severity      │   │              │          │
         │           │     │    topic         │   │              │          │
         │           │     │    source_client │   │              │          │
         │           │     │    detected_at   │   │              │          │
         │           │     └──────────────────┘   │              │          │
         │           │                             │              │          │
         │ 1:N       │                             │              │          │
         ▼           │                             │              │          │
  ┌──────────────────┴─┐                          │              │          │
  │    INCIDENTS       │                          │              │          │
  ├────────────────────┤                          │              │          │
  │ PK id              │                          │              │          │
  │    title           │                          │              │          │
  │    description     │                          │              │          │
  │    severity        │                          │              │          │
  │    status          │                          │              │          │
  │ FK assigned_to ────┼──────────────────────────┘              │          │
  │    created_at      │                                         │          │
  └────────────────────┘                                         │          │
                                                                 │          │
                     ◄───────────────────────────────────────────┘          │
                     (devices.id ◄── telemetry_logs.device_id)             │
                     ◄─────────────────────────────────────────────────────┘
```

**Keterangan Relasi:**

| Relasi | Tipe | Keterangan |
|--------|------|------------|
| Users → Incidents | One-to-Many (1:N) | Satu pengguna dapat ditugaskan menangani banyak insiden |
| Devices → TelemetryLogs | One-to-Many (1:N) | Satu perangkat menghasilkan banyak data telemetry |
| Devices → SecurityEvents | One-to-Many (1:N) | Satu perangkat dapat menghasilkan banyak *security event* |

### 4.3.2 Deskripsi Tabel Basis Data

Sistem Sentinel-IoT menggunakan lima tabel utama dalam basis data PostgreSQL. Berikut adalah deskripsi detail setiap tabel beserta kolom-kolomnya:

#### Tabel 1: `users`

Tabel `users` menyimpan data seluruh pengguna yang terdaftar dalam sistem Sentinel-IoT. Setiap pengguna memiliki peran (*role*) yang menentukan tingkat aksesnya terhadap fitur-fitur sistem.

| No | Nama Kolom | Tipe Data | Constraint | Keterangan |
|----|-----------|-----------|------------|------------|
| 1 | `id` | BIGINT | PRIMARY KEY, AUTO_INCREMENT | Pengidentifikasi unik pengguna |
| 2 | `name` | VARCHAR(255) | NOT NULL | Nama lengkap pengguna |
| 3 | `email` | VARCHAR(255) | NOT NULL, UNIQUE | Alamat email pengguna (digunakan untuk login) |
| 4 | `password` | VARCHAR(255) | NOT NULL | Kata sandi terenkripsi (bcrypt hash) |
| 5 | `role` | ENUM('admin','operator','viewer') | NOT NULL, DEFAULT 'viewer' | Peran pengguna dalam sistem |
| 6 | `created_at` | TIMESTAMP | NOT NULL, DEFAULT CURRENT_TIMESTAMP | Waktu pembuatan akun |
| 7 | `updated_at` | TIMESTAMP | NOT NULL, DEFAULT CURRENT_TIMESTAMP | Waktu pembaruan terakhir data pengguna |

#### Tabel 2: `devices`

Tabel `devices` menyimpan informasi seluruh perangkat IoT yang terdaftar dan dipantau oleh sistem. Setiap perangkat memiliki status yang diperbarui secara otomatis berdasarkan komunikasi terakhir dengan sistem.

| No | Nama Kolom | Tipe Data | Constraint | Keterangan |
|----|-----------|-----------|------------|------------|
| 1 | `id` | BIGINT | PRIMARY KEY, AUTO_INCREMENT | Pengidentifikasi unik perangkat (internal) |
| 2 | `device_id` | VARCHAR(100) | NOT NULL, UNIQUE | Pengidentifikasi perangkat pada MQTT (misal: `temp-sensor-001`) |
| 3 | `name` | VARCHAR(255) | NOT NULL | Nama/nama-nama perangkat |
| 4 | `type` | VARCHAR(100) | NOT NULL | Jenis perangkat (misal: `temperature_sensor`, `door_lock`) |
| 5 | `location` | VARCHAR(255) | NULL | Lokasi fisik pemasangan perangkat |
| 6 | `status` | ENUM('online','offline','warning','quarantined') | NOT NULL, DEFAULT 'offline' | Status koneksi perangkat saat ini |
| 7 | `last_seen_at` | TIMESTAMP | NULL | Waktu terakhir perangkat mengirimkan data |
| 8 | `tenant_id` | VARCHAR(100) | NOT NULL, DEFAULT 'default' | Pengidentifikasi tenant (untuk dukungan multi-tenant) |

#### Tabel 3: `telemetry_logs`

Tabel `telemetry_logs` menyimpan seluruh data telemetry yang diterima dari perangkat IoT melalui protokol MQTT. Data ini mencakup pembacaan sensor seperti suhu, kelembaban, level baterai, dan kekuatan sinyal.

| No | Nama Kolom | Tipe Data | Constraint | Keterangan |
|----|-----------|-----------|------------|------------|
| 1 | `id` | BIGINT | PRIMARY KEY, AUTO_INCREMENT | Pengidentifikasi unik record telemetry |
| 2 | `device_id` | BIGINT | FOREIGN KEY → devices(id), NOT NULL | Rujukan ke tabel perangkat pengirim data |
| 3 | `topic` | VARCHAR(500) | NOT NULL | Topik MQTT tempat data dipublikasikan |
| 4 | `temperature` | DECIMAL(5,2) | NULL | Pembacaan suhu dalam satuan Celsius |
| 5 | `humidity` | DECIMAL(5,2) | NULL | Pembacaan kelembaban dalam satuan persen (%) |
| 6 | `battery` | DECIMAL(5,2) | NULL | Level baterai perangkat dalam satuan persen (%) |
| 7 | `rssi` | INTEGER | NULL | Kekuatan sinyal yang diterima (*Received Signal Strength Indicator*) dalam dBm |
| 8 | `received_at` | TIMESTAMP | NOT NULL, DEFAULT CURRENT_TIMESTAMP | Waktu penerimaan data oleh sistem |

#### Tabel 4: `security_events`

Tabel `security_events` menyimpan catatan seluruh kejadian keamanan yang terdeteksi oleh sistem. Setiap event memiliki tipe kejadian dan tingkat keparahan yang membantu pengguna dalam melakukan analisis dan respons.

| No | Nama Kolom | Tipe Data | Constraint | Keterangan |
|----|-----------|-----------|------------|------------|
| 1 | `id` | BIGINT | PRIMARY KEY, AUTO_INCREMENT | Pengidentifikasi unik *security event* |
| 2 | `event_type` | VARCHAR(100) | NOT NULL | Jenis kejadian (misal: `malformed_payload`, `device_spoofing`, `publish_flood`, `unauthorized_publish`) |
| 3 | `severity` | ENUM('low','medium','high','critical') | NOT NULL | Tingkat keparahan kejadian |
| 4 | `topic` | VARCHAR(500) | NULL | Topik MQTT yang terkait dengan kejadian |
| 5 | `source_client_id` | VARCHAR(255) | NULL | Pengidentifikasi klien MQTT yang menjadi sumber kejadian |
| 6 | `detected_at` | TIMESTAMP | NOT NULL, DEFAULT CURRENT_TIMESTAMP | Waktu deteksi kejadian oleh sistem |

#### Tabel 5: `incidents`

Tabel `incidents` menyimpan data insiden keamanan yang dibuat dan dikelola oleh pengguna sistem. Setiap insiden mengikuti siklus hidup dari status *Open* hingga *Closed*.

| No | Nama Kolom | Tipe Data | Constraint | Keterangan |
|----|-----------|-----------|------------|------------|
| 1 | `id` | BIGINT | PRIMARY KEY, AUTO_INCREMENT | Pengidentifikasi unik insiden |
| 2 | `title` | VARCHAR(255) | NOT NULL | Judul singkat insiden |
| 3 | `description` | TEXT | NULL | Deskripsi detail insiden |
| 4 | `severity` | ENUM('low','medium','high','critical') | NOT NULL, DEFAULT 'medium' | Tingkat keparahan insiden |
| 5 | `status` | ENUM('open','investigating','mitigated','closed') | NOT NULL, DEFAULT 'open' | Status siklus hidup insiden |
| 6 | `assigned_to` | BIGINT | FOREIGN KEY → users(id), NULL | Pengguna yang ditugaskan menangani insiden |
| 7 | `created_at` | TIMESTAMP | NOT NULL, DEFAULT CURRENT_TIMESTAMP | Waktu pembuatan insiden |

### 4.3.3 Relasi Primary Key dan Foreign Key

Hubungan antar tabel diimplementasikan melalui *Primary Key* (PK) dan *Foreign Key* (FK) sebagai berikut:

| Tabel Anak | Kolom FK | Tabel Induk | Kolom PK | Tipe Relasi |
|-----------|----------|-------------|----------|-------------|
| `telemetry_logs` | `device_id` | `devices` | `id` | Many-to-One |
| `incidents` | `assigned_to` | `users` | `id` | Many-to-One |

Penerapan *foreign key constraint* ini memastikan integritas referensial (*referential integrity*) basis data, di mana setiap record pada tabel anak harus merujuk ke record yang valid pada tabel induk. Mekanisme *cascade* dan *restrict* diterapkan sesuai kebutuhan untuk mencegah penghapusan data induk yang masih dirujuk oleh data anak.

---

## 4.4 Rancangan Prototype

Prototype sistem Sentinel-IoT dirancang dengan memperhatikan prinsip *user experience* (UX) yang intuitif dan konsisten. Desain antarmuka menggunakan pendekatan *dashboard-centric* dengan navigasi sidebar yang memungkinkan pengguna beralih antar halaman dengan mudah. Berikut adalah deskripsi prototype setiap halaman dalam sistem:

### 4.4.1 Halaman Login

Halaman login merupakan halaman pertama yang diakses oleh pengguna saat membuka sistem Sentinel-IoT. Halaman ini menampilkan formulir autentikasi yang terdiri dari kolom *email* dan *password*, tombol "*Authenticate*", serta elemen visual berupa logo dan judul sistem. Desain halaman login mengadopsi tampilan *full-screen* dengan latar belakang gelap (*dark theme*) yang konsisten dengan tema keseluruhan sistem. Setelah pengguna memasukkan kredensial dan menekan tombol autentikasi, sistem melakukan validasi melalui *Laravel Sanctum* dan mengarahkan pengguna ke halaman dashboard jika autentikasi berhasil.

[Screenshot: halaman_login.png]

### 4.4.2 Halaman Dashboard

Halaman dashboard merupakan halaman utama yang ditampilkan setelah pengguna berhasil melakukan login. Halaman ini menyajikan ringkasan kondisi keamanan sistem secara komprehensif dalam satu layar. Komponen-komponen utama pada halaman dashboard meliputi:

- **Summary Cards** — Kartu ringkasan di bagian atas yang menampilkan jumlah total perangkat, perangkat *online*, insiden yang terbuka, dan *security event* hari ini.
- **Grafik Telemetry Timeline** — Visualisasi volume pesan per menit selama satu jam terakhir yang menunjukkan aktivitas perangkat IoT secara *real-time*.
- **Grafik Device Health** — Diagram distribusi status perangkat (*online/offline/warning*).
- **Security Score** — Penilaian risiko keamanan saat ini.
- **Live Feed** — *Feed* *security event* secara *real-time* yang dikelompokkan berdasarkan tingkat keparahan.

[Screenshot: halaman_dashboard.png]

### 4.4.3 Halaman Devices (Daftar Perangkat)

Halaman Devices menampilkan daftar seluruh perangkat IoT yang terdaftar dalam sistem. Setiap perangkat ditampilkan dalam bentuk kartu atau baris tabel yang memuat informasi *device_id*, nama perangkat, jenis, lokasi, status koneksi (dengan indikator warna: hijau untuk *online*, merah untuk *offline*, kuning untuk *warning*, dan merah bergaris untuk *quarantined*), serta waktu terakhir terlihat (*last_seen*). Halaman ini dilengkapi dengan fitur pencarian, penyaringan berdasarkan status, dan tombol untuk menambah perangkat baru.

[Screenshot: halaman_devices.png]

### 4.4.4 Halaman Device Detail

Halaman Device Detail menampilkan informasi lengkap mengenai satu perangkat IoT yang dipilih. Halaman ini memuat metadata perangkat secara detail, grafik data telemetry secara *real-time* (suhu, kelembaban, level baterai), riwayat *security event* yang terkait dengan perangkat tersebut, serta kontrol untuk melakukan tindakan *quarantine* terhadap perangkat. Grafik telemetry menggunakan *line chart* yang menampilkan data historis dan diperbarui secara otomatis ketika data baru diterima.

[Screenshot: halaman_device_detail.png]

### 4.4.5 Halaman Security Events

Halaman Security Events menampilkan daftar seluruh kejadian keamanan yang terdeteksi oleh sistem. Setiap event ditampilkan dengan informasi tipe kejadian, tingkat keparahan (dengan *badge* berwarna: hijau untuk *low*, kuning untuk *medium*, oranye untuk *high*, merah untuk *critical*), topik MQTT terkait, *source client ID*, dan waktu deteksi. Halaman ini dilengkapi dengan filter berdasarkan *severity*, tipe event, dan rentang tanggal. Pengguna dapat mengklik setiap event untuk melihat detail dan membuat insiden dari event tersebut.

[Screenshot: halaman_security_events.png]

### 4.4.6 Halaman Incidents

Halaman Incidents menampilkan daftar seluruh insiden keamanan yang dikelola oleh sistem. Setiap insiden ditampilkan dengan judul, tingkat keparahan, status siklus hidup (*Open*, *Investigating*, *Mitigated*, *Closed*), penanggung jawab, dan waktu pembuatan. Halaman ini menyediakan tombol untuk membuat insiden baru (*New Incident*), memperbarui status insiden, serta menghasilkan laporan analisis melalui AI Agent. Detail insiden menampilkan deskripsi lengkap, riwayat perubahan status, dan laporan yang dihasilkan oleh AI.

[Screenshot: halaman_incidents.png]

### 4.4.7 Halaman AI Agent

Halaman AI Agent menyediakan antarmuka konsol percakapan (*chat console*) yang memungkinkan pengguna berinteraksi dengan AI Agent untuk mendapatkan analisis keamanan dan rekomendasi. Pengguna dapat mengetikkan pertanyaan atau perintah dalam kolom teks, dan AI Agent akan memproses permintaan serta menampilkan respons secara *streaming*. Contoh permintaan yang dapat diajukan meliputi analisis tingkat risiko saat ini, daftar insiden terbuka dalam 24 jam terakhir, audit konfigurasi *MQTT broker*, dan rekomendasi mitigasi. Seluruh interaksi dicatat dalam audit trail untuk keperluan kepatuhan dan peninjauan.

[Screenshot: halaman_ai_agent.png]

---

## 4.5 Implementasi Sistem

Bagian ini menjelaskan implementasi aktual sistem Sentinel-IoT yang telah berhasil dibangun dan dijalankan. Setiap fitur diuraikan beserta cara kerja dan bukti implementasi dalam bentuk tangkapan layar (*screenshot*).

### 4.5.1 Implementasi Sistem Autentikasi

Sistem autentikasi Sentinel-IoT diimplementasikan menggunakan *Laravel Sanctum* sebagai mekanisme otentikasi *token-based* untuk REST API. Proses autentikasi bekerja sebagai berikut:

1. Pengguna memasukkan email dan password pada halaman login.
2. *Frontend* React mengirimkan permintaan POST ke endpoint `/api/login` dengan kredensial pengguna.
3. *Backend* Laravel memvalidasi kredensial terhadap data pengguna yang tersimpan dalam basis data (password dienkripsi menggunakan algoritma *bcrypt*).
4. Jika validasi berhasil, sistem menghasilkan *personal access token* melalui Laravel Sanctum dan mengirimkannya ke *frontend*.
5. Token disimpan pada *local storage* peramban dan disertakan dalam setiap permintaan API selanjutnya sebagai *Bearer Token* pada *header* Authorization.
6. Sistem memeriksa peran (*role*) pengguna dan memuat antarmuka sesuai tingkat akses yang dimiliki (Admin, Operator, atau Viewer).

Implementasi *role-based access control* (RBAC) diterapkan melalui *middleware* Laravel yang memeriksa peran pengguna sebelum mengizinkan akses ke endpoint API tertentu.

[Screenshot: implementasi_login.png]

### 4.5.2 Implementasi Dashboard Real-Time

Dashboard Sentinel-IoT diimplementasikan menggunakan React dengan integrasi data *real-time* dari *backend* Laravel. Implementasi dashboard meliputi:

1. **Summary Cards** — Komponen React yang menampilkan ringkasan statistik yang diambil dari endpoint API `/api/dashboard/summary`. Data diperbarui secara periodik menggunakan mekanisme *polling* dengan interval tertentu.

2. **Grafik Telemetry Timeline** — Visualisasi menggunakan *charting library* yang menampilkan volume pesan telemetry per menit selama satu jam terakhir. Data diambil dari endpoint `/api/dashboard/telemetry-timeline`.

3. **Grafik Device Health** — Diagram distribusi status perangkat (*online/offline/warning/quarantined*) yang diambil dari endpoint `/api/dashboard/device-health`.

4. **Security Score** — Komponen yang menampilkan penilaian risiko keamanan berdasarkan analisis *security event* terkini.

5. **Live Feed** — Komponen yang menampilkan *security event* terbaru secara *real-time* dengan indikator warna berdasarkan tingkat keparahan.

[Screenshot: implementasi_dashboard.png]

### 4.5.3 Implementasi Manajemen Perangkat

Fitur manajemen perangkat memungkinkan pengguna untuk mendaftarkan, memperbarui, dan menghapus perangkat IoT dalam sistem. Implementasi meliputi:

1. **Registrasi Perangkat** — Operator dan Admin dapat menambahkan perangkat baru melalui formulir yang mengumpulkan informasi *device_id*, nama, jenis, dan lokasi. Data dikirim ke endpoint API `/api/devices` melalui metode POST.

2. **Daftar Perangkat** — Halaman Devices menampilkan seluruh perangkat yang diambil dari endpoint `/api/devices` dengan dukungan *pagination*, pencarian, dan filter berdasarkan status.

3. **Detail Perangkat** — Halaman detail menampilkan metadata lengkap perangkat beserta grafik telemetry dan riwayat *security event*. Data diambil dari endpoint `/api/devices/{id}` dan `/api/devices/{id}/telemetry`.

4. **Quarantine Perangkat** — Fitur *quarantine* memungkinkan Operator dan Admin untuk mengisolasi perangkat yang terindikasi terkompromi. Saat tombol *quarantine* ditekan, sistem mengirim permintaan POST ke endpoint `/api/devices/{id}/quarantine` yang mengubah status perangkat menjadi *quarantined*.

[Screenshot: implementasi_devices.png]

### 4.5.4 Implementasi Penerimaan Data Telemetry via MQTT

Penerimaan data telemetry diimplementasikan melalui komponen *MQTT Ingestor* yang berjalan sebagai layanan terpisah (*microservice*) dalam arsitektur Docker Compose. Proses implementasi bekerja sebagai berikut:

1. Perangkat IoT (disimulasikan melalui Wokwi atau *script* Python) mempublikasikan data telemetry dalam format JSON ke topik MQTT `tenants/{tenant_id}/iot/sensor/{device_id}/telemetry`.

2. *MQTT Ingestor* (ditulis dalam bahasa Python menggunakan pustaka `paho-mqtt`) berlangganan (*subscribe*) ke topik MQTT yang sesuai.

3. Ketika pesan diterima, *ingestor* melakukan validasi terhadap format JSON dan kelengkapan data. Jika payload tidak valid, sistem mencatat *security event* bertipe *malformed_payload*.

4. Data telemetry yang valid disimpan ke tabel `telemetry_logs` dalam basis data PostgreSQL melalui koneksi langsung menggunakan pustaka `psycopg`.

5. Status perangkat pada tabel `devices` diperbarui (*last_seen_at* dan *status* diubah menjadi *online*).

6. Data terbaru kemudian tersedia untuk ditampilkan pada dashboard dan halaman detail perangkat secara *real-time*.

[Screenshot: implementasi_telemetry.png]

### 4.5.5 Implementasi Deteksi Security Event

Deteksi *security event* diimplementasikan pada komponen *MQTT Ingestor* yang melakukan analisis terhadap setiap pesan MQTT yang masuk. Jenis-jenis deteksi yang diimplementasikan meliputi:

1. **Malformed Payload** — Sistem mendeteksi pesan yang bukan merupakan JSON valid atau yang tidak memiliki *field* yang diperlukan. Ketika terdeteksi, sistem mencatat *security event* dengan tipe `malformed_payload` dan severity `medium`.

2. **Device Spoofing** — Sistem membandingkan *device_id* yang terdapat dalam payload pesan dengan *device_id* yang terkandung dalam topik MQTT. Jika terdapat ketidakcocokan, sistem mencatat *security event* dengan tipe `device_spoofing` dan severity `high`.

3. **Publish Flood** — Sistem melacak jumlah pesan yang diterima dari setiap *client_id* dalam jangka waktu tertentu (10 detik). Jika jumlah pesan melebihi ambang batas (50 pesan), sistem mencatat *security event* dengan tipe `publish_flood` dan severity `high`.

4. **Unauthorized Publish** — Sistem mendeteksi upaya publikasi dari klien yang tidak memiliki kredensial yang valid. *MQTT Broker* (Eclipse Mosquitto) dikonfigurasi dengan autentikasi ketat menggunakan *password file* dan ACL (*Access Control List*).

Setiap *security event* yang terdeteksi disimpan ke tabel `security_events` dan ditampilkan pada halaman Security Events di *frontend*.

[Screenshot: implementasi_security_events.png]

### 4.5.6 Implementasi Manajemen Insiden

Fitur manajemen insiden memungkinkan pengguna untuk membuat, memperbarui, dan menyelesaikan insiden keamanan. Implementasi meliputi:

1. **Pembuatan Insiden** — Operator dan Admin dapat membuat insiden baru melalui formulir yang mengumpulkan judul, deskripsi, tingkat keparahan, dan penanggung jawab. Insiden juga dapat dibuat langsung dari *security event* dengan menekan tombol "*Create Incident*" pada detail event.

2. **Siklus Hidup Insiden** — Setiap insiden mengikuti alur status: `Open` → `Investigating` → `Mitigated` → `Closed`. Pengguna dapat memperbarui status insiden melalui tombol dan *dropdown* pada halaman detail insiden.

3. **Penugasan** — Admin dapat menugaskan insiden kepada Operator tertentu melalui fitur *assign* yang menghubungkan insiden dengan pengguna melalui kolom `assigned_to`.

4. **AI-Generated Report** — Untuk setiap insiden, pengguna dapat meminta analisis dari AI Agent dengan menekan tombol "*Generate Report*". AI Agent akan menganalisis konteks insiden, mengkorelasikan dengan *security event* dan data telemetry terkait, serta menghasilkan laporan dalam format Markdown yang berisi temuan dan rekomendasi mitigasi.

[Screenshot: implementasi_incidents.png]

### 4.5.7 Implementasi AI Agent

AI Agent Sentinel-IoT diimplementasikan sebagai komponen yang terintegrasi langsung ke dalam aplikasi Laravel (*in-process*). Implementasi meliputi:

1. **Antarmuka Konsol** — Halaman AI Agent menyediakan *chat interface* yang memungkinkan pengguna mengirimkan pertanyaan dan menerima respons secara *streaming*.

2. **Prosesing Permintaan** — Ketika pengguna mengirimkan permintaan, *frontend* React mengirimkan pesan ke endpoint API `/api/agent/chat`. *Backend* Laravel memproses permintaan melalui *Laravel AI SDK* yang dapat terhubung ke berbagai penyedia AI (OpenAI, Anthropic, atau Gemini) sesuai konfigurasi.

3. **Fungsi Tool-Use** — AI Agent dilengkapi dengan akses ke berbagai *tool* yang memungkinkannya mengambil data dari basis data sistem, termasuk:
   - Daftar perangkat dan statusnya
   - Data *security event* dan insiden
   - Ringkasan data telemetry
   - Konfigurasi *MQTT broker*

4. **Audit Trail** — Seluruh interaksi dengan AI Agent dicatat dalam tabel `agent_messages` yang menyimpan *prompt*, respons, *tool* yang digunakan, serta metadata waktu dan pengguna.

[Screenshot: implementasi_ai_agent.png]

### 4.5.8 Integrasi Simulator Wokwi

Untuk keperluan pengembangan dan pengujian, sistem Sentinel-IoT terintegrasi dengan *platform* simulasi perangkat keras **Wokwi** (*https://wokwi.com*). Wokwi merupakan *platform* simulator *microcontroller* berbasis web yang memungkinkan simulasi perangkat IoT tanpa memerlukan perangkat keras fisik. Integrasi Wokwi diimplementasikan sebagai berikut:

1. **Simulator Telemetry Sensor** — Proyek Wokwi yang disimulasikan adalah perangkat berbasis ESP32 yang dilengkapi dengan sensor suhu dan kelembaban. *Microcontroller* ESP32 diprogram menggunakan Arduino framework untuk secara periodik membaca data sensor dan mempublikasikannya ke *MQTT broker* melalui protokol MQTT.

2. **Topik MQTT** — Perangkat simulator mempublikasikan data ke topik `tenants/default/iot/sensor/{device_id}/telemetry` dengan format JSON yang berisi *temperature*, *humidity*, *battery*, dan *rssi*.

3. **Skrip Serangan** — Selain simulator sensor normal, tersedia pula skrip-skrip serangan yang disimulasikan untuk menguji fitur deteksi keamanan sistem, meliputi:
   - **Flood Attack** — Skrip yang mempublikasikan volume pesan yang sangat tinggi dalam waktu singkat untuk menguji deteksi *publish flood*.
   - **Spoof Device** — Skrip yang mempublikasikan pesan dengan *device_id* yang tidak sesuai dengan topik untuk menguji deteksi *device spoofing*.
   - **Malformed Payload** — Skrip yang mempublikasikan pesan dengan format JSON yang tidak valid atau data yang tidak lengkap untuk menguji deteksi *malformed payload*.

4. **Multi-Sensor Simulation** — Konfigurasi Wokwi yang memungkinkan simulasi beberapa perangkat sensor secara simultan, masing-masing mengirimkan data ke topik MQTT yang berbeda.

5. **Verifikasi End-to-End** — Integrasi Wokwi memungkinkan pengujian alur data secara *end-to-end*, dari simulasi perangkat keras → publikasi MQTT → penerimaan oleh *MQTT Ingestor* → penyimpanan ke basis data → visualisasi pada dashboard. Hal ini memastikan bahwa seluruh komponen sistem berfungsi dengan benar sebelum diimplementasikan dengan perangkat keras sesungguhnya.

[Screenshot: implementasi_wokwi.png]

### 4.5.9 Ringkasan Implementasi

Tabel berikut merangkum seluruh fitur yang telah berhasil diimplementasikan pada sistem Sentinel-IoT:

| No | Fitur | Status | Teknologi |
|----|-------|--------|-----------|
| 1 | Autentikasi & RBAC | ✅ Terimplementasi | Laravel Sanctum, React |
| 2 | Dashboard Real-Time | ✅ Terimplementasi | React, Recharts, REST API |
| 3 | Manajemen Perangkat | ✅ Terimplementasi | Laravel REST API, React |
| 4 | Penerimaan Telemetry | ✅ Terimplementasi | MQTT, Python Ingestor, PostgreSQL |
| 5 | Deteksi Security Event | ✅ Terimplementasi | MQTT Ingestor (Python) |
| 6 | Manajemen Insiden | ✅ Terimplementasi | Laravel, React |
| 7 | AI Agent | ✅ Terimplementasi | Laravel AI SDK |
| 8 | Integrasi Wokwi | ✅ Terimplementasi | ESP32 Simulator, MQTT |
| 9 | Telegram Bot (Opsional) | ✅ Terimplementasi | Python, Telegram API |
| 10 | Docker Deployment | ✅ Terimplementasi | Docker Compose |

Seluruh fitur yang direncanakan pada tahap analisis kebutuhan telah berhasil diimplementasikan dan diuji menggunakan *platform* simulasi Wokwi. Sistem menunjukkan kinerja yang stabil dalam menerima data telemetry secara *real-time*, mendeteksi berbagai jenis ancaman keamanan, serta menyajikan informasi melalui antarmuka yang responsif dan intuitif.

---
