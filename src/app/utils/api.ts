import { projectId, publicAnonKey } from '/utils/supabase/info';

const REST_BASE_URL = `https://${projectId}.supabase.co/rest/v1`;

async function apiCall(endpoint: string, options: RequestInit = {}) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000);

  try {
    const response = await fetch(`${REST_BASE_URL}${endpoint}`, {
      ...options,
      signal: controller.signal,
      headers: {
        apikey: publicAnonKey,
        Authorization: `Bearer ${publicAnonKey}`,
        'Content-Type': 'application/json',
        Prefer: 'return=representation',
        ...options.headers,
      },
    });

    clearTimeout(timeoutId);

    let parsed: any = null;
    try {
      parsed = await response.json();
    } catch (_) {
      parsed = null;
    }

    if (!response.ok) {
      const errorMsg = parsed?.message || parsed?.error || `HTTP ${response.status}: ${response.statusText}`;
      console.error(`API Error on ${endpoint}:`, errorMsg);
      throw new Error(errorMsg);
    }

    if (parsed && typeof parsed === 'object' && 'success' in parsed) {
      return parsed;
    }

    return { success: true, data: parsed };
  } catch (error: any) {
    clearTimeout(timeoutId);
    if (error?.name === 'AbortError') {
      throw new Error('Request timed out. Pastikan koneksi internet stabil.');
    }
    throw error;
  }
}

function normalizeClassPayload(input: string | { name: string; level?: string; homeroom?: string }) {
  if (typeof input === 'string') {
    return { name: input.trim().toUpperCase() };
  }

  return {
    name: String(input.name || '').trim().toUpperCase(),
    level: input.level ? String(input.level).trim().toUpperCase() : null,
    homeroom: input.homeroom ? String(input.homeroom).trim() : null,
  };
}

async function buildStudentPayload(data: any) {
  let className = data.class ? String(data.class).trim().toUpperCase() : null;
  const classId = data.classId || data.class_id || null;
  const shouldSendFaceFields =
    Object.prototype.hasOwnProperty.call(data, 'faceImage') ||
    Object.prototype.hasOwnProperty.call(data, 'face_image') ||
    Object.prototype.hasOwnProperty.call(data, 'faceDescriptor') ||
    Object.prototype.hasOwnProperty.call(data, 'face_descriptor') ||
    Object.prototype.hasOwnProperty.call(data, 'faceEnrolledAt') ||
    Object.prototype.hasOwnProperty.call(data, 'face_enrolled_at');

  if (!className && classId) {
    const classResult = await apiCall(`/classes?select=name&id=eq.${encodeURIComponent(classId)}&limit=1`);
    const classRow = Array.isArray(classResult.data) ? classResult.data[0] : classResult.data;
    className = classRow?.name ? String(classRow.name).trim().toUpperCase() : null;
  }

  const payload: Record<string, any> = {
    name: String(data.name || '').trim(),
    nisn: data.nisn ? String(data.nisn).trim() : null,
    gender: data.gender ? String(data.gender).trim() : null,
    phone: data.phone ? String(data.phone).trim() : null,
    class: className,
    class_id: classId,
  };

  if (shouldSendFaceFields) {
    payload.face_image = data.faceImage || data.face_image || null;
    payload.face_descriptor = Array.isArray(data.faceDescriptor)
      ? data.faceDescriptor
      : Array.isArray(data.face_descriptor)
        ? data.face_descriptor
        : null;
    payload.face_enrolled_at =
      data.faceEnrolledAt ||
      data.face_enrolled_at ||
      ((data.faceImage || data.faceDescriptor || data.face_descriptor) ? new Date().toISOString() : null);
  }

  return payload;
}

// Classes API
export const classesAPI = {
  getAll: () => apiCall('/classes?select=id,name,level,homeroom'),
  create: (input: string | { name: string; level?: string; homeroom?: string }) =>
    apiCall('/classes?on_conflict=name', {
      method: 'POST',
      headers: {
        Prefer: 'resolution=merge-duplicates,return=representation',
      },
      body: JSON.stringify(normalizeClassPayload(input)),
    }),
  update: (oldName: string, input: string | { name: string; level?: string; homeroom?: string }) =>
    apiCall(`/classes?name=eq.${encodeURIComponent(oldName.trim().toUpperCase())}`, {
      method: 'PATCH',
      body: JSON.stringify(normalizeClassPayload(input)),
    }),
  delete: (name: string) =>
    apiCall(`/classes?name=eq.${encodeURIComponent(name.trim().toUpperCase())}`, {
      method: 'DELETE',
    }),
};

// Students API
export const studentsAPI = {
  getAll: () => apiCall('/students?select=*'),
  create: async (data: any) =>
    apiCall('/students', {
      method: 'POST',
      body: JSON.stringify(await buildStudentPayload(data)),
    }),
  update: async (id: string, data: any) =>
    apiCall(`/students?id=eq.${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: JSON.stringify(await buildStudentPayload(data)),
    }),
  delete: (id: string) =>
    apiCall(`/students?id=eq.${encodeURIComponent(id)}`, {
      method: 'DELETE',
    }),
};

// Tardiness API
export const tardinessAPI = {
  getAll: () => apiCall('/tardiness_records?select=*'),
  create: (data: any) =>
    apiCall('/tardiness_records', {
      method: 'POST',
      body: JSON.stringify({
        student_id: data.studentId || data.student_id || null,
        student_name: data.studentName || data.student_name,
        student_class: data.studentClass || data.student_class,
        reason: data.reason,
        recorded_at: data.timestamp || data.recorded_at || new Date().toISOString(),
        minutes_late: data.minutesLate ?? data.minutes_late ?? 0,
        ...(data.faceImage || data.face_image ? { face_image: data.faceImage || data.face_image } : {}),
      }),
    }),
  delete: (id: string) =>
    apiCall(`/tardiness_records?id=eq.${encodeURIComponent(id)}`, {
      method: 'DELETE',
    }),
};

// Confiscation API
export const confiscationAPI = {
  getAll: async () => {
    try {
      return await apiCall('/confiscation_records?select=id,student_id,student_name,student_class,item,item_image,confiscation_date,pickup_date,status,notes');
    } catch (error: any) {
      const message = String(error?.message || '');
      if (/item_image|column .* does not exist/i.test(message)) {
        return apiCall('/confiscation_records?select=id,student_id,student_name,student_class,item,confiscation_date,pickup_date,status,notes');
      }
      throw error;
    }
  },
  create: (data: any) =>
    apiCall('/confiscation_records', {
      method: 'POST',
      body: JSON.stringify({
        student_id: data.studentId || data.student_id || null,
        student_name: data.studentName || data.student_name,
        student_class: data.studentClass || data.student_class,
        item: data.item,
        confiscation_date: data.confiscationDate || data.confiscation_date,
        pickup_date: data.pickupDate || data.pickup_date || null,
        status: data.status || 'disita',
        notes: data.notes || null,
        ...(Object.prototype.hasOwnProperty.call(data, 'itemImage') || Object.prototype.hasOwnProperty.call(data, 'item_image')
          ? { item_image: data.itemImage || data.item_image || null }
          : {}),
      }),
    }),
  update: (id: string, data: any) =>
    apiCall(`/confiscation_records?id=eq.${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: JSON.stringify({
        student_id: data.studentId || data.student_id || null,
        student_name: data.studentName || data.student_name,
        student_class: data.studentClass || data.student_class,
        item: data.item,
        confiscation_date: data.confiscationDate || data.confiscation_date,
        pickup_date: data.pickupDate || data.pickup_date || null,
        status: data.status || 'disita',
        notes: data.notes || null,
        ...(Object.prototype.hasOwnProperty.call(data, 'itemImage') || Object.prototype.hasOwnProperty.call(data, 'item_image')
          ? { item_image: data.itemImage || data.item_image || null }
          : {}),
      }),
    }),
  delete: (id: string) =>
    apiCall(`/confiscation_records?id=eq.${encodeURIComponent(id)}`, {
      method: 'DELETE',
    }),
};

// Seed API
export const seedAPI = {
  seed: async () => {
    const studentsResult = await apiCall('/students?select=id&limit=1');
    const existingStudents = Array.isArray(studentsResult.data) ? studentsResult.data.length : 0;
    if (existingStudents > 0) {
      return { success: true, message: 'Data already exists, skipping seed.' };
    }

    const sampleClasses = ['X-1', 'X-2', 'XI-IPA-1', 'XI-IPS-1', 'XII-IPA-1', 'XII-IPS-1'];
    for (const name of sampleClasses) {
      await classesAPI.create({ name });
    }

    const sampleStudents = [
      { name: 'Ahmad Rizki Pratama', class: 'X-1', nisn: '0012345601' },
      { name: 'Siti Nurhaliza', class: 'X-1', nisn: '0012345602' },
      { name: 'Budi Santoso', class: 'X-2', nisn: '0012345603' },
      { name: 'Dewi Lestari', class: 'X-2', nisn: '0012345604' },
      { name: 'Eko Prasetyo', class: 'XI-IPA-1', nisn: '0012345605' },
      { name: 'Fitri Handayani', class: 'XI-IPA-1', nisn: '0012345606' },
      { name: 'Gilang Ramadhan', class: 'XI-IPS-1', nisn: '0012345607' },
      { name: 'Hana Pertiwi', class: 'XI-IPS-1', nisn: '0012345608' },
      { name: 'Indra Gunawan', class: 'XII-IPA-1', nisn: '0012345609' },
      { name: 'Jasmine Putri', class: 'XII-IPA-1', nisn: '0012345610' },
      { name: 'Kevin Kusuma', class: 'XII-IPS-1', nisn: '0012345611' },
      { name: 'Laila Fitria', class: 'XII-IPS-1', nisn: '0012345612' },
    ];

    for (const student of sampleStudents) {
      await studentsAPI.create(student);
    }

    return { success: true, message: `Seeded ${sampleStudents.length} students and ${sampleClasses.length} classes.` };
  },
};
