-- ============================================================================
-- เว็บไซต์ ป.ป.ช.สพฐ.น้อย โรงเรียนภูเขียว
-- สคริปต์ติดตั้งฐานข้อมูล Supabase (นำไปวางใน SQL Editor แล้วกด Run)
--
-- สิ่งที่สคริปต์นี้ทำ:
--   1) สร้างตารางและคอลัมน์ทั้งหมด (ทุกตารางมี id สำหรับอ้างอิง)
--   2) สร้างระบบตรวจสอบการเข้าสู่ระบบโดยเทียบตาราง admin โดยตรง
--      (ไม่ใช้ Supabase Auth) — ผ่านฟังก์ชัน SQL เท่านั้น
--   3) กำหนดสิทธิ์: ผู้เยี่ยมชมทั่วไปอ่านได้อย่างเดียว
--      การเพิ่ม/แก้ไข/ลบต้องมี token จากการ login เท่านั้น
--   4) สร้าง bucket สำหรับอัปโหลดไฟล์ (public-files)
--   5) รันเลขอัตโนมัติ / บันทึกชื่อผู้บันทึก / เวลา ฝั่งฐานข้อมูล
--
-- ตัวอักษรชื่อคอลัมน์ภาษาไทยและตัวพิมพ์ใหญ่ ต้องครงตามนี้เป๊ะ ๆ
-- ============================================================================

-- ส่วนเสริมที่จำเป็น (pgcrypto สำหรับ uuid / การสร้าง token)
create extension if not exists pgcrypto;

-- ============================================================================
-- 1) ตารางระบบ (ไม่เปิดให้อ่านโดยตรง — ใช้ฟังก์ชันเท่านั้น)
-- ============================================================================

-- ตารางผู้ใช้งาน: คอลัมน์ username, password, name เท่านั้น
-- (สิทธิ์: บัญชี username = "admin" คือ ผู้ดูแลระบบ, บัญชีอื่นคือ "nacc")
create table if not exists public.admin (
  id       uuid primary key default gen_random_uuid(),
  username text not null unique,
  password text not null,
  name     text not null
);

-- รหัสลับของระบบ (ใช้สร้าง token หลัง login) — สร้างอัตโนมัติครั้งเดียว
create table if not exists public.app_secrets (
  id     uuid primary key default gen_random_uuid(),
  secret text not null
);

-- สถิติการเข้าชม (ผู้เยี่ยมชมหน้าหลัก)
create table if not exists public.statis (
  id         uuid primary key default gen_random_uuid(),
  brand      text,
  "timestamp" timestamptz not null default now()
);

-- ============================================================================
-- 2) ตารางเนื้อหาเว็บไซต์
-- ============================================================================

-- ภาพสไลด์พื้นหลังหน้าแรก
create table if not exists public."Home" (
  id         uuid primary key default gen_random_uuid(),
  photo      text,
  caption    text,
  sort_order int not null default 0
);

-- ประกาศตามช่วงเวลา (แบนเนอร์หน้าแรก) — dateline เก็บช่วงวันเวลา
create table if not exists public.newstat (
  id       uuid primary key default gen_random_uuid(),
  name     text,
  photo    text,
  url      text,
  dateline tstzrange
);

-- ปุ่มลัดหน้าแรก
create table if not exists public.botton (
  id         uuid primary key default gen_random_uuid(),
  photo      text,
  meg        text,
  url        text,
  sort_order int not null default 0
);

-- ประวัติ: ที่มาและความสำคัญ / เจตจำนง / อำนาจหน้าที่
create table if not exists public.significance (
  id    uuid primary key default gen_random_uuid(),
  title text,
  mag   text,
  url   jsonb
);
create table if not exists public.hoop (
  id    uuid primary key default gen_random_uuid(),
  title text,
  mag   text,
  url   jsonb
);
create table if not exists public.anthority (
  id    uuid primary key default gen_random_uuid(),
  title text,
  mag   text,
  url   jsonb
);

-- บุคคลกร (คณะกรรมการ ป.ป.ช.สพฐ.น้อย)
create table if not exists public."mamberNACC" (
  id       uuid primary key default gen_random_uuid(),
  year     int  not null,
  photo    text,
  name     text not null,
  class    text,
  position text not null
);

-- ตัวแทนห้อง (อนุกรรมการ ป.ป.ช.สพฐ.น้อย)
create table if not exists public."ANACC" (
  id   uuid primary key default gen_random_uuid(),
  year int  not null,
  no   int,
  roll text,
  name text,
  class text,
  unique (year, roll)
);

-- ข่าวสาร (ประกาศ / ประชาสัมพันธ์ / คำสั่ง / จดหมายข่าว)
-- url เก็บรายการไฟล์แนบ (ภาพ + PDF) แบบ JSON
create table if not exists public.new (
  id         uuid primary key default gen_random_uuid(),
  no         int,
  url        jsonb,
  name       text not null,
  type       text not null,
  regisname  text,
  "timestamp" timestamptz default now(),
  mag        text,
  constraint new_type_chk check (type in ('ประกาศ','ประชาสัมพันธ์','คำสั่ง','จดหมายข่าว'))
);

-- ทะเบียนเกียรติบัตร (kind = certificate) และผลงาน (kind = award)
create table if not exists public."Certificate" (
  id                    uuid primary key default gen_random_uuid(),
  kind                  text not null default 'certificate',
  date                  date,
  name                  text,
  "from"                text,
  "Award"               text,
  url                   jsonb,
  "รูปกิจกรรม"           jsonb,
  "ระดับรางวัล"          text,
  "ประเภทสิทธิ์เหรียญรางวัล" text,
  "ประเภทเหรียญรางวัล"    text,
  "ชื่อผลงาน"            text,
  "หน่วยงานที่รับผิดชอบ"   text,
  "วันที่ได้รับ"          date,
  "ผู้ที่ได้รับรางวัล"      jsonb,
  "ครูที่ปรึกษา"          jsonb,
  constraint certificate_kind_chk check (kind in ('certificate','award'))
);

-- นโยบายและแผนดำเนินโครงการ (Timeline)
create table if not exists public.plan (
  id             uuid primary key default gen_random_uuid(),
  name           text not null,
  "ร่าง"         boolean not null default false,
  "เสนอ"         text not null default 'รอพิจารณา',
  "ดำเนินการ"     boolean not null default false,
  "แล้วเสร็จ"     boolean not null default false,
  "ผู้รับผิดชอบ"   text,
  regisname      text,
  url            jsonb,
  constraint plan_propose_chk check ("เสนอ" in ('รอพิจารณา','ผ่าน','ไม่ผ่าน'))
);

-- หลักสูตร / ธรรมนูญ / กฎหมาย
create table if not exists public.culecculum (
  id        uuid primary key default gen_random_uuid(),
  name      text not null,
  url       jsonb,
  regisname text
);
create table if not exists public.tammanun (
  id        uuid primary key default gen_random_uuid(),
  name      text not null,
  url       jsonb,
  regisname text
);
create table if not exists public.law (
  id        uuid primary key default gen_random_uuid(),
  name      text not null,
  url       jsonb,
  regisname text
);

-- ============================================================================
-- 3) ปรับปรุงฐานข้อมูลเดิม (ถ้ามีข้อมูลอยู่แล้ว) — เพิ่มคอลัมน์ที่ขาด
-- ============================================================================

-- ตาราง admin เดิม (ถ้ามี): สร้าง index กัน username ซ้ำ (ใช้กับ on conflict ด้านล่าง)
-- (ไม่เพิ่มคอลัมน์อื่น — ตารางมีเพียง username, password, name ตามที่กำหนด)
create unique index if not exists admin_username_uniq on public.admin (username);
alter table public.new        add column if not exists mag text;
alter table public.newstat    add column if not exists dateline tstzrange;
alter table public."Certificate" add column if not exists "รูปกิจกรรม" jsonb;
alter table public."Certificate" add column if not exists "ระดับรางวัล" text;
alter table public."Certificate" add column if not exists "ประเภทสิทธิ์เหรียญรางวัล" text;
alter table public."Certificate" add column if not exists "ประเภทเหรียญรางวัล" text;
alter table public."Certificate" add column if not exists "ชื่อผลงาน" text;
alter table public."Certificate" add column if not exists "หน่วยงานที่รับผิดชอบ" text;
alter table public."Certificate" add column if not exists "วันที่ได้รับ" date;
alter table public."Certificate" add column if not exists "ผู้ที่ได้รับรางวัล" jsonb;
alter table public."Certificate" add column if not exists "ครูที่ปรึกษา" jsonb;
alter table public.plan       add column if not exists "ร่าง" boolean not null default false;
alter table public.plan       add column if not exists "เสนอ" text not null default 'รอพิจารณา';
alter table public.plan       add column if not exists "ดำเนินการ" boolean not null default false;
alter table public.plan       add column if not exists "แล้วเสร็จ" boolean not null default false;
alter table public.plan       add column if not exists "ผู้รับผิดชอบ" text;
alter table public.plan       add column if not exists regisname text;
alter table public.culecculum add column if not exists regisname text;
alter table public.tammanun   add column if not exists regisname text;
alter table public.law        add column if not exists regisname text;

-- ข้อบังคับ (กันค่าที่ไม่ถูกต้อง) — ใช้ DO block เพื่อรันซ้ำได้
-- (PostgreSQL ไม่มี ADD CONSTRAINT IF NOT EXISTS ต้องตรวจใน pg_constraint เอง)
do $S$
begin
  if not exists (select 1 from pg_constraint
                  where conrelid = 'public.new'::regclass and conname = 'new_type_chk') then
    alter table public.new add constraint new_type_chk
      check (type in ('ประกาศ','ประชาสัมพันธ์','คำสั่ง','จดหมายข่าว'));
  end if;
end
$S$;

do $S$
begin
  if not exists (select 1 from pg_constraint
                  where conrelid = 'public."Certificate"'::regclass and conname = 'certificate_kind_chk') then
    alter table public."Certificate" add constraint certificate_kind_chk
      check (kind in ('certificate','award'));
  end if;
end
$S$;

do $S$
begin
  if not exists (select 1 from pg_constraint
                  where conrelid = 'public.plan'::regclass and conname = 'plan_propose_chk') then
    alter table public.plan add constraint plan_propose_chk
      check ("เสนอ" in ('รอพิจารณา','ผ่าน','ไม่ผ่าน'));
  end if;
end
$S$;

-- Timeline: ถ้าไม่ผ่านการเสนอ ห้ามเลือกดำเนินการ/แล้วเสร็จ และห้ามเลือกแล้วเสร็จโดยไม่ดำเนินการ
do $S$
begin
  if not exists (select 1 from pg_constraint
                  where conrelid = 'public.plan'::regclass and conname = 'plan_timeline_chk') then
    alter table public.plan add constraint plan_timeline_chk check (
      not ("เสนอ" = 'ไม่ผ่าน' and "ดำเนินการ") and
      not ("เสนอ" = 'ไม่ผ่าน' and "แล้วเสร็จ") and
      not ("แล้วเสร็จ" and not "ดำเนินการ")
    );
  end if;
end
$S$;

-- ลบฟังก์ชันเก่าที่อาจชนกับระบบใหม่ (ทุกลายเซ็น เช่น record_visit แบบระบบเดิม)
do $S$
declare r record;
begin
  for r in select p.oid::regprocedure as sig
          from pg_proc p join pg_namespace n on n.oid = p.pronamespace
          where n.nspname = 'public' and p.proname in ('record_visit','site_stats','active_newstat','active_announcements') loop
    execute format('drop function if exists %s', r.sig);
  end loop;
end
$S$;

-- ฟังก์ชันแฮชรหัสผ่าน (SHA-256) — เก็บแทนข้อความธรรมดาในคอลัมน์ password
-- (ผู้ใช้ยังกรอกรหัสผ่านปกติ ระบบจะแปลงเป็นแฮชให้เองทุกครั้ง)
create or replace function public.pk_hash(p text)
returns text
language sql immutable
set search_path = public, extensions
as $S$
  select encode(digest(coalesce(p, ''), 'sha256'), 'hex')
$S$;

-- แปลงรหัสผ่านเดิมที่เป็นข้อความธรรมดาให้เป็นแฮช (กรณีมีข้อมูลเดิมจากระบบเก่า)
update public.admin set password = public.pk_hash(password)
 where password is not null and password <> ''
   and password !~ '^[0-9a-f]{64}$';

-- ข้อมูลเริ่มต้น: บัญชี admin (username: admin / รหัสผ่าน: admin1234)
-- *** กรุณาเข้าเว็บไซต์แล้วเปลี่ยนรหัสผ่านทันที ***
-- (รองรับตาราง admin เดิมที่มีคอลัมน์ role/active เพิ่ม)
do $S$
begin
  if exists (select 1 from information_schema.columns
             where table_schema = 'public' and table_name = 'admin' and column_name = 'active') then
    insert into public.admin (username, password, name, role, active)
    values ('admin', public.pk_hash('admin1234'), 'ผู้ดูแลระบบ', 'admin', true)
    on conflict (username) do nothing;
  elsif exists (select 1 from information_schema.columns
             where table_schema = 'public' and table_name = 'admin' and column_name = 'role') then
    insert into public.admin (username, password, name, role)
    values ('admin', public.pk_hash('admin1234'), 'ผู้ดูแลระบบ', 'admin')
    on conflict (username) do nothing;
  else
    insert into public.admin (username, password, name)
    values ('admin', public.pk_hash('admin1234'), 'ผู้ดูแลระบบ')
    on conflict (username) do nothing;
  end if;
end
$S$;

-- บัญชีเดิมที่ยังไม่มีรหัสผ่าน ให้ตั้งเป็นรหัสเริ่มต้นชั่วคราว (ควรเปลี่ยนทันที)
update public.admin set password = public.pk_hash('admin1234')
 where password is null or password = '';

-- รหัสลับของระบบ (สร้างอัตโนมัติครั้งเดียว ห้ามเปลี่ยนถ้ามีอยู่แล้ว)
insert into public.app_secrets (secret)
select encode(gen_random_bytes(32), 'hex')
where not exists (select 1 from public.app_secrets);

-- ============================================================================
-- 4) ฟังก์ชันตรวจสอบการเข้าสู่ระบบ (แทน Supabase Auth)
--    token = HMAC(username + md5(password), secret) — เปลี่ยนรหัสผ่านแล้ว
--    token เดิมจะใช้ไม่ได้ทันที
-- ============================================================================

-- อ่าน HTTP headers ที่ส่งมากับคำขอ (ใช้ใน RLS policy)
create or replace function public._req_headers()
returns jsonb
language sql stable
as $$
  select coalesce(current_setting('request.headers', true)::jsonb, '{}'::jsonb)
$$;

-- ตรวจ token กับตาราง admin
create or replace function public.staff_verify_token(p_username text, p_token text)
returns boolean
language sql stable security definer set search_path = public, extensions
as $$
  select p_username is not null and p_token is not null and exists (
    select 1
    from public.admin a
    where a.username = p_username
      and encode(hmac(a.username || ':' || md5(a.password),
                       (select s.secret from public.app_secrets s limit 1), 'sha256'), 'hex') = p_token
  );
$$;

-- ใช้ใน policy: คำขอนี้มาจากผู้ที่ login แล้วหรือไม่
create or replace function public.is_staff()
returns boolean
language sql stable security definer set search_path = public, extensions
as $$
  select public.staff_verify_token(
    public._req_headers() ->> 'x-staff-user',
    public._req_headers() ->> 'x-staff-token'
  )
$$;

-- ชื่อผู้ใช้ที่ login อยู่ (จาก headers)
create or replace function public.staff_username()
returns text
language sql stable security definer set search_path = public, extensions
as $$
  select case when public.is_staff() then public._req_headers() ->> 'x-staff-user' end
$$;

-- ชื่อ-นามสกุลของผู้ที่ login อยู่
create or replace function public.staff_name()
returns text
language sql stable security definer set search_path = public, extensions
as $$
  select (select a.name from public.admin a
          where a.username = public.staff_username())
$$;

-- เข้าสู่ระบบ: เทียบ username/password กับตาราง admin
-- ส่งคืน token + ชื่อ + สิทธิ์ (admin / nacc)
create or replace function public.staff_login(p_username text, p_password text)
returns jsonb
language plpgsql security definer set search_path = public, extensions
as $$
declare
  a public.admin%rowtype;
begin
  select * into a from public.admin where username = lower(coalesce(p_username, ''));
  if not found or a.password <> public.pk_hash(p_password) then
    return jsonb_build_object('ok', false, 'error', 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง');
  end if;
  return jsonb_build_object(
    'ok',       true,
    'username', a.username,
    'name',     a.name,
    'role',     case when a.username = 'admin' then 'admin' else 'nacc' end,
    'token',    encode(hmac(a.username || ':' || md5(a.password),
                            (select s.secret from public.app_secrets s limit 1), 'sha256'), 'hex')
  );
end
$$;

-- ตรวจสถานะผู้ login ปัจจุบัน (ใช้ตรวจว่า token ยังไม่หมดอายุ)
create or replace function public.staff_me()
returns jsonb
language plpgsql security definer set search_path = public, extensions
as $$
begin
  if not public.is_staff() then return null; end if;
  return jsonb_build_object(
    'username', public.staff_username(),
    'name',     public.staff_name(),
    'role',     case when public.staff_username() = 'admin' then 'admin' else 'nacc' end
  );
end
$$;

-- เปลี่ยนรหัสผ่านของบัญชีที่ login อยู่
create or replace function public.staff_change_password(p_current text, p_new text)
returns jsonb
language plpgsql security definer set search_path = public, extensions
as $$
declare
  u text := public.staff_username();
begin
  if u is null then
    return jsonb_build_object('ok', false, 'error', 'กรุณาเข้าสู่ระบบก่อน');
  end if;
  if exists (select 1 from public.admin where username = u and password <> public.pk_hash(p_current)) then
    return jsonb_build_object('ok', false, 'error', 'รหัสผ่านปัจจุบันไม่ถูกต้อง');
  end if;
  if length(coalesce(p_new, '')) < 6 then
    return jsonb_build_object('ok', false, 'error', 'รหัสผ่านใหม่ต้องมีอย่างน้อย 6 ตัวอักษร');
  end if;
  update public.admin set password = public.pk_hash(p_new) where username = u;
  return jsonb_build_object('ok', true, 'error', 'เปลี่ยนรหัสผ่านสำเร็จ กรุณาเข้าสู่ระบบใหม่อีกครั้ง');
end
$$;

-- ============================================================================
-- 5) ฟังก์ชันสำหรับผู้ดูแล (บัญชี admin เท่านั้น): จัดการผู้ใช้
-- ============================================================================

create or replace function public.staff_list_users()
returns table (username text, name text)
language plpgsql security definer set search_path = public, extensions
as $$
begin
  if public.staff_username() is distinct from 'admin' then
    raise exception 'สำหรับผู้ดูแลระบบ (admin) เท่านั้น';
  end if;
  return query select a.username, a.name from public.admin a order by a.username;
end
$$;

create or replace function public.staff_save_user(p_username text, p_name text, p_password text)
returns jsonb
language plpgsql security definer set search_path = public, extensions
as $$
begin
  if public.staff_username() is distinct from 'admin' then
    return jsonb_build_object('ok', false, 'error', 'สำหรับผู้ดูแลระบบ (admin) เท่านั้น');
  end if;
  if p_username is null or length(trim(p_username)) < 3 then
    return jsonb_build_object('ok', false, 'error', 'ชื่อผู้ใช้ต้องมีอย่างน้อย 3 ตัวอักษร');
  end if;
  if p_name is null or trim(p_name) = '' then
    return jsonb_build_object('ok', false, 'error', 'กรุณากรอกชื่อผู้ใช้งาน');
  end if;
  insert into public.admin (username, password, name)
  values (lower(trim(p_username)), public.pk_hash(coalesce(nullif(p_password, ''), 'pk123456')), trim(p_name))
  on conflict (username) do update
    set name = excluded.name,
        password = case when coalesce(p_password, '') = '' then public.admin.password else excluded.password end;
  return jsonb_build_object('ok', true, 'error', 'บันทึกบัญชีสำเร็จ');
end
$$;

create or replace function public.staff_delete_user(p_username text)
returns jsonb
language plpgsql security definer set search_path = public, extensions
as $$
begin
  if public.staff_username() is distinct from 'admin' then
    return jsonb_build_object('ok', false, 'error', 'สำหรับผู้ดูแลระบบ (admin) เท่านั้น');
  end if;
  if lower(coalesce(p_username, '')) = 'admin' then
    return jsonb_build_object('ok', false, 'error', 'ลบบัญชี admin หลักไม่ได้');
  end if;
  delete from public.admin where username = lower(coalesce(p_username, ''));
  if not found then
    return jsonb_build_object('ok', false, 'error', 'ไม่พบบัญชีนี้');
  end if;
  return jsonb_build_object('ok', true, 'error', 'ลบบัญชีสำเร็จ');
end
$$;

-- ============================================================================
-- 6) ฟังก์ชันสาธารณะ: สถิติ / บันทึกการเข้าชม / ประกาศตามช่วงเวลา
-- ============================================================================

-- บันทึกการเข้าชมหน้าหลัก (รุ่นอุปกรณ์ + เวลา)
-- ใช้ชื่อพารามิเตอร์ device ให้ตรงกับที่หน้าเว็บเรียก record_visit({device: ...})
create or replace function public.record_visit(device text)
returns void
language plpgsql security definer set search_path = public, extensions
as $$
begin
  insert into public.statis (brand, "timestamp")
  values (left(coalesce(device, 'อุปกรณ์อื่น'), 120), now());
end
$$;

-- สถิติ: จำนวนผู้เยี่ยมชม + จำนวนกรรมการ/อนุกรรมการปีการศึกษาล่าสุด
create or replace function public.site_stats()
returns jsonb
language plpgsql security definer set search_path = public, extensions
as $$
declare
  my int; dy int; mc int; dc int;
begin
  select max(year) into my from public."mamberNACC";
  if my is not null then
    select count(*) into mc from public."mamberNACC" where year = my;
  end if;
  select max(year) into dy from public."ANACC";
  if dy is not null then
    select count(*) into dc from public."ANACC" where year = dy;
  end if;
  return jsonb_build_object(
    'visitors', (select count(*) from public.statis where brand is not null),
    'member_year', my, 'members', mc,
    'delegate_year', dy, 'delegates', dc
  );
end
$$;

-- ประกาศตามช่วงเวลาที่ตรงกับ "ตอนนี้"
-- ใช้ชื่อ active_announcements ให้ตรงกับที่หน้าเว็บเดิมเรียก
create or replace function public.active_announcements()
returns setof public.newstat
language sql stable security definer set search_path = public, extensions
as $$
  select * from public.newstat where dateline @> now() order by id
$$;

-- ============================================================================
-- 7) ระบบตัวเลขอัตโนมัติ + ประทับผู้บันทึก/เวลา (trigger ฝั่งฐานข้อมูล)
-- ============================================================================

-- ข่าวสาร: ใช้ sequence รันเลข (กันเลขซ้ำเมื่อบันทึกพร้อมกัน)
-- + ประทับผู้บันทึก/เวลาอัตโนมัติ + ล็อกช่องอ่านอย่างเดียวเมื่อแก้ไข
create sequence if not exists public.new_no_seq;
-- setval แบบ 3 อาร์กิวเมนต์ (is_called = false):
-- ตารางว่าง → nextval คืน 1, มีข้อมูล (สูงสุด 5) → nextval คืน 6
select setval('public.new_no_seq',
              coalesce((select max(no) from public.new), 0) + 1, false);

create or replace function public.trg_new_bi()
returns trigger
language plpgsql security definer set search_path = public, extensions
as $S$
begin
  if NEW.no is null then
    NEW.no := nextval('public.new_no_seq');
  end if;
  NEW.regisname := coalesce(public.staff_name(), NEW.regisname);
  NEW."timestamp" := now();
  return NEW;
end
$S$;
drop trigger if exists new_bi on public.new;
create trigger new_bi before insert on public.new
for each row execute function public.trg_new_bi();

-- เมื่อแก้ไขข่าว: ห้ามแก้ ลำดับ/ประเภท/ผู้บันทึก/เวลา (รักษาค่าเดิมไว้)
create or replace function public.trg_new_bu()
returns trigger
language plpgsql security definer set search_path = public, extensions
as $S$
begin
  NEW.no := OLD.no;
  NEW.type := OLD.type;
  NEW.regisname := OLD.regisname;
  NEW."timestamp" := OLD."timestamp";
  return NEW;
end
$S$;
drop trigger if exists new_bu on public.new;
create trigger new_bu before update on public.new
for each row execute function public.trg_new_bu();

-- ตัวแทนห้อง: รันเลข 1 2 3 4... ต่อในปีการศึกษาเดียวกัน
-- (ใช้ advisory lock กันเลขชนกันเมื่อบันทึกหลายชุดพร้อมกัน)
create or replace function public.trg_anacc_bi()
returns trigger
language plpgsql security definer set search_path = public, extensions
as $S$
begin
  if NEW.no is null then
    perform pg_advisory_xact_lock(hashtext('pk_anacc_' || NEW.year));
    NEW.no := (select coalesce(max(no), 0) + 1 from public."ANACC" where year = NEW.year);
  end if;
  return NEW;
end
$S$;
drop trigger if exists anacc_bi on public."ANACC";
create trigger anacc_bi before insert on public."ANACC"
for each row execute function public.trg_anacc_bi();

-- ประทับชื่อผู้บันทึกอัตโนมัติ (plan / culecculum / tammanun / law)
create or replace function public.trg_stamp_regisname()
returns trigger
language plpgsql security definer set search_path = public, extensions
as $$
begin
  NEW.regisname := coalesce(public.staff_name(), NEW.regisname);
  return NEW;
end
$$;
drop trigger if exists plan_stamp on public.plan;
create trigger plan_stamp before insert on public.plan
for each row execute function public.trg_stamp_regisname();
drop trigger if exists culecculum_stamp on public.culecculum;
create trigger culecculum_stamp before insert on public.culecculum
for each row execute function public.trg_stamp_regisname();
drop trigger if exists tammanun_stamp on public.tammanun;
create trigger tammanun_stamp before insert on public.tammanun
for each row execute function public.trg_stamp_regisname();
drop trigger if exists law_stamp on public.law;
create trigger law_stamp before insert on public.law
for each row execute function public.trg_stamp_regisname();

-- ============================================================================
-- 8) สิทธิ์การเข้าถึงตาราง (RLS)
--    - ตารางระบบ (admin / app_secrets / statis): บล็อกทุกการเข้าถึงโดยตรง
--    - ตารางเนื้อหา: อ่านได้ทั่วไป / เขียนได้เฉพาะผู้ที่ login
-- ============================================================================

alter table public.admin       enable row level security;
alter table public.app_secrets enable row level security;
alter table public.statis      enable row level security;
-- (ไม่สร้าง policy ใด = ปิดการเข้าถึงโดยตรงทั้งหมด ใช้ฟังก์ชันด้านบนเท่านั้น)

-- ลบ policy เดิมของตารางระบบทั้งหมดก่อน (ระบบเก่าอาจเปิดสิทธิ์ไว้)
do $S$
declare r record;
begin
  for r in select schemaname, tablename, policyname from pg_policies
          where schemaname = 'public' and tablename in ('admin','app_secrets','statis') loop
    execute format('drop policy if exists %I on %I.%I', r.policyname, r.schemaname, r.tablename);
  end loop;
end
$S$;

do $S$
declare t text; r record;
begin
  foreach t in array array[
    'Home','newstat','botton','significance','hoop','anthority','mamberNACC',
    'ANACC','new','Certificate','plan','culecculum','tammanun','law'
  ] loop
    -- ลบ policy เดิมทั้งหมดของตารางนี้ก่อน (รวม policy ของระบบเก่า) แล้วสร้างชุดใหม่
    for r in select policyname from pg_policies
            where schemaname = 'public' and tablename = t loop
      execute format('drop policy if exists %I on public.%I', r.policyname, t);
    end loop;
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists "public read" on public.%I', t);
    execute format('create policy "public read" on public.%I for select using (true)', t);
    execute format('drop policy if exists "staff insert" on public.%I', t);
    execute format('create policy "staff insert" on public.%I for insert with check (public.is_staff())', t);
    execute format('drop policy if exists "staff update" on public.%I', t);
    execute format('create policy "staff update" on public.%I for update using (public.is_staff()) with check (public.is_staff())', t);
    execute format('drop policy if exists "staff delete" on public.%I', t);
    execute format('create policy "staff delete" on public.%I for delete using (public.is_staff())', t);
  end loop;
end
$S$;

-- ============================================================================
-- 9) พื้นที่เก็บไฟล์ (Storage): bucket "public-files"
--    อ่านได้ทั่วไป / อัปโหลดได้เฉพาะ PDF และรูปภาพ / ลบ-แก้ไขเฉพาะผู้ที่ login
-- ============================================================================

insert into storage.buckets (id, name, public)
values ('public-files', 'public-files', true)
on conflict (id) do nothing;

drop policy if exists "public read files" on storage.objects;
create policy "public read files" on storage.objects
for select using (bucket_id = 'public-files');

drop policy if exists "public upload files" on storage.objects;
create policy "public upload files" on storage.objects
for insert with check (
  bucket_id = 'public-files'
  and (lower(name) like '%.pdf' or lower(name) like '%.jpg'
       or lower(name) like '%.jpeg' or lower(name) like '%.png'
       or lower(name) like '%.webp' or lower(name) like '%.gif')
);

drop policy if exists "staff delete files" on storage.objects;
create policy "staff delete files" on storage.objects
for delete using (bucket_id = 'public-files' and public.is_staff());

-- ============================================================================
-- เสร็จเรียบร้อย
-- บัญชีเริ่มต้น:  username = admin   password = admin1234
-- *** กรุณาเข้าเว็บไซต์ → เมนู 3 ขีด → เข้าสู่ระบบ → เปลี่ยนรหัสผ่านทันที ***
-- ============================================================================
