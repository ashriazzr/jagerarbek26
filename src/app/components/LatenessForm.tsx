import { useState, useEffect, useRef } from 'react';
import {
  Clock,
  Camera,
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
import { safeDate, safeFormatDate, formatDurationMinutes } from '../utils/date';
import { captureFaceDescriptor, findBestFaceMatch, loadFaceModels } from '../utils/face';

export function LatenessForm() {
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedStudent, setSelectedStudent] = useState('');
  const [reason, setReason] = useState('');
  const [timestamp, setTimestamp] = useState('');
  const [minutesLate, setMinutesLate] = useState(0);
  const [schoolStartHour, setSchoolStartHour] = useState(7);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraLoading, setCameraLoading] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [faceImage, setFaceImage] = useState('');
  const [matchedStudentId, setMatchedStudentId] = useState('');
  const [matchedStudentName, setMatchedStudentName] = useState('');

  const [classes, setClasses] = useState<string[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [classStudents, setClassStudents] = useState<Student[]>([]);
  const [latenessRecords, setLatenessRecords] = useState<LatenessRecord[]>([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [filterClass, setFilterClass] = useState('all');

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const faceMatchRef = useRef<NodeJS.Timeout | null>(null);
  const faceMatchInFlightRef = useRef(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

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
      stopCamera();
    };
  }, []);

  useEffect(() => {
    if (selectedClass) {
      const filtered = students.filter((s) => s.class === selectedClass);
      setClassStudents(filtered);
      setSelectedStudent((current) => (filtered.some((student) => student.id === current) ? current : ''));
    } else {
      setClassStudents([]);
      setSelectedStudent('');
    }
  }, [selectedClass, students]);

  useEffect(() => {
    if (!cameraActive || selectedStudent) {
      if (faceMatchRef.current) {
        clearInterval(faceMatchRef.current);
        faceMatchRef.current = null;
      }
      return;
    }

    const attemptAutoMatch = async () => {
      if (faceMatchInFlightRef.current) return;
      faceMatchInFlightRef.current = true;
      try {
        await captureFace({ silent: true });
      } finally {
        faceMatchInFlightRef.current = false;
      }
    };

    attemptAutoMatch();
    faceMatchRef.current = setInterval(attemptAutoMatch, 1500);

    return () => {
      if (faceMatchRef.current) {
        clearInterval(faceMatchRef.current);
        faceMatchRef.current = null;
      }
    };
  }, [cameraActive, selectedStudent, students]);

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

  const stopCamera = () => {
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
    if (faceMatchRef.current) {
      clearInterval(faceMatchRef.current);
      faceMatchRef.current = null;
    }
  };

  const startCamera = async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      toast.error('Browser tidak mendukung akses kamera');
      return;
    }

    try {
      setCameraLoading(true);
      setCameraError('');
      stopCamera();

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user' },
        audio: false,
      });

      streamRef.current = stream;
      setCameraActive(true);

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
    } catch (error) {
      console.error('Error starting camera:', error);
      setCameraError('Tidak bisa mengakses kamera. Pastikan izin kamera diaktifkan.');
      toast.error('Gagal membuka kamera');
    } finally {
      setCameraLoading(false);
    }
  };

  const detectFacePresence = async () => {
    const video = videoRef.current;
    if (!video) return true;

    const detectorCtor = (window as Window & {
      FaceDetector?: new (options?: { fastMode?: boolean; maxDetectedFaces?: number }) => {
        detect: (source: HTMLVideoElement) => Promise<Array<unknown>>;
      };
    }).FaceDetector;

    if (!detectorCtor) return true;

    try {
      const detector = new detectorCtor({ fastMode: true, maxDetectedFaces: 1 });
      const faces = await detector.detect(video);
      return faces.length > 0;
    } catch (error) {
      console.warn('Face detection fallback:', error);
      return true;
    }
  };

  const captureFace = async (options: { silent?: boolean } = {}) => {
    const silent = options.silent ?? false;
    if (!cameraActive) {
      if (!silent) toast.error('Buka kamera terlebih dahulu');
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) {
      if (!silent) toast.error('Kamera belum siap');
      return;
    }

    try {
      setCameraLoading(true);

      const hasFace = await detectFacePresence();
      if (!hasFace) {
        if (!silent) {
          setCameraError('Wajah belum terdeteksi. Arahkan muka ke kamera lalu coba lagi.');
          toast.error('Wajah belum terdeteksi');
        }
        return;
      }

      const descriptor = await captureFaceDescriptor(video);
      if (!descriptor) {
        if (!silent) {
          setCameraError('Wajah belum terdeteksi. Arahkan muka ke kamera lalu coba lagi.');
          toast.error('Wajah belum terdeteksi');
        }
        return;
      }

      const width = video.videoWidth || 640;
      const height = video.videoHeight || 480;
      canvas.width = width;
      canvas.height = height;

      const context = canvas.getContext('2d');
      if (!context) {
        if (!silent) toast.error('Gagal menyiapkan kanvas');
        return;
      }

      context.drawImage(video, 0, 0, width, height);
      setFaceImage(canvas.toDataURL('image/jpeg', 0.9));

      const matchedStudent = findBestFaceMatch(descriptor, students);
      if (matchedStudent) {
        setSelectedClass(matchedStudent.class);
        setSelectedStudent(matchedStudent.id);
        setClassStudents(students.filter((s) => s.class === matchedStudent.class));
        setMatchedStudentId(matchedStudent.id);
        setMatchedStudentName(matchedStudent.name);
        setCameraError('');
        if (!silent) toast.success(`Wajah cocok: ${matchedStudent.name}`);
      } else {
        setMatchedStudentId('');
        setMatchedStudentName('');
        if (!silent) {
          setCameraError('Wajah terdeteksi, tetapi belum cocok dengan data siswa.');
          toast.error('Wajah belum cocok dengan data siswa');
        }
      }
    } catch (error) {
      console.error('Error capturing face:', error);
      if (!silent) toast.error('Gagal memindai wajah');
    } finally {
      setCameraLoading(false);
    }
  };

  const retakeFace = () => {
    setFaceImage('');
    setCameraError('');
    setMatchedStudentId('');
    setMatchedStudentName('');
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

    if (cameraActive && !matchedStudentId) {
      toast.error('Wajah belum cocok. Arahkan kamera ke siswa sampai terdeteksi otomatis.');
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
        faceImage: faceImage || null,
      };
      await addLatenessRecord(record);
      await loadRecords();

      setReason('');
      setFaceImage('');
      setMatchedStudentId('');
      setMatchedStudentName('');
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
                    onChange={(e) => {
                      setSelectedClass(e.target.value);
                      setMatchedStudentId('');
                      setMatchedStudentName('');
                    }}
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
                    onChange={(e) => {
                      setSelectedStudent(e.target.value);
                      setMatchedStudentId('');
                      setMatchedStudentName('');
                    }}
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
                    Terlambat {formatDurationMinutes(minutesLate)}
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

            {/* Face scan */}
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between mb-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700">
                    Scan Muka dari Kamera
                  </label>
                  <p className="text-xs text-gray-500 mt-1">
                    Opsional, tapi disimpan sebagai bukti keterlambatan kalau backend sudah punya kolom fotonya.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={cameraActive ? stopCamera : startCamera}
                    disabled={cameraLoading}
                    className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60"
                  >
                    <Camera className="w-4 h-4" />
                    {cameraActive ? 'Tutup Kamera' : 'Buka Kamera'}
                  </button>
                  <button
                    type="button"
                    onClick={captureFace}
                    disabled={!cameraActive || cameraLoading}
                    className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed"
                  >
                    {cameraLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
                    Scan Wajah
                  </button>
                </div>
              </div>

              {cameraError && (
                <div className="mb-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700">
                  {cameraError}
                </div>
              )}

              <div className="grid gap-4 md:grid-cols-2">
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
                      Kamera belum aktif. Klik buka kamera untuk mulai scan.
                    </div>
                  )}
                </div>

                <div className="rounded-xl border border-dashed border-gray-300 bg-white p-4 min-h-[240px] flex flex-col justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-gray-800 mb-1">Hasil Scan</p>
                    <p className="text-xs text-gray-500">
                      Foto yang diambil akan ikut disimpan bersama data keterlambatan.
                    </p>
                  </div>

                  {faceImage ? (
                    <div className="space-y-3">
                      <img
                        src={faceImage}
                        alt="Hasil scan wajah"
                        className="w-full rounded-xl border border-gray-200 object-cover"
                      />
                      <button
                        type="button"
                        onClick={retakeFace}
                        className="inline-flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700"
                      >
                        <RefreshCw className="w-4 h-4" />
                        Scan ulang
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-1 items-center justify-center rounded-xl bg-gray-50 border border-gray-100 text-center px-6 py-10">
                      <div>
                        <Camera className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                        <p className="text-sm font-medium text-gray-700">Belum ada foto wajah</p>
                        <p className="text-xs text-gray-500 mt-1">Buka kamera lalu klik scan wajah.</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {cameraActive && matchedStudentName && (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
                  Wajah terdeteksi otomatis: <span className="font-semibold">{matchedStudentName}</span>
                </div>
              )}

              <canvas ref={canvasRef} className="hidden" />
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={saving || (cameraActive && !matchedStudentId)}
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
                      <div>{safeFormatDate(record.timestamp, "dd/MM/yy HH:mm", { locale: localeId })}</div>
                      {record.faceImage && (
                        <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-sky-100 px-2 py-0.5 text-[11px] font-semibold text-sky-700">
                          <Camera className="w-3 h-3" />
                          Scan tersimpan
                        </span>
                      )}
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
                        {formatDurationMinutes(record.minutesLate)}
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