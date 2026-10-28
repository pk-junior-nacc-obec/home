// ใช้ได้ทั้ง GitHub Pages แบบชื่อบัญชี.github.io และแบบ /ชื่อ-repository/
// อัปโหลดไฟล์นี้ข้าง index.html ไม่ต้องใช้ npm, build หรือ GitHub Secrets
// ใส่ได้เฉพาะ Publishable key ห้ามใส่ service_role / sb_secret / รหัสผ่าน
window.PK_CONFIG = Object.freeze({
  supabaseUrl: 'https://baprjszsaixaexpyyovs.supabase.co',
  publishableKey: 'sb_publishable_VxA4c7EIynzEwp1kyNdj7A__-eyjX7o',
  logo: 'https://drive.google.com/thumbnail?id=1E3Sfzalpk46I9uOFhsnfWrBURGb8LsED&sz=w256',
  // true = เชื่อมต่อ Supabase แล้ว (ตารางและ RPC พร้อมใช้งาน)
  // หากยังไม่ได้ติดตั้ง supabase-schema.sql ให้ตั้งเป็น false ก่อน
  // แก้บน GitHub: เปิด config.js > Edit > เปลี่ยนค่า > Commit changes
  connected: true
});
