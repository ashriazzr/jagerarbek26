# 📖 Panduan Penggunaan Sistem Absensi Keterlambatan Siswa

## Petunjuk Lengkap untuk Pengguna

---

## 🎯 Ringkasan Fitur

Sistem ini memiliki 5 menu utama:
1. **Dashboard** - Melihat statistik dan grafik
2. **Absensi Keterlambatan** - Input data siswa terlambat
3. **Data Razia** - Input dan kelola barang sitaan
4. **Laporan** - Lihat akumulasi data per hari/bulan
5. **Data Siswa** - Kelola database siswa

---

## 🏁 Mulai Menggunakan

### Langkah Pertama: Setup Data Siswa

Sebelum bisa input keterlambatan, Anda harus punya data siswa terlebih dahulu.

1. **Buka menu "Data Siswa"**
   - Klik icon "Users" di sidebar
   - Atau klik menu "Data Siswa"

2. **Klik tombol "Tambah Siswa"**
   - Tombol biru di pojok kanan atas

3. **Isi form dengan data siswa:**
   - **Nama Lengkap**: Nama lengkap siswa
   - **Kelas**: Format bebas (contoh: X IPA 1, XI IPS 2, XII MIPA 3)
   - **NIS**: Nomor Induk Siswa (bisa angka atau kombinasi)

4. **Klik "Tambah Siswa"**

5. **Ulangi untuk semua siswa**

**Tips:**
- Input data per kelas untuk lebih terorganisir
- Gunakan format kelas yang konsisten
- Simpan data siswa sebagai backup (export ke Excel jika perlu)

---

## 📝 Cara Input Keterlambatan

### Alur Input:

1. **Buka menu "Absensi Keterlambatan"**

2. **Pilih Kelas**
   - Dropdown akan menampilkan semua kelas yang ada
   - Pilih kelas siswa yang terlambat

3. **Pilih Nama Siswa**
   - Setelah kelas dipilih, dropdown siswa akan aktif
   - Pilih nama siswa yang terlambat
   - Akan muncul NIS siswa juga

4. **Input Alasan Keterlambatan**
   - Tuliskan alasan secara jelas dan lengkap
   - Contoh yang baik:
     - ❌ Terlambat (terlalu singkat)
     - ✅ Bangun kesiangan, alarm tidak berbunyi
     - ✅ Macet di jalan raya karena kecelakaan
     - ✅ Ban motor bocor di tengah jalan

5. **Cek/Sesuaikan Waktu**
   - Waktu akan otomatis terisi dengan waktu sekarang
   - Jika siswa datang beberapa menit lalu, klik field waktu dan sesuaikan
   - Atau klik tombol "Sekarang" untuk reset ke waktu sekarang

6. **Klik "Simpan Data Keterlambatan"**

7. **Selesai!**
   - Akan muncul notifikasi "Data keterlambatan berhasil disimpan"
   - Form otomatis reset untuk input siswa berikutnya

### Screenshot Alur (Ilustrasi):
```
[Pilih Kelas] → [Pilih Siswa] → [Input Alasan] → [Cek Waktu] → [Simpan]
```

---

## 🚨 Cara Input Data Razia

### Kapan Menggunakan Fitur Ini:
- Saat ada razia di sekolah
- Ada barang yang harus disita dari siswa
- Perlu mencatat siapa pemilik barang sitaan

### Alur Input:

1. **Buka menu "Data Razia"**

2. **Isi Form Input Barang Sitaan:**

   **a. Pilih Kelas**
   - Pilih kelas siswa yang terkena razia

   **b. Pilih Nama Siswa**
   - Pilih nama siswa pemilik barang

   **c. Nama Barang Sitaan**
   - Tuliskan nama barang yang disita
   - Contoh: Handphone Samsung A50, Rokok 1 bungkus, Vape, dll.

   **d. Tanggal Sita**
   - Otomatis terisi tanggal hari ini
   - Bisa diubah jika perlu

3. **Klik "Simpan Data Sitaan"**

4. **Data akan muncul di tabel di bawahnya**
   - Status: "Belum Diambil" (warna merah)

### Cara Tandai Barang Sudah Diambil:

1. **Di tabel daftar barang sitaan:**
   - Cari data barang yang akan ditandai
   - Klik icon **✓** (checkmark hijau) di kolom Aksi

2. **Status otomatis berubah:**
   - Status: "Sudah Diambil" (warna hijau)
   - Tanggal Ambil: Otomatis terisi tanggal hari ini

### Filter Data Razia:

Gunakan tombol filter di atas tabel:
- **Semua**: Tampilkan semua data
- **Belum Diambil**: Hanya yang masih disimpan
- **Sudah Diambil**: Hanya yang sudah dikembalikan

---

## 📊 Cara Melihat Laporan

### Laporan Per Hari:

1. **Buka menu "Laporan"**

2. **Pastikan mode "Per Hari" aktif** (tombol biru)

3. **Pilih tanggal yang ingin dilihat**
   - Klik field tanggal
   - Pilih dari kalender

4. **Lihat data:**
   - Total keterlambatan pada hari itu
   - Grafik distribusi per kelas
   - Top 10 siswa yang sering terlambat
   - Detail lengkap setiap kejadian

### Laporan Per Bulan:

1. **Klik tombol "Per Bulan"**

2. **Pilih bulan dan tahun**

3. **Lihat akumulasi keterlambatan sepanjang bulan**

### Export dan Print:

**Export ke CSV:**
1. Klik tombol **"Export"** (hijau)
2. File CSV akan otomatis terdownload
3. Bisa dibuka di Excel/Google Sheets
4. Format: Tanggal, Waktu, Nama, Kelas, NIS, Alasan

**Print Laporan:**
1. Klik tombol **"Print"** (abu-abu)
2. Dialog print browser akan muncul
3. Pilih printer atau Save as PDF
4. Klik Print

**Tips Print:**
- Gunakan orientasi Portrait untuk detail
- Gunakan Landscape jika tabel terlalu lebar
- Bisa save as PDF untuk arsip digital

---

## 📈 Dashboard - Memahami Statistik

### Card Statistik:

1. **Total Siswa**
   - Jumlah semua siswa yang terdaftar
   - Warna: Biru

2. **Terlambat Hari Ini**
   - Berapa siswa yang terlambat hari ini
   - Warna: Orange

3. **Terlambat Bulan Ini**
   - Akumulasi keterlambatan sepanjang bulan
   - Warna: Ungu

4. **Barang Sitaan Aktif**
   - Barang yang belum diambil
   - Warna: Merah

### Grafik:

**Grafik Keterlambatan 7 Hari Terakhir:**
- Batang biru menunjukkan jumlah keterlambatan
- Sumbu X: Tanggal (format DD/MM)
- Sumbu Y: Jumlah keterlambatan

**Cara Membaca:**
- Batang tinggi = Banyak yang terlambat
- Batang rendah = Sedikit yang terlambat
- Bisa melihat tren per hari

---

## 👥 Kelola Data Siswa

### Menambah Siswa:

Sudah dijelaskan di bagian "Langkah Pertama" di atas.

### Mencari Siswa:

1. **Search Box:**
   - Ketik nama atau NIS siswa
   - Hasil akan otomatis terfilter

2. **Filter Kelas:**
   - Pilih kelas dari dropdown
   - Hanya siswa dari kelas tersebut yang muncul

### Menghapus Siswa:

1. Cari siswa yang ingin dihapus
2. Klik tombol **"Hapus"** di kolom Aksi
3. Konfirmasi dengan klik **OK**
4. Data siswa terhapus permanen

**⚠️ PERINGATAN:**
- Hati-hati saat menghapus data siswa
- Data yang sudah dihapus tidak bisa dikembalikan
- Pastikan siswa benar-benar sudah tidak aktif

---

## 💡 Tips dan Best Practices

### Untuk Input Keterlambatan:

1. **Input Segera:**
   - Input data keterlambatan saat siswa datang
   - Jangan ditunda agar waktu akurat

2. **Alasan Jelas:**
   - Tuliskan alasan dengan detail
   - Berguna untuk analisis pola keterlambatan

3. **Cek Data:**
   - Pastikan siswa dan kelas benar sebelum simpan
   - Tidak bisa edit setelah disimpan, hanya bisa hapus

### Untuk Data Razia:

1. **Foto Barang:**
   - Sebaiknya foto barang sitaan sebagai bukti
   - Simpan di tempat lain (sistem belum support upload foto)

2. **Deskripsi Detail:**
   - Tuliskan merk, warna, atau ciri khas barang
   - Contoh: "HP Samsung A50 warna biru dengan case bergambar"

3. **Update Status:**
   - Jangan lupa tandai "Sudah Diambil" setelah dikembalikan
   - Agar data akurat

### Untuk Laporan:

1. **Export Rutin:**
   - Export data setiap minggu/bulan sebagai backup
   - Simpan file CSV di folder yang aman

2. **Print untuk Arsip:**
   - Print laporan bulanan untuk arsip fisik
   - Bisa untuk rapat atau evaluasi

3. **Analisis Data:**
   - Perhatikan kelas dengan keterlambatan tertinggi
   - Perhatikan siswa yang sering terlambat
   - Gunakan untuk tindak lanjut

### Untuk Data Siswa:

1. **Konsistensi Format:**
   - Gunakan format kelas yang sama untuk semua
   - Contoh: selalu "X IPA 1", bukan "10 IPA 1" atau "Sepuluh IPA 1"

2. **NIS Unik:**
   - Pastikan setiap siswa punya NIS berbeda
   - Jangan sampai ada NIS kembar

3. **Update Berkala:**
   - Hapus siswa yang sudah lulus
   - Tambah siswa baru setiap tahun ajaran

---

## 🔐 Keamanan dan Privasi

### Data Tersimpan di Cloud:

- Semua data tersimpan di server Supabase (cloud)
- Data aman dan encrypted
- Bisa diakses dari mana saja dengan koneksi internet

### Backup Data:

**Cara Manual:**
1. Export semua laporan ke CSV
2. Simpan file di komputer lokal
3. Backup ke Google Drive atau cloud storage lain

**Frekuensi Backup yang Disarankan:**
- Harian: Tidak perlu
- Mingguan: Bagus untuk sekolah kecil
- Bulanan: Minimum untuk arsip

### Akses Multi-User:

- Website bisa diakses banyak user sekaligus
- Data akan sinkron otomatis
- Pastikan semua user tahu cara menggunakan dengan benar

---

## ❓ FAQ (Frequently Asked Questions)

### Q: Apakah bisa diakses dari HP?
**A:** Ya! Website ini responsive dan bisa diakses dari HP, tablet, atau komputer.

### Q: Apakah perlu koneksi internet?
**A:** Ya, karena data tersimpan di cloud. Tanpa internet, data tidak bisa disimpan atau dimuat.

### Q: Apakah data aman?
**A:** Ya, data tersimpan di server Supabase yang aman dan encrypted.

### Q: Bisa edit data yang sudah disimpan?
**A:** Saat ini belum ada fitur edit. Jika salah input, hapus dan input ulang.

### Q: Berapa lama data tersimpan?
**A:** Data tersimpan permanen selama tidak dihapus manual.

### Q: Bisa export ke Excel?
**A:** Ya, export ke CSV kemudian buka dengan Excel atau Google Sheets.

### Q: Maksimal berapa siswa?
**A:** Tidak ada batasan. Bisa ribuan siswa.

### Q: Apakah gratis?
**A:** Ya, untuk penggunaan normal. Supabase free tier cukup untuk sekolah menengah.

### Q: Bisa tambah fitur custom?
**A:** Ya, jika Anda punya programmer atau developer, kode bisa dimodifikasi.

---

## 📞 Dukungan dan Bantuan

Jika ada masalah atau pertanyaan:

1. **Cek bagian Troubleshooting** di file INSTALASI.md
2. **Baca dokumentasi** ini dengan teliti
3. **Hubungi admin IT** sekolah Anda
4. **Buat issue** di GitHub repository (jika paham Git)

---

## 🎓 Pelatihan Pengguna

### Untuk Staff Sekolah:

Disarankan melakukan pelatihan singkat:

**Durasi:** 30-60 menit

**Materi:**
1. Pengenalan sistem (5 menit)
2. Cara input keterlambatan (10 menit)
3. Cara input data razia (10 menit)
4. Cara lihat dan export laporan (10 menit)
5. Q&A dan praktik (15-25 menit)

**Metode:**
- Demo langsung dengan projector
- Peserta praktik langsung dengan data dummy
- Berikan panduan tertulis (print dokumen ini)

---

## 🏆 Kesimpulan

Sistem Absensi Keterlambatan Siswa ini dirancang untuk:
- ✅ Memudahkan input dan pencatatan
- ✅ Menyimpan data dengan aman
- ✅ Menghasilkan laporan yang informatif
- ✅ Dapat diakses dari berbagai perangkat

Gunakan dengan bijak dan konsisten untuk hasil terbaik!

---

**Selamat menggunakan! 🎉**

Semoga sistem ini membantu administrasi sekolah Anda menjadi lebih efisien!
