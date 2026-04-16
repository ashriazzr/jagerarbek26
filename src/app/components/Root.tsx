import { Outlet, Link, useLocation } from 'react-router';
import {
  Home,
  Clock,
  ShieldAlert,
  Users,
  BarChart2,
  Menu,
  X,
  BookOpen,
  GraduationCap,
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { seedAPI } from '../utils/api';

export function Root() {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [seeded, setSeeded] = useState(false);

  // Seed sample data on first load
  useEffect(() => {
    const doSeed = async () => {
      try {
        await seedAPI.seed();
        setSeeded(true);
      } catch (e) {
        console.log('Seed error:', e);
      }
    };
    if (!seeded) doSeed();
  }, [seeded]);

  const navigation = [
    { name: 'Dashboard', href: '/', icon: Home },
    { name: 'Catat Keterlambatan', href: '/keterlambatan', icon: Clock },
    { name: 'Akumulasi & Laporan', href: '/akumulasi', icon: BarChart2 },
    { name: 'Data Razia', href: '/razia', icon: ShieldAlert },
    { name: 'Data Siswa', href: '/siswa', icon: Users },
    { name: 'Tutorial GitHub', href: '/tutorial', icon: BookOpen },
  ];

  const isActive = (href: string) => {
    if (href === '/') return location.pathname === '/';
    return location.pathname.startsWith(href);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <header className="bg-gradient-to-r from-blue-700 to-blue-600 shadow-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-3">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center">
                <GraduationCap className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="font-bold text-xl text-white leading-tight">SisAbsen</h1>
                <p className="text-xs text-blue-200">Sistem Absensi Keterlambatan Siswa</p>
              </div>
            </Link>

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-lg text-white/80 hover:bg-white/10 transition-colors"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex gap-1">
              {navigation.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all text-sm font-medium ${
                      active
                        ? 'bg-white text-blue-700'
                        : 'text-blue-100 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="hidden xl:inline">{item.name}</span>
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Mobile Navigation */}
          {mobileMenuOpen && (
            <nav className="lg:hidden pb-4 space-y-1 border-t border-blue-500/50 pt-3 mt-1">
              {navigation.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                      active
                        ? 'bg-white text-blue-700 font-semibold'
                        : 'text-blue-100 hover:bg-white/10'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="font-medium">{item.name}</span>
                  </Link>
                );
              })}
            </nav>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
            <p className="text-sm text-gray-500">
              © 2026 <span className="font-semibold text-blue-600">SisAbsen</span> — Sistem Absensi Keterlambatan Siswa
            </p>
            <p className="text-xs text-gray-400">Powered by Supabase Cloud</p>
          </div>
        </div>
      </footer>
    </div>
  );
}