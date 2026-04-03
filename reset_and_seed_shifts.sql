-- ========================================
-- ลบกะเก่าทั้งหมด + เพิ่มกะใหม่ 3 กะ
-- ========================================
-- รันไฟล์นี้เพื่อล้างกะเก่าและสร้างใหม่
-- ========================================

-- 1. ลบกะงานทั้งหมด (DELETE ALL)
DELETE FROM shifts;

-- 2. รีเซ็ต auto-increment (ถ้ามี)
ALTER SEQUENCE IF EXISTS shifts_id_seq RESTART WITH 1;

-- 3. เพิ่มกะเช้า (เปิดร้าน 09:30-19:30)
INSERT INTO shifts (
    name, 
    start_time, 
    end_time, 
    ot_start_time, 
    ot_end_time, 
    grace_period_minutes, 
    color, 
    display_order, 
    description, 
    is_active
)
VALUES (
    'กะเช้า',
    '09:30:00',
    '19:30:00',
    '19:30:00',
    '21:30:00',
    15,
    '#3B82F6',
    1,
    'กะเช้า: เปิดร้าน 09:30 - 19:30 (OT 19:30-21:30)',
    TRUE
);

-- 4. เพิ่มกะบ่าย (กลางวัน 11:30-21:30)
INSERT INTO shifts (
    name, 
    start_time, 
    end_time, 
    ot_start_time, 
    ot_end_time, 
    grace_period_minutes, 
    color, 
    display_order, 
    description, 
    is_active
)
VALUES (
    'กะบ่าย',
    '11:30:00',
    '21:30:00',
    '21:30:00',
    '23:30:00',
    15,
    '#10B981',
    2,
    'กะบ่าย: 11:30 - 21:30 (OT 21:30-23:30)',
    TRUE
);

-- 5. เพิ่มกะเช้า + OT (09:30-17:30 + OT)
INSERT INTO shifts (
    name, 
    start_time, 
    end_time, 
    ot_start_time, 
    ot_end_time, 
    grace_period_minutes, 
    color, 
    display_order, 
    description, 
    is_active
)
VALUES (
    'กะเช้า + OT',
    '09:30:00',
    '17:30:00',
    '17:30:00',
    '21:30:00',
    15,
    '#8B5CF6',
    3,
    'กะเช้า + OT: 09:30 - 17:30 (OT 17:30-21:30)',
    TRUE
);

-- 6. ตรวจสอบผล - ควรเห็น 3 แถว
SELECT 
    id, 
    name, 
    start_time, 
    end_time, 
    ot_start_time, 
    ot_end_time, 
    grace_period_minutes,
    color, 
    display_order
FROM shifts
WHERE is_active = TRUE
ORDER BY display_order;
