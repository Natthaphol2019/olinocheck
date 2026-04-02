-- ============================================
-- WORK SHIFTS MIGRATION
-- ============================================
-- Run this in Supabase SQL Editor

-- Create shifts table
CREATE TABLE IF NOT EXISTS shifts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    ot_start_time TIME,  -- When OT starts (optional)
    ot_end_time TIME,    -- When OT ends (optional)
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create employee_shifts table (assign employees to shifts)
CREATE TABLE IF NOT EXISTS employee_shifts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    shift_id UUID NOT NULL REFERENCES shifts(id) ON DELETE CASCADE,
    start_date DATE NOT NULL,
    end_date DATE,  -- NULL = indefinite
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    UNIQUE(employee_id, shift_id, start_date)
);

-- Add shift_id to time_records (to track which shift was worked)
ALTER TABLE time_records 
ADD COLUMN IF NOT EXISTS shift_id UUID REFERENCES shifts(id);

-- Add ot_hours to time_records (auto-calculated)
ALTER TABLE time_records 
ADD COLUMN IF NOT EXISTS ot_hours NUMERIC(4,2) DEFAULT 0;

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_shifts_active ON shifts(is_active);
CREATE INDEX IF NOT EXISTS idx_employee_shifts_employee ON employee_shifts(employee_id);
CREATE INDEX IF NOT EXISTS idx_employee_shifts_shift ON employee_shifts(shift_id);
CREATE INDEX IF NOT EXISTS idx_time_records_shift ON time_records(shift_id);

-- ============================================
-- INSERT DEFAULT SHIFTS (BEFORE RLS)
-- ============================================
INSERT INTO shifts (name, start_time, end_time, ot_start_time, ot_end_time, description) VALUES
  ('กะเช้า (Morning Shift)', '09:30', '19:30', '19:30', '21:30', 'กะเช้า - เวลาทำงาน 09:30-19:30, OT ได้ถึง 21:30'),
  ('กะบ่าย (Evening Shift)', '11:30', '21:30', '21:30', '23:30', 'กะบ่าย - เวลาทำงาน 11:30-21:30, OT ได้ถึง 23:30')
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- CREATE FUNCTIONS
-- ============================================

-- Create function to calculate OT hours
CREATE OR REPLACE FUNCTION calculate_ot_hours(
    p_check_in TIMESTAMP WITH TIME ZONE,
    p_check_out TIMESTAMP WITH TIME ZONE,
    p_shift_id UUID
) RETURNS NUMERIC AS $$
DECLARE
    v_shift_start TIME;
    v_shift_end TIME;
    v_ot_end TIME;
    v_check_out_time TIME;
    v_ot_hours NUMERIC;
BEGIN
    -- Get shift times
    SELECT start_time, end_time, ot_end_time 
    INTO v_shift_start, v_shift_end, v_ot_end
    FROM shifts 
    WHERE id = p_shift_id;
    
    -- If no shift found, return 0
    IF v_shift_end IS NULL THEN
        RETURN 0;
    END IF;
    
    -- Get check-out time
    v_check_out_time := p_check_out::time;
    
    -- Calculate OT hours (time worked after shift end)
    IF v_check_out_time > v_shift_end THEN
        -- Check if OT is within allowed OT time
        IF v_ot_end IS NOT NULL AND v_check_out_time > v_ot_end THEN
            v_check_out_time := v_ot_end;
        END IF;
        
        -- Calculate hours between shift end and check-out
        v_ot_hours := EXTRACT(EPOCH FROM (
            TIMESTAMP '2000-01-01 ' || v_check_out_time - 
            TIMESTAMP '2000-01-01 ' || v_shift_end
        )) / 3600;
        
        RETURN ROUND(v_ot_hours::numeric, 2);
    END IF;
    
    RETURN 0;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-calculate OT on time_records insert/update
CREATE OR REPLACE FUNCTION update_ot_hours()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.check_out IS NOT NULL AND NEW.shift_id IS NOT NULL THEN
        NEW.ot_hours := calculate_ot_hours(NEW.check_in, NEW.check_out, NEW.shift_id);
    ELSE
        NEW.ot_hours := 0;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_update_ot_hours ON time_records;
CREATE TRIGGER trg_update_ot_hours
    BEFORE INSERT OR UPDATE ON time_records
    FOR EACH ROW
    EXECUTE FUNCTION update_ot_hours();

-- ============================================
-- RLS POLICIES (ENABLE AFTER DATA INSERT)
-- ============================================

-- Enable RLS
ALTER TABLE shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_shifts ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Everyone can view shifts" ON shifts;
DROP POLICY IF EXISTS "HR/Admin can manage shifts" ON shifts;
DROP POLICY IF EXISTS "Employees can view own shifts" ON employee_shifts;
DROP POLICY IF EXISTS "HR/Admin can view all shifts" ON employee_shifts;
DROP POLICY IF EXISTS "HR/Admin can manage shifts" ON employee_shifts;

-- Everyone can view shifts
CREATE POLICY "Everyone can view shifts"
    ON shifts FOR SELECT
    USING (true);

-- HR/Admin can manage shifts
CREATE POLICY "HR/Admin can manage shifts"
    ON shifts FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM employees e
            WHERE e.auth_user_id = auth.uid()
            AND e.role IN ('hr', 'admin')
        )
    );

-- Employees can view their own shift assignments
CREATE POLICY "Employees can view own shifts"
    ON employee_shifts FOR SELECT
    USING (
        employee_id IN (
            SELECT id FROM employees WHERE auth_user_id = auth.uid()
        )
    );

-- HR/Admin can view all shift assignments
CREATE POLICY "HR/Admin can view all shifts"
    ON employee_shifts FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM employees e
            WHERE e.auth_user_id = auth.uid()
            AND e.role IN ('hr', 'admin')
        )
    );

-- HR/Admin can manage shift assignments
CREATE POLICY "HR/Admin can manage shifts"
    ON employee_shifts FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM employees e
            WHERE e.auth_user_id = auth.uid()
            AND e.role IN ('hr', 'admin')
        )
    );

-- ============================================
-- Sample: Assign all employees to Morning Shift
-- ============================================
-- Uncomment to assign all current employees to Morning Shift
-- INSERT INTO employee_shifts (employee_id, shift_id, start_date)
-- SELECT id, (SELECT id FROM shifts WHERE name LIKE '%Morning%'), CURRENT_DATE
-- FROM employees
-- ON CONFLICT (employee_id, shift_id, start_date) DO NOTHING;
