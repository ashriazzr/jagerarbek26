import { useState, useEffect } from 'react';
import { FileText, Calendar, TrendingUp, Download, Loader2, Printer } from 'lucide-react';
import { getLatenessRecords, getStudents } from '../utils/storage';
import { LatenessRecord, Student } from '../types';
import {
  format,
  startOfDay,
  endOfDay,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameDay,
} from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  LineChart,
  Line,
} from 'recharts';
import { toast } from 'sonner';
import { safeDate, safeFormatDate } from '../utils/date';

export function Reports() {
  const [loading, setLoading] = useState(true);
  const [allRecords, setAllRecords] = useState<LatenessRecord[]>([]);
  const [allStudents, setAllStudents] = useState<Student[]>([]);

  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), 'yyyy-MM'));
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [records, students] = await Promise.all([getLatenessRecords(), getStudents()]);
      setAllRecords(records);
      setAllStudents(students);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Gagal memuat data laporan');
    } finally {
      setLoading(false);
    }
  };

  // ─── Daily ───────────────────────────────────────────────────────────────────
  const dailyRecords = allRecords.filter(r => {
    const d = safeDate(r.timestamp);
    return d >= startOfDay(new Date(selectedDate)) && d <= endOfDay(new Date(selectedDate));
  });

  const dailyTotal = dailyRecords.length;
  const avgDailyMinutes = dailyTotal > 0
    ? Math.round(dailyRecords.reduce((s, r) => s + r.minutesLate, 0) / dailyTotal)
    : 0;

  // ─── Monthly ─────────────────────────────────────────────────────────────────
  const monthDate = safeDate(`${selectedMonth}-01`);
  const monthStart = startOfMonth(monthDate);
  const monthEnd = endOfMonth(monthDate);

  const monthlyRecords = allRecords.filter(r => {
    const d = safeDate(r.timestamp);
    return d >= monthStart && d <= monthEnd;
  });

  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const monthlyChartData = days.map(day => {
    const dayRecs = monthlyRecords.filter(r => isSameDay(safeDate(r.timestamp), day));
    return {
      date: format(day, 'dd', { locale: localeId }),
      fullDate: format(day, 'dd MMM yyyy', { locale: localeId }),
      count: dayRecs.length,
    };
  });

  const totalMonthlyLate = monthlyRecords.length;
  const avgMonthlyPerDay = days.length > 0
    ? Math.round(totalMonthlyLate / days.length)
    : 0;

  // Top students
  const studentCounts: Record<string, { name: string; class: string; count: number; nisn: string }> = {};
  monthlyRecords.forEach(r => {
    if (!studentCounts[r.studentId]) {
      const s = allStudents.find(s => s.id === r.studentId);
      studentCounts[r.studentId] = { name: r.studentName, class: r.studentClass, count: 0, nisn: s?.nisn || '-' };
    }
    studentCounts[r.studentId].count++;
  });
  const topStudents = Object.values(studentCounts).sort((a, b) => b.count - a.count).slice(0, 10);

  // Reason breakdown for month
  const reasonCounts: Record<string, number> = {};
  monthlyRecords.forEach(r => {
    reasonCounts[r.reason] = (reasonCounts[r.reason] || 0) + 1;
  });
  const reasonData = Object.entries(reasonCounts)
    .map(([reason, count]) => ({ reason: reason.length > 20 ? reason.slice(0, 20) + '…' : reason, count, full: reason }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);

  // ─── Exports ──────────────────────────────────────────────────────────────────
  const exportDailyCSV = () => {
    const rows = [
      ['Laporan Keterlambatan Harian'],
      [`Tanggal: ${safeFormatDate(selectedDate, 'dd MMMM yyyy', { locale: localeId })}`],
      [''],
      ['No', 'Waktu', 'NISN', 'Nama', 'Kelas', 'Alasan', 'Terlambat (menit)'],
      ...dailyRecords.map((r, i) => [
        i + 1,
        safeFormatDate(r.timestamp, 'HH:mm'),
        allStudents.find(s => s.id === r.studentId)?.nisn || '-',
        r.studentName,
        r.studentClass,
        `"${r.reason}"`,
        r.minutesLate,
      ]),
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob(['\ufeff' + rows], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `laporan-harian-${selectedDate}.csv`;
    link.click();
    toast.success('Laporan harian berhasil diekspor');
  };

  const exportMonthlyCSV = () => {
    const monthName = format(monthDate, 'MMMM yyyy', { locale: localeId });
    const rows = [
      ['Laporan Keterlambatan Bulanan'],
      [`Periode: ${monthName}`],
      [''],
      ['Ranking', 'NISN', 'Nama', 'Kelas', 'Jumlah Keterlambatan'],
      ...topStudents.map((s, i) => [i + 1, s.nisn, s.name, s.class, s.count]),
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob(['\ufeff' + rows], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `laporan-bulanan-${selectedMonth}.csv`;
    link.click();
    toast.success('Laporan bulanan berhasil diekspor');
  };

  const handlePrint = () => window.print();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
          <p className="text-gray-500 font-medium">Memuat laporan...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 print:space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Laporan & Statistik</h2>
          <p className="text-gray-500 mt-1">Analisis lengkap data keterlambatan siswa</p>
        </div>
        <button
          onClick={handlePrint}
          className="flex items-center gap-2 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors text-sm font-medium print:hidden"
        >
          <Printer className="w-4 h-4" />
          Cetak Laporan
        </button>
      </div>

      {/* Daily Report */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
              <Calendar className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">Laporan Harian</h3>
              <p className="text-xs text-gray-500">Detail keterlambatan per hari</p>
            </div>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <input
              type="date"
              lang="id-ID"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={exportDailyCSV}
              disabled={dailyTotal === 0}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm font-medium hover:bg-emerald-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              <Download className="w-4 h-4" />
              Export CSV
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-orange-50 rounded-xl p-4 border border-orange-100">
            <p className="text-xs text-orange-600 font-semibold">Total Terlambat</p>
            <p className="text-4xl font-bold text-orange-900 mt-1">{dailyTotal}</p>
            <p className="text-xs text-orange-500 mt-1">siswa</p>
          </div>
          <div className="bg-purple-50 rounded-xl p-4 border border-purple-100">
            <p className="text-xs text-purple-600 font-semibold">Rata-rata Keterlambatan</p>
            <p className="text-4xl font-bold text-purple-900 mt-1">{avgDailyMinutes}</p>
            <p className="text-xs text-purple-500 mt-1">menit</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Waktu</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Nama</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Kelas</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Alasan</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Terlambat</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {dailyRecords.length > 0 ? (
                dailyRecords
                  .sort((a, b) => safeDate(a.timestamp).getTime() - safeDate(b.timestamp).getTime())
                  .map(r => (
                    <tr key={r.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap">
                        {safeFormatDate(r.timestamp, 'HH:mm')}
                      </td>
                      <td className="px-4 py-3 text-sm font-semibold text-gray-900 whitespace-nowrap">{r.studentName}</td>
                      <td className="px-4 py-3 text-sm text-gray-500 whitespace-nowrap">{r.studentClass}</td>
                      <td className="px-4 py-3 text-sm text-gray-600 max-w-xs truncate">{r.reason}</td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-orange-100 text-orange-800">
                          {r.minutesLate} mnt
                        </span>
                      </td>
                    </tr>
                  ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-gray-400">
                    <FileText className="w-10 h-10 mx-auto mb-2 text-gray-200" />
                    Tidak ada data untuk tanggal ini
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Monthly Report */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">Laporan Bulanan</h3>
              <p className="text-xs text-gray-500">Ringkasan per bulan</p>
            </div>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <input
              type="month"
              lang="id-ID"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={exportMonthlyCSV}
              disabled={totalMonthlyLate === 0}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm font-medium hover:bg-emerald-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              <Download className="w-4 h-4" />
              Export CSV
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
            <p className="text-xs text-blue-600 font-semibold">Total Keterlambatan</p>
            <p className="text-4xl font-bold text-blue-900 mt-1">{totalMonthlyLate}</p>
          </div>
          <div className="bg-green-50 rounded-xl p-4 border border-green-100">
            <p className="text-xs text-green-600 font-semibold">Rata-rata per Hari</p>
            <p className="text-4xl font-bold text-green-900 mt-1">{avgMonthlyPerDay}</p>
          </div>
        </div>

        {/* Bar Chart */}
        <div className="mb-6">
          <h4 className="font-semibold text-gray-800 mb-3 text-sm">
            Grafik Keterlambatan — {format(monthDate, 'MMMM yyyy', { locale: localeId })}
          </h4>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={monthlyChartData} margin={{ top: 0, right: 0, left: -25, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
              <Tooltip formatter={(val) => [`${val} siswa`, 'Terlambat']} labelFormatter={(l, p) => p?.[0]?.payload?.fullDate || l} />
              <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                {monthlyChartData.map((e, i) => (
                  <Cell key={`monthly-cell-${i}`} fill={e.count > 0 ? '#6366f1' : '#e5e7eb'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Reason Breakdown */}
        {reasonData.length > 0 && (
          <div className="mb-6">
            <h4 className="font-semibold text-gray-800 mb-3 text-sm">Alasan Keterlambatan Terbanyak</h4>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={reasonData} layout="vertical" margin={{ top: 0, right: 20, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11 }} allowDecimals={false} />
                <YAxis type="category" dataKey="reason" tick={{ fontSize: 10 }} width={120} />
                <Tooltip formatter={(val) => [`${val}x`, 'Kejadian']} labelFormatter={(l, p) => p?.[0]?.payload?.full || l} />
                <Bar dataKey="count" fill="#f59e0b" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Top Students */}
        <div>
          <h4 className="font-semibold text-gray-800 mb-3 text-sm">10 Siswa Paling Sering Terlambat</h4>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Ranking</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">NISN</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Nama</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Kelas</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Keterlambatan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {topStudents.length > 0 ? (
                  topStudents.map((s, i) => (
                    <tr key={i} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                          i === 0 ? 'bg-yellow-100 text-yellow-800' :
                          i === 1 ? 'bg-gray-200 text-gray-700' :
                          i === 2 ? 'bg-orange-100 text-orange-800' :
                          'bg-blue-50 text-blue-700'
                        }`}>{i + 1}</div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500 font-mono">{s.nisn}</td>
                      <td className="px-4 py-3 text-sm font-semibold text-gray-900 whitespace-nowrap">{s.name}</td>
                      <td className="px-4 py-3 text-sm text-gray-500 whitespace-nowrap">{s.class}</td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center px-3 py-0.5 rounded-full text-sm font-bold bg-red-100 text-red-800">
                          {s.count}x
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-4 py-10 text-center text-gray-400">
                      Tidak ada data untuk bulan ini
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}