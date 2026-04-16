import { Link } from 'react-router';
import { Home, AlertCircle } from 'lucide-react';

export function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
      <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mb-6">
        <AlertCircle className="w-10 h-10 text-red-400" />
      </div>
      <h2 className="text-4xl font-bold text-gray-900 mb-2">404</h2>
      <p className="text-xl text-gray-600 mb-2">Halaman Tidak Ditemukan</p>
      <p className="text-gray-400 mb-8 max-w-md">
        Halaman yang Anda cari tidak ada atau telah dipindahkan.
      </p>
      <Link
        to="/"
        className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors"
      >
        <Home className="w-5 h-5" />
        Kembali ke Dashboard
      </Link>
    </div>
  );
}
