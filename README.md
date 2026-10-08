# 🎯 ANBK Realtime Token Monitor & Share

Aplikasi web modern dan responsif untuk **berbagi (share) dan memonitor Token Tes ANBK (Asesmen Nasional Berbasis Komputer) secara realtime antar-ruangan**. 

Aplikasi ini dirancang khusus untuk memecahkan kendala klasik di sekolah/madrasah saat pelaksanaan ANBK di mana beberapa ruangan menggunakan akun proktor / server yang sama dan membutuhkan token yang sama secara serentak tanpa perlu bolak-balik atau mengirim pesan manual.

---

## 📸 Pasangan Ruang & Token Bersama

Sesuai pembagian sesi dan akun proktor pada sistem:

| Grup | Pasangan Ruangan | Nama Pengawas / Proktor | Proktor ID | Password | Status Token |
| :---: | :---: | :--- | :---: | :---: | :---: |
| **Grup 1** | **R1 & R2** | U. Puja (R1) &bull; U. Nikma (R2) | `U05110068-AV3U` | `DK48M54G` | **Token Bersama** |
| **Grup 2** | **R3 & R4** | U. Khofifah (R3) &bull; U. Tasya (R4) | `U05110068-BV2U` | `LE54P60G` | **Token Bersama** |
| **Grup 3** | **R5 & R6** | U. Ady (R5) &bull; U. Anita (R6) | `U05110068-CX7U` | `KV83C49G` | **Token Bersama** |
| **Grup 4** | **R7** | U. Laila (R7) | `U05110068-FZ4U` | `GQ89N21G` | Token Mandiri |
| **Grup 5** | **R8 & R9** | U. Tito (R8) &bull; U. Rafly (R9) | `U05110068-DK7U` | `PB32N70G` | **Token Bersama** |
| **Grup 6** | **R10 & R11** | U. Yusuf (R10) &bull; U. Agus (R11) | `U05110068-EK3U` | `YZ15U87G` | **Token Bersama** |

---

## ✨ Fitur Unggulan

1. **3 Mode Tampilan Fleksibel**:
   - **Monitor Kartu Token (Board View)**: Desain kartu besar dengan warna pastel pembeda per grup ruang, font token berukuran besar dan jelas untuk proyektor lab atau smartphone pengawas.
   - **Tampilan Resmi ANBK (Status Tes)**: Tampilan tabel yang 100% identik dengan antarmuka web proktor resmi ANBK (lengkap dengan Kode Tes, Waktu, Kelompok, tombol Set, dan Rilis Token).
   - **Tampilan Format Spreadsheet**: Cerminan tabel Google Sheets asli lengkap dengan merge cell per kelompok ruang.
2. **Sinkronisasi Realtime Otomatis**:
   - Terhubung langsung ke **Google Sheets** melalui **Google Apps Script (GAS)** Web App.
   - Pilihan auto-refresh berkala (setiap 3, 5, 10, atau 30 detik) dengan indikator hitung mundur lingkaran (*circular countdown timer*).
3. **Notifikasi Suara (*Audio Chime Alert*)**:
   - Berbunyi suara bel manis (*two-tone chime*) secara otomatis begitu ada token yang baru saja dirilis atau diupdate, sehingga proktor di ruang sebelah langsung mengetahui ada token baru.
   - Dibuat dengan Web Audio API murni (tanpa file mp3 eksternal, bekerja offline maupun online).
4. **Animasi Sorot (*Visual Glow Pulse*)**:
   - Kartu ruangan yang tokennya baru saja diperbarui akan menyala hijau/berkedip sesaat untuk menarik perhatian.
5. **Salin Cepat 1-Klik (*One-Click Copy*)**:
   - Tombol salin token langsung ke papan klip dengan feedback instan `Tersalin!`.
6. **Update Langsung dari Web atau Spreadsheet**:
   - Token bisa diperbarui langsung melalui modal popup di website (dengan tombol *Generate Acak* 6 huruf khas ANBK), atau bisa diedit langsung di spreadsheet Google Sheets Anda.
7. **Filter & Pencarian Instan**:
   - Filter cepat tombol chip per pasangan ruang (R1 & R2, R3 & R4, dst) serta kolom pencarian berdasarkan nama pengawas atau nomor ruang.
8. **100% Responsif & Siap GitHub Pages**:
   - Sangat ringan, tanpa framework berat (Vanilla JS, CSS modern), dapat di-hosting gratis di GitHub Pages.

---

## 📁 Struktur Berkas

```
anbk-token-share/
├── index.html            # Halaman antarmuka utama dashboard ANBK
├── css/
│   └── style.css         # Styling tema resmi ANBK & monitor kartu
├── js/
│   └── app.js            # Engine sinkronisasi realtime, polling & audio alert
├── gas/
│   └── Code.gs           # Skrip backend Google Apps Script untuk Google Sheets
├── server.js             # Server lokal ringan (opsional untuk testing)
├── start.bat             # Klik 2x untuk menjalankan server lokal di Windows
└── README.md             # Petunjuk lengkap instalasi dan deployment
```

---

## 🚀 Panduan Setup Langkah Demi Langkah

### Bagian 1: Menyiapkan Google Sheets & Google Apps Script (Backend)

1. Buka browser dan buat Google Spreadsheet baru di: [sheets.new](https://sheets.new).
2. Beri nama spreadsheet Anda, misalnya: `DATABASE TOKEN ANBK 2026`.
3. Di menu atas spreadsheet, klik **Ekstensi (Extensions)** &gt; **Apps Script**.
4. Hapus seluruh kode bawaan yang ada di editor Apps Script (`function myFunction() { ... }`).
5. Buka berkas `gas/Code.gs` dari repository ini, salin seluruh kodenya, lalu tempel (*paste*) ke dalam editor Apps Script.
6. Klik ikon **Simpan (Save)** 💾.
7. Pada menu dropdown fungsi (di samping tombol Run), pilih fungsi `setupSheet`, lalu klik tombol **Jalankan (Run)**.
   - *Catatan*: Google akan meminta izin akses (*Authorization Required*). Klik **Review permissions** &gt; pilih akun Google Anda &gt; klik **Advanced** &gt; klik **Go to Untitled project (unsafe)** &gt; klik **Allow**.
   - Fungsi `setupSheet` akan secara otomatis membuat sheet bernama `DATA_TOKEN` dengan seluruh warna, baris, pasangan ruang, dan data awal yang persis seperti spreadsheet Anda!
8. Sekarang lakukan publikasi (Deploy):
   - Klik tombol **Deploy** (Terapkan) di pojok kanan atas &gt; pilih **New deployment** (Penerapan baru).
   - Klik ikon gerigi (Select type) &gt; pilih **Web app**.
   - Isi form konfigurasi:
     - **Description**: `ANBK Token API`
     - **Execute as**: `Me (email anda)`
     - **Who has access**: `Anyone` *(PENTING: Pilih 'Anyone' agar website GitHub Pages bisa membaca data token tanpa perlu login Google)*.
   - Klik tombol **Deploy**.
9. Salin **Web app URL** yang muncul (URL ini berakhiran `/exec`). Simpan URL ini!

---

### Bagian 2: Konfigurasi URL Otomatis

Website ini **sudah otomatis dikonfigurasi** ke URL Google Apps Script Anda:
`https://script.google.com/macros/s/AKfycbwUzzj_Gh17fBAZ29zJ8vVoprzZFBh6vm_8Y1TzI1wbzlWiYa6ygw-Z5XcQhzSjHi0rIA/exec`

Setiap pengawas/guru yang membuka website ini akan **langsung terhubung secara otomatis** tanpa perlu melakukan input atau konfigurasi apa pun.

> **Tips Admin**: Jika sewaktu-waktu Anda ingin mengganti URL atau mengubah interval sinkronisasi, Anda cukup mengklik tombol status **`🟢 LIVE SINKRON`** yang terletak di **pojok kiri bawah sidebar**.

---

### Bagian 3: Mengunggah ke GitHub & Mengaktifkan GitHub Pages (Online)

Agar web ini bisa diakses bersama oleh seluruh pengawas ruang melalui HP/Laptop masing-masing di jaringan sekolah:

1. Buat repository baru di akun GitHub Anda:
   - Nama repo: `anbk-token-share`
   - Set ke **Public**.
2. Unggah seluruh file proyek ini (`index.html`, folder `css`, folder `js`, folder `gas`, dan `README.md`) ke repository tersebut:
   ```bash
   git init
   git add .
   git commit -m "Initial commit: ANBK Realtime Token Share"
   git branch -M main
   git remote add origin https://github.com/USERNAME-ANDA/anbk-token-share.git
   git push -u origin main
   ```
3. Aktifkan **GitHub Pages**:
   - Di halaman repository GitHub Anda, klik menu **Settings** (Pengaturan).
   - Di bilah menu kiri, pilih **Pages**.
   - Di bagian **Build and deployment** > **Branch**, pilih branch `main` dan folder `/(root)`.
   - Klik **Save**.
4. Tunggu sekitar 1-2 menit. GitHub Pages akan memberikan alamat URL website Anda:
   `https://USERNAME-ANDA.github.io/anbk-token-share/`
5. Bagikan tautan website tersebut kepada seluruh pengawas ruang ujian!

---

## 💡 Cara Kerja Berbagi Token Saat Ujian

1. **Ketika Proktor merilis token baru**:
   - Proktor bisa langsung menekan tombol **Update** / **Rilis Token** pada ruangan terkait di website ini, mengetikkan 6 huruf token baru (atau menekan tombol *Acak*), lalu klik **Simpan & Bagikan Token**.
   - *ATAU*, proktor/teknisi utama bisa langsung mengedit kolom `TOKEN` di Google Spreadsheet.
2. **Dalam hitungan detik**:
   - Seluruh layar HP atau komputer pengawas ruangan pasangannya (misal R1 mengupdate token, pengawas R2 sedang membuka web di ruang sebelah) akan berbunyi *ding-dong* (*chime*) dan menampilkan token terbaru secara otomatis tanpa perlu refresh manual.
   - Pengawas cukup menekan tombol **Salin Token** untuk memasukkannya ke komputer ujian peserta atau menuliskannya di papan tulis ruang ujian.

---

## 🔒 Privasi & Keamanan
- Konfigurasi URL Google Apps Script disimpan aman di `localStorage` peramban masing-masing pengguna.
- Tidak membutuhkan server berbayar, database SQL, atau API key pihak ketiga berbayar.
