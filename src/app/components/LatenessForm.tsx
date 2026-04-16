import { useState, useEffect, useRef } from 'react';
import {
  Clock,
  ChevronDown,
  Loader2,
  AlertCircle,
  RefreshCw,
  Save,
  Trash2,
} from 'lucide-react';
import {
  getStudents,
  getLatenessRecords,
  addLatenessRecord,
  deleteLatenessRecord,
  getUniqueClasses,
} from '../utils/storage';
import { LatenessRecord, Student } from '../types';
import { format } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import { toast } from 'sonner';
import { safeDate, safeFormatDate } from '../utils/date';

export function LatenessForm() {
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedStudent, setSelectedStudent] = useState('');
  const [reason, setReason] = useState('');
  const [timestamp, setTimestamp] = useState('');
  const [minutesLate, setMinutesLate] = useState(0);
  const [schoolStartHour, setSchoolStartHour] = useState(7);

  const [classes, setClasses] = useState<string[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [classStudents, setClassStudents] = useState<Student[]>([]);
  const [latenessRecords, setLatenessRecords] = useState<LatenessRecord[]>([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [filterClass, setFilterClass] = useState('all');

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const reasonOptions = [
    'Bangun kesiangan',
    'Kemacetan lalu lintas',
    'Kendaraan rusak / mogok',
    'Hujan deras',
    'Keperluan keluarga',
    'Sakit mendadak',
    'Transportasi terlambat',
    'Lainnya',
  ];

  useEffect(() => {
    loadInitialData();
    startRealtimeClock();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  useEffect(() => {
    if (selectedClass) {
      const filtered = students.filter((s) => s.class === selectedClass);
      setClassStudents(filtered);
      setSelectedStudent('');
    } else {
      setClassStudents([]);
      setSelectedStudent('');
    }
  }, [selectedClass, students]);

  const startRealtimeClock = () => {
    const updateTime = () => {
      const now = new Date();
      setTimestamp(format(now, "yyyy-MM-dd'T'HH:mm"));
      calculateMinutesLate(now);
    };
    updateTime();
    timerRef.current = setInterval(updateTime, 30000); // update every 30s
  };

  const loadInitialData = async () => {
    try {
      setLoading(true);
      const [allStudents, records, uniqueClasses] = await Promise.all([
        getStudents(),
        getLatenessRecords(),
        getUniqueClasses(),
      ]);
      setStudents(allStudents);
      setClasses(uniqueClasses);
      const sorted = [...records].sort(
        (a, b) => safeDate(b.timestamp).getTime() - safeDate(a.timestamp).getTime()
      );
      setLatenessRecords(sorted);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Gagal memuat data');
    } finally {
      setLoading(false);
    }
  };

  const loadRecords = async () => {
    try {
      const records = await getLatenessRecords();
      const sorted = [...records].sort(
        (a, b) => safeDate(b.timestamp).getTime() - safeDate(a.timestamp).getTime()
      );
      setLatenessRecords(sorted);
    } catch (error) {
      console.error('Error loading records:', error);
    }
  };

  const calculateMinutesLate = (date: Date) => {
    const totalMinutes = date.getHours() * 60 + date.getMinutes();
    const schoolStart = schoolStartHour * 60;
    setMinutesLate(totalMinutes > schoolStart ? totalMinutes - schoolStart : 0);
  };

  const handleTimestampChange = (value: string) => {
    // Stop realtime clock when user manually changes time
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setTimestamp(value);
    calculateMinutesLate(safeDate(value));
  };

  const handleResetToNow = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    startRealtimeClock();
    toast.success('Waktu direset ke waktu sekarang');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClass || !selectedStudent || !reason.trim() || !timestamp) {
      toast.error('Mohon lengkapi semua field');
      return;
    }

    const student = classStudents.find((s) => s.id === selectedStudent);
    if (!student) {
      toast.error('Siswa tidak ditemukan');
      return;
    }

    try {
      setSaving(true);
      const record: Omit<LatenessRecord, 'id'> = {
        studentId: student.id,
        studentName: student.name,
        studentClass: student.class,
        reason: reason.trim(),
        timestamp,
        minutesLate,
      };
      await addLatenessRecord(record);
      await loadRecords();

      setReason('');
      toast.success(`✅ Keterlambatan ${student.name} berhasil dicatat`);
    } catch (error) {
      console.error('Error saving record:', error);
      toast.error('Gagal menyimpan data keterlambatan');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Hapus data keterlambatan ${name}?`)) return;
    try {
      setDeleting(id);
      await deleteLatenessRecord(id);
      await loadRecords();
      toast.success('Data berhasil dihapus');
    } catch (error) {
      console.error('Error deleting:', error);
      toast.error('Gagal menghapus data');
    } finally {
      setDeleting(null);
    }
  };

  const allClasses = Array.from(new Set(latenessRecords.map((r) => r.studentClass))).sort();
  const filteredRecords =
    filterClass === 'all' ? latenessRecords : latenessRecords.filter((r) => r.studentClass === filterClass);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
          <p className="text-gray-500 font-medium">Memuat data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold text-gray-900">Catat Keterlambatan</h2>
        <p className="text-gray-500 mt-1">Input data siswa yang terlambat masuk sekolah</p>
      </div>

      {/* Form Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        {classes.length === 0 ? (
          <div className="text-center py-8">
            <AlertCircle className="w-12 h-12 text-amber-400 mx-auto mb-3" />
            <p className="text-gray-600 font-medium">Belum ada data siswa</p>
            <p className="text-gray-400 text-sm mt-1">
              Tambahkan data siswa terlebih dahulu di menu{' '}
              <a href="/siswa" className="text-blue-600 underline">Data Siswa</a>
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Class */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Kelas <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <select
                    value={selectedClass}
                    onChange={(e) => setSelectedClass(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl appearance-none bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Pilih Kelas</option>
                    {classes.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                </div>
              </div>

              {/* Student */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Nama Siswa <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <select
                    value={selectedStudent}
                    onChange={(e) => setSelectedStudent(e.target.value)}
                    disabled={!selectedClass}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl appearance-none bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-400"
                  >
                    <option value="">
                      {selectedClass ? 'Pilih Siswa' : 'Pilih Kelas Dahulu'}
                    </option>
                    {classStudents.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.nisn})
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                </div>
              </div>
            </div>

            {/* Timestamp */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-semibold text-gray-700">
                  Waktu Kedatangan <span className="text-red-500">*</span>
                </label>
                <button
                  type="button"
                  onClick={handleResetToNow}
                  className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-medium"
                >
                  <RefreshCw className="w-3 h-3" />
                  Reset ke sekarang
                </button>
              </div>
              <div className="flex gap-3">
                <div className="relative flex-1">
                  <input
                    type="datetime-local"
                    lang="id-ID"
                    value={timestamp}
                    onChange={(e) => handleTimestampChange(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-xs text-gray-500 whitespace-nowrap">Jam masuk:</label>
                  <input
                    type="number"
                    min={5}
                    max={12}
                    value={schoolStartHour}
                    onChange={(e) => {
                      setSchoolStartHour(Number(e.target.value));
                      if (timestamp) calculateMinutesLate(safeDate(timestamp));
                    }}
                    className="w-16 px-2 py-3 border border-gray-300 rounded-xl text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="text-xs text-gray-500">:00</span>
                </div>
              </div>
              {minutesLate > 0 && (
                <div className="mt-2 flex items-center gap-2">
                  <span className="inline-flex items-center px-3 py-1 bg-orange-100 text-orange-700 text-sm font-semibold rounded-full">
                    <Clock className="w-3.5 h-3.5 mr-1" />
                    Terlambat {minutesLate} menit
                  </span>
                  <span className="text-xs text-gray-400">(dari jam {schoolStartHour}:00 WIB)</span>
                </div>
              )}
            </div>

            {/* Reason */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Alasan Keterlambatan <span className="text-red-500">*</span>
              </label>
              <div className="flex flex-wrap gap-2 mb-3">
                {reasonOptions.map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => setReason(opt === 'Lainnya' ? '' : opt)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                      reason === opt
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white text-gray-600 border-gray-300 hover:border-blue-400 hover:text-blue-600'
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={3}
                placeholder="Tuliskan alasan keterlambatan di sini..."
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              />
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={saving}
              className="w-full bg-blue-600 text-white py-3.5 rounded-xl font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 disabled:bg-blue-400"
            >
              {saving ? (
                <><Loader2 className="w-5 h-5 animate-spin" /> Menyimpan...</>
              ) : (
                <><Save className="w-5 h-5" /> Simpan Data Keterlambatan</>
              )}
            </button>
          </form>
        )}
      </div>

      {/* Records List */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-5 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h3 className="font-semibold text-gray-900">Riwayat Keterlambatan</h3>
            <p className="text-sm text-gray-500 mt-0.5">Total: {filteredRecords.length} data</p>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-500">Filter:</label>
            <div className="relative">
              <select
                value={filterClass}
                onChange={(e) => setFilterClass(e.target.value)}
                className="pl-3 pr-8 py-2 text-sm border border-gray-300 rounded-lg appearance-none bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Semua Kelas</option>
                {allClasses.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Waktu</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Siswa</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Kelas</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Alasan</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Terlambat</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredRecords.length > 0 ? (
                filteredRecords.map((record) => (
                  <tr key={record.id} className="hover:bg-gray-50">
                    <td className="px-5 py-4 whitespace-nowrap text-sm text-gray-700">
                      {safeFormatDate(record.timestamp, "dd/MM/yy HH:mm", { locale: localeId })}
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                      {record.studentName}
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap text-sm text-gray-500">
                      {record.studentClass}
                    </td>
                    <td className="px-5 py-4 text-sm text-gray-600 max-w-xs truncate">
                      {record.reason}
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-orange-100 text-orange-800">
                        {record.minutesLate} mnt
                      </span>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      <button
                        onClick={() => handleDelete(record.id, record.studentName)}
                        disabled={deleting === record.id}
                        className="text-red-500 hover:text-red-700 disabled:opacity-50 transition-colors"
                        title="Hapus"
                      >
                        {deleting === record.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-gray-400">
                    <Clock className="w-10 h-10 mx-auto mb-3 text-gray-200" />
                    <p>Belum ada data keterlambatan</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}