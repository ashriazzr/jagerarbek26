import { useState, useEffect } from "react";
import { BarChart3, Calendar, Trash2, Download, Filter } from "lucide-react";
import { tardinessAPI } from "../utils/api";
import { Tardiness } from "../types";
import { format, startOfMonth, endOfMonth } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { toast } from "sonner";
import { safeDate, safeFormatDate } from "../utils/date";

export function TardinessReport() {
  const [tardiness, setTardiness] = useState<Tardiness[]>([]);
  const [filteredData, setFilteredData] = useState<Tardiness[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [filterType, setFilterType] = useState<"all" | "daily" | "monthly">("all");
  const [selectedDate, setSelectedDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), "yyyy-MM"));

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    applyFilter();
  }, [tardiness, filterType, selectedDate, selectedMonth]);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await tardinessAPI.getAll();
      setTardiness(res.data || []);
    } catch (error) {
      console.error("Error loading tardiness data:", error);
      toast.error("Gagal memuat data");
    } finally {
      setLoading(false);
    }
  };

  const applyFilter = () => {
    let filtered = [...tardiness];

    if (filterType === "daily") {
      filtered = filtered.filter(t => t.lateDate === selectedDate);
    } else if (filterType === "monthly") {
      filtered = filtered.filter(t => t.lateDate.startsWith(selectedMonth));
    }

    // Sort by date descending
    filtered.sort((a, b) => {
      try {
        const dateA = safeDate(`${a.lateDate || '1970-01-01'}T${a.lateTime || '00:00'}`);
        const dateB = safeDate(`${b.lateDate || '1970-01-01'}T${b.lateTime || '00:00'}`);
        return dateB.getTime() - dateA.getTime();
      } catch {
        return 0;
      }
    });

    setFilteredData(filtered);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Yakin ingin menghapus data ini?")) return;

    try {
      await tardinessAPI.delete(id);
      toast.success("Data berhasil dihapus");
      loadData();
    } catch (error) {
      console.error("Error deleting tardiness:", error);
      toast.error("Gagal menghapus data");
    }
  };

  const exportToCSV = () => {
    if (filteredData.length === 0) {
      toast.error("Tidak ada data untuk diekspor");
      return;
    }

    const headers = ["Tanggal", "Jam", "Nama Siswa", "Kelas", "Alasan"];
    const rows = filteredData.map(t => [
      t.lateDate,
      t.lateTime,
      t.studentName,
      t.className,
      t.reason
    ]);

    const csv = [
      headers.join(","),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(","))
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `laporan_keterlambatan_${format(new Date(), "yyyy-MM-dd")}.csv`;
    link.click();

    toast.success("Data berhasil diekspor");
  };

  // Group by student for summary
  const studentSummary = filteredData.reduce((acc, curr) => {
    const key = curr.studentId;
    if (!acc[key]) {
      acc[key] = {
        studentName: curr.studentName,
        className: curr.className,
        count: 0
      };
    }
    acc[key].count++;
    return acc;
  }, {} as Record<string, { studentName: string; className: string; count: number }>);

  const topOffenders = Object.values(studentSummary)
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

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
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BarChart3 className="w-8 h-8 text-blue-600" />
            <div>
              <h2 className="text-2xl font-bold text-gray-800">Laporan Keterlambatan</h2>
              <p className="text-sm text-gray-600">Akumulasi data keterlambatan siswa</p>
            </div>
          </div>
          <button
            onClick={exportToCSV}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <Download className="w-5 h-5" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Filter */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="w-5 h-5 text-gray-600" />
          <h3 className="font-semibold text-gray-800">Filter Data</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tipe Filter
            </label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as any)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Semua Data</option>
              <option value="daily">Per Hari</option>
              <option value="monthly">Per Bulan</option>
            </select>
          </div>

          {filterType === "daily" && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Pilih Tanggal
              </label>
              <input
                type="date"
                lang="id-ID"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}

          {filterType === "monthly" && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Pilih Bulan
              </label>
              <input
                type="month"
                lang="id-ID"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}
        </div>

        <div className="mt-4 p-3 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>Total: {filteredData.length}</strong> data keterlambatan
          </p>
        </div>
      </div>

      {/* Top Offenders */}
      {topOffenders.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="font-semibold text-gray-800 mb-4">Siswa Paling Sering Terlambat</h3>
          <div className="space-y-2">
            {topOffenders.map((student, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <div className={`
                    w-8 h-8 rounded-full flex items-center justify-center text-white font-bold
                    ${index === 0 ? 'bg-yellow-500' : index === 1 ? 'bg-gray-400' : index === 2 ? 'bg-orange-400' : 'bg-gray-300'}
                  `}>
                    {index + 1}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800">{student.studentName}</p>
                    <p className="text-sm text-gray-600">{student.className}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-red-600">{student.count}x</p>
                  <p className="text-xs text-gray-500">terlambat</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Data Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tanggal & Waktu
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Nama Siswa
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Kelas
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Alasan
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredData.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                    <Calendar className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                    <p>Tidak ada data keterlambatan</p>
                  </td>
                </tr>
              ) : (
                filteredData.map((record) => (
                  <tr key={record.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {record.lateDate ? safeFormatDate(`${record.lateDate}T00:00:00`, "dd MMM yyyy", { locale: localeId }) : '-'}
                      </div>
                      <div className="text-sm text-gray-500">{record.lateTime}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{record.studentName}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{record.className}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 italic">"{record.reason}"</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => handleDelete(record.id)}
                        className="text-red-600 hover:text-red-800 transition-colors"
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
    </div>
  );
}
