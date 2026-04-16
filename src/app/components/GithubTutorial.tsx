import { useState } from 'react';
import {
  Github,
  Terminal,
  Globe,
  ChevronRight,
  CheckCircle,
  Copy,
  Check,
  BookOpen,
  ExternalLink,
  Info,
  AlertTriangle,
} from 'lucide-react';

function CodeBlock({ code, lang = 'bash' }: { code: string; lang?: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative bg-gray-900 rounded-xl overflow-hidden mt-3 mb-2">
      <div className="flex items-center justify-between px-4 py-2 bg-gray-800 border-b border-gray-700">
        <span className="text-xs text-gray-400 font-mono">{lang}</span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white transition-colors"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
          {copied ? 'Tersalin!' : 'Salin'}
        </button>
      </div>
      <pre className="px-4 py-4 text-sm text-gray-100 overflow-x-auto font-mono whitespace-pre-wrap">
        {code}
      </pre>
    </div>
  );
}

function Step({
  number,
  title,
  children,
}: {
  number: number;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex gap-5">
      <div className="flex flex-col items-center flex-shrink-0">
        <div className="w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0">
          {number}
        </div>
        <div className="w-0.5 bg-gray-200 flex-1 mt-2 min-h-4" />
      </div>
      <div className="pb-8 flex-1">
        <h3 className="font-bold text-gray-900 text-lg mb-3">{title}</h3>
        <div className="text-gray-600 space-y-3">{children}</div>
      </div>
    </div>
  );
}

export function GithubTutorial() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold text-gray-900">Tutorial Deploy ke GitHub Pages</h2>
        <p className="text-gray-500 mt-1">
          Langkah-langkah untuk meng-hosting SisAbsen di GitHub Pages agar bisa diakses dari URL{' '}
          <code className="bg-gray-100 px-1.5 py-0.5 rounded text-blue-700 text-sm">username.github.io</code>
        </p>
      </div>

      {/* Info Banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5 flex gap-4">
        <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-blue-800">
          <p className="font-semibold mb-1">Catatan Penting</p>
          <p>
            GitHub Pages hanya dapat meng-hosting file frontend (HTML, CSS, JS). Data siswa dan keterlambatan
            tetap tersimpan di <strong>Supabase Cloud</strong> dan dapat diakses dari mana saja secara real-time.
            Tutorial ini fokus pada deploy frontend React-nya saja.
          </p>
        </div>
      </div>

      {/* Prerequisites */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <h3 className="font-bold text-gray-900 text-xl mb-4 flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-blue-600" />
          Prasyarat
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { icon: Github, title: 'Akun GitHub', desc: 'Buat akun di github.com jika belum ada' },
            { icon: Terminal, title: 'Git Terinstal', desc: 'Download dari git-scm.com' },
            { icon: Globe, title: 'Node.js & pnpm', desc: 'Download dari nodejs.org, lalu install pnpm' },
          ].map(item => {
            const Icon = item.icon;
            return (
              <div key={item.title} className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Icon className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900 text-sm">{item.title}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{item.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Steps */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <h3 className="font-bold text-gray-900 text-xl mb-6 flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-green-600" />
          Langkah-langkah Deploy
        </h3>

        <div className="space-y-0">
          <Step number={1} title="Download / Export Kode Program">
            <p>
              Export kode program dari Figma Make. Klik tombol <strong>"Export"</strong> atau <strong>"Download"</strong> di
              dashboard Figma Make untuk mendapatkan file ZIP berisi seluruh kode sumber.
            </p>
            <p>Ekstrak file ZIP tersebut ke sebuah folder di komputer Anda.</p>
          </Step>

          <Step number={2} title="Buat Repository di GitHub">
            <p>
              Masuk ke <a href="https://github.com" target="_blank" rel="noreferrer" className="text-blue-600 underline inline-flex items-center gap-1">github.com <ExternalLink className="w-3 h-3" /></a>{' '}
              dan buat repository baru dengan nama:{' '}
              <code className="bg-gray-100 px-1.5 py-0.5 rounded text-sm font-mono">sisabsen</code> (atau nama lain)
            </p>
            <p>Pastikan visibility repository diset ke <strong>Public</strong>.</p>
            <p>
              Jika ingin URL berupa <code className="bg-gray-100 px-1 rounded text-sm">username.github.io</code>, beri nama
              repository persis:{' '}
              <code className="bg-gray-100 px-1.5 py-0.5 rounded text-sm font-mono">username.github.io</code>
            </p>
          </Step>

          <Step number={3} title="Install Dependencies & Build">
            <p>Buka terminal di folder proyek, lalu jalankan:</p>
            <CodeBlock
              code={`# Install pnpm jika belum ada
npm install -g pnpm

# Install semua dependensi
pnpm install

# Build untuk production
pnpm build`}
            />
            <p>
              Setelah selesai, akan ada folder <code className="bg-gray-100 px-1 rounded text-sm font-mono">dist/</code> berisi
              file static yang siap di-deploy.
            </p>
          </Step>

          <Step number={4} title="Konfigurasi Vite untuk GitHub Pages">
            <p>
              Edit file <code className="bg-gray-100 px-1 rounded text-sm font-mono">vite.config.ts</code> dan tambahkan{' '}
              <code className="bg-gray-100 px-1 rounded text-sm font-mono">base</code>:
            </p>
            <CodeBlock
              code={`import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  // Ganti 'sisabsen' dengan nama repository Anda
  // Jika repo bernama 'username.github.io', gunakan base: '/'
  base: '/sisabsen/',
  plugins: [
    react(),
    tailwindcss(),
  ],
})`}
              lang="typescript"
            />
            <p>Lalu build ulang:</p>
            <CodeBlock code={`pnpm build`} />
          </Step>

          <Step number={5} title="Inisialisasi Git & Push ke GitHub">
            <p>Di dalam folder proyek, jalankan perintah berikut (ganti dengan username dan repo Anda):</p>
            <CodeBlock
              code={`# Inisialisasi git repository (jika belum)
git init

# Tambahkan remote origin (ganti dengan URL repo Anda)
git remote add origin https://github.com/USERNAME/sisabsen.git

# Stage semua file
git add .

# Commit
git commit -m "Initial commit: SisAbsen - Sistem Absensi Keterlambatan"

# Push ke branch main
git push -u origin main`}
            />
          </Step>

          <Step number={6} title="Deploy ke GitHub Pages">
            <p>Ada dua cara untuk deploy:</p>
            
            <p className="font-semibold text-gray-800">Cara A: Menggunakan gh-pages (Otomatis)</p>
            <CodeBlock
              code={`# Install gh-pages
pnpm add -D gh-pages

# Tambahkan script di package.json:
# "deploy": "gh-pages -d dist"

# Jalankan deploy
pnpm deploy`}
            />

            <p className="font-semibold text-gray-800">Cara B: Manual via GitHub Actions</p>
            <p>Buat file <code className="bg-gray-100 px-1 rounded text-sm font-mono">.github/workflows/deploy.yml</code>:</p>
            <CodeBlock
              code={`name: Deploy to GitHub Pages

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - uses: pnpm/action-setup@v2
        with:
          version: 8
      - run: pnpm install
      - run: pnpm build
      - uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: \${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./dist`}
              lang="yaml"
            />
          </Step>

          <Step number={7} title="Aktifkan GitHub Pages di Settings">
            <p>
              Buka repository di GitHub → <strong>Settings</strong> → <strong>Pages</strong> (di sidebar kiri)
            </p>
            <p>
              Di bagian <strong>Build and deployment</strong>, pilih:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-sm">
              <li>Source: <strong>Deploy from a branch</strong></li>
              <li>Branch: <strong>gh-pages</strong> → Folder: <strong>/ (root)</strong></li>
              <li>Klik <strong>Save</strong></li>
            </ul>
            <p>
              Tunggu beberapa menit, lalu website Anda akan bisa diakses di:{' '}
              <code className="bg-gray-100 px-1.5 py-0.5 rounded text-sm font-mono text-blue-700">
                https://username.github.io/sisabsen/
              </code>
            </p>
          </Step>

          <Step number={8} title="Konfigurasi React Router (Penting!)">
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-amber-800 text-sm">Perlu Konfigurasi Tambahan</p>
                <p className="text-amber-700 text-sm mt-1">
                  GitHub Pages tidak mendukung HTML5 History API secara native. Anda perlu membuat file{' '}
                  <code className="bg-amber-100 px-1 rounded text-xs">404.html</code> untuk redirect.
                </p>
              </div>
            </div>
            <p className="mt-3">Buat file <code className="bg-gray-100 px-1 rounded text-sm">public/404.html</code>:</p>
            <CodeBlock
              code={`<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>SisAbsen</title>
  <script>
    // Redirect to main page with path as query param
    var l = window.location;
    l.replace(l.protocol + '//' + l.hostname + (l.port ? ':' + l.port : '') +
      l.pathname.split('/').slice(0, 1 + 1).join('/') + '/?/' +
      l.pathname.slice(1).split('/').slice(1).join('/').replace(/&/g, '~and~') +
      (l.search ? '&' + l.search.slice(1).replace(/&/g, '~and~') : '') + l.hash);
  </script>
</head>
</html>`}
              lang="html"
            />
          </Step>
        </div>
      </div>

      {/* Summary */}
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl border border-green-200 p-6">
        <div className="flex items-start gap-4">
          <CheckCircle className="w-8 h-8 text-green-600 flex-shrink-0" />
          <div>
            <h3 className="font-bold text-gray-900 text-lg">Selesai! 🎉</h3>
            <p className="text-gray-600 mt-2">
              Website SisAbsen Anda kini dapat diakses dari URL GitHub Pages dan terhubung ke Supabase Cloud.
              Data akan tersinkronisasi secara real-time di semua perangkat yang mengakses website.
            </p>
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              <div className="bg-white rounded-xl p-3 border border-green-100">
                <p className="font-semibold text-gray-800">✅ Dapat diakses dari</p>
                <p className="text-gray-500 mt-1">HP, tablet, laptop, komputer</p>
              </div>
              <div className="bg-white rounded-xl p-3 border border-green-100">
                <p className="font-semibold text-gray-800">✅ Data tersimpan di</p>
                <p className="text-gray-500 mt-1">Supabase Cloud (aman & persisten)</p>
              </div>
              <div className="bg-white rounded-xl p-3 border border-green-100">
                <p className="font-semibold text-gray-800">✅ Update mudah</p>
                <p className="text-gray-500 mt-1">git push → auto deploy via Actions</p>
              </div>
              <div className="bg-white rounded-xl p-3 border border-green-100">
                <p className="font-semibold text-gray-800">✅ Gratis</p>
                <p className="text-gray-500 mt-1">GitHub Pages & Supabase free tier</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Commands Reference */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <h3 className="font-bold text-gray-900 text-lg mb-4 flex items-center gap-2">
          <Terminal className="w-5 h-5 text-gray-600" />
          Referensi Perintah Cepat
        </h3>
        <div className="space-y-3">
          <div>
            <p className="text-sm font-semibold text-gray-700 mb-1">Update & Push perubahan:</p>
            <CodeBlock
              code={`git add .
git commit -m "Update: deskripsi perubahan"
git push origin main`}
            />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-700 mb-1">Build ulang:</p>
            <CodeBlock code={`pnpm build && pnpm deploy`} />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-700 mb-1">Cek status git:</p>
            <CodeBlock code={`git status && git log --oneline -5`} />
          </div>
        </div>
      </div>
    </div>
  );
}
