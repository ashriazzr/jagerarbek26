import { useState, useEffect } from "react";
import { Database, Plus, Trash2, Users, School, Edit } from "lucide-react";
import { classesAPI, studentsAPI } from "../utils/api";
import { Class, Student } from "../types";
import { toast } from "sonner";

export function MasterData() {
  const [activeTab, setActiveTab] = useState<"students" | "classes">("students");
  const [classes, setClasses] = useState<Class[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);

  // Form states for class
  const [showClassForm, setShowClassForm] = useState(false);
  const [className, setClassName] = useState("");
  const [classLevel, setClassLevel] = useState("");
  const [homeroom, setHomeroom] = useState("");

  // Form states for student
  const [showStudentForm, setShowStudentForm] = useState(false);
  const [studentName, setStudentName] = useState("");
  const [studentNis, setStudentNis] = useState("");
  const [studentClassId, setStudentClassId] = useState("");
  const [studentGender, setStudentGender] = useState<"L" | "P">("L");
  const [studentPhone, setStudentPhone] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
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
    } finally {
      setLoading(false);
    }
  };

  // Class functions
  const handleAddClass = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await classesAPI.create({
        name: className,
        level: classLevel,
        homeroom,
      });
      toast.success("Kelas berhasil ditambahkan");
      setClassName("");
      setClassLevel("");
      setHomeroom("");
      setShowClassForm(false);
      loadData();
    } catch (error) {
      console.error("Error adding class:", error);
      toast.error("Gagal menambahkan kelas");
    }
  };

  const handleDeleteClass = async (id: string) => {
    if (!confirm("Yakin ingin menghapus kelas ini?")) return;

    const hasStudents = students.some(s => s.classId === id);
    if (hasStudents) {
      toast.error("Tidak dapat menghapus kelas yang masih memiliki siswa");
      return;
    }

    try {
      await classesAPI.delete(id);
      toast.success("Kelas berhasil dihapus");
      loadData();
    } catch (error) {
      console.error("Error deleting class:", error);
      toast.error("Gagal menghapus kelas");
    }
  };

  // Student functions
  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await studentsAPI.create({
        name: studentName,
        nis: studentNis,
        classId: studentClassId,
        gender: studentGender,
        phone: studentPhone,
      });
      toast.success("Siswa berhasil ditambahkan");
      setStudentName("");
      setStudentNis("");
      setStudentClassId("");
      setStudentGender("L");
      setStudentPhone("");
      setShowStudentForm(false);
      loadData();
    } catch (error) {
      console.error("Error adding student:", error);
      toast.error("Gagal menambahkan siswa");
    }
  };

  const handleDeleteStudent = async (id: string) => {
    if (!confirm("Yakin ingin menghapus siswa ini?")) return;

    try {
      await studentsAPI.delete(id);
      toast.success("Siswa berhasil dihapus");
      loadData();
    } catch (error) {
      console.error("Error deleting student:", error);
      toast.error("Gagal menghapus siswa");
    }
  };

  const getClassName = (classId: string) => {
    return classes.find(c => c.id === classId)?.name || "-";
  };

  const getStudentCountByClass = (classId: string) => {
    return students.filter(s => s.classId === classId).length;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center gap-3">
          <Database className="w-8 h-8 text-blue-600" />
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Data Master</h2>
            <p className="text-sm text-gray-600">Kelola data siswa dan kelas</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-md">
        <div className="border-b">
          <div className="flex">
            <button
              onClick={() => setActiveTab("students")}
              className={`flex items-center gap-2 px-6 py-4 font-medium transition-colors ${
                activeTab === "students"
                  ? "text-blue-600 border-b-2 border-blue-600"
                  : "text-gray-600 hover:text-gray-800"
              }`}
            >
              <Users className="w-5 h-5" />
              Data Siswa ({students.length})
            </button>
            <button
              onClick={() => setActiveTab("classes")}
              className={`flex items-center gap-2 px-6 py-4 font-medium transition-colors ${
                activeTab === "classes"
                  ? "text-blue-600 border-b-2 border-blue-600"
                  : "text-gray-600 hover:text-gray-800"
              }`}
            >
              <School className="w-5 h-5" />
              Data Kelas ({classes.length})
            </button>
          </div>
        </div>

        <div className="p-6">
          {/* Students Tab */}
          {activeTab === "students" && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-800">Daftar Siswa</h3>
                <button
                  onClick={() => setShowStudentForm(!showStudentForm)}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Plus className="w-5 h-5" />
                  Tambah Siswa
                </button>
              </div>

              {/* Add Student Form */}
              {showStudentForm && (
                <form onSubmit={handleAddStudent} className="bg-gray-50 p-4 rounded-lg space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Nama Lengkap <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={studentName}
                        onChange={(e) => setStudentName(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        NIS <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={studentNis}
                        onChange={(e) => setStudentNis(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Kelas <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={studentClassId}
                        onChange={(e) => setStudentClassId(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
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

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Jenis Kelamin <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={studentGender}
                        onChange={(e) => setStudentGender(e.target.value as "L" | "P")}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        required
                      >
                        <option value="L">Laki-laki</option>
                        <option value="P">Perempuan</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        No. Telepon
                      </label>
                      <input
                        type="tel"
                        value={studentPhone}
                        onChange={(e) => setStudentPhone(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="08xxxxxxxxxx"
                      />
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="submit"
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      Simpan
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowStudentForm(false)}
                      className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
                    >
                      Batal
                    </button>
                  </div>
                </form>
              )}

              {/* Students Table */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">NIS</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nama</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Kelas</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">JK</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Telepon</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {students.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                          <Users className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                          <p>Belum ada data siswa</p>
                        </td>
                      </tr>
                    ) : (
                      students.map((student) => (
                        <tr key={student.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 text-sm text-gray-900">{student.nis}</td>
                          <td className="px-6 py-4 text-sm font-medium text-gray-900">{student.name}</td>
                          <td className="px-6 py-4 text-sm text-gray-900">{getClassName(student.classId)}</td>
                          <td className="px-6 py-4 text-sm text-gray-900">{student.gender}</td>
                          <td className="px-6 py-4 text-sm text-gray-900">{student.phone || "-"}</td>
                          <td className="px-6 py-4">
                            <button
                              onClick={() => handleDeleteStudent(student.id)}
                              className="text-red-600 hover:text-red-800"
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Classes Tab */}
          {activeTab === "classes" && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-800">Daftar Kelas</h3>
                <button
                  onClick={() => setShowClassForm(!showClassForm)}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Plus className="w-5 h-5" />
                  Tambah Kelas
                </button>
              </div>

              {/* Add Class Form */}
              {showClassForm && (
                <form onSubmit={handleAddClass} className="bg-gray-50 p-4 rounded-lg space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Nama Kelas <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={className}
                        onChange={(e) => setClassName(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="Contoh: X IPA 1"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Tingkat <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={classLevel}
                        onChange={(e) => setClassLevel(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        required
                      >
                        <option value="">-- Pilih Tingkat --</option>
                        <option value="X">X (10)</option>
                        <option value="XI">XI (11)</option>
                        <option value="XII">XII (12)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Wali Kelas <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={homeroom}
                        onChange={(e) => setHomeroom(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="Nama guru wali kelas"
                        required
                      />
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="submit"
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      Simpan
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowClassForm(false)}
                      className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
                    >
                      Batal
                    </button>
                  </div>
                </form>
              )}

              {/* Classes Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {classes.length === 0 ? (
                  <div className="col-span-full text-center py-8 text-gray-500">
                    <School className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                    <p>Belum ada data kelas</p>
                  </div>
                ) : (
                  classes.map((cls) => (
                    <div key={cls.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h4 className="font-bold text-lg text-gray-800">{cls.name}</h4>
                          <p className="text-sm text-gray-600">Tingkat {cls.level}</p>
                        </div>
                        <button
                          onClick={() => handleDeleteClass(cls.id)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                      <div className="space-y-1 text-sm">
                        <p className="text-gray-700">
                          <span className="font-medium">Wali Kelas:</span> {cls.homeroom}
                        </p>
                        <p className="text-gray-700">
                          <span className="font-medium">Jumlah Siswa:</span> {getStudentCountByClass(cls.id)} siswa
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
