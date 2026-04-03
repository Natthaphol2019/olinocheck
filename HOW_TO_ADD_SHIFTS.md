# 📋 วิธีเพิ่มกะงาน 3 กะ ใน Supabase

## ⚠️ สำคัญ - ต้องทำตามลำดับ!

ต้องรัน **2 ไฟล์** ตามลำดับนี้:

---

## 📝 ขั้นตอนที่ 1: เพิ่ม Column ใหม่ (รันครั้งแรกครั้งเดียว)

### เปิด Supabase SQL Editor:
1. เข้า https://supabase.com
2. เลือก Project ของคุณ
3. เมนูซ้าย → **SQL Editor**
4. คลิก **New query**

### Copy SQL นี้ไปรัน:

เปิดไฟล์: `shift_migration.sql`

หรือ Copy จากที่นี่:

```sql
-- เพิ่ม column ใหม่ให้ตาราง shifts
ALTER TABLE shifts 
ADD COLUMN IF NOT EXISTS grace_period_minutes INTEGER DEFAULT 15;

ALTER TABLE shifts 
ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0;

ALTER TABLE shifts 
ADD COLUMN IF NOT EXISTS color TEXT DEFAULT '#3B82F6';

-- สร้าง function ตรวจจับสายอัตโนมัติ
CREATE OR REPLACE FUNCTION update_attendance_status()
RETURNS TRIGGER AS $$
DECLARE
    shift_start TIME;
    grace_period INTEGER;
    check_in_time TIME;
BEGIN
    IF NEW.shift_id IS NOT NULL AND NEW.check_in IS NOT NULL THEN
        SELECT start_time, COALESCE(grace_period_minutes, 15)
        INTO shift_start, grace_period
        FROM shifts
        WHERE id = NEW.shift_id;
        
        IF shift_start IS NOT NULL THEN
            check_in_time := NEW.check_in::time;
            
            IF check_in_time > (shift_start + (grace_period || ' minutes')::interval)::time THEN
                NEW.status := 'late';
            ELSE
                NEW.status := 'normal';
            END IF;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- สร้าง trigger
DROP TRIGGER IF EXISTS trg_update_attendance_status ON time_records;
CREATE TRIGGER trg_update_attendance_status
    BEFORE INSERT OR UPDATE OF check_in, shift_id ON time_records
    FOR EACH ROW
    EXECUTE FUNCTION update_attendance_status();

-- สร้าง index
CREATE INDEX IF NOT EXISTS idx_shifts_active_order 
ON shifts(is_active, display_order) 
WHERE is_active = TRUE;
```

### กดปุ่ม "Run"

**ถ้าเห็น:** `Success. No rows returned` หรือ `SUCCESS` = ✅ สำเร็จ!

---

## 📝 ขั้นตอนที่ 2: เพิ่มกะงาน 3 กะ

### Copy SQL นี้ไปรัน:

เปิดไฟล์: `seed_3_shifts.sql`

หรือ Copy จากที่นี่:

```sql
-- ล้างกะเก่า (ถ้ามี)
DELETE FROM shifts WHERE name IN ('กะเช้า', 'กะกลางวัน', 'กะเย็น');

-- กะเช้า - เปิดร้าน
INSERT INTO shifts (name, start_time, end_time, ot_start_time, ot_end_time, grace_period_minutes, color, display_order, description, is_active)
VALUES (
    'กะเช้า',
    '09:30:00',
    '17:30:00',
    '17:30:00',
    '20:00:00',
    15,
    '#3B82F6',
    1,
    'กะเช้า: เปิดร้าน 09:30 - 17:30 (OT 17:30-20:00)',
    TRUE
);

-- กะกลางวัน
INSERT INTO shifts (name, start_time, end_time, ot_start_time, ot_end_time, grace_period_minutes, color, display_order, description, is_active)
VALUES (
    'กะกลางวัน',
    '11:30:00',
    '19:30:00',
    '19:30:00',
    '21:30:00',
    15,
    '#10B981',
    2,
    'กะกลางวัน: 11:30 - 19:30 (OT 19:30-21:30)',
    TRUE
);

-- กะเย็น - ปิดร้าน
INSERT INTO shifts (name, start_time, end_time, ot_start_time, ot_end_time, grace_period_minutes, color, display_order, description, is_active)
VALUES (
    'กะเย็น',
    '13:30:00',
    '21:30:00',
    '21:30:00',
    '23:30:00',
    15,
    '#8B5CF6',
    3,
    'กะเย็น: ปิดร้าน 13:30 - 21:30 (OT 21:30-23:30)',
    TRUE
);

-- ตรวจสอบ - ควรเห็น 3 แถว
SELECT id, name, start_time, end_time, ot_start_time, ot_end_time, color, display_order
FROM shifts
WHERE is_active = TRUE
ORDER BY display_order;
```

### กดปุ่ม "Run"

**ควรเห็นผลลัพธ์เป็น 3 แถว:**
```
name      | start_time | end_time | ot_start_time | ot_end_time
----------|------------|----------|---------------|------------
กะเช้า     | 09:30:00   | 17:30:00 | 17:30:00      | 20:00:00
กะกลางวัน  | 11:30:00   | 19:30:00 | 19:30:00      | 21:30:00
กะเย็น     | 13:30:00   | 21:30:00 | 21:30:00      | 23:30:00
```

✅ = **สำเร็จแล้ว!**

---

## 🕐 กะงาน 3 กะ

### **1. กะเช้า** (สีน้ำเงิน 🔵)
```
เปิดร้าน:  09:30 น.
เลิกงาน:   17:30 น. (8 ชม.)
OT:        17:30 - 20:00 น.
สายหลัง:   09:45 น.
```

### **2. กะกลางวัน** (สีเขียว 🟢)
```
เข้างาน:   11:30 น.
เลิกงาน:   19:30 น. (8 ชม.)
OT:        19:30 - 21:30 น.
สายหลัง:   11:45 น.
```

### **3. กะเย็น** (สีม่วง 🟣)
```
เข้างาน:   13:30 น.
ปิดร้าน:   21:30 น. (8 ชม.)
OT:        21:30 - 23:30 น.
สายหลัง:   13:45 น.
```

---

## 🎯 ร้านเปิด 09:30-21:30

```
เวลา        กะเช้า    กะกลางวัน  กะเย็น
09:30       🔵 เข้า
11:30                   🟢 เข้า
13:30                               🟣 เข้า
17:30       🔵 ออก   🟢 ทำงานต่อ   🟣 ทำงาน
19:30                🟢 ออก         🟣 ทำงาน
21:30                              🟣 ออก
```

**ครอบคลุมทั้งหมด:**
- 🔵 กะเช้า: เปิดร้าน 09:30
- 🟢 กะกลางวัน: ทำงานตอนกลางวัน
- 🟣 กะเย็น: ปิดร้าน 21:30

---

## ✅ ตรวจสอบว่าสำเร็จ

### วิธีที่ 1: ดูในเว็บ
```
1. เข้า http://localhost:5173
2. Login เป็นพนักงาน
3. เปิดหน้า เช็คอิน/เอาท์
4. ควรเห็น Card 3 ใบ:
   🔵 กะเช้า
   🟢 กะกลางวัน
   🟣 กะเย็น
```

### วิธีที่ 2: SQL Query
```sql
SELECT name, start_time, end_time FROM shifts ORDER BY display_order;
```

ควรเห็น:
```
name       | start_time | end_time
-----------|------------|----------
กะเช้า      | 09:30:00   | 17:30:00
กะกลางวัน   | 11:30:00   | 19:30:00
กะเย็น      | 13:30:00   | 21:30:00
```

---

## ❓ แก้ปัญหา

### **Error: column "grace_period_minutes" does not exist**
```
→ ต้องรัน shift_migration.sql ก่อน!
→ เพิ่ม column ใหม่ให้ตาราง shifts
```

### **Error: relation "shifts" does not exist**
```
→ ตาราง shifts ยังไม่มี
→ รันไฟล์ shifts_migration.sql ก่อน
```

### **ไม่เห็นกะงานในเว็บ**
```
1. เช็ค shifts.is_active = TRUE
2. Refresh หน้าเว็บ
3. เช็ค console มี error ไหม
```

---

## 📁 ไฟล์ SQL

1. **shift_migration.sql** - เพิ่ม column + trigger (รันครั้งแรก)
2. **seed_3_shifts.sql** - เพิ่มกะ 3 กะ (รันหลังจากไฟล์แรก)

**ลำดับ:**
```
1. shift_migration.sql  ✅
2. seed_3_shifts.sql    ✅
3. เสร็จ!                🎉
```
