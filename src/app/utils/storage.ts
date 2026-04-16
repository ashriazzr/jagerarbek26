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
  faceImage: record.faceImage ?? record.face_image ?? null,
});

const mapConfiscationRecord = (record: any): ConfiscationRecord => ({
  id: String(record.id),
  studentId: String(record.studentId ?? record.student_id ?? ''),
  studentName: String(record.studentName ?? record.student_name ?? ''),
  studentClass: String(record.studentClass ?? record.student_class ?? ''),
  item: String(record.item ?? ''),
  itemImage: record.itemImage ?? record.item_image ?? null,
  confiscationDate: toValidDateString(record.confiscationDate ?? record.confiscation_date, new Date().toISOString()),
  pickupDate: record.pickupDate ?? record.pickup_date ?? null,
  status: record.status === 'dikembalikan' || record.status === 'Dikembalikan' ? 'dikembalikan' : 'disita',
  notes: record.notes ?? undefined,
});

const mapStudentRecord = (student: any): Student => ({
  id: String(student.id),
  name: String(student.name ?? ''),
  class: String(student.class ?? ''),
  nisn: String(student.nisn ?? ''),
  gender: student.gender ? String(student.gender) : null,
  faceImage: student.faceImage ?? student.face_image ?? null,
  faceDescriptor: Array.isArray(student.faceDescriptor)
    ? student.faceDescriptor
    : Array.isArray(student.face_descriptor)
      ? student.face_descriptor
      : null,
  faceEnrolledAt: student.faceEnrolledAt ?? student.face_enrolled_at ?? null,
});

// ─── CLASSES ─────────────────────────────────────────────────────────────────

export const getClasses = async (): Promise<string[]> => {
  const result = await classesAPI.getAll();
  return ((result.data || []) as { name: string }[]).map(c => c.name).sort();
};

export const addClass = async (name: string): Promise<void> => {
  await classesAPI.create(name);
};

export const updateClass = async (oldName: string, newName: string): Promise<void> => {
  const normalizedOldName = oldName.trim().toUpperCase();
  const normalizedNewName = newName.trim().toUpperCase();

  await classesAPI.update(normalizedOldName, normalizedNewName);

  const students = await getStudents();
  const affectedStudents = students.filter(student => student.class === normalizedOldName);

  await Promise.all(
    affectedStudents.map(student =>
      updateStudent(student.id, {
        ...student,
        class: normalizedNewName,
      })
    )
  );
};

export const deleteClass = async (name: string): Promise<void> => {
  await classesAPI.delete(name);
};

// ─── STUDENTS ────────────────────────────────────────────────────────────────

export const getStudents = async (): Promise<Student[]> => {
  const result = await studentsAPI.getAll();
  return ((result.data || []) as any[]).map(mapStudentRecord);
};

export const addStudent = async (student: Omit<Student, 'id'>): Promise<Student> => {
  try {
    const result = await studentsAPI.create(student);
    return mapStudentRecord(result.data);
  } catch (error: any) {
    const message = String(error?.message || '');
    if ((student.faceImage || student.faceDescriptor) && /face_image|face_descriptor|face_enrolled_at|column .* does not exist/i.test(message)) {
      const { faceImage, faceDescriptor, faceEnrolledAt, ...fallbackStudent } = student as any;
      const result = await studentsAPI.create(fallbackStudent);
      return mapStudentRecord(result.data);
    }
    throw error;
  }
};

export const updateStudent = async (id: string, student: Student): Promise<Student> => {
  try {
    const result = await studentsAPI.update(id, student);
    return mapStudentRecord(result.data);
  } catch (error: any) {
    const message = String(error?.message || '');
    if ((student.faceImage || student.faceDescriptor) && /face_image|face_descriptor|face_enrolled_at|column .* does not exist/i.test(message)) {
      const { faceImage, faceDescriptor, faceEnrolledAt, ...fallbackStudent } = student as any;
      const result = await studentsAPI.update(id, fallbackStudent);
      return mapStudentRecord(result.data);
    }
    throw error;
  }
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
  try {
    const result = await tardinessAPI.create(record);
    return mapLatenessRecord(result.data);
  } catch (error: any) {
    const message = String(error?.message || '');
    if (record.faceImage && /face_image|column .* does not exist|invalid input syntax/i.test(message)) {
      const { faceImage, ...fallbackRecord } = record as any;
      const result = await tardinessAPI.create(fallbackRecord);
      return mapLatenessRecord(result.data);
    }
    throw error;
  }
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
  try {
    const result = await confiscationAPI.create(record);
    return mapConfiscationRecord(result.data);
  } catch (error: any) {
    const message = String(error?.message || '');
    if (record.itemImage && /item_image|column .* does not exist|invalid input syntax/i.test(message)) {
      const { itemImage, ...fallbackRecord } = record as any;
      const result = await confiscationAPI.create(fallbackRecord);
      return mapConfiscationRecord(result.data);
    }
    throw error;
  }
};

export const updateConfiscationRecord = async (id: string, record: ConfiscationRecord): Promise<ConfiscationRecord> => {
  try {
    const result = await confiscationAPI.update(id, record);
    return mapConfiscationRecord(result.data);
  } catch (error: any) {
    const message = String(error?.message || '');
    if (record.itemImage && /item_image|column .* does not exist|invalid input syntax/i.test(message)) {
      const { itemImage, ...fallbackRecord } = record as any;
      const result = await confiscationAPI.update(id, fallbackRecord);
      return mapConfiscationRecord(result.data);
    }
    throw error;
  }
};

export const deleteConfiscationRecord = async (id: string): Promise<void> => {
  await confiscationAPI.delete(id);
};
