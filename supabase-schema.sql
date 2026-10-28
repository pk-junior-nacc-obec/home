-- ============================================================================
--  ป.ป.ช.สพฐ.น้อย โรงเรียนภูเขียว — สคริปต์สร้างตาราง Supabase
--  รันใน: Supabase Dashboard > SQL Editor > New query > วางทั้งหมด > RUN
--  ใช้ได้ทั้งกับฐานข้อมูลใหม่ และฐานข้อมูลเดิมที่สร้างไว้แล้ว
--  (ใช้ IF NOT EXISTS / DROP FUNCTION IF EXISTS / ADD COLUMN IF NOT EXISTS เพื่อให้รันซ้ำได้)
--  สำหรับฐานข้อมูลเดิม: โปรดอ่านหมายเหตุท้ายไฟล์ (หัวข้อ "สำหรับฐานข้อมูลเดิม") ก่อนรัน
-- ============================================================================

-- ส่วนขยายที่จำเป็น
create extension if not exists pgcrypto;

-- ============================================================================
-- 1) ตารางข้อมูล (ทุกตารางมีคอลัมน์ id แบบ UUID สำหรับอ้างอิง)
-- ============================================================================

-- ภาพสไลด์พื้นหลังหน้าแรก
create table if not exists public."Home" (
  id uuid primary key default gen_random_uuid(),
  photo text,                    -- ลิงก์ภาพพื้นหลัง
  caption text,                  -- คำอธิบายภาพ
  sort_order int default 0,     -- ลำดับการแสดงผล
  created_at timestamptz default now()
);

-- ประกาศแบนเนอร์ที่แสดงเฉพาะช่วงเวลา (คอลัมน์ dateline ตามข้อกำหนด)
create table if not exists public.newstat (
  id uuid primary key default gen_random_uuid(),
  name text,                    -- ชื่อประกาศ
  photo text,                   -- ภาพประกาศ (แนวกว้างเต็มหน้า)
  url text,                     -- ลิงก์ปลายทางเมื่อกดภาพ
  start_at timestamptz,         -- เริ่มแสดง
  end_at timestamptz,           -- สิ้นสุดการแสดง
  dateline text,                -- ช่วงเวลา (สร้างอัตโนมัติจาก start_at/end_at)
  created_at timestamptz default now()
);

-- ปุ่มลัดหน้าแรก (ภาพ + ข้อความ + ลิงก์)
create table if not exists public.botton (
  id uuid primary key default gen_random_uuid(),
  meg text,                     -- ข้อความบนปุ่ม
  photo text,                   -- ภาพไอคอนของปุ่ม
  url text,                     -- ลิงก์ปลายทาง หรือชื่อเมนู เช่น คำสั่ง
  sort_order int default 0,
  created_at timestamptz default now()
);

-- ที่มาและความสำคัญ / เจตจำนง / อำนาจหน้าที่
create table if not exists public.significance (
  id uuid primary key default gen_random_uuid(),
  title text,                   -- หัวข้อ
  mag text,                     -- เนื้อหา (พิมพ์แบบ rich text)
  url jsonb,                     -- ไฟล์แนบ ภาพ/PDF
  created_at timestamptz default now()
);
create table if not exists public.hoop (like public.significance including all);
create table if not exists public.anthority (like public.significance including all);

-- คณะกรรมการ ป.ป.ช.สพฐ.น้อย
create table if not exists public."mamberNACC" (
  id uuid primary key default gen_random_uuid(),
  year int,                      -- ปีการศึกษา (พ.ศ.)
  photo text,                   -- รูปบุคลากร
  name text,                    -- ชื่อ - สกุล
  class text,                   -- ระดับชั้น เช่น มัธยมศึกษาปีที่ 5/1
  position text,                -- ตำแหน่ง
  created_at timestamptz default now()
);

-- ตัวแทนห้อง (อนุกรรมการ)
create table if not exists public."ANACC" (
  id uuid primary key default gen_random_uuid(),
  year int,                      -- ปีการศึกษา (พ.ศ.)
  no int,                        -- ลำดับ (รันอัตโนมัติต่อปีการศึกษา)
  roll text,                     -- รหัสนักเรียน 5 หลัก
  name text,                     -- ชื่อ - สกุล
  class text,                    -- ระดับชั้น เช่น ชั้นมัธยมศึกษาปีที่ 5/1
  created_at timestamptz default now(),
  unique (year, roll)
);

-- ข่าวสาร: ประกาศ / ประชาสัมพันธ์ / คำสั่ง / จดหมายข่าว
create table if not exists public.new (
  id uuid primary key default gen_random_uuid(),
  no bigint generated always as identity,   -- ลำดับ รันต่อจากเลขเดิมทั้งตาราง
  name text,                     -- ชื่อเรื่อง / เลขที่คำสั่ง / เลขที่จดหมายข่าว
  type text check (type in ('ประกาศ','ประชาสัมพันธ์','คำสั่ง','จดหมายข่าว')),
  mag text,                      -- เนื้อหาเพิ่มเติม (rich text)
  url jsonb,                     -- ไฟล์แนบ ภาพ/PDF (เก็บเป็น JSON)
  regisname text,               -- ชื่อผู้บันทึก (ระบบกำหนดอัตโนมัติ)
  timestamp timestamptz default now(),  -- วัน-เวลาบันทึก (แสดงแบบไทย)
  created_at timestamptz default now()
);

-- ทะเบียนเกียรติบัตร และ ผลงาน (แยกชนิดด้วยคอลัมน์ kind)
create table if not exists public."Certificate" (
  id uuid primary key default gen_random_uuid(),
  kind text default 'certificate' check (kind in ('certificate','award')),
  date date,                     -- วันที่ได้รับ (เกียรติบัตร)
  name text,                     -- ชื่อเกียรติบัตร
  "from" text,                   -- หน่วยงานที่มอบ
  "Award" text,                  -- ระดับเกียรติบัตร
  url jsonb,                     -- ไฟล์เกียรติบัตร PDF (1-5 ไฟล์)
  "รูปกิจกรรม" jsonb,            -- ภาพกิจกรรม 1-5 ภาพ (ผลงาน)
  "ระดับรางวัล" text,            -- นานาชาติ/ประเทศ/ภาค/จังหวัด/อำเภอ/เขต/โรงเรียน
  "ประเภทสิทธิ์เหรียญรางวัล" text,
  "ประเภทเหรียญรางวัล" text,
  "ชื่อผลงาน" text,
  "หน่วยงานที่รับผิดชอบ" text,
  "วันที่ได้รับ" date,           -- วันที่ได้รับ (ผลงาน)
  "ผู้ที่ได้รับรางวัล" jsonb,    -- รายชื่อผู้รับรางวัล (หลายคน)
  "ครูที่ปรึกษา" jsonb,         -- รายชื่อครูที่ปรึกษา (หลายคน)
  created_at timestamptz default now()
);

-- นโยบาย และแผนดำเนินโครงการ
create table if not exists public.plan (
  id uuid primary key default gen_random_uuid(),
  name text,                     -- ชื่อโครงการ/นโยบาย
  "ร่าง" boolean default false,
  "เสนอ" text default 'รอพิจารณา' check ("เสนอ" in ('รอพิจารณา','ผ่าน','ไม่ผ่าน')),
  "ดำเนินการ" boolean default false,
  "แล้วเสร็จ" boolean default false,
  "ผู้รับผิดชอบ" text,
  regisname text,               -- ผู้บันทึก (ระบบกำหนดอัตโนมัติ)
  url jsonb,                     -- ไฟล์ PDF 1 ไฟล์
  created_at timestamptz default now()
);

-- หลักสูตร / ธรรมนูญ / กฎหมาย
create table if not exists public.culecculum (
  id uuid primary key default gen_random_uuid(),
  name text, url jsonb, regisname text,
  created_at timestamptz default now()
);
create table if not exists public.tammanun (like public.culecculum including all);
create table if not exists public.law (like public.culecculum including all);

-- สถิติการเข้าชม (อ่าน/เขียนผ่าน RPC เท่านั้น)
create table if not exists public.statis (
  id uuid primary key default gen_random_uuid(),
  brand text,                     -- รุ่น/ชนิดอุปกรณ์ที่เข้าชม
  timestamp timestamptz default now()
);

-- บัญชีเจ้าหน้าที่ (เชื่อมกับ Supabase Auth)
create table if not exists public.admin (
  id uuid primary key references auth.users (id) on delete cascade,
  username text unique not null,  -- ใช้เข้าระบบ (จะถูกแปลงเป็น username@pkjunior.local)
  name text,                      -- ชื่อที่แสดง
  role text not null default 'nacc' check (role in ('admin','nacc')),
  active boolean default true,
  created_at timestamptz default now()
);

-- ============================================================================
-- 2) เสริมคอลัมน์ที่อาจขาดหายในฐานข้อมูลเดิม (ต้องวางหลังนิยามตารางทั้งหมด — บนฐานใหม่คำสั่งนี้ไม่ทำอะไร)
-- ============================================================================

alter table public.newstat    add column if not exists dateline text;
alter table public.new        add column if not exists regisname text;
alter table public.plan       add column if not exists regisname text;
alter table public.culecculum add column if not exists regisname text;
alter table public.tammanun   add column if not exists regisname text;
alter table public.law        add column if not exists regisname text;

-- ============================================================================
-- 3) ฟังก์ชันช่วยตรวจสิทธิ์ (SECURITY DEFINER ป้องกัน recursion ของ RLS)
-- ============================================================================

-- (ฟังก์ชันเหล่านี้ถูกนโยบาย RLS อ้างอิงอยู่ จึงต้องใช้ CREATE OR REPLACE แทน DROP เพื่อให้รันซ้ำได้)
create or replace function public.is_staff()
returns boolean language sql stable security definer set search_path = public
as $$ select exists (select 1 from public.admin a where a.id = auth.uid() and a.active) $$;

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public
as $$ select exists (select 1 from public.admin a where a.id = auth.uid() and a.active and a.role = 'admin') $$;

-- ชื่อของเจ้าหน้าที่ที่กำลังเข้าระบบ (ใช้ใน trigger กำหนด "ผู้บันทึก")
create or replace function public.staff_name()
returns text language sql stable security definer set search_path = public
as $$ select coalesce((select a.name from public.admin a where a.id = auth.uid() and a.active), 'เจ้าหน้าที่') $$;

-- ============================================================================
-- 4) RPC ที่หน้าเว็บเรียกใช้
-- ============================================================================

-- ประกาศแบนเนอร์ที่อยู่ในช่วงเวลาปัจจุบัน (เวลาไทย)
-- (RPC เหล่านี้ไม่มีนโยบายอ้างอิง จึง drop ก่อนสร้างได้ เพื่อรันซ้ำบนฐานเดิมแม้ชนิดผลลัพธ์เดิมต่างกัน)
drop function if exists public.active_announcements();
create function public.active_announcements()
returns setof public.newstat language sql stable security definer set search_path = public
as $$ select * from public.newstat
      where start_at is not null and end_at is not null
        and now() >= start_at and now() <= end_at
      order by start_at $$;

-- บันทึกการเข้าชมหน้าหลัก (รุ่นอุปกรณ์ + วันเวลา)
drop function if exists public.record_visit(text);
create function public.record_visit(device text)
returns void language plpgsql security definer set search_path = public
as $$ begin
  insert into public.statis (brand) values (left(coalesce(device,'ไม่ระบุ'), 200));
end $$;

-- สถิติหน้าหลัก: ผู้เยี่ยมชม + จำนวนกรรมการ/อนุกรรมการปีล่าสุด
drop function if exists public.site_stats();
create function public.site_stats()
returns jsonb language plpgsql stable security definer set search_path = public
as $$
declare
  v_visitors bigint;
  v_members bigint; v_member_year int;
  v_delegates bigint; v_delegate_year int;
begin
  select count(*) into v_visitors from public.statis;
  select year, count(*) into v_member_year, v_members
    from public."mamberNACC" group by year order by year desc limit 1;
  select year, count(*) into v_delegate_year, v_delegates
    from public."ANACC" group by year order by year desc limit 1;
  return jsonb_build_object(
    'visitors', v_visitors,
    'members', coalesce(v_members,0), 'member_year', v_member_year,
    'delegates', coalesce(v_delegates,0), 'delegate_year', v_delegate_year
  );
end $$;

grant execute on function
  public.active_announcements(), public.record_visit(text), public.site_stats(),
  public.is_staff(), public.is_admin()
to anon, authenticated;

-- ตรวจสอบขั้นตอนโครงการให้สอดคล้อง (บังคับในระดับฐานข้อมูล ไม่ใช่แค่หน้าเว็บ)
-- กติกา: ถ้า "เสนอ" ไม่ใช่ 'ผ่าน' จะติ๊ก "ดำเนินการ" หรือ "แล้วเสร็จ" ไม่ได้
--          และจะติ๊ก "แล้วเสร็จ" ได้ต้อง "ดำเนินการ" ก่อนเท่านั้น
drop trigger if exists plan_steps_trigger on public.plan;
drop function if exists public.plan_validate_steps();
create function public.plan_validate_steps()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  if NEW."เสนอ" is null then NEW."เสนอ" := 'รอพิจารณา'; end if;
  NEW."ดำเนินการ" := coalesce(NEW."ดำเนินการ", false);
  NEW."แล้วเสร็จ" := coalesce(NEW."แล้วเสร็จ", false);
  if NEW."เสนอ" <> 'ผ่าน' then
    NEW."ดำเนินการ" := false;
    NEW."แล้วเสร็จ" := false;
  end if;
  if NEW."แล้วเสร็จ" and not NEW."ดำเนินการ" then
    raise exception 'ขั้นตอนไม่ถูกต้อง: ต้องติ๊ก "ดำเนินการ" ก่อนจึงจะติ๊ก "แล้วเสร็จ" ได้';
  end if;
  return NEW;
end $$;

drop trigger if exists plan_steps_trigger on public.plan;
create trigger plan_steps_trigger before insert or update on public.plan
  for each row execute function public.plan_validate_steps();

-- ============================================================================
-- 5) Trigger: รันเลขลำดับอัตโนมัติ + กำหนดผู้บันทึก + สร้าง dateline
-- ============================================================================

-- ลำดับตัวแทนห้อง รันต่อเนื่องต่อปีการศึกษา (ล็อกกันเขียนพร้อมกัน)
create or replace function public.anacc_assign_no()
returns trigger language plpgsql security definer set search_path = public
as $$
declare v int;
begin
  if NEW.no is null then
    perform pg_advisory_xact_lock(hashtext('ANACC:' || NEW.year::text)::bigint);
    select coalesce(max(no),0) + 1 into v from public."ANACC" where year = NEW.year;
    NEW.no := v;
  end if;
  return NEW;
end $$;
drop trigger if exists anacc_no_trigger on public."ANACC";
create trigger anacc_no_trigger before insert on public."ANACC"
  for each row execute function public.anacc_assign_no();

-- กำหนด "ผู้บันทึก" จากบัญชีที่เข้าระบบ (แก้ไขช่องนี้ไม่ได้แม้จะยิง API ตรง)
create or replace function public.stamp_regisname()
returns trigger language plpgsql security definer set search_path = public
as $$ begin
  NEW.regisname := public.staff_name();
  return NEW;
end $$;
drop trigger if exists regisname_new on public.new;
create trigger regisname_new before insert or update on public.new
  for each row execute function public.stamp_regisname();
drop trigger if exists regisname_plan on public.plan;
create trigger regisname_plan before insert or update on public.plan
  for each row execute function public.stamp_regisname();
drop trigger if exists regisname_culecculum on public.culecculum;
create trigger regisname_culecculum before insert or update on public.culecculum
  for each row execute function public.stamp_regisname();
drop trigger if exists regisname_tammanun on public.tammanun;
create trigger regisname_tammanun before insert or update on public.tammanun
  for each row execute function public.stamp_regisname();
drop trigger if exists regisname_law on public.law;
create trigger regisname_law before insert or update on public.law
  for each row execute function public.stamp_regisname();

-- สร้างคอลัมน์ dateline ของ newstat จากช่วงเวลา (แสดงแบบไทย พ.ศ. พร้อมเวลา)
-- ตัวอย่าง: 23 ต.ค. 2569 16.00 น. ถึง 28 ต.ค. 2569 18.00 น.
drop trigger if exists dateline_newstat on public.newstat;
drop function if exists public.stamp_dateline();
drop function if exists public.thai_datetime(timestamptz);
create function public.thai_datetime(ts timestamptz)
returns text language plpgsql stable set search_path = public
as $$
declare
  m text[] := array['ม.ค.','ก.พ.','มี.ค.','เม.ย.','พ.ค.','มิ.ย.','ก.ค.','ส.ค.','ก.ย.','ต.ค.','พ.ย.','ธ.ค.'];
  t timestamp := ts at time zone 'Asia/Bangkok';
begin
  return to_char(t, 'DD') || ' ' || m[extract(month from t)::int] || ' ' ||
         (extract(year from t)::int + 543)::text || ' ' ||
         to_char(t, 'HH24.MI.SS') || ' น.';
end $$;

create function public.stamp_dateline()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  if NEW.start_at is not null and NEW.end_at is not null then
    NEW.dateline := public.thai_datetime(NEW.start_at) || ' ถึง ' || public.thai_datetime(NEW.end_at);
  end if;
  return NEW;
end $$;
drop trigger if exists dateline_newstat on public.newstat;
create trigger dateline_newstat before insert or update on public.newstat
  for each row execute function public.stamp_dateline();

-- ============================================================================
-- 6) นโยบาย RLS (สิทธิ์การเข้าถึงข้อมูล)
-- ============================================================================

alter table public."Home"          enable row level security;
alter table public.newstat         enable row level security;
alter table public.botton          enable row level security;
alter table public.significance    enable row level security;
alter table public.hoop            enable row level security;
alter table public.anthority       enable row level security;
alter table public."mamberNACC"    enable row level security;
alter table public."ANACC"         enable row level security;
alter table public.new             enable row level security;
alter table public."Certificate"  enable row level security;
alter table public.plan            enable row level security;
alter table public.culecculum     enable row level security;
alter table public.tammanun        enable row level security;
alter table public.law             enable row level security;
alter table public.statis          enable row level security;
alter table public.admin           enable row level security;

-- ตารางเนื้อหาที่เผยแพร่สาธารณะ: ใครก็อ่านได้ / เจ้าหน้าที่เท่านั้นที่เขียนได้
do $$
declare t text;
begin
  foreach t in array array['Home','botton','significance','hoop','anthority','mamberNACC','ANACC','new','Certificate','plan','culecculum','tammanun','law']
  loop
    execute format($f$
      drop policy if exists "public read %1$s" on public.%1$I;
      create policy "public read %1$s" on public.%1$I for select to anon, authenticated using (true);
      drop policy if exists "staff write %1$s" on public.%1$I;
      create policy "staff write %1$s" on public.%1$I for all to authenticated
        using (public.is_staff()) with check (public.is_staff());
    $f$, t);
  end loop;
end $$;

-- newstat: สาธารณะเห็นเฉพาะช่วงที่กำลังแสดง (ผ่าน RPC) / เจ้าหน้าที่อ่าน-เขียนได้
drop policy if exists "staff read newstat" on public.newstat;
create policy "staff read newstat" on public.newstat for select to authenticated using (public.is_staff());
drop policy if exists "staff write newstat" on public.newstat;
create policy "staff write newstat" on public.newstat for all to authenticated
  using (public.is_staff()) with check (public.is_staff());

-- admin: เจ้าหน้าที่อ่านข้อมูลตัวเองได้ / admin อ่านทั้งหมดได้ / แก้ไขผ่าน Edge Function เท่านั้น
drop policy if exists "staff read admin" on public.admin;
create policy "staff read admin" on public.admin for select to authenticated
  using (id = auth.uid() or public.is_admin());

-- statis: ไม่มีนโยบายอ่าน/เขียนตรง ใช้ RPC เท่านั้น (record_visit / site_stats)

-- ============================================================================
-- 7) ที่เก็บไฟล์ (Storage) สำหรับอัปโหลดรูปและ PDF
-- ============================================================================

insert into storage.buckets (id, name, public)
values ('public-files', 'public-files', true)
on conflict (id) do nothing;

drop policy if exists "public read public-files" on storage.objects;
create policy "public read public-files" on storage.objects
  for select to anon, authenticated using (bucket_id = 'public-files');

drop policy if exists "staff upload public-files" on storage.objects;
create policy "staff upload public-files" on storage.objects
  for insert to authenticated with check (bucket_id = 'public-files' and public.is_staff());

drop policy if exists "staff update public-files" on storage.objects;
create policy "staff update public-files" on storage.objects
  for update to authenticated using (bucket_id = 'public-files' and public.is_staff());

drop policy if exists "staff delete public-files" on storage.objects;
create policy "staff delete public-files" on storage.objects
  for delete to authenticated using (bucket_id = 'public-files' and public.is_staff());

-- ============================================================================
-- เสร็จสิ้น: ต่อไปสร้างบัญชีผู้ใช้คนแรก (ดูขั้นตอนใน README หัวข้อ "สร้างบัญชี Admin")
-- ============================================================================

-- ============================================================================
-- สำหรับฐานข้อมูลเดิม (สร้างจากเวอร์ชันก่อน) — หมายเหตุก่อนรันสคริปต์นี้ซ้ำ
-- ============================================================================
-- 1) สคริปต์นี้ "ไม่ลบข้อมูลเดิม" และรันซ้ำได้ (ทุกส่วนใช้ IF NOT EXISTS / DROP IF EXISTS)
-- 2) ถ้าฐานเดิมมีนโยบาย (policy) เก่าที่กว้างกว่านี้อยู่ สคริปต์จะเพิ่มนโยบายใหม่แต่ "ไม่ได้ลบ" นโยบาย
--    อื่นที่เคยสร้างไว้ — โปรดเข้าไปตรวจที่ Authentication > Policies แล้วลบนโยบายเก่าที่ไม่ต้องการ
--    (ตรวจโดยเฉพาะตาราง newstat และ statis ที่ระบบนี้กำหนดให้อ่านผ่าน RPC เท่านั้น)
-- 3) ตาราง plan: ถ้ามีข้อมูลเดิมที่ติ๊ก "ดำเนินการ"/"แล้วเสร็จ" ทั้งที่ "เสนอ" ยังไม่ใช่ "ผ่าน"
--    ให้แก้ไขแถวเหล่านั้นก่อน (trigger ใหม่จะบังคับกติกานี้ตั้งแต่รันสคริปต์แล้ว)
