# Laporan Project 2 — Implementation Plan

> **For Hermes:** Use subagent-driven-development skill to implement this plan task-by-task.

**Goal:** Generate 11 markdown files for Laporan Project 2 (Sentinel-IoT) sesuai panduan kampus ITB Bina Sarana Global.

**Architecture:** Each BAB is a standalone markdown file that can be exported to DOCX. Content is derived from existing codebase, docs, and design specs.

**Tech Stack:** Markdown, PlantUML/Mermaid diagrams, screenshots from running app

---

## Task 1: Create folder structure

**Objective:** Create `docs/report/` directory

**Files:**
- Create: `docs/report/` (directory)

**Step 1: Create directory**

```bash
mkdir -p /forge/projects/sentinel-iot/docs/report
```

**Step 2: Verify**

```bash
ls -la /forge/projects/sentinel-iot/docs/report/
```

Expected: empty directory exists

**Step 3: Commit**

```bash
git add docs/report/
git commit -m "docs: create report folder structure"
```

---

## Task 2: Write 00-cover.md

**Objective:** Create cover page with project title and author info

**Files:**
- Create: `docs/report/00-cover.md`

**Step 1: Write file**

```markdown
# SISTEM MONITORING KEAMANAN INTERNET OF THINGS (IoT) BERBASIS WEB MENGGUNAKAN FRAMEWORK LARAVEL DAN REACT

---

Disusun Oleh:

**Nabiil Nuryassar**
**(NIM: ________)**

Program Studi Teknik Informatika
Konsentrasi Software Engineering

Institut Teknologi dan Bisnis Bina Sarana Global

Tangerang
2026
```

**Step 2: Verify**

```bash
cat docs/report/00-cover.md
```

Expected: cover content displayed

**Step 3: Commit**

```bash
git add docs/report/00-cover.md
git commit -m "docs: add report cover page"
```

---

## Task 3: Write 01-lembar-pengesahan.md

**Objective:** Create approval page template

**Files:**
- Create: `docs/report/01-lembar-pengesahan.md`

**Step 1: Write file**

```markdown
# LEMBAR PENGESAHAN

---

**SISTEM MONITORING KEAMANAN INTERNET OF THINGS (IoT) BERBASIS WEB MENGGUNAKAN FRAMEWORK LARAVEL DAN REACT**

---

Disusun Oleh:

**Nabiil Nuryassar**
**NIM: ________**

---

Telah disetujui dan disahkan pada:

**Tanggal:** ________________

---

| | Nama | Tanda Tangan |
|---|------|--------------|
| **Ketua Program Studi** | ________________ | ________________ |
| **Dosen Penguji** | ________________ | ________________ |

---

Institut Teknologi dan Bisnis Bina Sarana Global
Tangerang, 2026
```

**Step 2: Verify**

```bash
cat docs/report/01-lembar-pengesahan.md
```

Expected: approval template displayed

**Step 3: Commit**

```bash
git add docs/report/01-lembar-pengesahan.md
git commit -m "docs: add lembar pengesahan template"
```

---

## Task 4: Write 02-kata-pengantar.md

**Objective:** Create preface section

**Files:**
- Create: `docs/report/02-kata-pengantar.md`

**Step 1: Write file**

```markdown
# KATA PENGANTAR

---

Puji syukur penulis panjatkan ke hadirat Tuhan Yang Maha Esa atas berkat dan rahmat-Nya sehingga penulis dapat menyelesaikan laporan project ini dengan baik.

Laporan ini disusun untuk memenuhi tugas mata kuliah Project 2 pada Program Studi Teknik Informatika, Konsentrasi Software Engineering, Institut Teknologi dan Bisnis Bina Sarana Global.

Penulis mengucapkan terima kasih kepada:

1. Bapak/Ibu Dosen Pembimbing yang telah memberikan bimbingan dan arahan selama penyusunan laporan ini.
2. Bapak/Ibu Dosen Penguji yang telah memberikan masukan dan koreksi.
3. Orang tua yang selalu memberikan doa dan dukungan.
4. Teman-teman yang telah membantu dalam proses pengembangan sistem.

Penulis menyadari bahwa laporan ini masih jauh dari sempurna. Oleh karena itu, penulis mengharapkan kritik dan saran yang membangun untuk perbaikan di masa mendatang.

Penulis berharap laporan ini dapat bermanfaat bagi pembaca dan dapat menjadi referensi bagi pengembangan sistem monitoring IoT di masa depan.

---

Tangerang, Juli 2026

Penulis
```

**Step 2: Verify**

```bash
cat docs/report/02-kata-pengantar.md
```

Expected: preface content displayed

**Step 3: Commit**

```bash
git add docs/report/02-kata-pengantar.md
git commit -m "docs: add kata pengantar"
```

---

## Task 5: Write 03-daftar-isi.md

**Objective:** Create table of contents, list of figures, tables, and appendices

**Files:**
- Create: `docs/report/03-daftar-isi.md`

**Step 1: Write file**

```markdown
# DAFTAR ISI

---

Lembar Pengesahan ................................................ ii

Kata Pengantar ................................................... iii

Daftar Isi ....................................................... iv

Daftar Gambar .................................................... v

Daftar Tabel ..................................................... vi

Daftar Lampiran .................................................. vii

**BAB I PENDAHULUAN** ............................................ 1
- 1.1 Latar Belakang ............................................. 1
- 1.2 Rumusan Masalah ............................................ 3
- 1.3 Batasan Masalah ............................................ 4
- 1.4 Tujuan Penulisan ........................................... 4
- 1.5 Metode Pengumpulan Data .................................... 5
- 1.6 Sistematika Penulisan ...................................... 5

**BAB II LANDASAN TEORI** ........................................ 6
- 2.1 Teori Umum ................................................. 6
- 2.2 Teori Khusus ............................................... 12

**BAB III TINJAUAN OBJEK YANG DITELITI** ......................... 15
- 3.1 Deskripsi Tempat Penelitian ................................ 15
- 3.2 Struktur Organisasi ........................................ 16
- 3.3 Tata Laksana Sistem Berjalan ................................ 17
- 3.4 Masalah yang Dihadapi ...................................... 20
- 3.5 Alternatif Pemecahan Masalah ................................ 21
- 3.6 User Requirement (Elisitasi) ................................ 22

**BAB IV IMPLEMENTASI DAN PEMBAHASAN** ........................... 28
- 4.1 Usulan Prosedur Baru ....................................... 28
- 4.2 Diagram Rancangan Sistem ................................... 29
- 4.3 Rancangan Basis Data ....................................... 33
- 4.4 Rancangan Prototype ........................................ 35
- 4.5 Implementasi Sistem ........................................ 38

**BAB V PENUTUP** ................................................ 45
- 5.1 Kesimpulan ................................................. 45
- 5.2 Saran ...................................................... 46

Lampiran ......................................................... 47

Daftar Pustaka ................................................... 50

---

# DAFTAR GAMBAR

---

Gambar 2.1 Arsitektur Framework Laravel ........................... 8

Gambar 2.2 Arsitektur React ...................................... 9

Gambar 2.3 Arsitektur MQTT ....................................... 10

Gambar 2.4 Modul ESP32 ........................................... 11

Gambar 3.1 Struktur Organisasi ................................... 16

Gambar 3.2 Use Case Diagram Sistem Berjalan ...................... 17

Gambar 3.3 Activity Diagram Sistem Berjalan ...................... 18

Gambar 4.1 Use Case Diagram Sistem Usulan ......................... 29

Gambar 4.2 Activity Diagram Sistem Usulan ......................... 30

Gambar 4.3 Class Diagram .......................................... 31

Gambar 4.4 ERD Sistem ............................................. 33

Gambar 4.5 Halaman Login .......................................... 35

Gambar 4.6 Halaman Dashboard ...................................... 36

Gambar 4.7 Halaman Devices ........................................ 37

Gambar 4.8 Halaman Device Detail .................................. 38

Gambar 4.9 Halaman Security Events ................................ 39

Gambar 4.10 Halaman Incidents ..................................... 40

Gambar 4.11 Wokwi Simulator ....................................... 41

---

# DAFTAR TABEL

---

Tabel 3.1 Elisitasi Tahap I ...................................... 22

Tabel 3.2 Elisitasi Tahap II ..................................... 23

Tabel 3.3 Elisitasi Tahap III .................................... 24

Tabel 3.4 Final Draft Elisitasi .................................. 25

Tabel 4.1 Struktur Tabel users ................................... 33

Tabel 4.2 Struktur Tabel devices ................................. 34

Tabel 4.3 Struktur Tabel telemetry_logs .......................... 34

Tabel 4.4 Struktur Tabel security_events ......................... 34

Tabel 4.5 Struktur Tabel incidents ................................ 35

---

# DAFTAR LAMPIRAN

---

1. Surat Keterangan Project
2. Kartu Bimbingan
3. Daftar Riwayat Hidup
4. Bukti Wawancara
5. Dokumentasi Observasi
6. Source Code
7. Manual Book
```

**Step 2: Verify**

```bash
cat docs/report/03-daftar-isi.md
```

Expected: TOC, figures, tables, appendices displayed

**Step 3: Commit**

```bash
git add docs/report/03-daftar-isi.md
git commit -m "docs: add daftar isi, gambar, tabel, lampiran"
```

---

## Task 6: Write 04-bab1-pendahuluan.md

**Objective:** Write BAB I — Pendahuluan (6 sections)

**Files:**
- Create: `docs/report/04-bab1-pendahuluan.md`

**Step 1: Write file**

```markdown
# BAB I
# PENDAHULUAN

---

## 1.1 Latar Belakang

Project 2 merupakan mata kuliah yang bertujuan untuk mengaplikasikan pengetahuan dan keterampilan yang telah diperoleh selama perkuliahan dalam membangun sebuah sistem informasi yang bermanfaat. Mata kuliah ini memberikan kesempatan kepada mahasiswa untuk merancang, mengembangkan, dan mengimplementasikan sistem berbasis web yang dapat menyelesaikan permasalahan nyata.

Perkembangan teknologi informasi dan komunikasi yang semakin pesat telah membawa perubahan signifikan dalam berbagai aspek kehidupan. Salah satu bidang yang mengalami perkembangan pesat adalah Internet of Things (IoT). IoT merupakan konsep di mana objek-objek fisik dapat terhubung ke internet dan saling berkomunikasi untuk mengumpulkan dan bertukar data. Menurut Statista (2024), jumlah perangkat IoT yang terhubung di seluruh dunia diperkirakan mencapai 15,14 miliar pada tahun 2024 dan diprediksi akan meningkat hingga 29,42 miliar pada tahun 2030.

Sistem monitoring IoT memiliki peran penting dalam memastikan keamanan dan keandalan operasional perangkat IoT. Dalam konteks keamanan, sistem monitoring IoT memungkinkan deteksi dini terhadap ancaman keamanan seperti serangan DDoS, spoofing perangkat, dan manipulasi data. Tanpa sistem monitoring yang memadai, perangkat IoT rentan terhadap serangan yang dapat mengakibatkan kerugian material dan non-material.

Berdasarkan observasi yang dilakukan, ditemukan bahwa banyak organisasi yang mengelola perangkat IoT masih mengandalkan proses monitoring secara manual. Proses manual ini memiliki beberapa kelemahan, antara lain: (1) respons terhadap insiden keamanan yang lambat, (2) kesulitan dalam melacak status perangkat secara real-time, (3) tidak adanya sistem peringatan dini terhadap anomali, dan (4) kurangnya dokumentasi dan audit trail untuk investigasi insiden.

Berdasarkan uraian tersebut, penulis tertarik mengangkat judul "Sistem Monitoring Keamanan Internet of Things (IoT) Berbasis Web Menggunakan Framework Laravel dan React." Sistem ini dirancang untuk membantu organisasi dalam memantau keamanan perangkat IoT secara real-time, mendeteksi ancaman keamanan, dan mengelola insiden keamanan secara efektif.

---

## 1.2 Rumusan Masalah

Berdasarkan latar belakang yang telah diuraikan, rumusan masalah dalam penelitian ini adalah:

1. Bagaimana proses monitoring keamanan perangkat IoT yang sedang berjalan saat ini?
2. Apa kendala dan kelemahan yang dihadapi dalam proses monitoring keamanan perangkat IoT secara manual?
3. Bagaimana membangun sistem monitoring keamanan IoT berbasis web yang mampu memantau perangkat secara real-time, mendeteksi ancaman keamanan, dan mengelola insiden secara efektif menggunakan framework Laravel dan React?

---

## 1.3 Batasan Masalah

Untuk membatasi ruang lingkup penelitian, maka batasan masalah dalam penelitian ini adalah:

1. Sistem yang dibangun berbasis web, tidak mencakup aplikasi mobile.
2. Monitoring difokuskan pada perangkat IoT yang menggunakan protokol MQTT.
3. Sistem hanya memantau data telemetry (suhu, kelembaban) dan event keamanan.
4. Tidak membahas integrasi dengan sistem pembayaran atau e-commerce.
5. Pengujian dilakukan menggunakan simulator Wokwi (ESP32 + DHT22), bukan perangkat fisik.
6. Sistem mendukung single-tenant, tidak mencakup multi-tenant production deployment.

---

## 1.4 Tujuan Penulisan

Tujuan dari penulisan laporan ini adalah:

1. Memenuhi tugas mata kuliah Project 2 pada Program Studi Teknik Informatika.
2. Menerapkan pengetahuan dan keterampilan yang diperoleh selama perkuliahan dalam membangun sistem informasi.
3. Merancang dan mengimplementasikan sistem monitoring keamanan IoT berbasis web yang efektif.
4. Membantu organisasi dalam memantau keamanan perangkat IoT secara real-time.
5. Menjadi referensi bagi pengembangan sistem monitoring IoT di masa depan.

---

## 1.5 Metode Pengumpulan Data

Dalam penyusunan laporan ini, penulis menggunakan beberapa metode pengumpulan data, antara lain:

### 1. Observasi

Penulis melakukan pengamatan langsung terhadap proses monitoring keamanan perangkat IoT yang sedang berjalan. Observasi dilakukan untuk memahami alur kerja, kendala, dan kebutuhan yang diperlukan dalam sistem monitoring.

### 2. Studi Pustaka

Penulis mengumpulkan data dan informasi dari berbagai sumber literatur, antara lain:

- Buku-buku tentang pemrograman web, database, dan keamanan IoT.
- Jurnal ilmiah terkait Internet of Things dan keamanan siber.
- Dokumentasi resmi framework dan teknologi yang digunakan (Laravel, React, PostgreSQL, MQTT).
- Artikel ilmiah dan website terpercaya yang membahas topik terkait.

### 3. Pengembangan Sistem

Penulis merancang dan mengembangkan sistem menggunakan metode pengembangan perangkat lunak yang meliputi perancangan sistem, implementasi kode program, dan pengujian sistem.

---

## 1.6 Sistematika Penulisan

Laporan ini disusun dengan sistematika penulisan sebagai berikut:

**BAB I — Pendahuluan**
Berisi latar belakang, rumusan masalah, batasan masalah, tujuan penulisan, metode pengumpulan data, dan sistematika penulisan.

**BAB II — Landasan Teori**
Berisi teori-teori yang mendukung penelitian, meliputi teori umum (website, sistem informasi, database, UML, framework, bahasa pemrograman) dan teori khusus (IoT, MQTT, ESP32, sensor).

**BAB III — Tinjauan Objek yang Diteliti**
Berisi deskripsi tempat penelitian, struktur organisasi, tata laksana sistem berjalan, masalah yang dihadapi, alternatif pemecahan masalah, dan user requirement (elisitasi).

**BAB IV — Implementasi dan Pembahasan**
Berisi usulan prosedur baru, diagram rancangan sistem (UML), rancangan basis data (ERD), rancangan prototype, dan implementasi sistem.

**BAB V — Penutup**
Berisi kesimpulan dan saran yang didasarkan pada hasil penelitian.
```

**Step 2: Verify**

```bash
wc -l docs/report/04-bab1-pendahuluan.md
```

Expected: ~150 lines

**Step 3: Commit**

```bash
git add docs/report/04-bab1-pendahuluan.md
git commit -m "docs: add BAB I — Pendahuluan"
```

---

## Task 7: Write 05-bab2-landasan-teori.md

**Objective:** Write BAB II — Landasan Teori (teori umum + khusus)

**Files:**
- Create: `docs/report/05-bab2-landasan-teori.md`

**Step 1: Write file**

Content: Teori umum (Website, Sistem Informasi, Database, Internet, UML, Framework, Bahasa Pemrograman) + Teori khusus (IoT, MQTT, ESP32, Sensor DHT22, Laravel, React, PostgreSQL, Docker, Tailwind CSS).

Each theory section: definition, characteristics, advantages, sources.

**Step 2: Verify**

```bash
wc -l docs/report/05-bab2-landasan-teori.md
```

Expected: ~300 lines

**Step 3: Commit**

```bash
git add docs/report/05-bab2-landasan-teori.md
git commit -m "docs: add BAB II — Landasan Teori"
```

---

## Task 8: Write 06-bab3-tinjauan-objek.md

**Objective:** Write BAB III — Tinjauan Objek (profil, struktur, sistem berjalan, elisitasi)

**Files:**
- Create: `docs/report/06-bab3-tinjauan-objek.md`

**Step 1: Write file**

Content:
- 3.1 Profil Sentinel-IoT (fictional: sistem monitoring IoT)
- 3.2 Struktur Organisasi (Admin, Operator, Viewer)
- 3.3 Sistem Berjalan (Use Case + Activity Diagram current state)
- 3.4 Masalah (manual monitoring, no alerting)
- 3.5 Alternatif (web-based dashboard, automated alerting)
- 3.6 Elisitasi (3 tahap + final draft)

**Step 2: Verify**

```bash
wc -l docs/report/06-bab3-tinjauan-objek.md
```

Expected: ~250 lines

**Step 3: Commit**

```bash
git add docs/report/06-bab3-tinjauan-objek.md
git commit -m "docs: add BAB III — Tinjauan Objek"
```

---

## Task 9: Write 07-bab4-implementasi.md

**Objective:** Write BAB IV — Implementasi (UML, ERD, prototype, screenshot)

**Files:**
- Create: `docs/report/07-bab4-implementasi.md`

**Step 1: Write file**

Content:
- 4.1 Usulan Prosedur Baru (activity diagram proposed)
- 4.2 Diagram Rancangan (Use Case, Activity, Class Diagram)
- 4.3 Rancangan Basis Data (ERD + 5 tabel utama)
- 4.4 Prototype (screenshot login, dashboard, devices, telemetry)
- 4.5 Implementasi (screenshot + penjelasan fungsi)

**Step 2: Verify**

```bash
wc -l docs/report/07-bab4-implementasi.md
```

Expected: ~350 lines

**Step 3: Commit**

```bash
git add docs/report/07-bab4-implementasi.md
git commit -m "docs: add BAB IV — Implementasi"
```

---

## Task 10: Write 08-bab5-penutup.md

**Objective:** Write BAB V — Penutup (kesimpulan + saran)

**Files:**
- Create: `docs/report/08-bab5-penutup.md`

**Step 1: Write file**

Content:
- 5.1 Kesimpulan (jawab 3 rumusan masalah BAB I)
- 5.2 Saran (pengembangan: mobile app, real hardware, multi-tenant, AI advanced)

**Step 2: Verify**

```bash
wc -l docs/report/08-bab5-penutup.md
```

Expected: ~80 lines

**Step 3: Commit**

```bash
git add docs/report/08-bab5-penutup.md
git commit -m "docs: add BAB V — Penutup"
```

---

## Task 11: Write 09-lampiran.md

**Objective:** Create appendix templates

**Files:**
- Create: `docs/report/09-lampiran.md`

**Step 1: Write file**

Content: Template for surat bukti project, kartu bimbingan, CV, bukti wawancara, dokumentasi.

**Step 2: Verify**

```bash
cat docs/report/09-lampiran.md
```

Expected: appendix templates displayed

**Step 3: Commit**

```bash
git add docs/report/09-lampiran.md
git commit -m "docs: add lampiran templates"
```

---

## Task 12: Write 10-daftar-pustaka.md

**Objective:** Create references list

**Files:**
- Create: `docs/report/10-daftar-pustaka.md`

**Step 1: Write file**

Content: References from books, journals, and official websites (Laravel, React, PostgreSQL, MQTT, ESP32, Docker).

**Step 2: Verify**

```bash
cat docs/report/10-daftar-pustaka.md
```

Expected: references list displayed

**Step 3: Commit**

```bash
git add docs/report/10-daftar-pustaka.md
git commit -m "docs: add daftar pustaka"
```

---

## Task 13: Take screenshots for BAB IV

**Objective:** Capture screenshots from running Sentinel-IoT app for report

**Files:**
- Create: `docs/report/screenshots/` (directory)

**Step 1: Create directory**

```bash
mkdir -p docs/report/screenshots
```

**Step 2: Capture screenshots**

Screenshots needed:
- [ ] Login page
- [ ] Dashboard (full page)
- [ ] Devices list
- [ ] Device detail + telemetry chart
- [ ] Security events
- [ ] Incidents
- [ ] AI agent chat
- [ ] Wokwi simulator (ESP32 + DHT22)

**Step 3: Verify**

```bash
ls -la docs/report/screenshots/
```

Expected: 8 screenshot files

**Step 4: Commit**

```bash
git add docs/report/screenshots/
git commit -m "docs: add report screenshots"
```

---

## Task 14: Final review

**Objective:** Verify all files are complete and consistent

**Files:**
- All files in `docs/report/`

**Step 1: Check all files exist**

```bash
ls -la docs/report/
```

Expected: 11 markdown files + screenshots/ directory

**Step 2: Check for placeholders**

```bash
grep -r "TODO\|TBD\|FIXME\|lorem\|placeholder" docs/report/
```

Expected: no matches

**Step 3: Check word count**

```bash
wc -l docs/report/*.md
```

Expected: ~1,300 total lines

**Step 4: Commit**

```bash
git add docs/report/
git commit -m "docs: finalize laporan project 2"
```

---

## Summary

| Task | Description | Est. Lines |
|------|-------------|------------|
| T01 | Create folder structure | - |
| T02 | Cover page | 20 |
| T03 | Lembar pengesahan | 25 |
| T04 | Kata pengantar | 40 |
| T05 | Daftar isi | 30 |
| T06 | BAB I — Pendahuluan | 150 |
| T07 | BAB II — Landasan Teori | 300 |
| T08 | BAB III — Tinjauan Objek | 250 |
| T09 | BAB IV — Implementasi | 350 |
| T10 | BAB V — Penutup | 80 |
| T11 | Lampiran | 30 |
| T12 | Daftar Pustaka | 40 |
| T13 | Screenshots | - |
| T14 | Final review | - |

**Total: 14 tasks, ~1,315 lines**
