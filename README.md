# 📚 Sistem Absensi Keterlambatan Siswa

Website aplikasi untuk mendata dan mengelola keterlambatan siswa serta barang sitaan hasil razia sekolah.

![Dashboard Preview](https://img.shields.io/badge/Status-Active-success)
![React](https://img.shields.io/badge/React-18.3.1-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-Yes-blue)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-v4-38bdf8)

## 🌟 Fitur Utama

### 📊 Dashboard
- Statistik real-time total siswa, keterlambatan hari ini, dan bulanan
- Grafik keterlambatan 7 hari terakhir
- Informasi barang sitaan aktif
- Overview sistem yang lengkap

### ⏰ Absensi Keterlambatan
- Input data siswa yang terlambat dengan mudah
- Pilih kelas dan nama siswa dari database
- Input alasan keterlambatan
- Timestamp otomatis (real-time) dengan opsi edit manual
- Form yang user-friendly dan terstruktur

### 🚨 Data Razia
- Input barang sitaan hasil razia
- Pilih siswa yang terkena razia
- Tanggal sita dan tanggal pengambilan
- Status barang (Belum Diambil / Sudah Diambil)
- Filter data berdasarkan status
- Update status pengambilan barang

### 📈 Laporan
- **Laporan Per Hari**: Lihat keterlambatan pada tanggal tertentu
- **Laporan Per Bulan**: Akumulasi keterlambatan bulanan
- Grafik distribusi per kelas
- Top 10 siswa yang sering terlambat
- Detail lengkap setiap kejadian
- **Export ke CSV** untuk analisis lebih lanjut
- **Print** laporan langsung dari browser

### 👥 Data Siswa
- Tambah, edit, dan hapus data siswa
- Cari siswa berdasarkan nama atau NIS
- Filter berdasarkan kelas
- Statistik distribusi siswa per kelas
- Manajemen database siswa yang lengkap

## 🛠️ Teknologi yang Digunakan

- **Frontend Framework:** React 18.3.1 dengan TypeScript
- **Routing:** React Router v7
- **Styling:** Tailwind CSS v4
- **UI Components:** Radix UI (shadcn/ui)
- **Charts:** Recharts
- **Icons:** Lucide React
- **Date Handling:** date-fns
- **Notifications:** Sonner
- **Backend:** Supabase (Database & API)
- **Build Tool:** Vite
- **Deployment:** GitHub Pages

## 🚀 Instalasi dan Penggunaan

### Prasyarat
- Node.js versi 18 atau lebih baru
- pnpm (atau npm/yarn)
- Git

### Langkah Instalasi

1. Clone repository:
```bash
git clone https://github.com/username-anda/absensi-siswa.git
cd absensi-siswa
```

2. Install dependencies:
```bash
pnpm install
# atau
npm install
```

3. Jalankan development server:
```bash
pnpm run dev
# atau
npm run dev
```

4. Buka browser dan akses `http://localhost:5173`

### Build untuk Production

```bash
pnpm run build
# atau
npm run build
```

Output akan berada di folder `dist/`

## 📦 Deploy ke GitHub Pages

Lihat file [TUTORIAL-GITHUB-PAGES.md](./TUTORIAL-GITHUB-PAGES.md) untuk panduan lengkap deployment ke GitHub Pages.

### Quick Deploy

1. Commit semua perubahan (termasuk `.github/workflows/deploy.yml`)
2. Push ke branch `main` di GitHub
3. Aktifkan GitHub Pages di Settings repository dengan source `GitHub Actions`
4. Tunggu workflow selesai di tab Actions
5. Website otomatis deploy dan dapat diakses di `https://username.github.io/repo-name/`

## 🔧 Konfigurasi

### Supabase Backend

Website ini menggunakan Supabase untuk penyimpanan cloud. Untuk mengonfigurasi:

1. Buat project di [Supabase](https://supabase.com)
2. Dapatkan Project URL dan Anon Key
3. Konfigurasi di file `/utils/supabase/info.tsx`

### Environment Variables

Jika diperlukan, buat file `.env.local`:

```env
VITE_SUPABASE_URL=your-project-url
VITE_SUPABASE_ANON_KEY=your-anon-key
```

## 📱 Akses Multi-Device

Website ini fully responsive dan dapat diakses dari:
- 💻 Desktop/Laptop
- 📱 Mobile Phone
- 📱 Tablet
- 🌐 Semua browser modern

## 🎯 Panduan Penggunaan

### 1. Setup Awal - Data Siswa
1. Buka menu **Data Siswa**
2. Klik **Tambah Siswa**
3. Isi data: Nama, Kelas, dan NIS
4. Klik **Tambah Siswa**
5. Ulangi untuk semua siswa

### 2. Input Keterlambatan
1. Buka menu **Absensi Keterlambatan**
2. Pilih kelas siswa
3. Pilih nama siswa
4. Input alasan keterlambatan
5. Sesuaikan waktu jika perlu (otomatis waktu sekarang)
6. Klik **Simpan Data Keterlambatan**

### 3. Input Data Razia
1. Buka menu **Data Razia**
2. Pilih kelas dan siswa
3. Input nama barang yang disita
4. Pilih tanggal penyitaan
5. Klik **Simpan Data Sitaan**

### 4. Lihat Laporan
1. Buka menu **Laporan**
2. Pilih mode: Per Hari atau Per Bulan
3. Pilih tanggal/bulan yang ingin dilihat
4. Lihat statistik, grafik, dan detail
5. Export ke CSV atau Print jika diperlukan

## 📊 Fitur Analytics

- Grafik keterlambatan per kelas
- Top 10 siswa yang sering terlambat
- Tren keterlambatan 7 hari terakhir
- Statistik distribusi per kelas
- Data akumulasi harian dan bulanan

## 🔒 Keamanan

- Data tersimpan aman di Supabase cloud
- CORS protection untuk API
- Input validation pada semua form
- Confirmation dialog untuk delete actions

## 🤝 Kontribusi

Kontribusi selalu welcome! Silakan:
1. Fork repository ini
2. Buat branch fitur baru (`git checkout -b fitur-baru`)
3. Commit perubahan (`git commit -m 'Menambah fitur baru'`)
4. Push ke branch (`git push origin fitur-baru`)
5. Buat Pull Request

## 📝 License

Project ini dibuat untuk keperluan edukasi dan manajemen sekolah.

## 📞 Support

Jika ada pertanyaan atau issue:
- Buat issue di GitHub repository
- Hubungi administrator sekolah

## ✅ Checklist Deployment

- [ ] Install Git dan Node.js
- [ ] Clone/download project
- [ ] Install dependencies
- [ ] Test di local
- [ ] Buat GitHub repository
- [ ] Update vite.config.ts (base URL)
- [ ] Commit dan push ke GitHub
- [ ] Setup GitHub Pages
- [ ] Akses website di github.io

---

**Dibuat dengan ❤️ untuk memudahkan administrasi sekolah**

Versi: 1.0.0  
Last Updated: April 2026
