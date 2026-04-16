import * as XLSX from 'xlsx';

interface ExcelColumn {
  header: string;
  key: string;
  width?: number;
}

interface ExcelSheet {
  name: string;
  title: string;
  subtitle?: string;
  columns: ExcelColumn[];
  rows: Record<string, any>[];
}

/** Build a worksheet from sheet definition with proper header row and column widths */
function buildSheet(sheet: ExcelSheet): XLSX.WorkSheet {
  const { title, subtitle, columns, rows } = sheet;

  // Build AOA (array of arrays)
  const aoa: any[][] = [];

  // Row 1: Title
  aoa.push([title, ...Array(columns.length - 1).fill('')]);

  // Row 2: Subtitle or blank
  if (subtitle) {
    aoa.push([subtitle, ...Array(columns.length - 1).fill('')]);
    aoa.push(Array(columns.length).fill(''));
  } else {
    aoa.push(Array(columns.length).fill(''));
  }

  // Header row
  aoa.push(columns.map(c => c.header));

  // Data rows
  rows.forEach((row, idx) => {
    aoa.push(columns.map(c => {
      if (c.key === '_no') return idx + 1;
      return row[c.key] ?? '';
    }));
  });

  const ws = XLSX.utils.aoa_to_sheet(aoa);

  // Merge title row across all columns
  const merges: XLSX.Range[] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: columns.length - 1 } },
  ];
  if (subtitle) {
    merges.push({ s: { r: 1, c: 0 }, e: { r: 1, c: columns.length - 1 } });
  }
  ws['!merges'] = merges;

  // Column widths
  ws['!cols'] = columns.map(c => ({
    wch: c.width ?? Math.max(c.header.length + 4, 14),
  }));

  return ws;
}

/** Export one or more sheets to an xlsx file */
export function exportXLSX(sheets: ExcelSheet[], filename: string) {
  const wb = XLSX.utils.book_new();
  sheets.forEach(sheet => {
    const ws = buildSheet(sheet);
    XLSX.utils.book_append_sheet(wb, ws, sheet.name.slice(0, 31));
  });
  XLSX.writeFile(wb, filename.endsWith('.xlsx') ? filename : `${filename}.xlsx`);
}

/** Export daily tardiness report */
export function exportDailyReport(
  records: any[],
  students: any[],
  dateLabel: string,
  filename: string
) {
  exportXLSX([
    {
      name: 'Laporan Harian',
      title: 'LAPORAN KETERLAMBATAN HARIAN — SisAbsen',
      subtitle: `Tanggal: ${dateLabel}   |   Total: ${records.length} siswa`,
      columns: [
        { header: 'No', key: '_no', width: 5 },
        { header: 'Waktu Datang', key: 'waktu', width: 14 },
        { header: 'NISN', key: 'nisn', width: 14 },
        { header: 'Nama Siswa', key: 'nama', width: 28 },
        { header: 'Kelas', key: 'kelas', width: 12 },
        { header: 'Alasan Keterlambatan', key: 'alasan', width: 32 },
        { header: 'Terlambat (menit)', key: 'menit', width: 18 },
      ],
      rows: records.map(r => ({
        waktu: r.waktu,
        nisn: students.find((s: any) => s.id === r.studentId)?.nisn || '-',
        nama: r.studentName,
        kelas: r.studentClass,
        alasan: r.reason,
        menit: r.minutesLate,
      })),
    },
  ], filename);
}

/** Export monthly tardiness report (3 sheets) */
export function exportMonthlyReport(
  records: any[],
  students: any[],
  dailyData: { fullDate: string; day: string; count: number }[],
  monthLabel: string,
  filename: string
) {
  // Build student ranking
  const studentMap: Record<string, { nama: string; kelas: string; nisn: string; jumlah: number; totalMenit: number }> = {};
  records.forEach(r => {
    if (!studentMap[r.studentId]) {
      const s = students.find((s: any) => s.id === r.studentId);
      studentMap[r.studentId] = {
        nama: r.studentName,
        kelas: r.studentClass,
        nisn: s?.nisn || '-',
        jumlah: 0,
        totalMenit: 0,
      };
    }
    studentMap[r.studentId].jumlah++;
    studentMap[r.studentId].totalMenit += r.minutesLate;
  });
  const ranking = Object.values(studentMap).sort((a, b) => b.jumlah - a.jumlah);

  // Build reason breakdown
  const reasonMap: Record<string, number> = {};
  records.forEach(r => {
    reasonMap[r.reason] = (reasonMap[r.reason] || 0) + 1;
  });
  const reasons = Object.entries(reasonMap)
    .map(([alasan, jumlah]) => ({ alasan, jumlah }))
    .sort((a, b) => b.jumlah - a.jumlah);

  exportXLSX([
    {
      name: 'Rangking Siswa',
      title: 'RANGKING KETERLAMBATAN SISWA — SisAbsen',
      subtitle: `Periode: ${monthLabel}   |   Total Kejadian: ${records.length}`,
      columns: [
        { header: 'Ranking', key: '_no', width: 9 },
        { header: 'NISN', key: 'nisn', width: 14 },
        { header: 'Nama Siswa', key: 'nama', width: 28 },
        { header: 'Kelas', key: 'kelas', width: 12 },
        { header: 'Jml Keterlambatan', key: 'jumlah', width: 18 },
        { header: 'Total Menit Terlambat', key: 'totalMenit', width: 22 },
      ],
      rows: ranking,
    },
    {
      name: 'Rekap Harian',
      title: 'REKAP KETERLAMBATAN HARIAN — SisAbsen',
      subtitle: `Periode: ${monthLabel}`,
      columns: [
        { header: 'No', key: '_no', width: 5 },
        { header: 'Tanggal', key: 'fullDate', width: 18 },
        { header: 'Hari', key: 'day', width: 12 },
        { header: 'Jml Siswa Terlambat', key: 'count', width: 22 },
      ],
      rows: dailyData.filter(d => d.count > 0),
    },
    {
      name: 'Alasan',
      title: 'ANALISIS ALASAN KETERLAMBATAN — SisAbsen',
      subtitle: `Periode: ${monthLabel}`,
      columns: [
        { header: 'No', key: '_no', width: 5 },
        { header: 'Alasan Keterlambatan', key: 'alasan', width: 36 },
        { header: 'Jumlah Kejadian', key: 'jumlah', width: 18 },
      ],
      rows: reasons,
    },
  ], filename);
}

/** Export per-student monthly report */
export function exportStudentReport(
  ranking: any[],
  monthLabel: string,
  filename: string
) {
  exportXLSX([
    {
      name: 'Rangking Siswa',
      title: 'RANGKING KETERLAMBATAN SISWA — SisAbsen',
      subtitle: `Periode: ${monthLabel}`,
      columns: [
        { header: 'Ranking', key: '_no', width: 9 },
        { header: 'Nama Siswa', key: 'name', width: 28 },
        { header: 'Kelas', key: 'class', width: 12 },
        { header: 'Jml Keterlambatan', key: 'count', width: 18 },
        { header: 'Total Menit Terlambat', key: 'totalMinutes', width: 22 },
      ],
      rows: ranking,
    },
  ], filename);
}
