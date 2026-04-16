import { useState, useEffect, useRef } from 'react';
import {
  Users, Plus, Edit2, Trash2, X, ChevronDown, Loader2,
  Search, Upload, Download, BookOpen, GraduationCap,
  Camera, RefreshCw, ScanFace,
} from 'lucide-react';
import { getStudents, addStudent, updateStudent, deleteStudent, getClasses, addClass, updateClass, deleteClass } from '../utils/storage';
import { Student } from '../types';
import { toast } from 'sonner';
import { captureFaceDescriptor, loadFaceModels } from '../utils/face';

export function StudentManagement() {
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<string[]>([]);
  const [filterClass, setFilterClass] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Modal states
  const [isStudentModalOpen, setIsStudentModalOpen] = useState(false);
  const [isClassModalOpen, setIsClassModalOpen] = useState(false);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);

  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [editingClassName, setEditingClassName] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [deletingClass, setDeletingClass] = useState<string | null>(null);
  const [bulkText, setBulkText] = useState('');
  const [newClassName, setNewClassName] = useState('');
  const [savingClass, setSavingClass] = useState(false);

  const [formData, setFormData] = useState({ name: '', class: '', nisn: '' });
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraLoading, setCameraLoading] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [faceImage, setFaceImage] = useState('');
  const [faceDescriptor, setFaceDescriptor] = useState<number[] | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const photoInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    loadAll();
  }, []);

  useEffect(() => {
    return () => {
      stopFaceCamera();
    };
  }, []);

  const loadAll = async () => {
    try {
      setLoading(true);
      const [allStudents, allClasses] = await Promise.all([getStudents(), getClasses()]);
      setStudents(allStudents.sort((a, b) => a.class.localeCompare(b.class) || a.name.localeCompare(b.name)));
      setClasses(allClasses);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Gagal memuat data');
    } finally {
      setLoading(false);
    }
  };

  const loadStudents = async () => {
    const all = await getStudents();
    setStudents(all.sort((a, b) => a.class.localeCompare(b.class) || a.name.localeCompare(b.name)));
  };

  const stopFaceCamera = () => {
    const stream = streamRef.current;
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
    }
    streamRef.current = null;
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
  };

  const startFaceCamera = async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      toast.error('Browser tidak mendukung kamera');
      return;
    }

    try {
      setCameraLoading(true);
      setCameraError('');
      stopFaceCamera();

      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' }, audio: false });
      streamRef.current = stream;
      setCameraActive(true);

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
    } catch (error) {
      console.error('Error opening camera:', error);
      setCameraError('Tidak dapat mengakses kamera. Pastikan izin kamera aktif.');
      toast.error('Gagal membuka kamera');
    } finally {
      setCameraLoading(false);
    }
  };

  const captureStudentFace = async () => {
    if (!cameraActive) {
      toast.error('Buka kamera terlebih dahulu');
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    try {
      setCameraLoading(true);
      await loadFaceModels();
      const descriptor = await captureFaceDescriptor(video);
      if (!descriptor) {
        setCameraError('Wajah tidak terdeteksi. Arahkan muka ke kamera dan coba lagi.');
        toast.error('Wajah tidak terdeteksi');
        return;
      }

      const width = video.videoWidth || 640;
      const height = video.videoHeight || 480;
      canvas.width = width;
      canvas.height = height;
      const context = canvas.getContext('2d');
      if (context) {
        context.drawImage(video, 0, 0, width, height);
      }

      setFaceImage(canvas.toDataURL('image/jpeg', 0.9));
      setFaceDescriptor(descriptor);
      setCameraError('');
      toast.success('Wajah siswa berhasil didaftarkan');
    } catch (error) {
      console.error('Error capturing face:', error);
      toast.error('Gagal mendaftarkan wajah');
    } finally {
      setCameraLoading(false);
    }
  };

  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('File harus berupa gambar');
      event.target.value = '';
      return;
    }

    try {
      setCameraLoading(true);
      setCameraError('');
      await loadFaceModels();

      const objectUrl = URL.createObjectURL(file);
      const image = await new Promise<HTMLImageElement>((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error('Gagal membaca gambar'));
        img.src = objectUrl;
      });

      const descriptor = await captureFaceDescriptor(image);
      URL.revokeObjectURL(objectUrl);

      if (!descriptor) {
        setCameraError('Wajah tidak terdeteksi pada foto. Gunakan foto yang lebih jelas dan menghadap depan.');
        toast.error('Wajah tidak terdeteksi pada foto');
        event.target.value = '';
        return;
      }

      const canvas = canvasRef.current;
      if (!canvas) {
        toast.error('Kanvas tidak tersedia');
        event.target.value = '';
        return;
      }

      const maxSize = 900;
      const scale = Math.min(1, maxSize / Math.max(image.width, image.height));
      canvas.width = Math.max(1, Math.round(image.width * scale));
      canvas.height = Math.max(1, Math.round(image.height * scale));

      const context = canvas.getContext('2d');
      if (!context) {
        toast.error('Gagal menyiapkan kanvas');
        event.target.value = '';
        return;
      }

      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      setFaceImage(canvas.toDataURL('image/jpeg', 0.9));
      setFaceDescriptor(descriptor);
      toast.success('Wajah siswa berhasil didaftarkan dari foto');
    } catch (error) {
      console.error('Error uploading face photo:', error);
      toast.error('Gagal memproses foto wajah');
    } finally {
      setCameraLoading(false);
      event.target.value = '';
    }
  };

  const resetStudentFace = () => {
    setFaceImage('');
    setFaceDescriptor(null);
    setCameraError('');
  };

  // ─── CLASS MANAGEMENT ────────────────────────────────────────────────────────

  const handleOpenClassModal = (className?: string) => {
    if (className) {
      setEditingClassName(className);
      setNewClassName(className);
    } else {
      setEditingClassName('');
      setNewClassName('');
    }
    setIsClassModalOpen(true);
  };

  const handleCloseClassModal = () => {
    setIsClassModalOpen(false);
    setEditingClassName('');
    setNewClassName('');
  };

  const handleAddClass = async () => {
    const name = newClassName.trim().toUpperCase();
    if (!name) { toast.error('Nama kelas tidak boleh kosong'); return; }
    if (classes.includes(name) && name !== editingClassName) { toast.error(`Kelas ${name} sudah ada`); return; }
    try {
      setSavingClass(true);
      if (editingClassName) {
        await updateClass(editingClassName, name);
        toast.success(`Kelas ${editingClassName} berhasil diubah menjadi ${name}`);
      } else {
        await addClass(name);
        toast.success(`Kelas ${name} berhasil ditambahkan`);
      }
      await loadAll();
      setNewClassName('');
      setEditingClassName('');
      setIsClassModalOpen(false);
    } catch (error) {
      console.error('Error adding class:', error);
      toast.error('Gagal menambah kelas');
    } finally {
      setSavingClass(false);
    }
  };

  const handleDeleteClass = async (name: string) => {
    const inUse = students.some(s => s.class === name);
    if (inUse) {
      toast.error(`Kelas ${name} masih digunakan oleh siswa. Pindahkan siswa terlebih dahulu.`);
      return;
    }
    if (!confirm(`Hapus kelas "${name}"?`)) return;
    try {
      setDeletingClass(name);
      await deleteClass(name);
      setClasses(prev => prev.filter(c => c !== name));
      toast.success(`Kelas ${name} berhasil dihapus`);
    } catch (error) {
      console.error('Error deleting class:', error);
      toast.error('Gagal menghapus kelas');
    } finally {
      setDeletingClass(null);
    }
  };

  // ─── STUDENT CRUD ────────────────────────────────────────────────────────────

  const handleOpenModal = (student?: Student) => {
    if (student) {
      setEditingStudent(student);
      setFormData({ name: student.name, class: student.class, nisn: student.nisn });
      setFaceImage(student.faceImage || '');
      setFaceDescriptor(student.faceDescriptor || null);
    } else {
      setEditingStudent(null);
      setFormData({ name: '', class: classes[0] || '', nisn: '' });
      setFaceImage('');
      setFaceDescriptor(null);
    }
    setIsStudentModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsStudentModalOpen(false);
    setEditingStudent(null);
    setFormData({ name: '', class: '', nisn: '' });
    setFaceImage('');
    setFaceDescriptor(null);
    setCameraError('');
    stopFaceCamera();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.class) {
      toast.error('Nama dan kelas wajib diisi');
      return;
    }
    try {
      setSaving(true);
      if (editingStudent) {
        const updated: Student = {
          ...editingStudent,
          name: formData.name.trim(),
          class: formData.class,
          nisn: formData.nisn.trim(),
          faceImage: faceImage || null,
          faceDescriptor: faceDescriptor,
          faceEnrolledAt: faceDescriptor ? new Date().toISOString() : editingStudent.faceEnrolledAt || null,
        };
        await updateStudent(editingStudent.id, updated);
        toast.success('Data siswa berhasil diperbarui');
      } else {
        await addStudent({
          name: formData.name.trim(),
          class: formData.class,
          nisn: formData.nisn.trim(),
          faceImage: faceImage || null,
          faceDescriptor: faceDescriptor,
          faceEnrolledAt: faceDescriptor ? new Date().toISOString() : null,
        });
        toast.success('Siswa baru berhasil ditambahkan');
      }
      await loadStudents();
      handleCloseModal();
    } catch (error) {
      console.error('Error saving student:', error);
      toast.error('Gagal menyimpan data siswa');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Hapus siswa "${name}"?`)) return;
    try {
      setDeleting(id);
      await deleteStudent(id);
      await loadStudents();
      toast.success(`Siswa ${name} berhasil dihapus`);
    } catch (error) {
      console.error('Error deleting student:', error);
      toast.error('Gagal menghapus siswa');
    } finally {
      setDeleting(null);
    }
  };

  // ─── BULK IMPORT ─────────────────────────────────────────────────────────────

  const handleBulkImport = async () => {
    const lines = bulkText.trim().split('\n').filter(l => l.trim());
    if (lines.length === 0) { toast.error('Format tidak valid'); return; }
    try {
      setSaving(true);
      let count = 0;
      for (const line of lines) {
        const parts = line.split(',').map(p => p.trim());
        if (parts.length >= 2) {
          const studentClass = parts[2]?.toUpperCase() || '';
          await addStudent({ nisn: parts[0], name: parts[1], class: studentClass });
          count++;
        }
      }
      await loadStudents();
      setIsBulkModalOpen(false);
      setBulkText('');
      toast.success(`✅ ${count} siswa berhasil diimpor`);
    } catch (error) {
      console.error('Error bulk importing:', error);
      toast.error('Gagal mengimpor data');
    } finally {
      setSaving(false);
    }
  };

  // ─── EXPORT CSV ──────────────────────────────────────────────────────────────

  const handleExport = () => {
    const rows = [
      ['NISN', 'Nama', 'Kelas'],
      ...students.map(s => [s.nisn, s.name, s.class]),
    ];
    const csv = rows.map(r => r.join(',')).join('\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'data-siswa.csv';
    link.click();
    toast.success('Data siswa berhasil diekspor');
  };

  // ─── FILTER ──────────────────────────────────────────────────────────────────

  const filteredStudents = students.filter(s => {
    const matchClass = filterClass === 'all' || s.class === filterClass;
    const q = searchQuery.toLowerCase();
    const matchSearch = s.name.toLowerCase().includes(q) ||
      s.nisn.includes(q) || s.class.toLowerCase().includes(q);
    return matchClass && matchSearch;
  });

  const allClasses = Array.from(new Set(students.map(s => s.class))).sort();

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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Data Siswa</h2>
          <p className="text-gray-500 mt-1">Kelola daftar kelas dan siswa yang terdaftar</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setIsBulkModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors text-sm font-medium"
          >
            <Upload className="w-4 h-4" /> Import
          </button>
          <button
            onClick={handleExport}
            disabled={students.length === 0}
            className="flex items-center gap-2 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors text-sm font-medium disabled:opacity-50"
          >
            <Download className="w-4 h-4" /> Export CSV
          </button>
          <button
            onClick={() => handleOpenModal()}
            disabled={classes.length === 0}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors text-sm font-semibold disabled:bg-blue-300"
          >
            <Plus className="w-4 h-4" /> Tambah Siswa
          </button>
        </div>
      </div>

      {/* ─── CLASS MANAGEMENT ─────────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-indigo-50 rounded-xl flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Manajemen Kelas</h3>
              <p className="text-xs text-gray-500">{classes.length} kelas terdaftar</p>
            </div>
          </div>
          <button
            onClick={() => setIsClassModalOpen(true)}
            className="flex items-center gap-2 px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium"
          >
            <Plus className="w-4 h-4" /> Tambah Kelas
          </button>
        </div>

        {classes.length === 0 ? (
          <div className="text-center py-6 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
            <GraduationCap className="w-10 h-10 text-gray-300 mx-auto mb-2" />
            <p className="text-gray-500 text-sm font-medium">Belum ada kelas</p>
            <p className="text-gray-400 text-xs mt-1">Tambah kelas terlebih dahulu sebelum menambah siswa</p>
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {classes.map(cls => {
              const count = students.filter(s => s.class === cls).length;
              return (
                <div
                  key={cls}
                  className="flex items-center gap-2 px-3 py-2 bg-indigo-50 border border-indigo-100 rounded-xl group"
                >
                  <GraduationCap className="w-4 h-4 text-indigo-500 flex-shrink-0" />
                  <span className="text-sm font-semibold text-indigo-800">{cls}</span>
                  <span className="text-xs text-indigo-400 font-medium">{count} siswa</span>
                  <button
                    onClick={() => handleOpenClassModal(cls)}
                    className="ml-1 text-indigo-300 hover:text-indigo-600 transition-colors"
                    title={`Edit kelas ${cls}`}
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDeleteClass(cls)}
                    disabled={deletingClass === cls}
                    className="ml-1 text-indigo-300 hover:text-red-500 transition-colors disabled:opacity-50"
                    title={`Hapus kelas ${cls}`}
                  >
                    {deletingClass === cls
                      ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      : <X className="w-3.5 h-3.5" />}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ─── STUDENTS TABLE ───────────────────────────────────────────────────── */}

      {/* Filter & Search */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Cari nama, NISN, atau kelas..."
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="relative">
            <select
              value={filterClass}
              onChange={e => setFilterClass(e.target.value)}
              className="pl-4 pr-10 py-2.5 border border-gray-300 rounded-xl text-sm appearance-none bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Semua Kelas ({students.length})</option>
              {allClasses.map(c => (
                <option key={c} value={c}>{c} ({students.filter(s => s.class === c).length})</option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-5 border-b border-gray-100 flex items-center justify-between">
          <p className="text-sm text-gray-500">
            Menampilkan <span className="font-semibold text-gray-900">{filteredStudents.length}</span> siswa
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">No</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">NISN</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Nama Siswa</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Kelas</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredStudents.length > 0 ? (
                filteredStudents.map((student, idx) => (
                  <tr key={student.id} className="hover:bg-gray-50">
                    <td className="px-5 py-4 text-sm text-gray-400">{idx + 1}</td>
                    <td className="px-5 py-4 whitespace-nowrap text-sm font-mono text-gray-500">
                      {student.nisn || <span className="text-gray-300 italic">—</span>}
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">{student.name}</td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      <span className="px-2.5 py-1 bg-blue-50 text-blue-700 text-xs font-semibold rounded-full">
                        {student.class}
                      </span>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => handleOpenModal(student)}
                          className="text-blue-500 hover:text-blue-700 transition-colors"
                          title="Edit"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(student.id, student.name)}
                          disabled={deleting === student.id}
                          className="text-red-400 hover:text-red-600 disabled:opacity-50 transition-colors"
                          title="Hapus"
                        >
                          {deleting === student.id
                            ? <Loader2 className="w-4 h-4 animate-spin" />
                            : <Trash2 className="w-4 h-4" />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-5 py-14 text-center text-gray-400">
                    <Users className="w-10 h-10 mx-auto mb-3 text-gray-200" />
                    <p>{searchQuery ? 'Tidak ada siswa yang cocok dengan pencarian' : 'Belum ada data siswa'}</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ─── ADD CLASS MODAL ──────────────────────────────────────────────────── */}
      {isClassModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h3 className="text-lg font-bold text-gray-900">{editingClassName ? 'Edit Kelas' : 'Tambah Kelas Baru'}</h3>
              <button onClick={handleCloseClassModal}
                className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Nama Kelas <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={newClassName}
                  onChange={e => setNewClassName(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleAddClass()}
                  placeholder="Contoh: X-1, XI-IPA-2, XII-IPS-1"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 uppercase"
                  style={{ textTransform: 'uppercase' }}
                  autoFocus
                />
                <p className="text-xs text-gray-400 mt-1">Nama kelas akan otomatis diubah ke huruf kapital</p>
              </div>
              <div className="flex gap-3 pt-1">
                <button
                  onClick={handleCloseClassModal}
                  className="flex-1 py-3 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50"
                >
                  Batal
                </button>
                <button
                  onClick={handleAddClass}
                  disabled={savingClass || !newClassName.trim()}
                  className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 disabled:bg-indigo-300 flex items-center justify-center gap-2"
                >
                  {savingClass ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  {editingClassName ? 'Simpan Perubahan' : 'Tambah Kelas'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── ADD/EDIT STUDENT MODAL ───────────────────────────────────────────── */}
      {isStudentModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[calc(100dvh-2rem)] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h3 className="text-xl font-bold text-gray-900">
                {editingStudent ? 'Edit Data Siswa' : 'Tambah Siswa Baru'}
              </h3>
              <button onClick={handleCloseModal} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1 min-h-0">
              {/* Kelas select */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Kelas <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <select
                    value={formData.class}
                    onChange={e => setFormData({ ...formData, class: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl appearance-none bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Pilih Kelas</option>
                    {classes.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                </div>
              </div>

              {/* Nama */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Nama Lengkap <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Contoh: Ahmad Rizki Pratama"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              {/* NISN (opsional) */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  NISN <span className="text-gray-400 font-normal text-xs">(opsional)</span>
                </label>
                <input
                  type="text"
                  value={formData.nisn}
                  onChange={e => setFormData({ ...formData, nisn: e.target.value })}
                  placeholder="Contoh: 0012345678"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 space-y-3">
                <div>
                  <label className="block text-sm font-semibold text-gray-700">Daftar Wajah Siswa</label>
                  <p className="text-xs text-gray-500 mt-1">Data ini dipakai untuk pencocokan otomatis dari kamera saat absensi.</p>
                </div>

                {cameraError && (
                  <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700">
                    {cameraError}
                  </div>
                )}

                <div className="grid gap-3 md:grid-cols-2">
                  <div className="overflow-hidden rounded-xl bg-black aspect-video relative">
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      className={`h-full w-full object-cover ${cameraActive ? 'opacity-100' : 'opacity-40'}`}
                    />
                    {!cameraActive && (
                      <div className="absolute inset-0 flex items-center justify-center text-sm text-white/80 px-4 text-center">
                        Buka kamera lalu arahkan wajah siswa ke layar.
                      </div>
                    )}
                  </div>

                  <div className="rounded-xl border border-dashed border-gray-300 bg-white p-4 flex flex-col justify-between gap-3 min-h-[160px] md:min-h-[220px]">
                    <div>
                      <p className="text-sm font-semibold text-gray-800 mb-1">Hasil enrollment</p>
                      <p className="text-xs text-gray-500">Satu foto wajah dan descriptor akan disimpan untuk matching.</p>
                    </div>

                    {faceImage ? (
                      <div className="space-y-3">
                        <img src={faceImage} alt="Wajah siswa" className="w-full rounded-xl border border-gray-200 object-cover" />
                        <button
                          type="button"
                          onClick={resetStudentFace}
                          className="inline-flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700"
                        >
                          <RefreshCw className="w-4 h-4" />
                          Hapus hasil scan
                        </button>
                      </div>
                    ) : (
                      <div className="flex flex-1 items-center justify-center rounded-xl bg-gray-50 border border-gray-100 text-center px-6 py-10">
                        <div>
                          <ScanFace className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                          <p className="text-sm font-medium text-gray-700">Belum ada data wajah</p>
                          <p className="text-xs text-gray-500 mt-1">Klik scan untuk menyimpan wajah siswa.</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={cameraActive ? stopFaceCamera : startFaceCamera}
                    disabled={cameraLoading}
                    className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60"
                  >
                    <Camera className="w-4 h-4" />
                    {cameraActive ? 'Tutup Kamera' : 'Buka Kamera'}
                  </button>
                  <button
                    type="button"
                    onClick={captureStudentFace}
                    disabled={!cameraActive || cameraLoading}
                    className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 disabled:bg-indigo-400 disabled:cursor-not-allowed"
                  >
                    {cameraLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ScanFace className="w-4 h-4" />}
                    Scan Wajah Siswa
                  </button>
                  <button
                    type="button"
                    onClick={() => photoInputRef.current?.click()}
                    disabled={cameraLoading}
                    className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-indigo-200 bg-indigo-50 text-indigo-700 text-sm font-semibold hover:bg-indigo-100 disabled:opacity-60"
                  >
                    <Upload className="w-4 h-4" />
                    Upload Foto Siswa
                  </button>
                  <input
                    ref={photoInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="hidden"
                  />
                </div>

                <canvas ref={canvasRef} className="hidden" />
              </div>

              <div className="flex gap-3 pt-2 sticky bottom-0 bg-white pb-1">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="flex-1 py-3 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 disabled:bg-blue-400 flex items-center justify-center gap-2"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  {editingStudent ? 'Simpan' : 'Tambah'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── BULK IMPORT MODAL ───────────────────────────────────────────────── */}
      {isBulkModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h3 className="text-xl font-bold text-gray-900">Import Siswa Massal</h3>
              <button onClick={() => setIsBulkModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-blue-50 rounded-xl p-4 text-sm text-blue-700">
                <p className="font-semibold mb-1">Format per baris:</p>
                <code className="bg-blue-100 px-2 py-0.5 rounded text-xs">NISN,Nama Lengkap,Kelas</code>
                <p className="mt-2 text-blue-600">Contoh:</p>
                <pre className="text-xs mt-1 text-blue-600">
{`0012345601,Ahmad Rizki,X-1
,Siti Nurhaliza,X-1
0012345603,Budi Santoso,XI-IPA-1`}
                </pre>
                <p className="text-xs mt-2 text-blue-500">*NISN boleh dikosongkan (tetap isi koma)</p>
              </div>
              <textarea
                value={bulkText}
                onChange={e => setBulkText(e.target.value)}
                rows={8}
                placeholder="Paste data siswa di sini..."
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm resize-none"
              />
              <div className="flex gap-3">
                <button
                  onClick={() => setIsBulkModalOpen(false)}
                  className="flex-1 py-3 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50"
                >
                  Batal
                </button>
                <button
                  onClick={handleBulkImport}
                  disabled={saving || !bulkText.trim()}
                  className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 disabled:bg-blue-400 flex items-center justify-center gap-2"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                  Import Data
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
