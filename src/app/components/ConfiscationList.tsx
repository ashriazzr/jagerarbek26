import { useState, useEffect } from "react";
import { ListChecks, Trash2, CheckCircle, Package, Filter } from "lucide-react";
import { confiscationAPI } from "../utils/api";
import { Confiscation } from "../types";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { toast } from "sonner";
import { safeDate, safeFormatDate } from "../utils/date";

export function ConfiscationList() {
  const [confiscations, setConfiscations] = useState<Confiscation[]>([]);
  const [filteredData, setFilteredData] = useState<Confiscation[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<"all" | "Disita" | "Dikembalikan">("all");

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    applyFilter();
  }, [confiscations, statusFilter]);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await confiscationAPI.getAll();
      setConfiscations(res.data || []);
    } catch (error) {
      console.error("Error loading confiscations:", error);
      toast.error("Gagal memuat data");
    } finally {
      setLoading(false);
    }
  };

  const applyFilter = () => {
    let filtered = [...confiscations];

    if (statusFilter !== "all") {
      filtered = filtered.filter(c => c.status === statusFilter);
    }

    // Sort by date descending
    filtered.sort((a, b) => {
      const dateA = safeDate(a.confiscationDate);
      const dateB = safeDate(b.confiscationDate);
      return dateB.getTime() - dateA.getTime();
    });

    setFilteredData(filtered);
  };

  const handleMarkAsReturned = async (item: Confiscation) => {
    if (!confirm("Tandai barang ini sebagai sudah dikembalikan?")) return;

    try {
      await confiscationAPI.update(item.id, {
        status: "Dikembalikan",
        returnDate: format(new Date(), "yyyy-MM-dd"),
      });
      toast.success("Barang ditandai sudah dikembalikan");
      loadData();
    } catch (error) {
      console.error("Error updating confiscation:", error);
      toast.error("Gagal mengupdate data");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Yakin ingin menghapus data ini?")) return;

    try {
      await confiscationAPI.delete(id);
      toast.success("Data berhasil dihapus");
      loadData();
    } catch (error) {
      console.error("Error deleting confiscation:", error);
      toast.error("Gagal menghapus data");
    }
  };

  const confiscatedCount = confiscations.filter(c => c.status === "Disita").length;
  const returnedCount = confiscations.filter(c => c.status === "Dikembalikan").length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center gap-3">
          <ListChecks className="w-8 h-8 text-red-600" />
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Daftar Barang Razia</h2>
            <p className="text-sm text-gray-600">Kelola dan lacak barang sitaan</p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm mb-1">Total Barang</p>
              <p className="text-3xl font-bold text-gray-800">{confiscations.length}</p>
            </div>
            <Package className="w-12 h-12 text-gray-400" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm mb-1">Masih Disita</p>
              <p className="text-3xl font-bold text-red-600">{confiscatedCount}</p>
            </div>
            <Package className="w-12 h-12 text-red-400" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm mb-1">Sudah Dikembalikan</p>
              <p className="text-3xl font-bold text-green-600">{returnedCount}</p>
            </div>
            <CheckCircle className="w-12 h-12 text-green-400" />
          </div>
        </div>
      </div>

      {/* Filter */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="w-5 h-5 text-gray-600" />
          <h3 className="font-semibold text-gray-800">Filter Status</h3>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setStatusFilter("all")}
            className={`px-4 py-2 rounded-lg transition-colors ${
              statusFilter === "all"
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            Semua ({confiscations.length})
          </button>
          <button
            onClick={() => setStatusFilter("Disita")}
            className={`px-4 py-2 rounded-lg transition-colors ${
              statusFilter === "Disita"
                ? "bg-red-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            Disita ({confiscatedCount})
          </button>
          <button
            onClick={() => setStatusFilter("Dikembalikan")}
            className={`px-4 py-2 rounded-lg transition-colors ${
              statusFilter === "Dikembalikan"
                ? "bg-green-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            Dikembalikan ({returnedCount})
          </button>
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Siswa
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Barang Sitaan
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tanggal Sita
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tanggal Kembali
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredData.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                    <Package className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                    <p>Tidak ada data razia</p>
                  </td>
                </tr>
              ) : (
                filteredData.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{item.studentName}</div>
                      <div className="text-sm text-gray-500">{item.className}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{item.itemName}</div>
                      {item.notes && (
                        <div className="text-sm text-gray-500 italic">{item.notes}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {safeFormatDate(item.confiscationDate, "dd MMM yyyy", { locale: localeId })}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {item.returnDate
                          ? safeFormatDate(item.returnDate, "dd MMM yyyy", { locale: localeId })
                          : "-"}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        item.status === "Disita"
                          ? "bg-red-100 text-red-800"
                          : "bg-green-100 text-green-800"
                      }`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        {item.status === "Disita" && (
                          <button
                            onClick={() => handleMarkAsReturned(item)}
                            className="text-green-600 hover:text-green-800 transition-colors"
                            title="Tandai sudah dikembalikan"
                          >
                            <CheckCircle className="w-5 h-5" />
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="text-red-600 hover:text-red-800 transition-colors"
                          title="Hapus"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
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
