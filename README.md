# ติดตั้งเว็บไซต์ ป.ป.ช.สพฐ.น้อย ผ่าน GitHub UI

ชุดนี้เป็น HTML, CSS และ JavaScript สำหรับ GitHub Pages โดยตรง ไม่ต้องติดตั้งโปรแกรม ไม่ต้องใช้ Terminal และไม่ต้องสั่ง build การอัปโหลดไฟล์เข้า Repository เป็นเพียงการเก็บโค้ด ต้องเปิด GitHub Pages จึงจะมีหน้าเว็บไซต์ให้เข้าชม

## เลือก ZIP ให้ถูก

- **PK-Junior-NACC-GitHub-UI.zip:** แตก ZIP แล้วอัปโหลดทุกไฟล์และทุกโฟลเดอร์ภายในเข้า Repository สำหรับเปิดหน้าเว็บ ไม่มีโค้ด SQL หรือ GitHub Actions ปะปน
- **PK-Junior-NACC-Supabase-Setup.zip:** เก็บไว้ตั้งค่า Supabase ไม่ต้องอัปโหลด ZIP นี้เข้า Repository เว็บไซต์ มี SQL, Edge Function และคู่มือติดตั้งฉบับเต็ม

ZIP เว็บไซต์จัด index.html ไว้ที่ระดับบนสุดแล้ว ห้ามอัปโหลด ZIP ทั้งก้อนแล้วคาดว่าจะเปิดเว็บได้ ให้แตก ZIP ก่อนเสมอ และอย่าสร้างโฟลเดอร์ครอบไฟล์เพิ่มอีกชั้น

## อัปโหลดผ่านหน้า Repository

1. เข้าสู่ระบบ GitHub แล้วเปิด Repository ที่ต้องการใช้ หากยังไม่มี ให้สร้าง Repository ใหม่โดยใช้ชื่อที่ต้องการและเลือก Public เฉพาะเมื่อยอมรับให้คนอื่นเห็นโค้ดทั้งหมดได้ ชุดนี้ไม่มีรหัสผ่านหรือ service-role key แต่มี Publishable key สำหรับใช้ในหน้าเว็บ
2. แตก `PK-Junior-NACC-GitHub-UI.zip` ลงโฟลเดอร์ในเครื่อง
3. ใน Repository เลือก **Add file → Upload files** หากเป็น Repository ว่างอาจมีข้อความ **uploading an existing file** ให้เลือกข้อความนั้น
4. ลากทุกไฟล์และโฟลเดอร์ที่อยู่ภายในโฟลเดอร์ที่แตก ZIP ลงพื้นที่อัปโหลด โดยต้องเก็บโครงสร้าง `assets/` และ `vendor/` ไม่ให้ไฟล์ข้างในกระจายออกมาด้านนอก
5. ใส่ข้อความ Commit เช่น `Upload school website` และกด **Commit changes** ไปที่ branch `main`
6. ตรวจว่า `index.html` อยู่ที่หน้าแรกของ Repository เคียงข้าง `app.js`, `config.js` และ `styles.css`
7. ตรวจ `.nojekyll` หากไฟล์นี้ไม่ได้ถูกอัปโหลด ให้เลือก **Add file → Create new file** ตั้งชื่อ `.nojekyll` ใส่ข้อความ `GitHub Pages static website` แล้ว Commit

ขั้นตอนอัปโหลดอ้างอิง [คู่มือเพิ่มไฟล์ผ่านหน้า GitHub Repository](https://docs.github.com/en/repositories/working-with-files/managing-files/adding-a-file-to-a-repository) หากเลือกสร้าง branch ใหม่ GitHub อาจแสดงปุ่ม **Propose changes** แทน และต้องรวม Pull Request เข้า `main` ก่อนใช้เป็นแหล่งเผยแพร่

โครงสร้างที่ถูกต้อง:

```text
Repository/
├── index.html
├── styles.css
├── app.js
├── config.js
├── .nojekyll
├── README.md
├── THIRD_PARTY.md
├── assets/
│   ├── logo.png
│   ├── footer-1.png ... footer-6.png
│   └── ANACC-template.csv
└── vendor/
    ├── supabase.js
    ├── purify.min.js
    ├── papaparse.min.js
    ├── lucide.min.js
    └── LICENSES.txt
```

Windows อาจซ่อนนามสกุลจนเห็นเป็น `index`, `app`, `config` และ `styles` ให้ใช้ไฟล์เดิมโดยไม่เติมนามสกุลซ้ำ เช่น อย่าเปลี่ยนเป็น `index.html.html`

## เปิด GitHub Pages

เปิด **Settings → Pages → Build and deployment** แล้วเลือก **Source: Deploy from a branch** จากนั้นเลือก branch `main` และโฟลเดอร์ `/(root)` แล้วกด **Save** ตาม [คู่มือ GitHub Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site)

รอการเผยแพร่สำเร็จและใช้ URL ที่ปรากฏในหน้า Pages เพื่อเปิดเว็บไซต์ URL อาจเป็นรูปแบบ `https://ชื่อบัญชี.github.io/ชื่อ-repository/` ขึ้นอยู่กับชื่อ Repository ของคุณ ไม่ใช่ URL หน้า Repository ที่มีรายชื่อไฟล์

ไม่ต้องเลือก GitHub Actions สำหรับชุด ZIP นี้ และไม่ต้องเพิ่มไฟล์ workflow เอง หาก Repository เดิมมี `.github/workflows/pages.yml` ที่เผยแพร่เว็บอยู่แล้ว ให้ใช้วิธีเดิมต่อไป หรือปิด workflow เดิมก่อนเปลี่ยนมาใช้วิธี branch เพื่อไม่ให้ deploy สองวิธีพร้อมกัน

## ตั้งค่า Supabase แล้วเปิดเชื่อมต่อ

ไฟล์ `config.js` ใส่ URL โปรเจกต์และ Publishable key ตามข้อมูลที่ได้รับไว้แล้ว ค่าเริ่มต้นเป็น `connected: false` เพื่อให้เปิดตรวจหน้าเว็บได้โดยไม่เรียกฐานข้อมูลที่ยังไม่ได้ติดตั้ง

ให้ติดตั้ง Supabase ตามลำดับจาก ZIP ตั้งค่าแยกต่างหาก:

1. รัน `supabase/schema.sql` ใน SQL Editor เฉพาะการติดตั้งครั้งแรก หากมีตารางอยู่แล้ว ให้ตรวจและสำรองข้อมูลก่อน ห้ามลบตารางเพื่อฝืนรัน SQL
2. สร้างผู้ใช้คนแรกใน Authentication และเพิ่มโปรไฟล์ด้วย `supabase/bootstrap-admin.sql` หลังแทน UID ให้ถูกต้อง
3. ติดตั้ง Edge Function `manage-users` ด้วยโค้ดที่ให้มา เพื่อให้ admin เพิ่มผู้ใช้และรีเซ็ตรหัสผ่านผู้อื่นได้
4. เปิด `config.js` บน GitHub กดปุ่มแก้ไข แล้วเปลี่ยนเฉพาะบรรทัด:

```js
connected: false
```

เป็น:

```js
connected: true
```

5. กด **Commit changes** แล้วรอ GitHub Pages เผยแพร่ฉบับใหม่ จากนั้นเปิดหน้าเว็บไซต์และตรวจว่าป้ายก่อนเชื่อมต่อหายไป
6. ตั้ง Authentication Site URL ใน Supabase เป็น URL เว็บไซต์ที่ GitHub Pages แสดง แล้วลองเข้าสู่ระบบด้วย Username และรหัสผ่านที่คุณสร้าง

ห้ามใส่รหัสผ่าน, database password, `service_role` หรือ `sb_secret_...` ใน Repository แม้ Repository เป็น Private ก็ตาม ใช้ Supabase Auth และตรวจสิทธิ์ด้วย RLS ตามโค้ดที่ให้ไว้

## สิ่งที่ GitHub ทำและไม่ทำ

- **GitHub Repository:** เก็บไฟล์โค้ดที่คุณอัปโหลด
- **GitHub Pages:** ให้บริการ HTML/CSS/JavaScript/ภาพของหน้าเว็บ
- **Supabase:** เก็บข้อมูล ตรวจบัญชี อัปโหลดไฟล์ และประมวลผล Edge Function การอัปโหลดไฟล์เว็บไม่ได้สร้างฐานข้อมูลให้เอง

เมนูใช้ลิงก์แบบ `#/significance`, `#/announce` และ `#/newsletter` เพื่อให้เปิดและรีเฟรชหน้าภายในจาก GitHub Pages ได้ โดยไม่ต้องตั้งระบบ server routing และไม่ต้องใส่ชื่อ Repository ในโค้ด รูปและสคริปต์ใช้เส้นทางสัมพัทธ์ `./` เพื่อรองรับเว็บที่อยู่ใต้ชื่อ Repository

ชุดนี้ไม่ผูกโดเมน `pkjunior.nacc.obec.com` อัตโนมัติ ต้องมีสิทธิ์จากเจ้าของโดเมนก่อนจึงตั้ง DNS และ Custom domain ได้ จึงไม่ใส่ไฟล์ `CNAME` มาทับการตั้งค่าของคุณ

## ตรวจเมื่อเปิดแล้วมีปัญหา

- **เห็นเพียงไฟล์โค้ด:** คุณอยู่หน้า Repository ให้เปิด URL จากหน้า Settings → Pages แทน
- **404 หน้าแรก:** ตรวจว่า Pages ใช้ `main` / `/(root)` และ `index.html` อยู่ระดับบนสุด ไม่อยู่ในโฟลเดอร์ซ้อน
- **หน้าเว็บไม่มีสีหรือรูป:** ตรวจว่า `styles.css`, `assets/` และ `vendor/` อัปโหลดครบ และตัวสะกด/ตัวพิมพ์ใหญ่เล็กตรงกับชุดต้นฉบับ
- **เห็นป้ายก่อนเชื่อมต่อ:** เป็นสถานะตั้งใจเมื่อ `connected: false` ให้ตั้ง Supabase ก่อนเปลี่ยนค่าเป็น `true`
- **เข้าสู่ระบบหรือบันทึกไม่ได้:** ตรวจการสร้าง Auth user, แถวโปรไฟล์ `admin`, SQL และ RLS ตามคู่มือ ไม่ใช่ปัญหาที่แก้ด้วยการอัปโหลด SQL เข้า Repository
- **โค้ดแก้แล้วแต่หน้าเว็บยังเก่า:** ตรวจสถานะการเผยแพร่ล่าสุดใน GitHub Pages แล้วรีเฟรชหน้าเว็บแบบไม่ใช้แคช

## การทดสอบและขอบเขต

ตรวจชุดไฟล์โดยจำลองการเสิร์ฟทั้งที่ root และใต้โฟลเดอร์ `/pkjunior/` ซึ่งมีรูปแบบเส้นทางเหมือนเว็บ Project Pages พร้อมตรวจหน้าเดสก์ท็อปและมือถือ การตรวจนี้ไม่ใช่การยืนยันว่า Repository, DNS หรือฐานข้อมูลจริงของคุณติดตั้งแล้ว

ไม่ได้เปลี่ยนฐานข้อมูลจริง ไม่ได้สร้างบัญชีจริง และไม่ได้อัปโหลดเข้า GitHub ของคุณโดยอัตโนมัติ โครงสร้างฐานข้อมูลและระบบสิทธิ์ยังใช้ชุดเดิม ส่วนการปรับรอบนี้แยก ZIP หน้าเว็บกับ ZIP ตั้งค่า Supabase และย้าย CSV ตัวอย่างไปอยู่ใน assets เพื่อให้ชุดหน้าเว็บไม่พึ่งโฟลเดอร์ฐานข้อมูล
