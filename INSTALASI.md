# 🚀 Panduan Instalasi Lengkap

## Sistem Absensi Keterlambatan Siswa

Panduan ini akan membantu Anda menginstall dan menjalankan sistem absensi keterlambatan siswa dari awal hingga bisa digunakan.

---

## 📋 Persyaratan Sistem

### Perangkat Lunak yang Diperlukan:

1. **Node.js** (versi 18 atau lebih baru)
   - Download: https://nodejs.org/
   - Pilih versi LTS (Long Term Support)
   - Install sesuai sistem operasi Anda

2. **Git** (untuk version control)
   - Download: https://git-scm.com/downloads
   - Install dengan setting default

3. **Text Editor** (pilih salah satu):
   - Visual Studio Code (Recommended): https://code.visualstudio.com/
   - Sublime Text: https://www.sublimetext.com/
   - Notepad++: https://notepad-plus-plus.org/

4. **Browser Modern** (Chrome, Firefox, Edge, atau Safari versi terbaru)

### Hardware Minimum:
- RAM: 4GB (8GB recommended)
- Storage: 500MB free space
- Processor: Dual-core atau lebih

---

## 🔧 Langkah 1: Install Node.js dan Git

### Windows:

1. **Install Node.js:**
   - Download installer dari https://nodejs.org/
   - Jalankan installer
   - Klik "Next" terus hingga selesai
   - Restart komputer

2. **Verifikasi instalasi:**
   - Buka Command Prompt (tekan `Win + R`, ketik `cmd`, Enter)
   - Ketik: `node --version`
   - Ketik: `npm --version`
   - Jika muncul nomor versi, instalasi berhasil

3. **Install Git:**
   - Download dari https://git-scm.com/download/win
   - Jalankan installer dengan setting default
   - Verifikasi: `git --version`

### macOS:

1. **Install Homebrew** (jika belum ada):
   ```bash
   /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
   ```

2. **Install Node.js:**
   ```bash
   brew install node
   ```

3. **Install Git:**
   ```bash
   brew install git
   ```

4. **Verifikasi:**
   ```bash
   node --version
   npm --version
   git --version
   ```

### Linux (Ubuntu/Debian):

```bash
# Update package list
sudo apt update

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install Git
sudo apt-get install git

# Verifikasi
node --version
npm --version
git --version
```

---

## 📦 Langkah 2: Download Project

### Opsi A: Download ZIP (Paling Mudah)

1. Jika Anda punya file ZIP project, extract ke folder yang mudah diakses
   - Contoh: `C:\Projects\absensi-siswa` (Windows)
   - Contoh: `~/Projects/absensi-siswa` (macOS/Linux)

### Opsi B: Clone dari GitHub

1. Buka terminal/command prompt
2. Navigate ke folder tempat Anda ingin menyimpan project:
   ```bash
   cd C:\Projects  # Windows
   cd ~/Projects   # macOS/Linux
   ```

3. Clone repository:
   ```bash
   git clone https://github.com/username/absensi-siswa.git
   cd absensi-siswa
   ```

---

## 🔨 Langkah 3: Install Dependencies

1. **Buka terminal di folder project:**
   - Windows: Shift + Right Click di folder → "Open PowerShell window here"
   - macOS/Linux: Right Click → "Open Terminal here"
   - Atau buka VS Code dan buka folder project

2. **Install dependencies:**
   
   Jika menggunakan npm (default):
   ```bash
   npm install
   ```
   
   Atau jika menggunakan pnpm (lebih cepat):
   ```bash
   # Install pnpm terlebih dahulu
   npm install -g pnpm
   
   # Install dependencies
   pnpm install
   ```

3. **Tunggu proses instalasi:**
   - Proses ini akan download semua library yang diperlukan
   - Biasanya memakan waktu 2-5 menit tergantung koneksi internet
   - Jika muncul warning, bisa diabaikan

---

## ⚙️ Langkah 4: Konfigurasi (Opsional)

Jika Anda ingin menggunakan penyimpanan cloud sendiri:

1. **Buat akun Supabase** (gratis):
   - Kunjungi https://supabase.com
   - Sign up dengan email atau GitHub
   - Buat project baru

2. **Dapatkan credentials:**
   - Di dashboard Supabase, klik Settings → API
   - Copy "Project URL" dan "anon/public key"

3. **Update file konfigurasi:**
   - Buka file `/utils/supabase/info.tsx`
   - Ganti dengan credentials Anda

---

## 🚀 Langkah 5: Jalankan Aplikasi

1. **Start development server:**
   ```bash
   npm run dev
   ```
   
   Atau dengan pnpm:
   ```bash
   pnpm run dev
   ```

2. **Tunggu hingga muncul pesan:**
   ```
   VITE v6.x.x ready in xxx ms
   
   ➜  Local:   http://localhost:5173/
   ➜  Network: use --host to expose
   ```

3. **Buka browser:**
   - Kunjungi http://localhost:5173
   - Website seharusnya sudah berjalan!

4. **Stop server:**
   - Tekan `Ctrl + C` di terminal
   - Ketik `Y` dan Enter

---

## 📝 Langkah 6: Setup Data Awal

### 6.1 Tambah Data Siswa Pertama

1. Klik menu **"Data Siswa"** di sidebar
2. Klik tombol **"Tambah Siswa"**
3. Isi form:
   - Nama: `Ahmad Rizki`
   - Kelas: `X IPA 1`
   - NIS: `2024001`
4. Klik **"Tambah Siswa"**

### 6.2 Tambah Lebih Banyak Siswa

Ulangi langkah di atas untuk menambah lebih banyak siswa dengan data yang berbeda.

**Contoh data siswa:**
```
Nama: Siti Nurhaliza | Kelas: X IPA 1 | NIS: 2024002
Nama: Budi Santoso   | Kelas: X IPA 2 | NIS: 2024003
Nama: Dewi Lestari   | Kelas: XI IPS 1 | NIS: 2023001
Nama: Eko Prasetyo   | Kelas: XI IPS 1 | NIS: 2023002
```

### 6.3 Coba Input Keterlambatan

1. Klik menu **"Absensi Keterlambatan"**
2. Pilih kelas siswa
3. Pilih nama siswa
4. Input alasan: `Bangun kesiangan`
5. Waktu akan otomatis terisi dengan waktu sekarang
6. Klik **"Simpan Data Keterlambatan"**

### 6.4 Lihat Dashboard

1. Klik menu **"Dashboard"**
2. Anda akan melihat statistik dan grafik data yang baru saja diinput

---

## 🌐 Langkah 7: Build untuk Production (Opsional)

Jika ingin membuat versi production untuk di-deploy:

```bash
npm run build
```

File production akan dibuat di folder `dist/`

---

## 📱 Akses dari Device Lain

### Opsi 1: Akses di Jaringan Lokal (LAN)

1. **Jalankan server dengan expose:**
   ```bash
   npm run dev -- --host
   ```

2. **Cari IP address komputer Anda:**
   
   Windows:
   ```bash
   ipconfig
   ```
   Cari "IPv4 Address", contoh: `192.168.1.100`
   
   macOS/Linux:
   ```bash
   ifconfig
   ```
   Cari "inet", contoh: `192.168.1.100`

3. **Akses dari device lain:**
   - Pastikan device di jaringan WiFi yang sama
   - Buka browser di device lain
   - Akses: `http://192.168.1.100:5173`
   - Ganti dengan IP address komputer Anda

### Opsi 2: Deploy ke GitHub Pages

Untuk akses dari internet (bukan hanya LAN), ikuti panduan di [TUTORIAL-GITHUB-PAGES.md](./TUTORIAL-GITHUB-PAGES.md)

---

## ❗ Troubleshooting

### Error: "npm not found" atau "node not found"

**Solusi:**
1. Pastikan Node.js sudah terinstall
2. Restart terminal/command prompt
3. Restart komputer jika perlu

### Error: "EACCES: permission denied"

**Solusi (macOS/Linux):**
```bash
sudo chown -R $USER /usr/local/lib/node_modules
```

**Solusi (Windows):**
- Run Command Prompt as Administrator

### Error: "Port 5173 already in use"

**Solusi:**
1. Stop aplikasi yang menggunakan port tersebut
2. Atau ubah port di terminal:
   ```bash
   npm run dev -- --port 3000
   ```

### Website blank atau tidak muncul

**Solusi:**
1. Cek console browser (F12)
2. Lihat error yang muncul
3. Pastikan semua dependencies ter-install
4. Coba hapus folder `node_modules` dan install ulang:
   ```bash
   rm -rf node_modules
   npm install
   ```

### Data tidak tersimpan

**Solusi:**
1. Pastikan koneksi internet aktif
2. Cek konfigurasi Supabase
3. Lihat console browser untuk error messages

---

## 🎓 Tutorial Video (Opsional)

Untuk panduan visual, Anda bisa membuat video tutorial atau mencari di YouTube:
- "How to install Node.js"
- "How to run React application"
- "Git and GitHub tutorial"

---

## 📞 Bantuan Lebih Lanjut

Jika masih ada masalah:

1. **Cek dokumentasi:**
   - Node.js: https://nodejs.org/docs/
   - Vite: https://vitejs.dev/
   - React: https://react.dev/

2. **Cari di Google:**
   - Copy paste error message ke Google
   - Biasanya ada solusi di StackOverflow

3. **Hubungi administrator:**
   - Jika ini untuk sekolah, hubungi admin IT sekolah

---

## ✅ Checklist Instalasi

Pastikan semua langkah berikut sudah dilakukan:

- [ ] Node.js terinstall (cek dengan `node --version`)
- [ ] Git terinstall (cek dengan `git --version`)
- [ ] Project sudah di-download/clone
- [ ] Dependencies sudah di-install (`npm install`)
- [ ] Server bisa jalan (`npm run dev`)
- [ ] Website bisa diakses di browser
- [ ] Bisa tambah data siswa
- [ ] Bisa input keterlambatan
- [ ] Dashboard menampilkan data

---

## 🎉 Selamat!

Jika semua checklist di atas sudah ✅, instalasi berhasil!

Anda sekarang bisa mulai menggunakan Sistem Absensi Keterlambatan Siswa.

---

**Happy Coding! 🚀**

Jika ada pertanyaan, jangan ragu untuk bertanya!
