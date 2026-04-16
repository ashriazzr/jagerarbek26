import { useState, useEffect } from 'react';
import { BarChart2, Calendar, ChevronDown, Loader2, Users, Clock, TrendingUp } from 'lucide-react';
import { getLatenessRecords, getStudents } from '../utils/storage';
import { LatenessRecord, Student } from '../types';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { toast } from 'sonner';

type Tab = 'daily' | 'monthly' | 'student';

export function Accumulation() {
  const [activeTab, setActiveTab] = useState<Tab>('daily');
  const [loading, setLoading] = useState(true);
  const [records, setRecords] = useState<LatenessRecord[]>([]);
  const [students, setStudents] = useState<Student[]>([]);

  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), 'yyyy-MM'));
  const [selectedClass, setSelectedClass] = useState('all');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [recs, studs] = await Promise.all([getLatenessRecords(), getStudents()]);
      setRecords(recs);
      setStudents(studs);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Gagal memuat data');
    } finally {
      setLoading(false);
    }
  };

  const allClasses = Array.from(new Set(records.map(r => r.studentClass))).sort();

  // ─── DAILY ACCUMULATION ───────────────────────────────────────────────────

  const dailyRecords = records.filter(r => {
    const recDate = format(new Date(r.timestamp), 'yyyy-MM-dd');
    return recDate === selectedDate;
  });

  const filteredDailyRecords = selectedClass === 'all'
    ? dailyRecords
    : dailyRecords.filter(r => r.studentClass === selectedClass);

  // Group by hour
  const hourlyData = Array.from({ length: 24 }, (_, h) => ({
    hour: `${String(h).padStart(2, '0')}:00`,
    count: filteredDailyRecords.filter(r => new Date(r.timestamp).getHours() === h).length,
  })).filter(d => d.count > 0 || (d.hour >= '06:00' && d.hour <= '12:00'));

  const dailyTotal = filteredDailyRecords.length;
  const avgMinutes = dailyTotal > 0
    ? Math.round(filteredDailyRecords.reduce((s, r) => s + r.minutesLate, 0) / dailyTotal)
    : 0;

  // ─── MONTHLY ACCUMULATION ─────────────────────────────────────────────────

  const monthDate = new Date(selectedMonth + '-01');
  const monthStart = startOfMonth(monthDate);
  const monthEnd = endOfMonth(monthDate);

  const monthlyRecords = records.filter(r => {
    const d = new Date(r.timestamp);
    return d >= monthStart && d <= monthEnd;
  });

  const filteredMonthlyRecords = selectedClass === 'all'
    ? monthlyRecords
    : monthlyRecords.filter(r => r.studentClass === selectedClass);

  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const dailyChartData = days.map(day => {
    const dayRecs = filteredMonthlyRecords.filter(r => isSameDay(new Date(r.timestamp), day));
    return {
      date: format(day, 'dd', { locale: localeId }),
      day: format(day, 'EEE', { locale: localeId }),
      count: dayRecs.length,
      fullDate: format(day, 'dd MMM yyyy', { locale: localeId }),
    };
  });

  const monthlyTotal = filteredMonthlyRecords.length;
  const daysWithLate = dailyChartData.filter(d => d.count > 0).length;
  const maxDay = dailyChartData.reduce((max, d) => d.count > max.count ? d : max, { count: 0, fullDate: '-', date: '-', day: '-' });

  // ─── PER-STUDENT ACCUMULATION ─────────────────────────────────────────────

  const monthlyForStudent = records.filter(r => {
    const d = new Date(r.timestamp);
    return d >= monthStart && d <= monthEnd;
  });

  const filteredStudentRecords = selectedClass === 'all'
    ? monthlyForStudent
    : monthlyForStudent.filter(r => r.studentClass === selectedClass);

  type StudentStat = { id: string; name: string; class: string; count: number; totalMinutes: number };
  const studentMap: Record<string, StudentStat> = {};
  filteredStudentRecords.forEach(r => {
    if (!studentMap[r.studentId]) {
      studentMap[r.studentId] = {
        id: r.studentId,
        name: r.studentName,
        class: r.studentClass,
        count: 0,
        totalMinutes: 0,
      };
    }
    studentMap[r.studentId].count++;
    studentMap[r.studentId].totalMinutes += r.minutesLate;
  });

  const studentStats = Object.values(studentMap).sort((a, b) => b.count - a.count);

  const tabs = [
    { id: 'daily' as Tab, label: 'Akumulasi Harian', icon: Calendar },
    { id: 'monthly' as Tab, label: 'Akumulasi Bulanan', icon: BarChart2 },
    { id: 'student' as Tab, label: 'Per Siswa', icon: Users },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
          <p className="text-gray-500 font-medium">Memuat data akumulasi...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold text-gray-900">Akumulasi Keterlambatan</h2>
        <p className="text-gray-500 mt-1">Rekap keterlambatan siswa per hari, per bulan, dan per siswa</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-full sm:w-fit">
        {tabs.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === tab.id
                  ? 'bg-white text-blue-700 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-gray-100 p-4 flex flex-wrap gap-3 items-center">
        {activeTab === 'daily' && (
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-500 font-medium">Tanggal:</label>
            <input
              type="date"
              lang="id-ID"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        )}
        {(activeTab === 'monthly' || activeTab === 'student') && (
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-500 font-medium">Bulan:</label>
            <input
              type="month"
              lang="id-ID"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        )}
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-500 font-medium">Kelas:</label>
          <div className="relative">
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="pl-3 pr-8 py-2 border border-gray-300 rounded-lg text-sm appearance-none bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Semua Kelas</option>
              {allClasses.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* ─── DAILY TAB ──────────────────────────────────────────────────────────── */}
      {activeTab === 'daily' && (
        <div className="space-y-5">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <div className="bg-orange-50 rounded-2xl p-5 border border-orange-100">
              <p className="text-xs font-semibold text-orange-600">Total Terlambat</p>
              <p className="text-4xl font-bold text-orange-900 mt-1">{dailyTotal}</p>
              <p className="text-xs text-orange-500 mt-1">{format(new Date(selectedDate), 'dd MMMM yyyy', { locale: localeId })}</p>
            </div>
            <div className="bg-purple-50 rounded-2xl p-5 border border-purple-100">
              <p className="text-xs font-semibold text-purple-600">Rata-rata Keterlambatan</p>
              <p className="text-4xl font-bold text-purple-900 mt-1">{avgMinutes}</p>
              <p className="text-xs text-purple-500 mt-1">menit</p>
            </div>
            <div className="bg-blue-50 rounded-2xl p-5 border border-blue-100 col-span-2 sm:col-span-1">
              <p className="text-xs font-semibold text-blue-600">Kelas Paling Sering</p>
              <p className="text-2xl font-bold text-blue-900 mt-1">
                {dailyTotal > 0
                  ? Object.entries(
                      filteredDailyRecords.reduce((acc, r) => {
                        acc[r.studentClass] = (acc[r.studentClass] || 0) + 1;
                        return acc;
                      }, {} as Record<string, number>)
                    ).sort((a, b) => b[1] - a[1])[0]?.[0] || '-'
                  : '-'}
              </p>
              <p className="text-xs text-blue-500 mt-1">kelas terbanyak</p>
            </div>
          </div>

          {/* Hourly Bar Chart */}
          {dailyTotal > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <h3 className="font-semibold text-gray-900 mb-4">Distribusi Per Jam</h3>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={hourlyData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="hour" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                  <Tooltip
                    formatter={(val) => [`${val} siswa`, 'Terlambat']}
                    labelFormatter={(l) => `Pukul ${l}`}
                  />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                    {hourlyData.map((_, i) => (
                      <Cell key={`hourly-cell-${i}`} fill="#f97316" />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Detail Table */}
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <div className="p-5 border-b border-gray-100">
              <h3 className="font-semibold text-gray-900">Detail Keterlambatan Hari Ini</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">No</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Waktu</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Nama Siswa</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Kelas</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Alasan</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Keterlambatan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filteredDailyRecords.length > 0 ? (
                    filteredDailyRecords
                      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
                      .map((r, i) => (
                        <tr key={r.id} className="hover:bg-gray-50">
                          <td className="px-5 py-4 text-sm text-gray-400">{i + 1}</td>
                          <td className="px-5 py-4 text-sm text-gray-700 whitespace-nowrap">
                            {format(new Date(r.timestamp), 'HH:mm')}
                          </td>
                          <td className="px-5 py-4 text-sm font-semibold text-gray-900 whitespace-nowrap">
                            {r.studentName}
                          </td>
                          <td className="px-5 py-4 text-sm text-gray-500 whitespace-nowrap">
                            <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full text-xs font-medium">{r.studentClass}</span>
                          </td>
                          <td className="px-5 py-4 text-sm text-gray-600 max-w-xs truncate">{r.reason}</td>
                          <td className="px-5 py-4 whitespace-nowrap">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-orange-100 text-orange-800">
                              <Clock className="w-3 h-3 mr-1" />{r.minutesLate} mnt
                            </span>
                          </td>
                        </tr>
                      ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="px-5 py-12 text-center text-gray-400">
                        <Calendar className="w-10 h-10 mx-auto mb-3 text-gray-200" />
                        <p>Tidak ada keterlambatan pada tanggal ini</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ─── MONTHLY TAB ─────────────────────────────────────────────────────────── */}
      {activeTab === 'monthly' && (
        <div className="space-y-5">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <div className="bg-blue-50 rounded-2xl p-5 border border-blue-100">
              <p className="text-xs font-semibold text-blue-600">Total Keterlambatan</p>
              <p className="text-4xl font-bold text-blue-900 mt-1">{monthlyTotal}</p>
              <p className="text-xs text-blue-500 mt-1">{format(monthDate, 'MMMM yyyy', { locale: localeId })}</p>
            </div>
            <div className="bg-green-50 rounded-2xl p-5 border border-green-100">
              <p className="text-xs font-semibold text-green-600">Hari dengan Keterlambatan</p>
              <p className="text-4xl font-bold text-green-900 mt-1">{daysWithLate}</p>
              <p className="text-xs text-green-500 mt-1">dari {days.length} hari</p>
            </div>
            <div className="bg-red-50 rounded-2xl p-5 border border-red-100 col-span-2 sm:col-span-1">
              <p className="text-xs font-semibold text-red-600">Hari Terbanyak</p>
              <p className="text-2xl font-bold text-red-900 mt-1">
                {maxDay.count > 0 ? `${maxDay.count}x` : '-'}
              </p>
              <p className="text-xs text-red-500 mt-1">{maxDay.count > 0 ? maxDay.fullDate : 'Tidak ada data'}</p>
            </div>
          </div>

          {/* Bar Chart */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <h3 className="font-semibold text-gray-900 mb-4">
              Grafik Keterlambatan — {format(monthDate, 'MMMM yyyy', { locale: localeId })}
            </h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={dailyChartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip
                  formatter={(val) => [`${val} siswa`, 'Terlambat']}
                  labelFormatter={(l, payload) => payload?.[0]?.payload?.fullDate || l}
                />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {dailyChartData.map((entry, i) => (
                    <Cell key={`daily-cell-${i}`} fill={entry.count > 0 ? '#3b82f6' : '#e5e7eb'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Day-by-day table */}
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <div className="p-5 border-b border-gray-100">
              <h3 className="font-semibold text-gray-900">Rekap Per Hari</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Tanggal</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Hari</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Jumlah Terlambat</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Grafik</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {dailyChartData.filter(d => d.count > 0).length > 0 ? (
                    dailyChartData.filter(d => d.count > 0).map((d, i) => (
                      <tr key={i} className="hover:bg-gray-50">
                        <td className="px-5 py-3 text-sm text-gray-700 font-medium">{d.fullDate}</td>
                        <td className="px-5 py-3 text-sm text-gray-500 capitalize">{d.day}</td>
                        <td className="px-5 py-3">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-bold bg-blue-100 text-blue-800">
                            {d.count} siswa
                          </span>
                        </td>
                        <td className="px-5 py-3">
                          <div className="w-full bg-gray-100 rounded-full h-2.5 max-w-32">
                            <div
                              className="bg-blue-500 h-2.5 rounded-full"
                              style={{ width: `${Math.min((d.count / maxDay.count) * 100, 100)}%` }}
                            />
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="px-5 py-12 text-center text-gray-400">
                        Tidak ada keterlambatan pada bulan ini
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ─── PER STUDENT TAB ─────────────────────────────────────────────────────── */}
      {activeTab === 'student' && (
        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-purple-50 rounded-2xl p-5 border border-purple-100">
              <p className="text-xs font-semibold text-purple-600">Siswa yang Pernah Terlambat</p>
              <p className="text-4xl font-bold text-purple-900 mt-1">{studentStats.length}</p>
              <p className="text-xs text-purple-500 mt-1">dari {students.length} siswa terdaftar</p>
            </div>
            <div className="bg-red-50 rounded-2xl p-5 border border-red-100">
              <p className="text-xs font-semibold text-red-600">Terlambat Terbanyak</p>
              <p className="text-2xl font-bold text-red-900 mt-1 truncate">
                {studentStats[0]?.name || '-'}
              </p>
              <p className="text-xs text-red-500 mt-1">
                {studentStats[0] ? `${studentStats[0].count}x — ${studentStats[0].class}` : 'Tidak ada data'}
              </p>
            </div>
          </div>

          {/* Student Chart */}
          {studentStats.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <h3 className="font-semibold text-gray-900 mb-4">Top 10 Siswa Paling Sering Terlambat</h3>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart
                  data={studentStats.slice(0, 10).map(s => ({ name: s.name.split(' ')[0], count: s.count, fullName: s.name }))}
                  layout="vertical"
                  margin={{ top: 0, right: 20, left: 0, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 11 }} allowDecimals={false} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={80} />
                  <Tooltip formatter={(val) => [`${val}x`, 'Keterlambatan']} labelFormatter={(l, payload) => payload?.[0]?.payload?.fullName || l} />
                  <Bar dataKey="count" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Student ranking table */}
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <div className="p-5 border-b border-gray-100">
              <h3 className="font-semibold text-gray-900">Rangking Keterlambatan Siswa</h3>
              <p className="text-sm text-gray-500 mt-0.5">
                {format(monthDate, 'MMMM yyyy', { locale: localeId })}
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Ranking</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Nama Siswa</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Kelas</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Jumlah</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Total Menit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {studentStats.length > 0 ? (
                    studentStats.map((s, i) => (
                      <tr key={s.id} className="hover:bg-gray-50">
                        <td className="px-5 py-4">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                            i === 0 ? 'bg-yellow-100 text-yellow-800' :
                            i === 1 ? 'bg-gray-200 text-gray-700' :
                            i === 2 ? 'bg-orange-100 text-orange-800' :
                            'bg-blue-50 text-blue-700'
                          }`}>
                            {i + 1}
                          </div>
                        </td>
                        <td className="px-5 py-4 text-sm font-semibold text-gray-900 whitespace-nowrap">{s.name}</td>
                        <td className="px-5 py-4 whitespace-nowrap">
                          <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full text-xs font-medium">{s.class}</span>
                        </td>
                        <td className="px-5 py-4">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-800">
                            {s.count}x
                          </span>
                        </td>
                        <td className="px-5 py-4 text-sm text-gray-600">
                          <span className="flex items-center gap-1">
                            <TrendingUp className="w-3.5 h-3.5 text-orange-500" />
                            {s.totalMinutes} mnt
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="px-5 py-12 text-center text-gray-400">
                        <Users className="w-10 h-10 mx-auto mb-3 text-gray-200" />
                        <p>Tidak ada data keterlambatan bulan ini</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}