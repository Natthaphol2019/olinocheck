-- ========================================
-- Shift System Improvement Migration
-- ========================================
-- This migration:
-- 1. Creates trigger to auto-detect late status
-- 2. Adds grace period configuration
-- 3. Adds default shift assignment for new employees
-- ========================================

-- 1. Add grace period column to shifts (default 15 minutes)
ALTER TABLE shifts 
ADD COLUMN IF NOT EXISTS grace_period_minutes INTEGER DEFAULT 15;

-- 2. Add display_order for sorting shifts
ALTER TABLE shifts 
ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0;

-- 3. Add color field for UI display
ALTER TABLE shifts 
ADD COLUMN IF NOT EXISTS color TEXT DEFAULT '#3B82F6';

-- 4. Create function to auto-detect late status
CREATE OR REPLACE FUNCTION update_attendance_status()
RETURNS TRIGGER AS $$
DECLARE
    shift_start TIME;
    grace_period INTEGER;
    check_in_time TIME;
BEGIN
    -- Only process if shift_id is set
    IF NEW.shift_id IS NOT NULL AND NEW.check_in IS NOT NULL THEN
        -- Get shift start time and grace period
        SELECT start_time, COALESCE(grace_period_minutes, 15)
        INTO shift_start, grace_period
        FROM shifts
        WHERE id = NEW.shift_id;
        
        IF shift_start IS NOT NULL THEN
            -- Get check-in time
            check_in_time := NEW.check_in::time;
            
            -- Calculate allowed time (shift start + grace period)
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

-- 5. Create trigger to auto-update status on check-in
DROP TRIGGER IF EXISTS trg_update_attendance_status ON time_records;
CREATE TRIGGER trg_update_attendance_status
    BEFORE INSERT OR UPDATE OF check_in, shift_id ON time_records
    FOR EACH ROW
    EXECUTE FUNCTION update_attendance_status();

-- 6. Create function to auto-assign default shift to new employees
CREATE OR REPLACE FUNCTION assign_default_shift_to_new_employee()
RETURNS TRIGGER AS $$
DECLARE
    default_shift_id UUID;
BEGIN
    -- Try to find active "Morning" or "Normal" shift
    SELECT id INTO default_shift_id
    FROM shifts
    WHERE (name ILIKE '%morning%' OR name ILIKE '%normal%' OR name ILIKE '%เช้า%')
      AND is_active = TRUE
    ORDER BY display_order
    LIMIT 1;
    
    -- If no matching shift, get first active shift
    IF default_shift_id IS NULL THEN
        SELECT id INTO default_shift_id
        FROM shifts
        WHERE is_active = TRUE
        ORDER BY display_order
        LIMIT 1;
    END IF;
    
    -- Assign shift if found
    IF default_shift_id IS NOT NULL THEN
        INSERT INTO employee_shifts (employee_id, shift_id, start_date, is_active)
        VALUES (NEW.id, default_shift_id, CURRENT_DATE, TRUE)
        ON CONFLICT DO NOTHING;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 7. Create trigger to auto-assign shift on employee creation
DROP TRIGGER IF EXISTS trg_assign_default_shift ON employees;
CREATE TRIGGER trg_assign_default_shift
    AFTER INSERT ON employees
    FOR EACH ROW
    EXECUTE FUNCTION assign_default_shift_to_new_employee();

-- 8. Update existing shifts with better defaults
UPDATE shifts SET 
    color = '#3B82F6',  -- Blue
    display_order = 1,
    grace_period_minutes = 15
WHERE name ILIKE '%morning%' OR name ILIKE '%เช้า%';

UPDATE shifts SET 
    color = '#8B5CF6',  -- Purple
    display_order = 2,
    grace_period_minutes = 15
WHERE name ILIKE '%evening%' OR name ILIKE '%เย็น%';

-- 9. Create view for easy shift querying
CREATE OR REPLACE VIEW employee_current_shifts AS
SELECT 
    e.id AS employee_id,
    e.name AS employee_name,
    e.role,
    d.name AS department_name,
    s.id AS shift_id,
    s.name AS shift_name,
    s.start_time,
    s.end_time,
    s.ot_start_time,
    s.ot_end_time,
    s.color,
    es.start_date,
    es.end_date
FROM employees e
LEFT JOIN departments d ON e.department_id = d.id
LEFT JOIN employee_shifts es ON e.id = es.employee_id AND es.is_active = TRUE
    AND (es.end_date IS NULL OR es.end_date >= CURRENT_DATE)
    AND es.start_date <= CURRENT_DATE
LEFT JOIN shifts s ON es.shift_id = s.id AND s.is_active = TRUE
WHERE e.is_active = TRUE;

-- 10. Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_employee_shifts_active 
ON employee_shifts(employee_id, is_active) 
WHERE is_active = TRUE;

CREATE INDEX IF NOT EXISTS idx_shifts_active_order 
ON shifts(is_active, display_order) 
WHERE is_active = TRUE;

-- ========================================
-- Comments
-- ========================================
COMMENT ON COLUMN shifts.grace_period_minutes IS 'Minutes allowed after shift start before marked as late';
COMMENT ON COLUMN shifts.display_order IS 'Order to display shifts in UI (lower = first)';
COMMENT ON COLUMN shifts.color IS 'Hex color code for UI display';
COMMENT ON FUNCTION update_attendance_status() IS 'Automatically sets status to late/normal based on shift start time';
COMMENT ON FUNCTION assign_default_shift_to_new_employee() IS 'Auto-assigns default shift when new employee is created';
COMMENT ON VIEW employee_current_shifts IS 'Shows current active shift for each employee';
