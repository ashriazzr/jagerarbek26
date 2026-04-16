-- Supabase PostgreSQL schema for SisAbsen
-- Run this file in Supabase SQL Editor.

begin;

-- Optional but commonly used in Supabase for UUID generation
create extension if not exists pgcrypto;

-- =============================
-- 1) Kelas
-- =============================
create table if not exists public.classes (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  level text,
  homeroom text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint classes_level_check check (
    level is null or level in ('X', 'XI', 'XII')
  )
);

create index if not exists idx_classes_name on public.classes (name);

-- =============================
-- 2) Siswa
-- =============================
create table if not exists public.students (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  nisn text,
  gender text,
  phone text,
  class text,
  class_id uuid references public.classes(id) on update cascade on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_students_name on public.students (name);
create index if not exists idx_students_nisn on public.students (nisn);
create index if not exists idx_students_gender on public.students (gender);
create index if not exists idx_students_phone on public.students (phone);
create index if not exists idx_students_class on public.students (class);
create index if not exists idx_students_class_id on public.students (class_id);

-- =============================
-- 3) Keterlambatan
-- =============================
create table if not exists public.tardiness_records (
  id uuid primary key default gen_random_uuid(),
  student_id uuid references public.students(id) on update cascade on delete set null,
  student_name text not null,
  student_class text not null,
  reason text not null,
  recorded_at timestamptz not null default now(),
  minutes_late integer not null default 0,
  created_at timestamptz not null default now(),
  constraint tardiness_minutes_late_check check (minutes_late >= 0)
);

create index if not exists idx_tardiness_student_id on public.tardiness_records (student_id);
create index if not exists idx_tardiness_recorded_at on public.tardiness_records (recorded_at desc);
create index if not exists idx_tardiness_student_class on public.tardiness_records (student_class);

-- =============================
-- 4) Razia / Barang Sitaan
-- =============================
create table if not exists public.confiscation_records (
  id uuid primary key default gen_random_uuid(),
  student_id uuid references public.students(id) on update cascade on delete set null,
  student_name text not null,
  student_class text not null,
  item text not null,
  confiscation_date date not null,
  pickup_date date,
  status text not null default 'disita',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint confiscation_status_check check (status in ('disita', 'dikembalikan')),
  constraint confiscation_pickup_date_check check (
    pickup_date is null or pickup_date >= confiscation_date
  )
);

create index if not exists idx_confiscation_student_id on public.confiscation_records (student_id);
create index if not exists idx_confiscation_date on public.confiscation_records (confiscation_date desc);
create index if not exists idx_confiscation_status on public.confiscation_records (status);
create index if not exists idx_confiscation_student_class on public.confiscation_records (student_class);

-- =============================
-- 5) Trigger updated_at
-- =============================
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_classes_updated_at on public.classes;
create trigger trg_classes_updated_at
before update on public.classes
for each row execute function public.set_updated_at();

drop trigger if exists trg_students_updated_at on public.students;
create trigger trg_students_updated_at
before update on public.students
for each row execute function public.set_updated_at();

drop trigger if exists trg_confiscation_updated_at on public.confiscation_records;
create trigger trg_confiscation_updated_at
before update on public.confiscation_records
for each row execute function public.set_updated_at();

-- =============================
-- 6) RLS basic policy (dev-friendly)
-- =============================
alter table public.classes enable row level security;
alter table public.students enable row level security;
alter table public.tardiness_records enable row level security;
alter table public.confiscation_records enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'classes' and policyname = 'classes_read_all'
  ) then
    create policy classes_read_all on public.classes for select to anon, authenticated using (true);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'classes' and policyname = 'classes_write_all'
  ) then
    create policy classes_write_all on public.classes for all to anon, authenticated using (true) with check (true);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'students' and policyname = 'students_read_all'
  ) then
    create policy students_read_all on public.students for select to anon, authenticated using (true);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'students' and policyname = 'students_write_all'
  ) then
    create policy students_write_all on public.students for all to anon, authenticated using (true) with check (true);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'tardiness_records' and policyname = 'tardiness_read_all'
  ) then
    create policy tardiness_read_all on public.tardiness_records for select to anon, authenticated using (true);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'tardiness_records' and policyname = 'tardiness_write_all'
  ) then
    create policy tardiness_write_all on public.tardiness_records for all to anon, authenticated using (true) with check (true);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'confiscation_records' and policyname = 'confiscation_read_all'
  ) then
    create policy confiscation_read_all on public.confiscation_records for select to anon, authenticated using (true);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'confiscation_records' and policyname = 'confiscation_write_all'
  ) then
    create policy confiscation_write_all on public.confiscation_records for all to anon, authenticated using (true) with check (true);
  end if;
end $$;

commit;

-- Optional quick seed examples:
-- insert into public.classes(name, level, homeroom) values
-- ('X-1', 'X', 'Bpk. Andi'),
-- ('X-2', 'X', 'Ibu Sari');
--
-- insert into public.students(name, nisn, class)
-- values ('Ahmad Rizki', '0012345601', 'X-1');
