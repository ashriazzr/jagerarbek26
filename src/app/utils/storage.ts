import { Student, LatenessRecord, ConfiscationRecord } from '../types';
import { studentsAPI, tardinessAPI, confiscationAPI, classesAPI } from './api';

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
  return (result.data || []) as LatenessRecord[];
};

export const addLatenessRecord = async (record: Omit<LatenessRecord, 'id'>): Promise<LatenessRecord> => {
  const result = await tardinessAPI.create(record);
  return result.data as LatenessRecord;
};

export const deleteLatenessRecord = async (id: string): Promise<void> => {
  await tardinessAPI.delete(id);
};

// ─── CONFISCATION ─────────────────────────────────────────────────────────────

export const getConfiscationRecords = async (): Promise<ConfiscationRecord[]> => {
  const result = await confiscationAPI.getAll();
  return (result.data || []) as ConfiscationRecord[];
};

export const addConfiscationRecord = async (record: Omit<ConfiscationRecord, 'id'>): Promise<ConfiscationRecord> => {
  const result = await confiscationAPI.create(record);
  return result.data as ConfiscationRecord;
};

export const updateConfiscationRecord = async (id: string, record: ConfiscationRecord): Promise<ConfiscationRecord> => {
  const result = await confiscationAPI.update(id, record);
  return result.data as ConfiscationRecord;
};

export const deleteConfiscationRecord = async (id: string): Promise<void> => {
  await confiscationAPI.delete(id);
};
