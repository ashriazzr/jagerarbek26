# 📖 Tutorial Deploy Website Absensi Keterlambatan Siswa ke GitHub Pages

## 🎯 Panduan Lengkap untuk Push ke GitHub dan Deploy ke GitHub.io

### Langkah 1: Persiapan Awal

#### A. Install Git (jika belum ada)
1. Download Git dari https://git-scm.com/downloads
2. Install sesuai sistem operasi Anda
3. Verifikasi instalasi dengan membuka terminal/command prompt dan ketik:
   ```bash
   git --version
   ```

#### B. Buat Akun GitHub (jika belum punya)
1. Kunjungi https://github.com
2. Klik "Sign up" dan ikuti prosesnya
3. Verifikasi email Anda

---

### Langkah 2: Konfigurasi Proyek untuk GitHub Pages

#### A. Buat file konfigurasi Vite untuk GitHub Pages

Buat file baru `vite.config.ts` atau edit yang sudah ada dengan konten berikut:

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: '/nama-repository-anda/', // GANTI dengan nama repository Anda
})
```

**PENTING:** Ganti `nama-repository-anda` dengan nama repository yang akan Anda buat. Misalnya jika repository bernama `absensi-siswa`, maka isi dengan `/absensi-siswa/`

#### B. Update package.json untuk build

Pastikan file `package.json` sudah memiliki script build. Tambahkan juga script untuk deploy:

```json
{
  "scripts": {
    "build": "vite build",
    "predeploy": "npm run build",
    "deploy": "gh-pages -d dist"
  }
}
```

---

### Langkah 3: Inisialisasi Git dan Push ke GitHub

#### A. Inisialisasi Git di Folder Proyek

Buka terminal/command prompt di folder proyek Anda, kemudian jalankan:

```bash
git init
git add .
git commit -m "Initial commit: Sistem Absensi Keterlambatan Siswa"
```

#### B. Buat Repository di GitHub

1. Login ke GitHub
2. Klik tombol "+" di pojok kanan atas → "New repository"
3. Isi form:
   - **Repository name:** `absensi-siswa` (atau nama lain sesuai keinginan)
   - **Description:** "Website Sistem Absensi Keterlambatan Siswa"
   - **Public/Private:** Pilih **Public** (agar bisa di-deploy ke GitHub Pages gratis)
   - **JANGAN** centang "Add a README file"
4. Klik "Create repository"

#### C. Hubungkan Project ke GitHub Repository

Setelah repository dibuat, GitHub akan menampilkan instruksi. Salin dan jalankan perintah berikut di terminal:

```bash
git remote add origin https://github.com/username-anda/nama-repository.git
git branch -M main
git push -u origin main
```

**Ganti:**
- `username-anda` dengan username GitHub Anda
- `nama-repository` dengan nama repository yang Anda buat

---

### Langkah 4: Deploy ke GitHub Pages

#### Opsi A: Menggunakan GitHub Actions (RECOMMENDED)

1. Di folder proyek, buat folder `.github/workflows`
2. Buat file baru `.github/workflows/deploy.yml` dengan isi:

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [ main ]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4
      
      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: '20'
      
      - name: Install pnpm
        uses: pnpm/action-setup@v2
        with:
          version: 8
      
      - name: Install dependencies
        run: pnpm install
      
      - name: Build
        run: pnpm run build
      
      - name: Upload artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: ./dist

  deploy:
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    needs: build
    steps:
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
```

3. Commit dan push file ini:
```bash
git add .github/workflows/deploy.yml
git commit -m "Add GitHub Actions workflow for deployment"
git push
```

4. **Aktifkan GitHub Pages:**
   - Buka repository di GitHub
   - Klik tab **Settings**
   - Scroll ke bagian **Pages** (di sidebar kiri)
   - Di **Source**, pilih **GitHub Actions**
   - Klik **Save**

5. Workflow akan otomatis berjalan. Cek di tab **Actions** di repository Anda

#### Opsi B: Deploy Manual dengan gh-pages

1. Install package gh-pages:
```bash
npm install --save-dev gh-pages
```

2. Jalankan build dan deploy:
```bash
npm run build
npx gh-pages -d dist
```

3. **Aktifkan GitHub Pages:**
   - Buka repository di GitHub
   - Klik tab **Settings**
   - Scroll ke bagian **Pages**
   - Di **Source**, pilih branch **gh-pages**
   - Klik **Save**

---

### Langkah 5: Akses Website Anda

Setelah deployment selesai (biasanya 1-5 menit), website Anda dapat diakses di:

```
https://username-anda.github.io/nama-repository/
```

Contoh:
- Username: `johndoe`
- Repository: `absensi-siswa`
- URL: `https://johndoe.github.io/absensi-siswa/`

---

### 🔄 Update Website di Masa Depan

Setiap kali Anda ingin update website:

1. Lakukan perubahan di kode
2. Commit perubahan:
   ```bash
   git add .
   git commit -m "Deskripsi perubahan"
   git push
   ```
3. Jika menggunakan GitHub Actions, website akan otomatis ter-update
4. Jika manual, jalankan lagi: `npm run deploy`

---

### 🔧 Troubleshooting

#### Masalah: Website tidak muncul atau error 404
**Solusi:**
1. Pastikan `base` di `vite.config.ts` sesuai dengan nama repository
2. Pastikan GitHub Pages sudah diaktifkan di Settings
3. Tunggu beberapa menit untuk propagasi

#### Masalah: Assets (CSS/JS) tidak load
**Solusi:**
1. Cek lagi setting `base` di `vite.config.ts`
2. Pastikan build ulang setelah mengubah konfigurasi
3. Clear cache browser (Ctrl + Shift + R)

#### Masalah: API Supabase tidak jalan
**Solusi:**
1. Pastikan Supabase credentials sudah dikonfigurasi
2. Cek CORS settings di Supabase dashboard
3. Verifikasi environment variables

---

### 📱 Akses dari Berbagai Device

Setelah website live di GitHub Pages:

1. **Desktop/Laptop:** Buka URL di browser
2. **Mobile/Tablet:** Buka URL di browser mobile
3. **Bookmark:** Save URL untuk akses cepat
4. **PWA (Optional):** Bisa ditambahkan ke home screen di mobile

Website ini responsive dan bisa diakses dari device apapun dengan koneksi internet!

---

### 🎉 Selamat!

Website Sistem Absensi Keterlambatan Siswa Anda sekarang sudah online dan dapat diakses dari mana saja!

#### Fitur yang Tersedia:
✅ Dashboard dengan statistik real-time  
✅ Form absensi keterlambatan dengan timestamp  
✅ Form data razia barang sitaan  
✅ Laporan per hari dan per bulan  
✅ Manajemen data siswa  
✅ Export laporan ke CSV  
✅ Print laporan  
✅ Penyimpanan cloud dengan Supabase  
✅ Responsive untuk semua device  

---

### 📞 Bantuan Lebih Lanjut

Jika ada pertanyaan atau masalah:
1. Cek dokumentasi GitHub Pages: https://pages.github.com/
2. Cek dokumentasi Vite: https://vitejs.dev/
3. Cek dokumentasi Supabase: https://supabase.com/docs

---

**Catatan Penting:**
- Pastikan koneksi internet stabil saat deploy
- Backup kode secara berkala
- Jangan commit file sensitive (API keys, passwords) ke GitHub
- Gunakan environment variables untuk data sensitif
