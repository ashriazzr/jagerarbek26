import { useState, useEffect } from "react";
import { Clock, Save, Users } from "lucide-react";
import { classesAPI, studentsAPI, tardinessAPI } from "../utils/api";
import { Class, Student } from "../types";
import { format } from "date-fns";
import { toast } from "sonner";

export function TardinessForm() {
  const [classes, setClasses] = useState<Class[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
  
  const [selectedClassId, setSelectedClassId] = useState("");
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [reason, setReason] = useState("");
  const [lateDate, setLateDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [lateTime, setLateTime] = useState(format(new Date(), "HH:mm"));
  const [useCurrentTime, setUseCurrentTime] = useState(true);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (selectedClassId) {
      const filtered = students.filter(s => s.classId === selectedClassId);
      setFilteredStudents(filtered);
      setSelectedStudentId("");
    } else {
      setFilteredStudents([]);
    }
  }, [selectedClassId, students]);

  useEffect(() => {
    if (useCurrentTime) {
      const interval = setInterval(() => {
        setLateDate(format(new Date(), "yyyy-MM-dd"));
        setLateTime(format(new Date(), "HH:mm"));
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [useCurrentTime]);

  const loadData = async () => {
    try {
      const [classesRes, studentsRes] = await Promise.all([
        classesAPI.getAll(),
        studentsAPI.getAll(),
      ]);
      setClasses(classesRes.data || []);
      setStudents(studentsRes.data || []);
    } catch (error) {
      console.error("Error loading data:", error);
      toast.error("Gagal memuat data");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedClassId || !selectedStudentId || !reason) {
      toast.error("Semua field harus diisi!");
      return;
    }

    setLoading(true);
    try {
      const selectedClass = classes.find(c => c.id === selectedClassId);
      const selectedStudent = students.find(s => s.id === selectedStudentId);

      await tardinessAPI.create({
        studentId: selectedStudentId,
        studentName: selectedStudent?.name,
        classId: selectedClassId,
        className: selectedClass?.name,
        reason,
        lateTime,
        lateDate,
      });

      toast.success("Data keterlambatan berhasil disimpan!");
      
      // Reset form
      setSelectedClassId("");
      setSelectedStudentId("");
      setReason("");
      setUseCurrentTime(true);
    } catch (error) {
      console.error("Error saving tardiness:", error);
      toast.error("Gagal menyimpan data");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center gap-3 mb-6">
        <Clock className="w-8 h-8 text-blue-600" />
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Form Absensi Keterlambatan</h2>
          <p className="text-sm text-gray-600">Catat siswa yang terlambat masuk sekolah</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Pilih Kelas */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Pilih Kelas <span className="text-red-500">*</span>
          </label>
          <select
            value={selectedClassId}
            onChange={(e) => setSelectedClassId(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          >
            <option value="">-- Pilih Kelas --</option>
            {classes.map((cls) => (
              <option key={cls.id} value={cls.id}>
                {cls.name}
              </option>
            ))}
          </select>
        </div>

        {/* Pilih Siswa */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Pilih Siswa <span className="text-red-500">*</span>
          </label>
          <select
            value={selectedStudentId}
            onChange={(e) => setSelectedStudentId(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
            disabled={!selectedClassId}
          >
            <option value="">-- Pilih Siswa --</option>
            {filteredStudents.map((student) => (
              <option key={student.id} value={student.id}>
                {student.name} ({student.nis})
              </option>
            ))}
          </select>
          {!selectedClassId && (
            <p className="text-sm text-gray-500 mt-1">Pilih kelas terlebih dahulu</p>
          )}
        </div>

        {/* Alasan Keterlambatan */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Alasan Keterlambatan <span className="text-red-500">*</span>
          </label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={4}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Contoh: Bangun kesiangan, Kendaraan mogok, dll."
            required
          />
        </div>

        {/* Waktu */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="flex items-center justify-between mb-4">
            <label className="block text-sm font-medium text-gray-700">
              Waktu Keterlambatan
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={useCurrentTime}
                onChange={(e) => setUseCurrentTime(e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-600">Gunakan waktu sekarang</span>
            </label>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tanggal
              </label>
              <input
                type="date"
                lang="id-ID"
                value={lateDate}
                onChange={(e) => setLateDate(e.target.value)}
                disabled={useCurrentTime}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Jam
              </label>
              <input
                type="time"
                value={lateTime}
                onChange={(e) => setLateTime(e.target.value)}
                disabled={useCurrentTime}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                required
              />
            </div>
          </div>

          {useCurrentTime && (
            <p className="text-sm text-blue-600 mt-2">
              Waktu akan diperbarui secara otomatis
            </p>
          )}
        </div>

        {/* Submit Button */}
        <div className="flex gap-3">
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            <Save className="w-5 h-5" />
            {loading ? "Menyimpan..." : "Simpan Data"}
          </button>
        </div>
      </form>

      {/* Info Box */}
      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex gap-3">
          <Users className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-800">
            <p className="font-semibold mb-1">Informasi:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Pastikan data siswa dan kelas sudah terdaftar di Data Master</li>
              <li>Waktu akan otomatis menggunakan waktu saat ini (dapat diubah manual)</li>
              <li>Data yang tersimpan dapat dilihat di menu Laporan Keterlambatan</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
