// Edge Function: manage-users
// ใช้จัดการบัญชีเจ้าหน้าที่ (เพิ่มบัญชี / แก้ไข / รีเซ็ตรหัสผ่าน) — สำหรับสิทธิ์ admin เท่านั้น
// ติดตั้ง: Supabase Dashboard > Edge Functions > Create a function > ชื่อ manage-users > วางโค้ดนี้ทั้งหมด > Deploy
// หมายเหตุ: Edge Function นี้จำเป็นสำหรับเมนู "จัดการผู้ใช้" ถ้าไม่ติดตั้ง เมนูอื่นใช้งานได้ตามปกติ
import { createClient } from 'jsr:@supabase/supabase-js@2'

const AUTH_EMAIL_DOMAIN = 'pkjunior.local' // ต้องตรงกับ authEmailDomain ใน config.js

// CORS: เปิดให้เว็บไซต์ (GitHub Pages) เรียกใช้ได้ และตอบ preflight OPTIONS ให้ถูกต้อง
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Max-Age': '86400',
}
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })

Deno.serve(async (req) => {
  // ตอบ preflight ของ browser ก่อนตรวจสอบตัวตน (ตามสเปก CORS)
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: corsHeaders })
  if (req.method !== 'POST') return json({ error: 'รองรับเฉพาะคำสั่ง POST' }, 405)

  try {
    // ตรวจสอบตัวตนผู้เรียกจาก JWT ที่แนบมากับหน้าเว็บ (ไม่ใช่ publishable key)
    const authHeader = req.headers.get('Authorization') ?? ''
    if (!authHeader.startsWith('Bearer ')) return json({ error: 'ต้องเข้าสู่ระบบก่อนดำเนินการ' }, 401)

    const url = Deno.env.get('SUPABASE_URL')!
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    const caller = createClient(url, anonKey, {
      global: { headers: { Authorization: authHeader } },
    })
    const { data: { user }, error: userErr } = await caller.auth.getUser()
    if (userErr || !user) return json({ error: 'ไม่สามารถตรวจสอบตัวตนได้ กรุณาเข้าสู่ระบบใหม่' }, 401)

    // ยืนยันว่าเป็น admin ที่ยังใช้งานได้จริง
    const admin = createClient(url, serviceKey)
    const { data: profile } = await admin
      .from('admin')
      .select('role, active')
      .eq('id', user.id)
      .maybeSingle()
    if (!profile?.active || profile.role !== 'admin') {
      return json({ error: 'การจัดการบัญชีผู้ใช้สำหรับสิทธิ์ admin เท่านั้น' }, 403)
    }

    const body = (await req.json()) as {
      action?: 'create' | 'update'
      id?: string
      username?: string
      name?: string
      role?: 'admin' | 'nacc'
      password?: string
      active?: boolean
    }

    const username = String(body.username ?? '').trim().toLowerCase()
    const name = String(body.name ?? '').trim()
    const role = body.role === 'admin' ? 'admin' : 'nacc'
    const email = `${username}@${AUTH_EMAIL_DOMAIN}`

    // --- ตรวจสอบความถูกต้องของข้อมูลทั้งหมดก่อนเขียนอะไรลงฐานข้อมูล ---
    if (!/^[a-z0-9._-]{3,50}$/.test(username)) {
      return json({ error: 'Username ใช้ได้เฉพาะ a-z, 0-9, จุด, ขีด ความยาว 3-50 ตัว' })
    }
    if (!name) return json({ error: 'กรุณากรอกชื่อผู้ใช้งาน' })
    if (body.password && body.password.length < 12) {
      return json({ error: 'รหัสผ่านต้องมีอย่างน้อย 12 ตัวอักษร' })
    }

    if (body.action === 'create') {
      if (!body.password) return json({ error: 'กรุณากำหนดรหัสผ่าน (อย่างน้อย 12 ตัวอักษร)' })
      const { data: created, error: createErr } = await admin.auth.admin.createUser({
        email,
        password: body.password,
        email_confirm: true,
      })
      if (createErr) {
        const msg = /already/i.test(createErr.message)
          ? 'มีชื่อผู้ใช้นี้อยู่แล้ว กรุณาเลือกชื่อผู้ใช้อื่น'
          : `สร้างบัญชีไม่สำเร็จ: ${createErr.message}`
        return json({ error: msg })
      }
      const { error: rowErr } = await admin.from('admin').insert({
        id: created.user.id,
        username,
        name,
        role,
        active: true,
      })
      if (rowErr) {
        await admin.auth.admin.deleteUser(created.user.id) // ย้อนกลับถ้าบันทึกโปรไฟล์ไม่ได้
        return json({ error: `บันทึกข้อมูลบัญชีไม่สำเร็จ: ${rowErr.message}` })
      }
      return json({ ok: true })
    }

    if (body.action === 'update') {
      if (!body.id) return json({ error: 'ไม่พบบัญชีที่ต้องการแก้ไข' })
      const { data: target } = await admin.from('admin').select('*').eq('id', body.id).maybeSingle()
      if (!target) return json({ error: 'ไม่พบบัญชีนี้ในระบบ' })

      const updates: Record<string, unknown> = { name, role }
      if (typeof body.active === 'boolean') updates.active = body.active
      if (username !== target.username) updates.username = username

      // อัปเดตฐานข้อมูลก่อน แล้วค่อยอัปเดต Auth (ถ้า Auth พลาดจะย้อนคืนฐานข้อมูล)
      const { error: rowErr } = await admin.from('admin').update(updates).eq('id', body.id)
      if (rowErr) return json({ error: `แก้ไขข้อมูลบัญชีไม่สำเร็จ: ${rowErr.message}` })

      const authUpdates: Record<string, string> = {}
      if (username !== target.username) authUpdates.email = email
      if (body.password) authUpdates.password = body.password
      if (Object.keys(authUpdates).length) {
        const { error: authErr } = await admin.auth.admin.updateUserById(body.id, authUpdates)
        if (authErr) {
          // ย้อนกลับข้อมูลในตาราง admin ให้เหมือนเดิม เพื่อไม่ให้สองฝั่งขัดแย้งกัน
          await admin.from('admin').update({
            username: target.username,
            name: target.name,
            role: target.role,
            active: target.active,
          }).eq('id', body.id)
          return json({ error: `อัปเดตบัญชีฝั่ง Auth ไม่สำเร็จ: ${authErr.message}` })
        }
      }
      return json({ ok: true })
    }

    return json({ error: 'ไม่ทราบคำสั่ง (ต้องเป็น create หรือ update)' })
  } catch (e) {
    return json({ error: `เกิดข้อผิดพลาดภายในระบบ: ${e instanceof Error ? e.message : String(e)}` }, 500)
  }
})
