// ใช้ได้ทั้ง GitHub Pages แบบชื่อบัญชี.github.io และแบบ /ชื่อ-repository/
// อัปโหลดไฟล์นี้ข้าง index.html ไม่ต้องใช้ npm, build หรือ GitHub Secrets
// ใส่ได้เฉพาะ Publishable key ห้ามใส่ service_role / sb_secret / รหัสผ่าน
window.PK_CONFIG = Object.freeze({
  supabaseUrl: 'https://baprjszsaixaexpyyovs.supabase.co',
  publishableKey: 'sb_publishable_VxA4c7EIynzEwp1kyNdj7A__-eyjX7o',
  authEmailDomain: 'pkjunior.local',
  logo: './assets/logo.png',
  // หลังติดตั้ง schema.sql และสร้าง admin คนแรกแล้ว เปลี่ยนเป็น true
  // แก้บน GitHub: เปิด config.js > Edit > เปลี่ยนค่า > Commit changes
  // false = เปิดดูหน้าเว็บได้ แต่ไม่เรียก API และยังบันทึกข้อมูลไม่ได้
  connected: false
});
