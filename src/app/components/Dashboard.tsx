import { useState, useEffect } from 'react';
import { Link } from 'react-router';
import {
  Clock,
  ShieldAlert,
  Users,
  TrendingUp,
  AlertCircle,
  Calendar,
  BarChart2,
  ArrowRight,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import { getLatenessRecords, getConfiscationRecords, getStudents } from '../utils/storage';
import { seedAPI } from '../utils/api';
import { format, startOfDay, endOfDay, startOfMonth, endOfMonth } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import { toast } from 'sonner';
import { safeDate, safeFormatDate, formatDurationMinutes } from '../utils/date';

export function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalStudents: 0,
    todayLate: 0,
    monthlyLate: 0,
    activeConfiscations: 0,
    mostLateStudent: { name: '-', count: 0 },
  });
  const [recentLateness, setRecentLateness] = useState<any[]>([]);
  const [recentConfiscations, setRecentConfiscations] = useState<any[]>([]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      // Try to seed sample data on first load (no-op if data exists)
      try {
        await seedAPI.seed();
      } catch (_) {
        // Seed failure is non-fatal; ignore
      }
      const [students, latenessRecords, confiscationRecords] = await Promise.all([
        getStudents(),
        getLatenessRecords(),
        getConfiscationRecords(),
      ]);

      const today = new Date();
      const todayStart = startOfDay(today);
      const todayEnd = endOfDay(today);
      const monthStart = startOfMonth(today);
      const monthEnd = endOfMonth(today);

      const todayLate = latenessRecords.filter((r) => {
        const d = safeDate(r.timestamp);
        return d >= todayStart && d <= todayEnd;
      });

      const monthlyLate = latenessRecords.filter((r) => {
        const d = safeDate(r.timestamp);
        return d >= monthStart && d <= monthEnd;
      });

      const activeConfiscations = confiscationRecords.filter((r) => r.status === 'disita');

      const studentCounts: Record<string, { name: string; count: number }> = {};
      monthlyLate.forEach((r) => {
        if (!studentCounts[r.studentId]) {
          studentCounts[r.studentId] = { name: r.studentName, count: 0 };
        }
        studentCounts[r.studentId].count++;
      });

      const mostLateStudent = Object.values(studentCounts).reduce(
        (max, cur) => (cur.count > max.count ? cur : max),
        { name: '-', count: 0 }
      );

      setStats({
        totalStudents: students.length,
        todayLate: todayLate.length,
        monthlyLate: monthlyLate.length,
        activeConfiscations: activeConfiscations.length,
        mostLateStudent,
      });

      setRecentLateness(
        [...latenessRecords]
          .sort((a, b) => safeDate(b.timestamp).getTime() - safeDate(a.timestamp).getTime())
          .slice(0, 5)
      );

      setRecentConfiscations(
        [...confiscationRecords]
          .sort(
            (a, b) =>
              safeDate(b.confiscationDate).getTime() - safeDate(a.confiscationDate).getTime()
          )
          .slice(0, 5)
      );
    } catch (error) {
      console.error('Error loading dashboard:', error);
      toast.error(`Gagal memuat data dashboard: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      label: 'Total Siswa',
      value: stats.totalStudents,
      icon: Users,
      bg: 'bg-blue-50',
      iconColor: 'text-blue-600',
      border: 'border-blue-100',
    },
    {
      label: 'Terlambat Hari Ini',
      value: stats.todayLate,
      icon: Clock,
      bg: 'bg-orange-50',
      iconColor: 'text-orange-600',
      border: 'border-orange-100',
    },
    {
      label: 'Terlambat Bulan Ini',
      value: stats.monthlyLate,
      icon: Calendar,
      bg: 'bg-purple-50',
      iconColor: 'text-purple-600',
      border: 'border-purple-100',
    },
    {
      label: 'Barang Disita Aktif',
      value: stats.activeConfiscations,
      icon: ShieldAlert,
      bg: 'bg-red-50',
      iconColor: 'text-red-600',
      border: 'border-red-100',
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
          <p className="text-gray-500 font-medium">Memuat data dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Welcome */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Dashboard</h2>
          <p className="text-gray-500 mt-1">
            {format(new Date(), "EEEE, dd MMMM yyyy", { locale: localeId })}
          </p>
        </div>
        <button
          onClick={loadDashboardData}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh Data
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.label}
              className={`bg-white rounded-2xl shadow-sm p-5 border ${card.border} hover:shadow-md transition-shadow`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs sm:text-sm text-gray-500 font-medium">{card.label}</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">{card.value}</p>
                </div>
                <div className={`w-11 h-11 ${card.bg} rounded-xl flex items-center justify-center flex-shrink-0`}>
                  <Icon className={`w-6 h-6 ${card.iconColor}`} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Alert: Most Late Student */}
      {stats.mostLateStudent.count > 0 && (
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl border border-orange-200 p-5 flex items-center gap-4">
          <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center flex-shrink-0">
            <TrendingUp className="w-6 h-6 text-orange-600" />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-700">Siswa Paling Sering Terlambat Bulan Ini</p>
            <p className="text-gray-600 text-sm mt-0.5">
              <span className="font-bold text-orange-600">{stats.mostLateStudent.name}</span>{' '}
              — total{' '}
              <span className="font-bold text-gray-900">{stats.mostLateStudent.count}x</span>{' '}
              keterlambatan
            </p>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Aksi Cepat</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { href: '/keterlambatan', icon: Clock, label: 'Catat Keterlambatan', desc: 'Input siswa terlambat', color: 'orange' },
            { href: '/akumulasi', icon: BarChart2, label: 'Akumulasi & Laporan', desc: 'Rekap harian, bulanan & export', color: 'purple' },
            { href: '/razia', icon: ShieldAlert, label: 'Data Razia', desc: 'Catat barang sitaan', color: 'red' },
            { href: '/siswa', icon: Users, label: 'Data Siswa', desc: 'Kelola kelas & siswa', color: 'blue' },
          ].map((action) => {
            const Icon = action.icon;
            const colors: Record<string, string> = {
              orange: 'bg-orange-50 text-orange-600 group-hover:bg-orange-100',
              purple: 'bg-purple-50 text-purple-600 group-hover:bg-purple-100',
              red: 'bg-red-50 text-red-600 group-hover:bg-red-100',
              blue: 'bg-blue-50 text-blue-600 group-hover:bg-blue-100',
            };
            return (
              <Link
                key={action.href}
                to={action.href}
                className="bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-md transition-all group flex items-center gap-4"
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors ${colors[action.color]}`}>
                  <Icon className="w-6 h-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 text-sm">{action.label}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{action.desc}</p>
                </div>
                <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-gray-500 transition-colors" />
              </Link>
            );
          })}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Lateness */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-5 border-b border-gray-100 flex items-center justify-between">
            <h3 className="font-semibold text-gray-900">Keterlambatan Terbaru</h3>
            <Link to="/keterlambatan" className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1 font-medium">
              Lihat Semua <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="divide-y divide-gray-50">
            {recentLateness.length > 0 ? (
              recentLateness.map((record) => (
                <div key={record.id} className="p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Clock className="w-5 h-5 text-orange-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 text-sm">{record.studentName}</p>
                      <p className="text-xs text-gray-500">{record.studentClass}</p>
                      <p className="text-xs text-gray-500 mt-1 truncate">{record.reason}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-xs text-gray-400">
                          {safeFormatDate(record.timestamp, "dd MMM, HH:mm", { locale: localeId })}
                        </span>
                        <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-medium">
                          +{formatDurationMinutes(record.minutesLate)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-10 text-center text-gray-400">
                <AlertCircle className="w-10 h-10 mx-auto mb-3 text-gray-200" />
                <p className="text-sm">Belum ada data keterlambatan</p>
              </div>
            )}
          </div>
        </div>

        {/* Recent Confiscations */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-5 border-b border-gray-100 flex items-center justify-between">
            <h3 className="font-semibold text-gray-900">Razia Terbaru</h3>
            <Link to="/razia" className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1 font-medium">
              Lihat Semua <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="divide-y divide-gray-50">
            {recentConfiscations.length > 0 ? (
              recentConfiscations.map((record) => (
                <div key={record.id} className="p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${record.status === 'disita' ? 'bg-red-100' : 'bg-green-100'}`}>
                      <ShieldAlert className={`w-5 h-5 ${record.status === 'disita' ? 'text-red-600' : 'text-green-600'}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 text-sm">{record.studentName}</p>
                      <p className="text-xs text-gray-500">{record.studentClass}</p>
                      <p className="text-sm text-gray-800 mt-1 font-medium truncate">{record.item}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-gray-400">
                          {safeFormatDate(record.confiscationDate, "dd MMM yyyy", { locale: localeId })}
                        </span>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${record.status === 'disita' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                          {record.status === 'disita' ? 'Disita' : 'Dikembalikan'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-10 text-center text-gray-400">
                <AlertCircle className="w-10 h-10 mx-auto mb-3 text-gray-200" />
                <p className="text-sm">Belum ada data razia</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}