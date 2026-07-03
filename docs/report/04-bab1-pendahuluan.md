# BAB I
# PENDAHULUAN

**SISTEM MONITORING KEAMANAN INTERNET OF THINGS (IoT) BERBASIS WEB MENGGUNAKAN FRAMEWORK LARAVEL DAN REACT**

**Tugas Akhir — Mata Kuliah Proyek 2**

**Oleh:**
**Nabiil Nuryassar dan Angga Saputra**

**Institut Teknologi dan Bisnis Bina Sarana Global**

---

## 1.1 Latar Belakang

Perkembangan teknologi informasi dan komunikasi telah membawa perubahan signifikan dalam berbagai aspek kehidupan manusia, mulai dari sektor industri, pendidikan, kesehatan, hingga sistem keamanan. Salah satu inovasi teknologi yang mengalami pertumbuhan pesat dalam beberapa tahun terakhir adalah *Internet of Things* (IoT). IoT merupakan konsep di mana berbagai perangkat fisik yang dilengkapi dengan sensor, *actuator*, dan konektivitas jaringan dapat saling berkomunikasi dan bertukar data melalui internet tanpa memerlukan intervensi manusia secara langsung (Al-Fuqaha *et al.*, 2015). Menurut laporan terbaru dari Statista (2024), jumlah perangkat IoT yang terhubung secara global diperkirakan telah mencapai lebih dari 15 miliar unit, dan diproyeksikan akan terus meningkat hingga lebih dari 29 miliar pada tahun 2030. Pertumbuhan eksponensial ini menunjukkan bahwa IoT telah menjadi salah satu pilar utama dalam transformasi digital di berbagai sektor.

Seiring dengan meningkatnya adopsi teknologi IoT, kebutuhan akan sistem pemantauan (*monitoring*) yang efektif dan efisien menjadi semakin krusial. Perangkat IoT menghasilkan volume data yang sangat besar secara *real-time*, mencakup data telemetri berupa suhu, kelembaban, intensitas cahaya, serta status berbagai parameter lingkungan lainnya. Selain itu, aspek keamanan perangkat IoT juga menjadi perhatian utama, mengingat ancaman siber yang terus berkembang dapat menargetkan kerentanan pada perangkat IoT yang terhubung ke jaringan (Sicari *et al.*, 2015). Oleh karena itu, diperlukan sebuah sistem monitoring terintegrasi yang tidak hanya mampu menampilkan data telemetri secara *real-time*, tetapi juga mendeteksi dan melaporkan *security event* yang terjadi pada perangkat IoT.

Institut Teknologi dan Bisnis Bina Sarana Global sebagai institusi pendidikan tinggi yang bergerak di bidang teknologi dan bisnis, mengharuskan mahasiswanya untuk menyelesaikan tugas akhir sebagai salah satu syarat kelulusan. Pada mata kuliah Proyek 2, mahasiswa dituntut untuk mampu mengaplikasikan pengetahuan dan keterampilan yang telah diperoleh selama masa perkuliahan ke dalam bentuk produk teknologi yang nyata, terukur, dan dapat memberikan manfaat praktis. Proyek ini menjadi wahana bagi mahasiswa untuk mengintegrasikan berbagai kompetensi yang telah dipelajari, mulai dari analisis kebutuhan, perancangan sistem, implementasi, hingga pengujian dan dokumentasi.

Namun demikian, monitoring perangkat IoT yang dilakukan secara manual memiliki sejumlah keterbatasan yang signifikan. Pendekatan konvensional seperti memeriksa log secara langsung, memantau setiap perangkat satu per satu, atau mengandalkan notifikasi sederhana dirasa kurang memadai dalam menghadapi volume data yang besar dan kompleksitas jaringan IoT yang terus berkembang. Metode manual tersebut tidak hanya membutuhkan waktu dan tenaga yang besar, tetapi juga rentan terhadap *human error* dan keterlambatan dalam merespons insiden keamanan. Kondisi ini menunjukkan perlunya pengembangan sistem monitoring berbasis web yang dapat menyajikan data secara terpusat, *real-time*, dan interaktif, sehingga pengguna dapat dengan mudah memantau kondisi seluruh perangkat IoT dan merespons setiap anomali keamanan dengan cepat dan tepat.

Berdasarkan pertimbangan-pertimbangan tersebut, penulis memilih topik **"Sistem Monitoring Keamanan Internet of Things (IoT) Berbasis Web Menggunakan Framework Laravel dan React (Studi Kasus: Software House Kanezza Tech)"** sebagai tugas akhir mata kuliah Proyek 2. Sistem ini, yang diberi nama **Sentinel-IoT**, dirancang untuk menjawab kebutuhan akan platform monitoring IoT yang modern, terintegrasi, dan *user-friendly* guna mendukung operasional dan keamanan infrastruktur di lingkungan Kanezza Tech. Pemilihan framework Laravel sebagai *backend* dan React sebagai *frontend* didasarkan pada kematangan ekosistem, dukungan komunitas yang luas, serta kemampuan keduanya dalam membangun aplikasi web yang *scalable* dan *maintainable*. Dengan pemanfaatan protokol MQTT yang ringan dan efisien untuk komunikasi antara perangkat IoT dan server, serta integrasi dengan simulator perangkat keras Wokwi untuk keperluan pengembangan dan pengujian, penulis berharap sistem Sentinel-IoT dapat menjadi solusi monitoring yang komprehensif dan aplikatif.

## 1.2 Rumusan Masalah

Berdasarkan latar belakang yang telah diuraikan di atas, maka rumusan masalah dalam penulisan tugas akhir ini adalah sebagai berikut:

1. Bagaimana mekanisme monitoring keamanan perangkat IoT yang dilakukan saat ini, dan bagaimana sistem tersebut mengakomodasi kebutuhan pemantauan data telemetri serta *security event* secara *real-time*?
2. Apa saja permasalahan dan tantangan yang dihadapi dalam proses monitoring keamanan IoT secara konvensional, terutama terkait efisiensi, akurasi data, dan kemampuan respons terhadap insiden keamanan?
3. Bagaimana merancang dan membangun sistem monitoring keamanan IoT berbasis web menggunakan framework Laravel dan React yang mampu menampilkan data telemetri dan *security event* secara *real-time* melalui *dashboard* interaktif?

## 1.3 Batasan Masalah

Untuk menjaga fokus dan kedalaman pembahasan dalam penulisan tugas akhir ini, maka penulis membatasi ruang lingkup masalah sebagai berikut:

1. Sistem monitoring yang dikembangkan merupakan aplikasi berbasis web (*web-based*) yang dapat diakses melalui *web browser*, bukan aplikasi *mobile* atau *desktop*.
2. Protokol komunikasi antara perangkat IoT dengan *backend* server menggunakan protokol MQTT (*Message Queuing Telemetry Transport*) sebagai protokol utama.
3. Data yang diproses dan ditampilkan oleh sistem meliputi dua kategori utama, yaitu data telemetri (seperti suhu, kelembaban, dan parameter lingkungan lainnya) serta data *security event* (seperti anomali dan potensi ancaman keamanan).
4. Sistem dikembangkan dengan arsitektur *single-tenant*, yaitu melayani satu entitas atau organisasi, tanpa implementasi fitur *multi-tenancy*.
5. Simulasi dan pengujian perangkat IoT dilakukan menggunakan *platform* simulator Wokwi (*https://wokwi.com*), bukan menggunakan perangkat keras (*hardware*) IoT secara fisik.

## 1.4 Tujuan Penulisan

Berdasarkan rumusan masalah yang telah ditetapkan, tujuan penulisan tugas akhir ini adalah sebagai berikut:

1. Menganalisis kebutuhan sistem monitoring keamanan IoT berbasis web, mencakup kebutuhan fungsional dan non-fungsional.
2. Merancang arsitektur sistem monitoring keamanan IoT yang terintegrasi, meliputi *frontend*, *backend*, *broker* MQTT, dan perangkat IoT simulator.
3. Mengimplementasikan sistem monitoring keamanan IoT berbasis web menggunakan framework Laravel pada sisi *backend* dan React pada sisi *frontend* dengan fitur *dashboard* real-time.
4. Menguji fungsionalitas dan kinerja sistem monitoring yang telah dikembangkan untuk memastikan keandalan dan kesesuaian dengan kebutuhan yang telah dianalisis.
5. Menghasilkan dokumentasi teknis yang lengkap dan sistematis mengenai perancangan, implementasi, dan pengujian sistem monitoring keamanan IoT berbasis web.

## 1.5 Metode Pengumpulan Data

Dalam pelaksanaan penulisan tugas akhir ini, penulis menggunakan beberapa metode pengumpulan data berikut:

### 1.5.1 Observasi
Penulis melakukan observasi terhadap sistem monitoring IoT yang telah ada, baik yang bersifat *open-source* maupun komersial, untuk memahami fitur-fitur yang disediakan, kelebihan, serta kekurangan dari masing-masing sistem. Observasi ini juga mencakup pemantauan terhadap perilaku perangkat IoT simulator yang digunakan dalam pengembangan sistem Sentinel-IoT.

### 1.5.2 Studi Pustaka
Penulis mengumpulkan data dan informasi dari berbagai sumber literatur, termasuk jurnal ilmiah, buku teks, dokumentasi resmi framework dan *platform*, serta artikel teknis yang relevan. Studi pustaka ini bertujuan untuk membangun landasan teori yang kuat mengenai teknologi IoT, protokol MQTT, framework Laravel dan React, serta prinsip-prinsip desain sistem monitoring keamanan.

### 1.5.3 Pengembangan Sistem
Penulis melakukan pengembangan sistem secara langsung melalui tahapan analisis kebutuhan, perancangan (*design*), implementasi (*coding*), integrasi, dan pengujian (*testing*). Metode pengembangan sistem ini dilakukan secara iteratif untuk memastikan bahwa setiap komponen sistem berfungsi sesuai dengan spesifikasi yang telah ditetapkan. Pengujian dilakukan menggunakan simulator Wokwi untuk mereplikasi skenario komunikasi perangkat IoT dengan sistem.

## 1.6 Sistematika Penulisan

Sistematika penulisan tugas akhir ini disusun secara sistematis dalam lima bab untuk memudahkan pembaca dalam memahami alur penulisan. Berikut adalah uraian masing-masing bab:

### BAB I — Pendahuluan
Bab ini memuat latar belakang masalah, rumusan masalah, batasan masalah, tujuan penulisan, metode pengumpulan data, dan sistematika penulisan. Bab ini memberikan gambaran umum mengenai topik yang dibahas serta justifikasi mengapa topik ini dipilih sebagai tugas akhir.

### BAB II — Landasan Teori
Bab ini memuat teori-teori dan konsep dasar yang relevan dengan pengembangan sistem, meliputi pembahasan mengenai *Internet of Things* (IoT), protokol komunikasi MQTT, konsep sistem monitoring keamanan, framework Laravel, framework React, dan konsep-konsep pendukung lainnya. Landasan teori ini menjadi acuan dalam proses perancangan dan implementasi sistem.

### BAB III — Analisis dan Perancangan Sistem
Bab ini berisi analisis kebutuhan sistem, baik kebutuhan fungsional maupun non-fungsional, serta perancangan sistem yang meliputi diagram use case, diagram aktivitas, diagram sekuens, rancangan basis data (*database*), arsitektur sistem, dan *wireframe* antarmuka pengguna. Bab ini juga menjelaskan alur kerja (*workflow*) sistem secara keseluruhan.

### BAB IV — Implementasi dan Pengujian
Bab ini memaparkan proses implementasi sistem monitoring keamanan IoT berbasis web, termasuk konfigurasi lingkungan pengembangan, implementasi fitur-fitur utama pada *backend* dan *frontend*, integrasi dengan *broker* MQTT, serta pengujian menggunakan simulator Wokwi. Bab ini juga menyajikan hasil pengujian fungsionalitas dan pembahasan terhadap temuan-temuan yang diperoleh selama proses pengujian.

### BAB V — Kesimpulan dan Saran
Bab ini berisi kesimpulan yang diperoleh dari hasil penulisan tugas akhir, serta saran untuk pengembangan lebih lanjut di masa mendatang. Kesimpulan disusun berdasarkan pencapaian tujuan penulisan yang telah ditetapkan, dan saran diberikan berdasarkan pembahasan terhadap keterbatasan sistem yang masih mungkin ditingkatkan.
