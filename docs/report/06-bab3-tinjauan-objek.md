# BAB III
# TINJAUAN OBJEK

## SISTEM MONITORING KEAMANAN INTERNET OF THINGS (IoT) BERBASIS WEB MENGGUNAKAN FRAMEWORK LARAVEL DAN REACT

---

## 3.1 Deskripsi Tempat

Sentinel-IoT merupakan sebuah proyek sistem berbasis web (*web-based system*) yang dikembangkan untuk memantau dan mengelola keamanan perangkat Internet of Things (IoT). Berbeda dengan penelitian pada umumnya yang dilakukan di lokasi fisik seperti perusahaan, pabrik, atau instansi pemerintah, objek penelitian ini berupa sistem perangkat lunak (*software system*) yang berjalan pada infrastruktur *server* dan dapat diakses melalui peramban web (*web browser*).

Sistem ini dikembangkan sebagai solusi atas kebutuhan pemantauan keamanan ekosistem perangkat IoT yang semakin kompleks. Dalam konteks ini, perangkat IoT mencakup berbagai jenis sensor, aktuator, *gateway*, dan perangkat *embedded* yang terhubung ke jaringan internet dan rentan terhadap serangan siber. Sentinel-IoT dirancang untuk menyediakan antarmuka terpusat (*centralized dashboard*) yang memungkinkan pengelola sistem untuk memantau status keamanan seluruh perangkat IoT secara *real-time*, mendeteksi anomali, mengelola insiden keamanan, serta melakukan tindakan mitigasi seperti *quarantine* terhadap perangkat yang terindikasi terkompromi.

Secara teknis, sistem Sentinel-IoT dibangun menggunakan *framework* Laravel pada sisi *backend* (server-side) dan React pada sisi *frontend* (client-side). Arsitektur sistem mengadopsi pola *Representational State Transfer Application Programming Interface* (REST API), di mana *backend* Laravel menyediakan layanan API yang dikonsumsi oleh *frontend* React. Komunikasi data *real-time* antara perangkat IoT dan sistem menggunakan protokol *Message Queuing Telemetry Transport* (MQTT) yang merupakan standar protokol komunikasi ringan untuk perangkat IoT.

Lingkup pengembangan Sentinel-IoT mencakup aspek-aspek berikut:

1. **Autentikasi dan Otorisasi** — Sistem manajemen pengguna dengan mekanisme *login*, *registration*, dan pengaturan hak akses berbasis peran (*role-based access control*).
2. **Pemantauan Perangkat** — Registrasi, pengelolaan, dan pemantauan status perangkat IoT yang terhubung ke sistem.
3. **Pengumpulan Telemetry** — Penerimaan dan penyimpanan data sensor (*telemetry data*) dari perangkat IoT secara periodik melalui protokol MQTT.
4. **Deteksi Keamanan** — Identifikasi dan pencatatan *security event* berdasarkan analisis pola data telemetry dan perilaku perangkat.
5. **Manajemen Insiden** — Pelacakan, penanganan, dan penyelesaian insiden keamanan yang terdeteksi.
6. **Tindakan Mitigasi** — Kemampuan melakukan *quarantine* terhadap perangkat yang terindikasi berbahaya atau terkompromi.

---

## 3.2 Struktur Organisasi

Dalam pengelolaan sistem Sentinel-IoT, terdapat tiga peran utama (*roles*) yang masing-masing memiliki tanggung jawab dan tingkat akses yang berbeda. Struktur organisasi ini diterapkan melalui mekanisme *Role-Based Access Control* (RBAC) untuk memastikan keamanan dan tertib administrasi sistem.

### 3.2.1 Admin (Administrator)

Admin merupakan pengguna dengan tingkat akses tertinggi dalam sistem Sentinel-IoT. Tanggung jawab admin meliputi:

- Mengelola seluruh akun pengguna sistem, termasuk membuat, mengubah, dan menghapus akun pengguna.
- Mengatur dan memodifikasi peran serta hak akses setiap pengguna.
- Mengkonfigurasi parameter sistem secara keseluruhan, termasuk pengaturan integrasi MQTT dan *broker*.
- Mengelola *AI Agent* dan konfigurasi deteksi otomatis.
- Melakukan *maintenance* dan pembaruan sistem.
- Mengakses dan mengunduh seluruh laporan dan log audit sistem.
- Memantau kesehatan dan performa sistem secara keseluruhan.

### 3.2.2 Operator

Operator merupakan pengguna yang bertanggung jawab atas operasional harian pemantauan keamanan IoT. Tanggung jawab operator meliputi:

- Mendaftarkan (*register*) dan mengelola perangkat IoT yang akan dipantau.
- Memantau *dashboard* keamanan secara berkala dan merespons peringatan (*alert*) yang muncul.
- Menganalisis *security event* dan *incident* yang terdeteksi oleh sistem.
- Melakukan tindakan mitigasi, termasuk *quarantine* terhadap perangkat yang mencurigakan.
- Mengelola dan memperbarui data telemetry perangkat.
- Membuat dan mengelola laporan insiden keamanan.
- Mengkonfigurasi parameter pemantauan untuk perangkat-perangkat yang dikelola.

### 3.2.3 Viewer

Viewer merupakan pengguna dengan akses terbatas yang hanya dapat melihat informasi tanpa hak untuk melakukan modifikasi. Tanggung jawab viewer meliputi:

- Melihat *dashboard* keamanan dan status perangkat IoT.
- Melihat daftar *security event* dan *incident* yang tercatat dalam sistem.
- Melihat riwayat dan log aktivitas perangkat.
- Mengunduh laporan yang telah disediakan oleh sistem.

Tabel berikut merangkum pembagian hak akses ketiga peran tersebut:

| Fitur                          | Admin | Operator | Viewer |
|-------------------------------|:-----:|:--------:|:------:|
| Kelola Pengguna               |   ✓   |    ✗     |   ✗    |
| Konfigurasi Sistem            |   ✓   |    ✗     |   ✗    |
| Kelola Perangkat IoT          |   ✓   |    ✓     |   ✗    |
| Pantau Dashboard              |   ✓   |    ✓     |   ✓    |
| Tangani Insiden               |   ✓   |    ✓     |   ✗    |
| Quarantine Perangkat          |   ✓   |    ✓     |   ✗    |
| Kelola Telemetry              |   ✓   |    ✓     |   ✗    |
| Lihat Security Event          |   ✓   |    ✓     |   ✓    |
| Unduh Laporan                 |   ✓   |    ✓     |   ✓    |
| Konfigurasi AI Agent          |   ✓   |    ✗     |   ✗    |

---

## 3.3 Tata Laksana Sistem Berjalan

### 3.3.1 Gambaran Umum Proses Pemantauan Manual

Sebelum dibangunnya sistem Sentinel-IoT, proses pemantauan keamanan perangkat IoT dilakukan secara manual oleh tim operasional. Proses manual ini melibatkan langkah-langkah berikut:

1. **Pengecekan Perangkat Secara Langsung** — Operator mengakses setiap perangkat IoT secara individual melalui antarmuka masing-masing perangkat atau melalui *command-line interface* (CLI) untuk memeriksa status dan konfigurasi keamanan.

2. **Pengumpulan Data Secara Manual** — Operator mengumpulkan data log dan status dari masing-masing perangkat secara terpisah, kemudian mengumpulkannya dalam dokumen spreadsheet atau catatan manual.

3. **Analisis Insiden** — Ketika ditemukan anomali, operator menganalisis secara manual berdasarkan pengalaman dan pengetahuan individu tanpa dukungan sistem deteksi otomatis.

4. **Pelaporan** — Hasil pemantauan dan temuan insiden dicatat dalam laporan tertulis yang disusun secara periodik (harian, mingguan, atau bulanan).

### 3.3.2 Diagram Use Case Sistem Manual

Proses pemantauan manual melibatkan beberapa *use case* utama yang dilakukan oleh pengguna (operator):

**Use Case: Memeriksa Status Perangkat**
- **Aktor:** Operator
- **Deskripsi:** Operator mengakses antarmuka masing-masing perangkat IoT untuk memeriksa apakah perangkat berjalan normal atau mengalami gangguan.
- **Alur:**
  1. Operator membuka koneksi ke perangkat IoT satu per satu.
  2. Operator memeriksa parameter status perangkat (CPU, memori, jaringan, uptime).
  3. Operator mencatat hasil pemeriksaan ke dalam dokumen manual.
  4. Jika ditemukan anomali, operator melanjutkan ke proses analisis.

**Use Case: Mengumpulkan Data Log**
- **Aktor:** Operator
- **Deskripsi:** Operator mengunduh dan mengumpulkan log aktivitas dari setiap perangkat untuk keperluan analisis.
- **Alur:**
  1. Operator mengakses log sistem pada masing-masing perangkat.
  2. Operator mengekspor log ke format teks atau CSV.
  3. Operator menggabungkan log dari berbagai perangkat ke dalam satu dokumen.
  4. Operator melakukan *filtering* dan pencarian secara manual.

**Use Case: Menangani Insiden Keamanan**
- **Aktor:** Operator, Admin
- **Deskripsi:** Ketika ditemukan indikasi serangan atau anomali keamanan, operator melakukan penanganan insiden.
- **Alur:**
  1. Operator mendeteksi adanya aktivitas mencurigakan dari log atau pemantauan langsung.
  2. Operator melaporkan temuan kepada admin.
  3. Admin dan operator melakukan analisis bersama.
  4. Tindakan mitigasi dilakukan secara manual (misalnya: mematikan perangkat, memblokir IP, memperbarui konfigurasi).
  5. Insiden dicatat dalam laporan manual.

### 3.3.3 Diagram Aktivitas Proses Pemantauan Manual

Proses pemantauan manual secara keseluruhan dapat digambarkan dalam diagram aktivitas (*activity diagram*) sebagai berikut:

```
[Mulai]
    │
    ▼
[Operator Login ke Sistem Perangkat]
    │
    ▼
[Periksa Status Perangkat Satu per Satu] ◄──────────────────┐
    │                                                         │
    ▼                                                         │
{Status Normal?}                                              │
    │              │                                          │
   Ya             Tidak                                       │
    │              │                                          │
    ▼              ▼                                          │
[Catat        [Analisis Anomali]                              │
 Status]           │                                          │
    │              ▼                                          │
    │         {Serius?}                                       │
    │           │       │                                    │
    │          Ya      Tidak                                  │
    │           │       │                                    │
    │           ▼       ▼                                    │
    │      [Laporkan  [Catat &                               │
    │       ke Admin]  Monitor] ─────────────────────────────┘
    │           │
    │           ▼
    │      [Lakukan Mitigasi Manual]
    │           │
    │           ▼
    │      [Catat Insiden]
    │           │
    ├───────────┘
    ▼
{Masih Ada Perangkat Lain?}
    │              │
   Ya             Tidak
    │              │
    ▼              ▼
 [Ulangi]    [Susun Laporan]
                │
                ▼
            [Selesai]
```

---

## 3.4 Masalah yang Dihadapi

Berdasarkan analisis terhadap proses pemantauan keamanan perangkat IoT yang berjalan secara manual, teridentifikasi beberapa permasalahan utama yang menjadi dasar pengembangan sistem Sentinel-IoT:

### 3.4.1 Respon Terhadap Insiden yang Lambat

Proses pemantauan manual mengharuskan operator untuk memeriksa setiap perangkat secara satu per satu. Dalam lingkungan dengan puluhan hingga ratusan perangkat IoT, proses ini memakan waktu yang sangat lama. Akibatnya, ketika terjadi insiden keamanan, waktu deteksi dan respons menjadi sangat lambat. Serangan yang seharusnya dapat ditangani dalam hitungan menit justru baru terdeteksi setelah berjam-jam bahkan berhari-hari, sehingga potensi kerugian dan kerusakan menjadi semakin besar.

### 3.4.2 Tidak Adanya Pemantauan Real-Time

Sistem manual tidak mampu memberikan gambaran status keamanan secara *real-time*. Data yang diperoleh operator bersifat *point-in-time*, yaitu hanya merepresentasikan kondisi perangkat pada saat pemeriksaan dilakukan. Kondisi ini menciptakan *blind spot* di antara interval pemeriksaan, di mana serangan atau anomali dapat terjadi tanpa terdeteksi.

### 3.4.3 Tidak Adanya Mekanisme Peringatan Otomatis (*Alerting*)

Tanpa sistem terkomputerisasi, tidak tersedia mekanisme peringatan otomatis yang dapat memberitahukan operator ketika parameter keamanan perangkat melampaui ambang batas (*threshold*) yang telah ditentukan. Operator sepenuhnya bergantung pada kemampuan observasi manual yang rentan terhadap kelelahan (*fatigue*) dan kesalahan manusia (*human error*).

### 3.4.4 Tidak Adanya Jejak Audit (*Audit Trail*)

Dalam proses manual, pencatatan tindakan yang dilakukan operator terhadap perangkat tidak tersentralisasi dan tidak terstandardisasi. Ketika diperlukan investigasi atas suatu insiden, sulit untuk menelusuri kronologi kejadian dan tindakan yang telah diambil. Ketiadaan *audit trail* juga menyulitkan proses evaluasi dan perbaikan prosedur keamanan.

### 3.4.5 Data Tersebar dan Tidak Terintegrasi

Data log dan status perangkat tersimpan di berbagai lokasi yang terpisah tanpa integrasi. Operator harus membuka dan memeriksa banyak sumber data secara manual untuk mendapatkan gambaran lengkap mengenai kondisi keamanan ekosistem IoT. Kondisi ini menghambat kemampuan untuk melakukan analisis korelasi antar perangkat dan mendeteksi pola serangan yang kompleks.

### 3.4.6 Ketergantungan pada Keahlian Individu

Proses analisis keamanan dalam pendekatan manual sangat bergantung pada pengetahuan dan pengalaman operator individu. Ketika operator yang berpengalaman tidak tersedia (misalnya: cuti, sakit, atau keluar dari organisasi), kemampuan pemantauan dan deteksi ancaman menurun secara signifikan.

---

## 3.5 Alternatif Pemecahan Masalah

Berdasarkan permasalahan yang telah diidentifikasi pada bagian sebelumnya, berikut disajikan alternatif pemecahan masalah yang diusulkan melalui pengembangan sistem Sentinel-IoT:

### 3.5.1 Dashboard Keamanan Berbasis Web

Sistem Sentinel-IoT menyediakan *dashboard* keamanan berbasis web yang dapat diakses melalui peramban (*browser*) dari mana saja dan kapan saja. *dashboard* menampilkan ringkasan status keamanan seluruh perangkat IoT dalam satu antarmuka terpadu, termasuk:

- Jumlah total perangkat yang terdaftar dan statusnya (aktif, tidak aktif, *quarantined*).
- Ringkasan *security event* berdasarkan tingkat keparahan (*severity*).
- Daftar insiden keamanan yang sedang berlangsung dan status penanganannya.
- Visualisasi data telemetry dalam bentuk grafik dan diagram.

Dengan adanya *dashboard* terpusat, operator tidak perlu lagi mengakses perangkat satu per satu, sehingga efisiensi pemantauan meningkat secara signifikan.

### 3.5.2 Sistem Peringatan Otomatis (*Automated Alerting*)

Sentinel-IoT dilengkapi dengan mekanisme deteksi dan peringatan otomatis yang berjalan secara kontinu di *backend*. Sistem ini memantau data telemetry yang masuk dari perangkat IoT dan membandingkannya dengan ambang batas keamanan yang telah dikonfigurasi. Ketika terdeteksi anomali atau pelanggaran keamanan, sistem secara otomatis:

- Membuat *security event* yang tercatat dalam basis data.
- Mengirimkan notifikasi kepada operator dan admin melalui *in-app notification*.
- Meningkatkan (*escalation*) tingkat keparahan insiden jika anomali berlanjut.

Mekanisme ini menghilangkan ketergantungan pada observasi manual dan memastikan bahwa setiap potensi ancaman terdeteksi dan ditangani secara tepat waktu.

### 3.5.3 Pemantauan Real-Time melalui Protokol MQTT

Sistem Sentinel-IoT mengintegrasikan protokol MQTT untuk menerima data telemetry dari perangkat IoT secara *real-time*. MQTT merupakan protokol *publish-subscribe* yang ringan dan efisien, dirancang khusus untuk komunikasi perangkat IoT dengan *bandwidth* dan sumber daya terbatas. Melalui integrasi ini:

- Data telemetry perangkat diterima dan diproses secara *real-time* oleh sistem.
- Status perangkat diperbarui secara otomatis berdasarkan *heartbeat* dan data yang masuk.
- Operator dapat memantau perubahan kondisi perangkat secara langsung tanpa perlu melakukan *refresh* manual.

### 3.5.4 Sistem Manajemen Insiden Terintegrasi

Sentinel-IoT menyediakan modul manajemen insiden yang memungkinkan pelacakan insiden keamanan dari tahap deteksi hingga penyelesaian. Setiap insiden tercatat dengan informasi lengkap meliputi:

- Waktu dan sumber deteksi.
- Perangkat yang terdampak.
- Jenis dan tingkat keparahan insiden.
- Riwayat tindakan yang diambil untuk menangani insiden.
- Status penyelesaian insiden.

Modul ini memastikan bahwa seluruh proses penanganan insiden terdokumentasi dengan baik dan dapat ditelusuri (*audit trail*).

### 3.5.5 Fitur Quarantine Perangkat

Sentinel-IoT menyediakan fitur *quarantine* yang memungkinkan operator untuk mengisolasi perangkat yang terindikasi terkompromi dari jaringan. Ketika suatuu perangkat dikarantina:

- Perangkat ditandai dengan status *quarantined* dalam sistem.
- Data telemetry dari perangkat tetap dicatat untuk keperluan analisis forensik.
- Perangkat dapat diaktifkan kembali setelah dilakukan verifikasi dan perbaikan keamanan.

### 3.5.6 Jejak Audit (*Audit Trail*) Terkomputerisasi

Setiap tindakan yang dilakukan oleh pengguna dalam sistem Sentinel-IoT tercatat secara otomatis dalam log audit. Informasi yang tercatat meliputi identitas pengguna, waktu tindakan, jenis tindakan, dan objek yang terdampak. Log audit ini tersimpan secara permanen dan dapat diakses oleh admin untuk keperluan investigasi dan evaluasi.

---

## 3.6 Elisitasi Kebutuhan (*Requirements Elicitation*)

Proses elisitasi kebutuhan (*requirements elicitation*) dilakukan untuk mengidentifikasi, menganalisis, dan mendokumentasikan kebutuhan fungsional dan non-fungsional sistem Sentinel-IoT. Proses ini dilaksanakan dalam tiga tahap (*three-stage elicitation*) yang diikuti oleh penyusunan *final draft* kebutuhan.

### 3.6.1 Tahap I — Identifikasi Seluruh Kebutuhan

Pada tahap pertama, dilakukan identifikasi menyeluruh terhadap seluruh kebutuhan sistem berdasarkan analisis permasalahan, studi literatur, dan tinjauan terhadap sistem sejenis. Berikut adalah 15 (*fifteen*) kebutuhan sistem yang teridentifikasi:

| No. | ID     | Kebutuhan                                                    |
|-----|--------|--------------------------------------------------------------|
| 1   | REQ-01 | Sistem harus menyediakan mekanisme autentikasi pengguna (*login*) yang aman |
| 2   | REQ-02 | Sistem harus menyediakan fitur registrasi akun pengguna baru  |
| 3   | REQ-03 | Sistem harus menyediakan *dashboard* keamanan yang menampilkan ringkasan status IoT |
| 4   | REQ-04 | Sistem harus menyediakan fitur registrasi dan pengelolaan perangkat IoT |
| 5   | REQ-05 | Sistem harus dapat menerima dan menyimpan data telemetry perangkat secara *real-time* |
| 6   | REQ-06 | Sistem harus dapat mendeteksi dan mencatat *security event* berdasarkan anomali data |
| 7   | REQ-07 | Sistem harus menyediakan fitur manajemen insiden keamanan (*incident management*) |
| 8   | REQ-08 | Sistem harus menyediakan fitur *quarantine* untuk mengisolasi perangkat terkompromi |
| 9   | REQ-09 | Sistem harus terintegrasi dengan protokol MQTT untuk komunikasi dengan perangkat IoT |
| 10  | REQ-10 | Sistem harus menyediakan antarmuka API REST untuk integrasi dengan sistem eksternal |
| 11  | REQ-11 | Sistem harus menyediakan fitur manajemen pengguna dan pengaturan peran (*role*) oleh admin |
| 12  | REQ-12 | Sistem harus menyediakan fitur AI Agent untuk analisis keamanan berbasis kecerdasan buatan |
| 13  | REQ-13 | Sistem harus mendukung multi-tenant untuk pengelolaan beberapa organisasi |
| 14  | REQ-14 | Sistem harus memiliki dokumentasi pengujian (*testing documentation*) yang lengkap |
| 15  | REQ-15 | Sistem harus menyediakan mekanisme log audit untuk setiap aktivitas pengguna |

### 3.6.2 Tahap II — Pengelompokan Kebutuhan ke dalam Kategori

Pada tahap kedua, 15 kebutuhan yang telah teridentifikasi dikelompokkan ke dalam enam kategori fungsional berdasarkan kesamaan domain dan fungsionalitas:

**Kategori 1: Autentikasi dan Manajemen Pengguna (Authentication & User Management)**

| No. | ID     | Kebutuhan                                                    |
|-----|--------|--------------------------------------------------------------|
| 1   | REQ-01 | Autentikasi pengguna (*login*) yang aman                     |
| 2   | REQ-02 | Registrasi akun pengguna baru                                |
| 3   | REQ-11 | Manajemen pengguna dan pengaturan peran oleh admin           |
| 4   | REQ-13 | Dukungan multi-tenant untuk beberapa organisasi              |

**Kategori 2: Pemantauan dan Dashboard (Monitoring & Dashboard)**

| No. | ID     | Kebutuhan                                                    |
|-----|--------|--------------------------------------------------------------|
| 1   | REQ-03 | *Dashboard* keamanan ringkasan status IoT                    |
| 2   | REQ-05 | Penerimaan dan penyimpanan data telemetry *real-time*        |
| 3   | REQ-15 | Mekanisme log audit untuk aktivitas pengguna                 |

**Kategori 3: Manajemen Perangkat dan Insiden (Device & Incident Management)**

| No. | ID     | Kebutuhan                                                    |
|-----|--------|--------------------------------------------------------------|
| 1   | REQ-04 | Registrasi dan pengelolaan perangkat IoT                     |
| 2   | REQ-06 | Deteksi dan pencatatan *security event*                      |
| 3   | REQ-07 | Manajemen insiden keamanan                                   |
| 4   | REQ-08 | Fitur *quarantine* perangkat terkompromi                      |

**Kategori 4: Integrasi dan Protokol (Integration & Protocol)**

| No. | ID     | Kebutuhan                                                    |
|-----|--------|--------------------------------------------------------------|
| 1   | REQ-09 | Integrasi protokol MQTT                                      |
| 2   | REQ-10 | Antarmuka API REST untuk integrasi eksternal                 |

**Kategori 5: Pengujian dan Dokumentasi (Testing & Documentation)**

| No. | ID     | Kebutuhan                                                    |
|-----|--------|--------------------------------------------------------------|
| 1   | REQ-14 | Dokumentasi pengujian yang lengkap                           |

**Kategori 6: Kecerdasan Buatan (Artificial Intelligence)**

| No. | ID     | Kebutuhan                                                    |
|-----|--------|--------------------------------------------------------------|
| 1   | REQ-12 | AI Agent untuk analisis keamanan berbasis kecerdasan buatan  |

### 3.6.3 Tahap III — Penentuan Prioritas Kebutuhan

Pada tahap ketiga, kebutuhan-kebutuhan yang telah dikelompokkan diberikan tingkat prioritas berdasarkan urgensi, dampak terhadap fungsi inti sistem, dan ketergantungan antar fitur (*dependency*). Penentuan prioritas menggunakan tiga tingkatan: **Tinggi** (*High*), **Sedang** (*Medium*), dan **Rendah** (*Low*).

**Prioritas Tinggi (*High Priority*)**

Kebutuhan dengan prioritas tinggi merupakan fitur-fitur inti yang harus ada agar sistem dapat berfungsi sebagaimana mestinya (*minimum viable product*):

| No. | ID     | Kebutuhan                                        | Alasan Prioritas                              |
|-----|--------|--------------------------------------------------|-----------------------------------------------|
| 1   | REQ-01 | Autentikasi pengguna (*login*)                   | Dasar keamanan sistem; tanpa autentikasi, sistem tidak dapat diakses secara aman |
| 2   | REQ-03 | *Dashboard* keamanan                              | Fitur utama yang menjadi antarmuka inti pemantauan |
| 3   | REQ-04 | Registrasi dan pengelolaan perangkat IoT         | Tanpa perangkat terdaftar, tidak ada data yang dipantau |
| 4   | REQ-05 | Penerimaan data telemetry *real-time*            | Data telemetry merupakan sumber informasi utama untuk deteksi anomali |
| 5   | REQ-09 | Integrasi protokol MQTT                          | Protokol komunikasi utama antara perangkat IoT dan sistem |

**Prioritas Sedang (*Medium Priority*)**

Kebutuhan dengan prioritas sedang merupakan fitur-fitur pendukung yang sangat penting untuk operasional keamanan namun dapat dikembangkan setelah fitur inti selesai:

| No. | ID     | Kebutuhan                                        | Alasan Prioritas                              |
|-----|--------|--------------------------------------------------|-----------------------------------------------|
| 1   | REQ-06 | Deteksi dan pencatatan *security event*          | Penting untuk deteksi ancaman namun memerlukan data telemetry terlebih dahulu |
| 2   | REQ-07 | Manajemen insiden keamanan                       | Memerlukan *security event* sebagai input      |
| 3   | REQ-08 | Fitur *quarantine* perangkat                     | Tindakan mitigasi yang kritis namun memerlukan deteksi insiden terlebih dahulu |

**Prioritas Rendah (*Low Priority*)**

Kebutuhan dengan prioritas rendah merupakan fitur-fitur tambahan (*nice-to-have*) yang dapat dikembangkan pada fase selanjutnya:

| No. | ID     | Kebutuhan                                        | Alasan Prioritas                              |
|-----|--------|--------------------------------------------------|-----------------------------------------------|
| 1   | REQ-12 | AI Agent untuk analisis keamanan                 | Fitur lanjutan yang memerlukan infrastruktur AI dan dataset yang memadai |
| 2   | REQ-10 | Antarmuka API REST                               | Diperlukan untuk integrasi eksternal namun tidak mendesak untuk fungsi inti |
| 3   | REQ-13 | Dukungan multi-tenant                            | Fitur skalabilitas yang dapat ditambahkan pada fase pengembangan selanjutnya |

### 3.6.4 Final Draft — Fitur Sistem

Berdasarkan hasil tiga tahap elisitasi di atas, disusun *final draft* yang memuat 10 (*sepuluh*) fitur utama sistem Sentinel-IoT beserta prioritas dan deskripsi masing-masing:

| No. | Fitur                          | Prioritas | Deskripsi                                                            |
|-----|--------------------------------|:---------:|----------------------------------------------------------------------|
| 1   | Autentikasi & Manajemen User   | Tinggi    | Sistem *login*, *register*, dan manajemen akun pengguna dengan role-based access control (Admin, Operator, Viewer) |
| 2   | Dashboard Keamanan IoT         | Tinggi    | *Dashboard* utama yang menampilkan ringkasan status perangkat, statistik *security event*, dan metrik keamanan secara *real-time* |
| 3   | Manajemen Perangkat IoT        | Tinggi    | Fitur registrasi, pengeditan, penghapusan, dan pemantauan status perangkat IoT yang terhubung ke sistem |
| 4   | Penerimaan Data Telemetry      | Tinggi    | Penerimaan, penyimpanan, dan visualisasi data sensor dari perangkat IoT melalui protokol MQTT |
| 5   | Integrasi Protokol MQTT        | Tinggi    | Konfigurasi dan pengelolaan koneksi ke *MQTT broker* untuk komunikasi *real-time* dengan perangkat IoT |
| 6   | Deteksi Security Event         | Sedang    | Pendeteksian otomatis anomali keamanan berdasarkan analisis data telemetry dan pola perilaku perangkat |
| 7   | Manajemen Insiden              | Sedang    | Pelacakan dan pengelolaan siklus hidup insiden keamanan dari deteksi hingga penyelesaian |
| 8   | Quarantine Perangkat            | Sedang    | Fitur isolasi perangkat yang terindikasi terkompromi untuk mencegah penyebaran ancaman |
| 9   | AI Agent Analisis Keamanan     | Rendah    | Agen berbasis kecerdasan buatan untuk analisis pola serangan dan rekomendasi mitigasi otomatis |
| 10  | API REST & Multi-Tenant        | Rendah    | Antarmuka API RESTful untuk integrasi dengan sistem eksternal serta dukungan multi-organisasi |

---

> **Catatan:** Seluruh kebutuhan dan fitur yang tercantum dalam dokumen elisitasi ini akan menjadi landasan dalam proses perancangan (*design*) dan pengembangan (*development*) sistem Sentinel-IoT pada bab-bab selanjutnya.

---

*Halaman ini merupakan bagian dari laporan penelitian sistem "SISTEM MONITORING KEAMANAN INTERNET OF THINGS (IoT) BERBASIS WEB MENGGUNAKAN FRAMEWORK LARAVEL DAN REACT".*
