# ไลบรารีและสื่อ

ไลบรารี JavaScript ด้านล่างถูกเก็บใน `vendor` เพื่อให้หน้าเว็บไม่ต้องโหลด JavaScript จาก CDN ขณะเปิดใช้งาน เวอร์ชันนี้เป็นเวอร์ชันที่ติดตั้งขณะจัดทำไฟล์ ควรตรวจและอัปเดตด้านความปลอดภัยตามรอบบำรุงรักษา

| ไลบรารี | เวอร์ชัน | หน้าที่ | License |
|---|---|---|---|
| @supabase/supabase-js | 2.109.0 | Database, Auth, Storage, Edge Functions client | MIT |
| DOMPurify | 3.4.17 | กรอง HTML จาก rich text | Apache-2.0 OR MPL-2.0 |
| Papa Parse | 5.7.0 | อ่าน CSV | MIT |
| Lucide | 1.62.0 | ไอคอนเส้น | ISC |

ข้อความใบอนุญาตจากแพ็กเกจรวมอยู่ใน `vendor/LICENSES.txt` ส่วน Supabase client อ้างอิงใบอนุญาตแพ็กเกจย่อยที่รวมใน bundle เพิ่มเติมในไฟล์เดียวกัน

## ตราหน่วยงาน

ไฟล์ตราทั้งหมดมาจาก Drive ID ที่ผู้ว่าจ้างระบุ ไม่ได้สร้างตราใหม่ และไม่ถือว่าโค้ดชุดนี้ให้สิทธิ์ใช้งานตราหน่วยงานแก่บุคคลอื่น ผู้เผยแพร่ต้องตรวจสิทธิ์ในการใช้ตราด้วยตนเอง

```text
assets/logo.png     1E3Sfzalpk46I9uOFhsnfWrBURGb8LsED
assets/footer-1.png 1pR3z3yqWvR0NWFXthGGAZi4wmCcWqSPP
assets/footer-2.png 1clHr-iDb4_yG-c51kNqArnSiPwzUfB9U
assets/footer-3.png 1Khty8Gu0LYuaC7ZYqXdh5J8aCut8g_3R
assets/footer-4.png 1E3Sfzalpk46I9uOFhsnfWrBURGb8LsED
assets/footer-5.png 1y1cSQLU2gnYCrHRN1LfwU6CE276URUHh
assets/footer-6.png 1RNTiCMiZ6FDOYPO9GEaYudMON6fZmxe8
```

## ฟอนต์และแผนที่

หน้าเว็บโหลด Noto Sans Thai และ Sarabun ผ่าน Google Fonts และใช้ Google Maps iframe พร้อมลิงก์เปิดแผนที่ภายนอก หากใช้งานในเครือข่ายที่บล็อกบริการเหล่านี้ ฟอนต์จะกลับไปใช้ sans-serif และควรเปิดแผนที่จากลิงก์ดูเส้นทางแทน
