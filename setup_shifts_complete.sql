-- ========================================
-- Shift System - Complete Setup
-- ========================================
-- รันไฟล์นี้ไฟล์เดียว - ทำทุกอย่างให้เสร็จ
-- ========================================

-- ขั้นตอนที่ 1: เพิ่ม column ใหม่
ALTER TABLE shifts 
ADD COLUMN IF NOT EXISTS grace_period_minutes INTEGER DEFAULT 15;

ALTER TABLE shifts 
ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0;

ALTER TABLE shifts 
ADD COLUMN IF NOT EXISTS color TEXT DEFAULT '#3B82F6';

-- ขั้นตอนที่ 2: สร้าง function ตรวจจับสาย
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

-- ขั้นตอนที่ 3: สร้าง trigger
DROP TRIGGER IF EXISTS trg_update_attendance_status ON time_records;
CREATE TRIGGER trg_update_attendance_status
    BEFORE INSERT OR UPDATE OF check_in, shift_id ON time_records
    FOR EACH ROW
    EXECUTE FUNCTION update_attendance_status();

-- ขั้นตอนที่ 4: สร้าง index
CREATE INDEX IF NOT EXISTS idx_shifts_active_order 
ON shifts(is_active, display_order) 
WHERE is_active = TRUE;

-- ขั้นตอนที่ 5: ลบกะเก่า (ถ้ามี)
DELETE FROM shifts WHERE name IN ('กะเช้า', 'กะกลางวัน', 'กะเย็น');

-- ขั้นตอนที่ 6: เพิ่มกะเช้า (เปิดร้าน)
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

-- ขั้นตอนที่ 7: เพิ่มกะกลางวัน
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

-- ขั้นตอนที่ 8: เพิ่มกะเย็น (ปิดร้าน)
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

-- ขั้นตอนที่ 9: ตรวจสอบผล
SELECT id, name, start_time, end_time, ot_start_time, ot_end_time, color, display_order
FROM shifts
WHERE is_active = TRUE
ORDER BY display_order;
