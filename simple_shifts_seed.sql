-- ========================================
-- Simple Shift System - Seed Data
-- ========================================
-- Creates 2 default shifts for employees to choose from
-- ========================================

-- Clear existing shifts (optional - remove if you want to keep old shifts)
-- DELETE FROM shifts;

-- Insert Morning Shift (9:30 - 19:30)
INSERT INTO shifts (name, start_time, end_time, ot_start_time, ot_end_time, grace_period_minutes, color, display_order, description, is_active)
VALUES (
    'กะเช้า',
    '09:30:00',
    '19:30:00',
    '19:30:00',
    '23:30:00',
    15,
    '#3B82F6',
    1,
    'กะเช้า: เข้างาน 09:30 - เลิกงาน 19:30 (OT 19:30-23:30)',
    TRUE
)
ON CONFLICT DO NOTHING;

-- Insert Evening Shift (11:30 - 21:30)
INSERT INTO shifts (name, start_time, end_time, ot_start_time, ot_end_time, grace_period_minutes, color, display_order, description, is_active)
VALUES (
    'กะเย็น',
    '11:30:00',
    '21:30:00',
    '21:30:00',
    '23:30:00',
    15,
    '#8B5CF6',
    2,
    'กะเย็น: เข้างาน 11:30 - เลิกงาน 21:30 (OT 21:30-23:30)',
    TRUE
)
ON CONFLICT DO NOTHING;

-- Verify shifts were created
SELECT id, name, start_time, end_time, ot_start_time, ot_end_time, color, display_order
FROM shifts
ORDER BY display_order;
