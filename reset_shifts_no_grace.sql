-- ========================================
-- ลบ grace period + เพิ่มกะใหม่ 3 กะ
-- ========================================
-- ไม่มีการนับ "สาย" อีกต่อไป - ตรงเวลาทุกคน
-- ========================================

-- 1. เปลี่ยน default grace_period_minutes เป็น 0 (ไม่มีการสาย)
ALTER TABLE shifts 
ALTER COLUMN grace_period_minutes SET DEFAULT 0;

-- 2. ลบกะเก่าทั้งหมด
DELETE FROM shifts;

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
    0,
    '#3B82F6',
    1,
    'กะเช้า: เปิดร้าน 09:30 - 19:30 (OT 19:30-21:30)',
    TRUE
);

-- 4. เพิ่มกะบ่าย (11:30-21:30)
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
    0,
    '#10B981',
    2,
    'กะบ่าย: 11:30 - 21:30 (OT 21:30-23:30)',
    TRUE
);

-- 5. เพิ่มกะเช้า + OT (09:30-17:30)
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
    0,
    '#8B5CF6',
    3,
    'กะเช้า + OT: 09:30 - 17:30 (OT 17:30-21:30)',
    TRUE
);

-- 6. ตรวจสอบผล
SELECT 
    name, 
    start_time, 
    end_time, 
    ot_start_time, 
    ot_end_time,
    grace_period_minutes,
    color, 
    display_order
FROM shifts
ORDER BY display_order;
