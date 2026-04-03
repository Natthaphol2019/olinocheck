-- ========================================
-- Seed 3 Shifts for Store Hours 09:30-21:30
-- ========================================
-- Run this AFTER shift_migration.sql
-- ========================================

-- Delete old shifts first (clean slate)
DELETE FROM shifts WHERE name IN ('กะเช้า', 'กะกลางวัน', 'กะเย็น');

-- กะเช้า (Morning) - เปิดร้าน
-- เวลา: 09:30 - 17:30 (8 ชั่วโมง)
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

-- กะกลางวัน (Mid) - กลางวัน
-- เวลา: 11:30 - 19:30 (8 ชั่วโมง)
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

-- กะเย็น (Evening) - ปิดร้าน
-- เวลา: 13:30 - 21:30 (8 ชั่วโมง)
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

-- Verify - should see 3 shifts
SELECT id, name, start_time, end_time, ot_start_time, ot_end_time, color, display_order
FROM shifts
WHERE is_active = TRUE
ORDER BY display_order;
