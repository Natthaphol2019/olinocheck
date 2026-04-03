# 🔄 Git + Deploy Workflow

## ✅ Workflow ที่ดี

### กฎง่ายๆ: **พัฒนาเสร็จ → Commit → Push → Deploy**

ทุกครั้งที่คุณเขียนโค้ดเสร็จ ควรทำแบบนี้:

---

## 🚀 วิธีที่ 1: ใช้ Script (ง่ายที่สุด)

### ดับเบิลคลิกไฟล์นี้:
```
commit-deploy.bat
```

จะทำให้อัตโนมัติ:
1. ✅ เพิ่มไฟล์ทั้งหมด (`git add .`)
2. ✅ Commit พร้อมข้อความ (`git commit -m "..."`)
3. ✅ Push ขึ้น GitHub (`git push`)
4. ✅ Deploy ไป Vercel (`vercel --prod`)

---

## 💻 วิธีที่ 2: ใช้คำสั่งเอง (แนะนำ)

### ขั้นตอนที่ 1: เช็คการเปลี่ยนแปลง
```bash
git status
```

### ขั้นตอนที่ 2: ดูว่าแก้อะไรไปบ้าง
```bash
git diff
```

### ขั้นตอนที่ 3: เพิ่มไฟล์
```bash
git add .
```
(หรือระบุไฟล์: `git add filename.js`)

### ขั้นตอนที่ 4: Commit
```bash
git commit -m "feat: เพิ่มระบบ login"
```

**ตัวอย่างข้อความ Commit ที่ดี:**
```
feat: เพิ่มระบบ login ด้วย PIN
fix: แก้ไข error ในหน้า dashboard
update: ปรับปรุง UI ของหน้า reports
chore: อัพเดท dependencies
```

### ขั้นตอนที่ 5: Push ขึ้น GitHub
```bash
git push origin main
```

### ขั้นตอนที่ 6: Deploy ไป Vercel
```bash
npm run deploy
```
หรือ
```bash
vercel --prod
```

---

## 🎯 รวมคำสั่งในบรรทัดเดียว

### Commit + Push + Deploy
```bash
git add . && git commit -m "Update" && git push origin main && npm run deploy
```

---

## 📝 Commit Message Convention

ใช้ prefix เหล่านี้เพื่อให้เข้าใจง่าย:

| Prefix | ความหมาย | ตัวอย่าง |
|--------|----------|----------|
| `feat:` | ฟีเจอร์ใหม่ | `feat: เพิ่มระบบ login` |
| `fix:` | แก้ไข bug | `fix: แก้ไข error หน้า dashboard` |
| `docs:` | เอกสาร | `docs: เพิ่มคู่มือ deploy` |
| `style:` | จัดรูปแบบโค้ด | `style: จัด indentation` |
| `refactor:` | ปรับโครงสร้าง | `refactor: แยก component` |
| `perf:` | ปรับปรุงประสิทธิภาพ | `perf: ลดขนาด bundle` |
| `test:` | เพิ่ม/แก้ไข test | `test: เพิ่ม unit tests` |
| `chore:` | ปรับปรุงทั่วไป | `chore: อัพเดท dependencies` |

---

## 🔄 Auto-Deploy จาก GitHub

### ตั้งค่าครั้งเดียว:

1. **Push ขึ้น GitHub**
   ```bash
   git push origin main
   ```

2. **Vercel จะ Deploy อัตโนมัติ**
   - ทุกครั้งที่ push ไป `main` branch
   - ไม่ต้องรันคำสั่ง deploy เอง

3. **ดูสถานะ Deploy**
   - เข้า Vercel Dashboard
   - ดู Deployments tab

### ข้อดีของ Auto-Deploy:
✅ ไม่ต้องรันคำสั่ง deploy เอง  
✅ ทุก commit มี version บน Vercel  
✅ ดู preview ได้ทุก commit  
✅ Rollback ง่าย

---

## ⚠️ ข้อควรระวัง

### 1. **อย่า Commit .env.local**
```bash
# เช็คก่อน commit
git status

# ถ้าเห็น .env.local ให้ลบออก
git rm --cached .env.local
```

### 2. **ทดสอบก่อน Deploy**
```bash
# Build ทดสอบก่อน
npm run build

# Preview ดูว่าทำงานปกติไหม
npm run preview
```

### 3. **Commit บ่อยๆ**
- เสร็จฟีเจอร์เล็กๆ ก็ commit ได้
- ไม่ต้องรอให้เสร็จทั้งหมด
- ทำให้ rollback ง่าย

---

## 📊 Workflow Summary

```
┌─────────────────┐
│  เขียนโค้ด      │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  git add .      │ ← เพิ่มไฟล์
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  git commit     │ ← บันทึกการเปลี่ยนแปลง
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  git push       │ ← อัปโหลดขึ้น GitHub
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  npm run deploy │ ← Deploy ไป Vercel
└─────────────────┘
```

---

## 🎯 Quick Commands

### คำสั่งเดียวเสร็จ:
```bash
# ใช้ script
commit-deploy.bat

# หรือใช้คำสั่งเอง
git add . && git commit -m "Update" && git push && npm run deploy
```

### เฉพาะ Commit + Push (ไม่ Deploy):
```bash
git add . && git commit -m "Update" && git push
```

### Deploy เฉพาะ Build:
```bash
npm run build && vercel --prod
```

---

## 📞 ตัวอย่างจริง

### หลังจากแก้ bug หน้า login:

```bash
git add .
git commit -m "fix: แก้ไข error validation หน้า login"
git push origin main
npm run deploy
```

### หลังจากเพิ่มฟีเจอร์ใหม่:

```bash
git add .
git commit -m "feat: เพิ่มระบบ export CSV"
git push origin main
npm run deploy
```

---

## 🎉 สรุป

**ควรทำทุกครั้ง:**
1. ✅ พัฒนาเสร็จ
2. ✅ `git add .`
3. ✅ `git commit -m "ข้อความอธิบาย"`
4. ✅ `git push origin main`
5. ✅ `npm run deploy` (หรือใช้ `commit-deploy.bat`)

**หรือตั้งค่า Auto-Deploy:**
- Push ครั้งเดียว → Vercel deploy อัตโนมัติ

**ทุกอย่างพร้อมแล้ว!** 🚀
