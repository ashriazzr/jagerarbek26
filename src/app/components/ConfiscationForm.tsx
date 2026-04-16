import { useState, useEffect } from 'react';
import { ShieldAlert, Save, Trash2, Check, ChevronDown, Loader2, AlertCircle, Package } from 'lucide-react';
import {
  getStudents,
  getConfiscationRecords,
  addConfiscationRecord,
  updateConfiscationRecord,
  deleteConfiscationRecord,
  getUniqueClasses,
} from '../utils/storage';
import { ConfiscationRecord, Student } from '../types';
import { format } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import { toast } from 'sonner';

export function ConfiscationForm() {
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedStudent, setSelectedStudent] = useState('');
  const [item, setItem] = useState('');
  const [confiscationDate, setConfiscationDate] = useState('');
  const [plannedPickupDate, setPlannedPickupDate] = useState('');
  const [notes, setNotes] = useState('');

  const [classes, setClasses] = useState<string[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [classStudents, setClassStudents] = useState<Student[]>([]);
  const [confiscationRecords, setConfiscationRecords] = useState<ConfiscationRecord[]>([]);
  const [filterStatus, setFilterStatus] = useState<'all' | 'disita' | 'dikembalikan'>('all');
  const [filterClass, setFilterClass] = useState('all');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [returning, setReturning] = useState<string | null>(null);

  const itemOptions = [
    'Handphone / HP',
    'Rokok',
    'Earphone / Headphone',
    'Buku non-pelajaran',
    'Kosmetik / Makeup',
    'Charger',
    'Power Bank',
    'Lainnya',
  ];

  useEffect(() => {
    loadInitialData();
    const now = new Date();
    setConfiscationDate(format(now, 'yyyy-MM-dd'));
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

  const loadInitialData = async () => {
    try {
      setLoading(true);
      const [allStudents, records, uniqueClasses] = await Promise.all([
        getStudents(),
        getConfiscationRecords(),
        getUniqueClasses(),
      ]);
      setStudents(allStudents);
      setClasses(uniqueClasses);
      const sorted = [...records].sort(
        (a, b) => new Date(b.confiscationDate).getTime() - new Date(a.confiscationDate).getTime()
      );
      setConfiscationRecords(sorted);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Gagal memuat data');
    } finally {
      setLoading(false);
    }
  };

  const loadRecords = async () => {
    try {
      const records = await getConfiscationRecords();
      const sorted = [...records].sort(
        (a, b) => {
          try {
            const dateA = new Date(`${a.confiscationDate || '1970-01-01'}T00:00:00`);
            const dateB = new Date(`${b.confiscationDate || '1970-01-01'}T00:00:00`);
            if (isNaN(dateA.getTime()) || isNaN(dateB.getTime())) {
              return 0;
            }
            return dateB.getTime() - dateA.getTime();
          } catch {
            return 0;
          }
        }
      );
      setConfiscationRecords(sorted);
    } catch (error) {
      console.error('Error loading records:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClass || !selectedStudent || !item.trim() || !confiscationDate) {
      toast.error('Mohon lengkapi semua field wajib');
      return;
    }

    const student = classStudents.find((s) => s.id === selectedStudent);
    if (!student) {
      toast.error('Siswa tidak ditemukan');
      return;
    }

    try {
      setSaving(true);
      const record: Omit<ConfiscationRecord, 'id'> = {
        studentId: student.id,
        studentName: student.name,
        studentClass: student.class,
        item: item.trim(),
        confiscationDate,
        pickupDate: plannedPickupDate || null,
        status: 'disita',
        notes: notes.trim() || undefined,
      };
      await addConfiscationRecord(record);
      await loadRecords();

      setItem('');
      setNotes('');
      setPlannedPickupDate('');
      const now = new Date();
      setConfiscationDate(format(now, 'yyyy-MM-dd'));

      toast.success(`✅ Barang "${item}" dari ${student.name} berhasil dicatat`);
    } catch (error) {
      console.error('Error saving record:', error);
      toast.error('Gagal menyimpan data razia');
    } finally {
      setSaving(false);
    }
  };

  const handleReturn = async (id: string, studentName: string, itemName: string) => {
    const record = confiscationRecords.find((r) => r.id === id);
    if (!record) return;

    try {
      setReturning(id);
      const updated: ConfiscationRecord = {
        ...record,
        pickupDate: format(new Date(), 'yyyy-MM-dd'),
        status: 'dikembalikan',
      };
      await updateConfiscationRecord(id, updated);
      await loadRecords();
      toast.success(`✅ Barang "${itemName}" telah dikembalikan kepada ${studentName}`);
    } catch (error) {
      console.error('Error updating record:', error);
      toast.error('Gagal mengupdate status');
    } finally {
      setReturning(null);
    }
  };

  const handleDelete = async (id: string, studentName: string, itemName: string) => {
    if (!confirm(`Hapus data penyitaan "${itemName}" dari ${studentName}?`)) return;
    try {
      setDeleting(id);
      await deleteConfiscationRecord(id);
      await loadRecords();
      toast.success('Data razia berhasil dihapus');
    } catch (error) {
      console.error('Error deleting:', error);
      toast.error('Gagal menghapus data');
    } finally {
      setDeleting(null);
    }
  };

  const allRecordClasses = Array.from(new Set(confiscationRecords.map((r) => r.studentClass))).sort();

  const filteredRecords = confiscationRecords.filter((r) => {
    const matchStatus = filterStatus === 'all' || r.status === filterStatus;
    const matchClass = filterClass === 'all' || r.studentClass === filterClass;
    return matchStatus && matchClass;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-10 h-10 text-red-500 animate-spin" />
          <p className="text-gray-500 font-medium">Memuat data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold text-gray-900">Data Razia & Barang Sitaan</h2>
        <p className="text-gray-500 mt-1">Catat barang sitaan dari siswa dan kelola status pengembalian</p>
      </div>

      {/* Form Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        {classes.length === 0 ? (
          <div className="text-center py-8">
            <AlertCircle className="w-12 h-12 text-amber-400 mx-auto mb-3" />
            <p className="text-gray-600 font-medium">Belum ada data siswa</p>
            <p className="text-gray-400 text-sm mt-1">
              Tambahkan data siswa di menu{' '}
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
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl appearance-none bg-white focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
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
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl appearance-none bg-white focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-400"
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

            {/* Item */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Barang yang Disita <span className="text-red-500">*</span>
              </label>
              <div className="flex flex-wrap gap-2 mb-3">
                {itemOptions.map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => setItem(opt === 'Lainnya' ? '' : opt)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                      item === opt
                        ? 'bg-red-600 text-white border-red-600'
                        : 'bg-white text-gray-600 border-gray-300 hover:border-red-400 hover:text-red-600'
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
              <input
                type="text"
                value={item}
                onChange={(e) => setItem(e.target.value)}
                placeholder="Nama barang yang disita (e.g. HP Samsung A52, Rokok)"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Confiscation Date */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Tanggal Penyitaan <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  lang="id-ID"
                  value={confiscationDate}
                  onChange={(e) => setConfiscationDate(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
              </div>

              {/* Planned Pickup Date */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Rencana Tanggal Pengambilan{' '}
                  <span className="text-gray-400 font-normal">(opsional)</span>
                </label>
                <input
                  type="date"
                  lang="id-ID"
                  value={plannedPickupDate}
                  onChange={(e) => setPlannedPickupDate(e.target.value)}
                  min={confiscationDate}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Catatan Tambahan{' '}
                <span className="text-gray-400 font-normal">(opsional)</span>
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                placeholder="Keterangan tambahan mengenai barang atau kondisi penyitaan..."
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
              />
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={saving}
              className="w-full bg-red-600 text-white py-3.5 rounded-xl font-semibold hover:bg-red-700 transition-colors flex items-center justify-center gap-2 disabled:bg-red-400"
            >
              {saving ? (
                <><Loader2 className="w-5 h-5 animate-spin" /> Menyimpan...</>
              ) : (
                <><Save className="w-5 h-5" /> Simpan Data Razia</>
              )}
            </button>
          </form>
        )}
      </div>

      {/* Records */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-5 border-b border-gray-100">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h3 className="font-semibold text-gray-900">Riwayat Data Razia</h3>
              <p className="text-sm text-gray-500 mt-0.5">Menampilkan {filteredRecords.length} data</p>
            </div>
            <div className="flex flex-wrap gap-2 items-center">
              {/* Status Filter */}
              <div className="flex rounded-lg border border-gray-200 overflow-hidden text-sm">
                {(['all', 'disita', 'dikembalikan'] as const).map((status) => (
                  <button
                    key={status}
                    onClick={() => setFilterStatus(status)}
                    className={`px-3 py-1.5 font-medium transition-colors ${
                      filterStatus === status
                        ? status === 'all'
                          ? 'bg-gray-800 text-white'
                          : status === 'disita'
                          ? 'bg-red-600 text-white'
                          : 'bg-green-600 text-white'
                        : 'bg-white text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    {status === 'all' ? 'Semua' : status === 'disita' ? 'Disita' : 'Dikembalikan'}
                  </button>
                ))}
              </div>
              {/* Class Filter */}
              <div className="relative">
                <select
                  value={filterClass}
                  onChange={(e) => setFilterClass(e.target.value)}
                  className="pl-3 pr-8 py-1.5 text-sm border border-gray-200 rounded-lg appearance-none bg-white focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  <option value="all">Semua Kelas</option>
                  {allRecordClasses.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Tgl Sita</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Siswa</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Kelas</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Barang</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Status</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Tgl Ambil</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredRecords.length > 0 ? (
                filteredRecords.map((record) => (
                  <tr key={record.id} className="hover:bg-gray-50">
                    <td className="px-5 py-4 whitespace-nowrap text-sm text-gray-700">
                      {format(new Date(record.confiscationDate), 'dd/MM/yyyy', { locale: localeId })}
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                      {record.studentName}
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap text-sm text-gray-500">
                      {record.studentClass}
                    </td>
                    <td className="px-5 py-4 text-sm text-gray-900">
                      <div className="flex items-center gap-2">
                        <Package className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        <span className="font-medium">{record.item}</span>
                      </div>
                      {record.notes && (
                        <p className="text-xs text-gray-400 mt-0.5 italic">{record.notes}</p>
                      )}
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                          record.status === 'disita'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-green-100 text-green-800'
                        }`}
                      >
                        {record.status === 'disita' ? 'Disita' : 'Dikembalikan'}
                      </span>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap text-sm text-gray-500">
                      {record.pickupDate
                        ? format(new Date(record.pickupDate), 'dd/MM/yyyy', { locale: localeId })
                        : <span className="text-gray-300">—</span>}
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        {record.status === 'disita' && (
                          <button
                            onClick={() => handleReturn(record.id, record.studentName, record.item)}
                            disabled={returning === record.id}
                            className="text-green-600 hover:text-green-800 disabled:opacity-50 transition-colors"
                            title="Tandai Dikembalikan"
                          >
                            {returning === record.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Check className="w-4 h-4" />
                            )}
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(record.id, record.studentName, record.item)}
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
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-gray-400">
                    <ShieldAlert className="w-10 h-10 mx-auto mb-3 text-gray-200" />
                    <p>Belum ada data razia</p>
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
