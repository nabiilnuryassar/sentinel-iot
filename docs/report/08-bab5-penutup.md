# BAB V

# PENUTUP

## 5.1 Kesimpulan

Berdasarkan hasil penelitian yang telah dilakukan terhadap sistem monitoring keamanan Internet of Things (IoT) berbasis web menggunakan framework Laravel dan React, serta pembahasan yang telah diuraikan pada bab-bab sebelumnya, maka dapat ditarik kesimpulan sebagai berikut:

**Pertama**, berkenaan dengan rumusan masalah mengenai proses monitoring keamanan perangkat IoT yang sedang berjalan, ditemukan bahwa proses tersebut pada umumnya masih dilakukan secara manual. Petugas keamanan diharuskan memeriksa perangkat satu per satu dan mencatat data secara manual, baik melalui dokumen fisik maupun spreadsheet. Proses manual ini membutuhkan waktu yang sangat lama dan rentan terhadap kesalahan manusia (*human error*), sehingga mengakibatkan ketidakefisienan dalam pengelolaan keamanan perangkat IoT.

**Kedua**, berkenaan dengan rumusan masalah mengenai kendala yang dihadapi dalam proses monitoring, diidentifikasi empat kendala utama, yaitu: (1) respons terhadap insiden keamanan yang lambat akibat tidak adanya sistem notifikasi otomatis; (2) kesulitan dalam melacak status perangkat secara *real-time* karena ketergantungan pada pemeriksaan manual; (3) tidak adanya sistem peringatan dini (*early warning system*) terhadap anomali pada perangkat IoT; dan (4) kurangnya dokumentasi *audit trail* yang memadai untuk keperluan pelacakan dan analisis pasca-insiden.

**Ketiga**, berkenaan dengan rumusan masalah mengenai solusi yang dapat dikembangkan, sistem monitoring keamanan IoT berbasis web berhasil dibangun menggunakan framework Laravel pada sisi *backend* dan React pada sisi *frontend*. Sistem ini mengintegrasikan berbagai fitur utama, antara lain: *dashboard* monitoring *real-time* yang menyajikan informasi status perangkat secara visual, manajemen perangkat IoT untuk pengelolaan data perangkat secara terpusat, modul deteksi ancaman keamanan yang mampu mengidentifikasi potensi serangan, manajemen insiden untuk pencatatan dan penanganan insiden keamanan, integrasi protokol MQTT sebagai media komunikasi antara perangkat IoT dan server, serta pengujian fungsional menggunakan simulator Wokwi untuk memvalidasi fungsionalitas sistem. Hasil pengujian menunjukkan bahwa sistem ini mampu mengatasi permasalahan monitoring manual dan memberikan solusi yang lebih efektif, efisien, dan terstruktur dalam mengelola keamanan perangkat IoT.

## 5.2 Saran

Sehubungan dengan hasil penelitian yang telah dilakukan, penulis menyampaikan beberapa saran untuk pengembangan sistem di masa mendatang:

1. **Menambahkan Dukungan Perangkat IoT Fisik.** Sistem perlu diperluas agar dapat menerima data dari perangkat IoT fisik seperti ESP32 dan Raspberry Pi secara langsung, sehingga pengujian dan penerapan sistem tidak hanya terbatas pada simulator semata.

2. **Mengimplementasikan Arsitektur Multi-Tenant.** Untuk keperluan *deployment* pada lingkungan produksi, arsitektur *multi-tenant* perlu diimplementasikan agar sistem dapat digunakan oleh beberapa organisasi atau departemen secara bersamaan dengan isolasi data yang terjamin.

3. **Menambahkan Notifikasi Real-Time.** Sistem perlu dilengkapi dengan fitur notifikasi *real-time* melalui berbagai saluran komunikasi seperti *email*, Telegram, dan WhatsApp agar petugas keamanan dapat segera menerima peringatan ketika terjadi insiden atau anomali pada perangkat IoT.

4. **Mengembangkan AI Agent untuk Analisis Ancaman Otomatis.** Integrasi kecerdasan buatan (*artificial intelligence*) dalam bentuk AI *agent* dapat dikembangkan untuk melakukan analisis ancaman secara otomatis, sehingga sistem mampu memberikan rekomendasi penanganan insiden berdasarkan pola serangan yang terdeteksi.

5. **Menambahkan Aplikasi Mobile.** Pengembangan aplikasi mobile (*smartphone*) perlu dilakukan untuk memungkinkan petugas keamanan melakukan monitoring perangkat IoT secara *on-the-go*, memberikan fleksibilitas akses di luar lingkungan kerja.

6. **Mengimplementasikan Sertifikat TLS untuk Keamanan Komunikasi MQTT.** Keamanan komunikasi antara perangkat IoT dan server melalui protokol MQTT perlu ditingkatkan dengan mengimplementasikan sertifikat TLS (*Transport Layer Security*) guna menjamin kerahasiaan dan integritas data yang dikirimkan.

7. **Menambahkan Dashboard Analytics dengan Visualisasi Data Historis.** Sistem perlu dilengkapi dengan *dashboard analytics* yang menyajikan visualisasi data historis, seperti tren serangan, statistik insiden, dan performa perangkat dari waktu ke waktu, untuk mendukung pengambilan keputusan strategis berbasis data.

---

Dengan demikian, penelitian ini diharapkan dapat menjadi kontribusi dalam pengembangan sistem monitoring keamanan IoT berbasis web dan menjadi referensi bagi peneliti selanjutnya yang tertarik untuk mengembangkan sistem serupa dengan fitur dan cakupan yang lebih luas.
