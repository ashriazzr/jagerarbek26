import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import { createClient } from "npm:@supabase/supabase-js";

const app = new Hono();

const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
const supabaseKey =
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ||
  Deno.env.get("SUPABASE_ANON_KEY") ||
  "";

if (!supabaseUrl || !supabaseKey) {
  console.warn("SUPABASE_URL or SUPABASE key is missing.");
}

const db = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false },
});

app.use('*', logger(console.log));

app.use('*', cors({
  origin: '*',
  allowHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  exposeHeaders: ['Content-Length'],
  maxAge: 86400,
  credentials: false,
}));

app.options('*', (c) => c.text('', 204));

function normalizeClassName(name: string): string {
  return name.trim().toUpperCase();
}

async function classNameFromId(classId: string | null | undefined): Promise<string | null> {
  if (!classId) return null;
  const { data, error } = await db
    .from("classes")
    .select("name")
    .eq("id", classId)
    .maybeSingle();
  if (error) return null;
  return data?.name || null;
}

async function classIdFromName(className: string | null | undefined): Promise<string | null> {
  if (!className) return null;
  const { data, error } = await db
    .from("classes")
    .select("id")
    .eq("name", normalizeClassName(className))
    .maybeSingle();
  if (error) return null;
  return data?.id || null;
}

// Health check
app.get("/health", (c) =>
  c.json({ status: "ok", timestamp: new Date().toISOString() })
);

// ─── CLASSES ─────────────────────────────────────────────────────────────────

app.get("/classes", async (c) => {
  try {
    const { data, error } = await db
      .from("classes")
      .select("id, name, level, homeroom")
      .order("name", { ascending: true });
    if (error) throw error;
    return c.json({ success: true, data: data || [] });
  } catch (error) {
    console.log("Error fetching classes:", error);
    return c.json({ success: false, error: `Failed to fetch classes: ${error}` }, 500);
  }
});

app.post("/classes", async (c) => {
  try {
    const body = await c.req.json();
    const name = normalizeClassName(body.name || "");
    const level = body.level ? String(body.level).trim().toUpperCase() : null;
    const homeroom = body.homeroom ? String(body.homeroom).trim() : null;
    if (!name) return c.json({ success: false, error: "Class name is required" }, 400);

    const { data, error } = await db
      .from("classes")
      .upsert({ name, level, homeroom }, { onConflict: "name" })
      .select("id, name, level, homeroom")
      .single();
    if (error) throw error;

    return c.json({ success: true, data });
  } catch (error) {
    console.log("Error creating class:", error);
    return c.json({ success: false, error: `Failed to create class: ${error}` }, 500);
  }
});

app.delete("/classes/:name", async (c) => {
  try {
    const name = normalizeClassName(decodeURIComponent(c.req.param("name")));

    const { data: inUse, error: checkError } = await db
      .from("students")
      .select("id")
      .eq("class", name)
      .limit(1);
    if (checkError) throw checkError;
    if (inUse && inUse.length > 0) {
      return c.json({ success: false, error: "Class is still used by students" }, 400);
    }

    const { error } = await db.from("classes").delete().eq("name", name);
    if (error) throw error;

    return c.json({ success: true });
  } catch (error) {
    console.log("Error deleting class:", error);
    return c.json({ success: false, error: `Failed to delete class: ${error}` }, 500);
  }
});

// ─── STUDENTS ───────────────────────────────────────────────────────────────

app.get("/students", async (c) => {
  try {
    const { data, error } = await db
      .from("students")
      .select("id, name, nisn, class, class_id")
      .order("name", { ascending: true });
    if (error) throw error;

    const students = (data || []).map((s: any) => ({
      id: s.id,
      name: s.name,
      nisn: s.nisn || "",
      class: s.class || "",
      classId: s.class_id || null,
    }));

    return c.json({ success: true, data: students });
  } catch (error) {
    console.log("Error fetching students:", error);
    return c.json({ success: false, error: `Failed to fetch students: ${error}` }, 500);
  }
});

app.post("/students", async (c) => {
  try {
    const body = await c.req.json();
    const classIdFromBody = body.classId || body.class_id || null;
    const classNameFromBody = body.class || null;

    const resolvedClassId = classIdFromBody || await classIdFromName(classNameFromBody);
    const resolvedClassName = classNameFromBody || await classNameFromId(resolvedClassId);

    const studentInsert = {
      name: String(body.name || "").trim(),
      nisn: body.nisn ? String(body.nisn).trim() : null,
      class: resolvedClassName || null,
      class_id: resolvedClassId,
    };
    if (!studentInsert.name || !studentInsert.class) {
      return c.json({ success: false, error: "Student name and class are required" }, 400);
    }

    const { data, error } = await db
      .from("students")
      .insert(studentInsert)
      .select("id, name, nisn, class, class_id")
      .single();
    if (error) throw error;

    const student = {
      id: data.id,
      name: data.name,
      nisn: data.nisn || "",
      class: data.class || "",
      classId: data.class_id || null,
    };

    return c.json({ success: true, data: student });
  } catch (error) {
    console.log("Error creating student:", error);
    return c.json({ success: false, error: `Failed to create student: ${error}` }, 500);
  }
});

app.put("/students/:id", async (c) => {
  try {
    const id = c.req.param('id');
    const body = await c.req.json();

    const classIdFromBody = body.classId || body.class_id || null;
    const classNameFromBody = body.class || null;

    const resolvedClassId = classIdFromBody || await classIdFromName(classNameFromBody);
    const resolvedClassName = classNameFromBody || await classNameFromId(resolvedClassId);

    const studentUpdate = {
      name: String(body.name || "").trim(),
      nisn: body.nisn ? String(body.nisn).trim() : null,
      class: resolvedClassName || null,
      class_id: resolvedClassId,
    };
    if (!studentUpdate.name || !studentUpdate.class) {
      return c.json({ success: false, error: "Student name and class are required" }, 400);
    }

    const { data, error } = await db
      .from("students")
      .update(studentUpdate)
      .eq("id", id)
      .select("id, name, nisn, class, class_id")
      .single();
    if (error) throw error;

    const student = {
      id: data.id,
      name: data.name,
      nisn: data.nisn || "",
      class: data.class || "",
      classId: data.class_id || null,
    };

    return c.json({ success: true, data: student });
  } catch (error) {
    console.log("Error updating student:", error);
    return c.json({ success: false, error: `Failed to update student: ${error}` }, 500);
  }
});

app.delete("/students/:id", async (c) => {
  try {
    const id = c.req.param('id');
    const { error } = await db.from("students").delete().eq("id", id);
    if (error) throw error;
    return c.json({ success: true });
  } catch (error) {
    console.log("Error deleting student:", error);
    return c.json({ success: false, error: `Failed to delete student: ${error}` }, 500);
  }
});

// ─── TARDINESS ──────────────────────────────────────────────────────────────

app.get("/tardiness", async (c) => {
  try {
    const { data, error } = await db
      .from("tardiness_records")
      .select("id, student_id, student_name, student_class, reason, recorded_at, minutes_late")
      .order("recorded_at", { ascending: false });
    if (error) throw error;

    const records = (data || []).map((r: any) => ({
      id: r.id,
      studentId: r.student_id,
      studentName: r.student_name,
      studentClass: r.student_class,
      reason: r.reason,
      timestamp: r.recorded_at,
      minutesLate: r.minutes_late,
    }));

    return c.json({ success: true, data: records });
  } catch (error) {
    console.log("Error fetching tardiness records:", error);
    return c.json({ success: false, error: `Failed to fetch tardiness records: ${error}` }, 500);
  }
});

app.post("/tardiness", async (c) => {
  try {
    const body = await c.req.json();

    const payload = {
      student_id: body.studentId || null,
      student_name: String(body.studentName || "").trim(),
      student_class: String(body.studentClass || "").trim(),
      reason: String(body.reason || "").trim(),
      recorded_at: body.timestamp || new Date().toISOString(),
      minutes_late: Number(body.minutesLate || 0),
    };

    if (!payload.student_name || !payload.student_class || !payload.reason) {
      return c.json({ success: false, error: "Invalid tardiness payload" }, 400);
    }

    const { data, error } = await db
      .from("tardiness_records")
      .insert(payload)
      .select("id, student_id, student_name, student_class, reason, recorded_at, minutes_late")
      .single();
    if (error) throw error;

    const record = {
      id: data.id,
      studentId: data.student_id,
      studentName: data.student_name,
      studentClass: data.student_class,
      reason: data.reason,
      timestamp: data.recorded_at,
      minutesLate: data.minutes_late,
    };

    return c.json({ success: true, data: record });
  } catch (error) {
    console.log("Error creating tardiness record:", error);
    return c.json({ success: false, error: `Failed to create tardiness record: ${error}` }, 500);
  }
});

app.delete("/tardiness/:id", async (c) => {
  try {
    const id = c.req.param('id');
    const { error } = await db.from("tardiness_records").delete().eq("id", id);
    if (error) throw error;
    return c.json({ success: true });
  } catch (error) {
    console.log("Error deleting tardiness record:", error);
    return c.json({ success: false, error: `Failed to delete tardiness record: ${error}` }, 500);
  }
});

// ─── CONFISCATION ────────────────────────────────────────────────────────────

app.get("/confiscation", async (c) => {
  try {
    const { data, error } = await db
      .from("confiscation_records")
      .select("id, student_id, student_name, student_class, item, confiscation_date, pickup_date, status, notes")
      .order("confiscation_date", { ascending: false });
    if (error) throw error;

    const records = (data || []).map((r: any) => ({
      id: r.id,
      studentId: r.student_id,
      studentName: r.student_name,
      studentClass: r.student_class,
      item: r.item,
      confiscationDate: r.confiscation_date,
      pickupDate: r.pickup_date,
      status: r.status,
      notes: r.notes,
    }));

    return c.json({ success: true, data: records });
  } catch (error) {
    console.log("Error fetching confiscation records:", error);
    return c.json({ success: false, error: `Failed to fetch confiscation records: ${error}` }, 500);
  }
});

app.post("/confiscation", async (c) => {
  try {
    const body = await c.req.json();

    const payload = {
      student_id: body.studentId || null,
      student_name: String(body.studentName || "").trim(),
      student_class: String(body.studentClass || "").trim(),
      item: String(body.item || "").trim(),
      confiscation_date: body.confiscationDate,
      pickup_date: body.pickupDate || null,
      status: body.status || "disita",
      notes: body.notes || null,
    };
    if (!payload.student_name || !payload.student_class || !payload.item || !payload.confiscation_date) {
      return c.json({ success: false, error: "Invalid confiscation payload" }, 400);
    }

    const { data, error } = await db
      .from("confiscation_records")
      .insert(payload)
      .select("id, student_id, student_name, student_class, item, confiscation_date, pickup_date, status, notes")
      .single();
    if (error) throw error;

    const record = {
      id: data.id,
      studentId: data.student_id,
      studentName: data.student_name,
      studentClass: data.student_class,
      item: data.item,
      confiscationDate: data.confiscation_date,
      pickupDate: data.pickup_date,
      status: data.status,
      notes: data.notes,
    };

    return c.json({ success: true, data: record });
  } catch (error) {
    console.log("Error creating confiscation record:", error);
    return c.json({ success: false, error: `Failed to create confiscation record: ${error}` }, 500);
  }
});

app.put("/confiscation/:id", async (c) => {
  try {
    const id = c.req.param('id');
    const body = await c.req.json();

    const payload = {
      student_id: body.studentId || null,
      student_name: String(body.studentName || "").trim(),
      student_class: String(body.studentClass || "").trim(),
      item: String(body.item || "").trim(),
      confiscation_date: body.confiscationDate,
      pickup_date: body.pickupDate || null,
      status: body.status || "disita",
      notes: body.notes || null,
    };
    if (!payload.student_name || !payload.student_class || !payload.item || !payload.confiscation_date) {
      return c.json({ success: false, error: "Invalid confiscation payload" }, 400);
    }

    const { data, error } = await db
      .from("confiscation_records")
      .update(payload)
      .eq("id", id)
      .select("id, student_id, student_name, student_class, item, confiscation_date, pickup_date, status, notes")
      .single();
    if (error) throw error;

    const record = {
      id: data.id,
      studentId: data.student_id,
      studentName: data.student_name,
      studentClass: data.student_class,
      item: data.item,
      confiscationDate: data.confiscation_date,
      pickupDate: data.pickup_date,
      status: data.status,
      notes: data.notes,
    };

    return c.json({ success: true, data: record });
  } catch (error) {
    console.log("Error updating confiscation record:", error);
    return c.json({ success: false, error: `Failed to update confiscation record: ${error}` }, 500);
  }
});

app.delete("/confiscation/:id", async (c) => {
  try {
    const id = c.req.param('id');
    const { error } = await db.from("confiscation_records").delete().eq("id", id);
    if (error) throw error;
    return c.json({ success: true });
  } catch (error) {
    console.log("Error deleting confiscation record:", error);
    return c.json({ success: false, error: `Failed to delete confiscation record: ${error}` }, 500);
  }
});

// ─── SEED SAMPLE DATA ────────────────────────────────────────────────────────

app.post("/seed", async (c) => {
  try {
    const { count, error: countError } = await db
      .from("students")
      .select("id", { count: "exact", head: true });
    if (countError) throw countError;

    if ((count || 0) > 0) {
      return c.json({ success: true, message: "Data already exists, skipping seed." });
    }

    const sampleClasses = ["X-1", "X-2", "XI-IPA-1", "XI-IPS-1", "XII-IPA-1", "XII-IPS-1"];
    const classRows = sampleClasses.map((name) => ({ name }));
    const { error: classError } = await db
      .from("classes")
      .upsert(classRows, { onConflict: "name" });
    if (classError) throw classError;

    const sampleStudents = [
      { name: "Ahmad Rizki Pratama", class: "X-1", nisn: "0012345601" },
      { name: "Siti Nurhaliza", class: "X-1", nisn: "0012345602" },
      { name: "Budi Santoso", class: "X-2", nisn: "0012345603" },
      { name: "Dewi Lestari", class: "X-2", nisn: "0012345604" },
      { name: "Eko Prasetyo", class: "XI-IPA-1", nisn: "0012345605" },
      { name: "Fitri Handayani", class: "XI-IPA-1", nisn: "0012345606" },
      { name: "Gilang Ramadhan", class: "XI-IPS-1", nisn: "0012345607" },
      { name: "Hana Pertiwi", class: "XI-IPS-1", nisn: "0012345608" },
      { name: "Indra Gunawan", class: "XII-IPA-1", nisn: "0012345609" },
      { name: "Jasmine Putri", class: "XII-IPA-1", nisn: "0012345610" },
      { name: "Kevin Kusuma", class: "XII-IPS-1", nisn: "0012345611" },
      { name: "Laila Fitria", class: "XII-IPS-1", nisn: "0012345612" },
    ];

    const { error: studentError } = await db.from("students").insert(sampleStudents);
    if (studentError) throw studentError;

    return c.json({ success: true, message: `Seeded ${sampleStudents.length} students and ${sampleClasses.length} classes.` });
  } catch (error) {
    console.log("Error seeding data:", error);
    return c.json({ success: false, error: `Failed to seed data: ${error}` }, 500);
  }
});

Deno.serve(app.fetch);
