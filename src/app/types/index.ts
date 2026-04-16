export interface Student {
  id: string;
  name: string;
  class: string;
  nisn: string;
  gender?: string | null;
  faceImage?: string | null;
  faceDescriptor?: number[] | null;
  faceEnrolledAt?: string | null;
}

export interface LatenessRecord {
  id: string;
  studentId: string;
  studentName: string;
  studentClass: string;
  reason: string;
  timestamp: string;
  minutesLate: number;
  faceImage?: string | null;
}

export interface ConfiscationRecord {
  id: string;
  studentId: string;
  studentName: string;
  studentClass: string;
  item: string;
  itemImage?: string | null;
  confiscationDate: string;
  pickupDate: string | null;
  status: 'disita' | 'dikembalikan';
  notes?: string;
}

export interface ClassOption {
  value: string;
  label: string;
}
