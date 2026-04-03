-- ========================================
-- Shift System Migration (Required First)
-- ========================================
-- Run this FIRST to add new columns to shifts table
-- ========================================

-- 1. Add new columns to shifts table
ALTER TABLE shifts 
ADD COLUMN IF NOT EXISTS grace_period_minutes INTEGER DEFAULT 15;

ALTER TABLE shifts 
ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0;

ALTER TABLE shifts 
ADD COLUMN IF NOT EXISTS color TEXT DEFAULT '#3B82F6';

-- 2. Create function to auto-detect late status
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

-- 3. Create trigger
DROP TRIGGER IF EXISTS trg_update_attendance_status ON time_records;
CREATE TRIGGER trg_update_attendance_status
    BEFORE INSERT OR UPDATE OF check_in, shift_id ON time_records
    FOR EACH ROW
    EXECUTE FUNCTION update_attendance_status();

-- 4. Create indexes
CREATE INDEX IF NOT EXISTS idx_shifts_active_order 
ON shifts(is_active, display_order) 
WHERE is_active = TRUE;
