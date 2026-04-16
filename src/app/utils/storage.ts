import { Student, LatenessRecord, ConfiscationRecord } from '../types';
import { studentsAPI, tardinessAPI, confiscationAPI, classesAPI } from './api';

const toValidDateString = (value: unknown, fallback = '') => {
  if (typeof value !== 'string' || !value.trim()) return fallback;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? fallback : value;
};

const mapLatenessRecord = (record: any): LatenessRecord => ({
  id: String(record.id),
  studentId: String(record.studentId ?? record.student_id ?? ''),
  studentName: String(record.studentName ?? record.student_name ?? ''),
  studentClass: String(record.studentClass ?? record.student_class ?? ''),
  reason: String(record.reason ?? ''),
  timestamp: toValidDateString(record.timestamp ?? record.recorded_at, new Date().toISOString()),
  minutesLate: Number(record.minutesLate ?? record.minutes_late ?? 0),
});

const mapConfiscationRecord = (record: any): ConfiscationRecord => ({
  id: String(record.id),
  studentId: String(record.studentId ?? record.student_id ?? ''),
  studentName: String(record.studentName ?? record.student_name ?? ''),
  studentClass: String(record.studentClass ?? record.student_class ?? ''),
  item: String(record.item ?? ''),
  confiscationDate: toValidDateString(record.confiscationDate ?? record.confiscation_date, new Date().toISOString()),
  pickupDate: record.pickupDate ?? record.pickup_date ?? null,
  status: record.status === 'dikembalikan' || record.status === 'Dikembalikan' ? 'dikembalikan' : 'disita',
  notes: record.notes ?? undefined,
});

// ─── CLASSES ─────────────────────────────────────────────────────────────────

export const getClasses = async (): Promise<string[]> => {
  const result = await classesAPI.getAll();
  return ((result.data || []) as { name: string }[]).map(c => c.name).sort();
};

export const addClass = async (name: string): Promise<void> => {
  await classesAPI.create(name);
};

export const deleteClass = async (name: string): Promise<void> => {
  await classesAPI.delete(name);
};

// ─── STUDENTS ────────────────────────────────────────────────────────────────

export const getStudents = async (): Promise<Student[]> => {
  const result = await studentsAPI.getAll();
  return (result.data || []) as Student[];
};

export const addStudent = async (student: Omit<Student, 'id'>): Promise<Student> => {
  const result = await studentsAPI.create(student);
  return result.data as Student;
};

export const updateStudent = async (id: string, student: Student): Promise<Student> => {
  const result = await studentsAPI.update(id, student);
  return result.data as Student;
};

export const deleteStudent = async (id: string): Promise<void> => {
  await studentsAPI.delete(id);
};

export const getUniqueClasses = async (): Promise<string[]> => {
  const students = await getStudents();
  const classes = students.map(s => s.class);
  return Array.from(new Set(classes)).sort();
};

export const getStudentsByClass = async (className: string): Promise<Student[]> => {
  const students = await getStudents();
  return students.filter(s => s.class === className);
};

// ─── TARDINESS ───────────────────────────────────────────────────────────────

export const getLatenessRecords = async (): Promise<LatenessRecord[]> => {
  const result = await tardinessAPI.getAll();
  return ((result.data || []) as any[]).map(mapLatenessRecord);
};

export const addLatenessRecord = async (record: Omit<LatenessRecord, 'id'>): Promise<LatenessRecord> => {
  const result = await tardinessAPI.create(record);
  return mapLatenessRecord(result.data);
};

export const deleteLatenessRecord = async (id: string): Promise<void> => {
  await tardinessAPI.delete(id);
};

// ─── CONFISCATION ─────────────────────────────────────────────────────────────

export const getConfiscationRecords = async (): Promise<ConfiscationRecord[]> => {
  const result = await confiscationAPI.getAll();
  return ((result.data || []) as any[]).map(mapConfiscationRecord);
};

export const addConfiscationRecord = async (record: Omit<ConfiscationRecord, 'id'>): Promise<ConfiscationRecord> => {
  const result = await confiscationAPI.create(record);
  return mapConfiscationRecord(result.data);
};

export const updateConfiscationRecord = async (id: string, record: ConfiscationRecord): Promise<ConfiscationRecord> => {
  const result = await confiscationAPI.update(id, record);
  return mapConfiscationRecord(result.data);
};

export const deleteConfiscationRecord = async (id: string): Promise<void> => {
  await confiscationAPI.delete(id);
};
