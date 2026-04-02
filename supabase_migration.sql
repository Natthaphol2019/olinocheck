-- ============================================
-- Employee Attendance System - Supabase Migration
-- ============================================
-- IMPORTANT: Run this in TWO parts:
-- 
-- PART 1 (Lines 1-430): Run in SQL Editor
--   - Copy lines 1-430 and paste into SQL Editor
--   - Click "Run" to create tables, RLS policies, and functions
--
-- PART 2 (Storage): Run separately
--   - Option A: Use Supabase Dashboard → Storage → attendance → Policies
--   - Option B: Run storage_policies.sql file separately
--
-- For detailed instructions, see QUICKSTART.md
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- DEPARTMENTS TABLE
-- ============================================
CREATE TABLE departments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- ============================================
-- EMPLOYEES TABLE
-- ============================================
CREATE TABLE employees (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    pin_hash TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('employee', 'supervisor', 'hr', 'admin')),
    department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
    is_active BOOLEAN DEFAULT TRUE,
    auth_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    UNIQUE(auth_user_id)
);

-- Index for faster lookups
CREATE INDEX idx_employees_auth_user_id ON employees(auth_user_id);
CREATE INDEX idx_employees_role ON employees(role);
CREATE INDEX idx_employees_department_id ON employees(department_id);

-- ============================================
-- TIME RECORDS TABLE
-- ============================================
CREATE TABLE time_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    check_in TIMESTAMP WITH TIME ZONE,
    check_out TIMESTAMP WITH TIME ZONE,
    check_in_image TEXT,
    check_out_image TEXT,
    lat FLOAT,
    lng FLOAT,
    work_type TEXT CHECK (work_type IN ('office', 'wfh', 'field')),
    status TEXT DEFAULT 'normal' CHECK (status IN ('normal', 'absent', 'late')),
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    UNIQUE(employee_id, date)
);

-- Indexes for faster queries
CREATE INDEX idx_time_records_employee_id ON time_records(employee_id);
CREATE INDEX idx_time_records_date ON time_records(date);
CREATE INDEX idx_time_records_employee_date ON time_records(employee_id, date);

-- ============================================
-- REQUESTS TABLE (Time Correction, Retroactive Check-in/out)
-- ============================================
CREATE TABLE requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('time_correction', 'retroactive_checkin', 'retroactive_checkout')),
    reason TEXT NOT NULL,
    request_date DATE NOT NULL,
    requested_time TIME,
    file_url TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    approved_by UUID REFERENCES employees(id) ON DELETE SET NULL,
    approved_at TIMESTAMP WITH TIME ZONE,
    rejection_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Indexes
CREATE INDEX idx_requests_employee_id ON requests(employee_id);
CREATE INDEX idx_requests_status ON requests(status);
CREATE INDEX idx_requests_approved_by ON requests(approved_by);

-- ============================================
-- OVERTIME TABLE
-- ============================================
CREATE TABLE overtime (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    reason TEXT NOT NULL,
    hours NUMERIC(4,2) NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    approved_by UUID REFERENCES employees(id) ON DELETE SET NULL,
    approved_at TIMESTAMP WITH TIME ZONE,
    rejection_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Indexes
CREATE INDEX idx_overtime_employee_id ON overtime(employee_id);
CREATE INDEX idx_overtime_date ON overtime(date);
CREATE INDEX idx_overtime_status ON overtime(status);

-- ============================================
-- LEAVE REQUESTS TABLE (7 Types)
-- ============================================
CREATE TABLE leave_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    leave_type TEXT NOT NULL CHECK (leave_type IN ('annual', 'sick', 'personal', 'maternity', 'paternity', 'bereavement', 'unpaid')),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    reason TEXT NOT NULL,
    file_url TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    approved_by UUID REFERENCES employees(id) ON DELETE SET NULL,
    approved_at TIMESTAMP WITH TIME ZONE,
    rejection_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    CONSTRAINT valid_date_range CHECK (end_date >= start_date)
);

-- Indexes
CREATE INDEX idx_leave_requests_employee_id ON leave_requests(employee_id);
CREATE INDEX idx_leave_requests_status ON leave_requests(status);
CREATE INDEX idx_leave_requests_dates ON leave_requests(start_date, end_date);

-- ============================================
-- STORAGE BUCKET SETUP
-- ============================================
-- Create storage bucket for attendance images
INSERT INTO storage.buckets (id, name, public) 
VALUES ('attendance', 'attendance', true)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================

-- Enable RLS on all tables
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE overtime ENABLE ROW LEVEL SECURITY;
ALTER TABLE leave_requests ENABLE ROW LEVEL SECURITY;

-- ============================================
-- DEPARTMENTS RLS POLICIES
-- ============================================
-- Everyone can read departments
CREATE POLICY "Everyone can view departments"
    ON departments FOR SELECT
    USING (true);

-- Only HR/Admin can insert/update/delete departments
CREATE POLICY "HR/Admin can manage departments"
    ON departments FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM employees 
            WHERE employees.auth_user_id = auth.uid() 
            AND employees.role IN ('hr', 'admin')
        )
    );

-- ============================================
-- EMPLOYEES RLS POLICIES
-- ============================================
-- Employees can see their own record
CREATE POLICY "Employees can view own record"
    ON employees FOR SELECT
    USING (auth.uid() = auth_user_id);

-- Supervisors can see their team (same department)
CREATE POLICY "Supervisors can view team"
    ON employees FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM employees e 
            WHERE e.auth_user_id = auth.uid() 
            AND e.role IN ('supervisor', 'hr', 'admin')
            AND (e.role IN ('hr', 'admin') OR e.department_id = employees.department_id)
        )
    );

-- HR/Admin can see all employees
CREATE POLICY "HR/Admin can view all employees"
    ON employees FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM employees 
            WHERE employees.auth_user_id = auth.uid() 
            AND employees.role IN ('hr', 'admin')
        )
    );

-- Only HR/Admin can insert/update/delete employees
CREATE POLICY "HR/Admin can manage employees"
    ON employees FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM employees 
            WHERE employees.auth_user_id = auth.uid() 
            AND employees.role IN ('hr', 'admin')
        )
    );

-- ============================================
-- TIME RECORDS RLS POLICIES
-- ============================================
-- Employees can see their own time records
CREATE POLICY "Employees can view own time records"
    ON time_records FOR SELECT
    USING (employee_id IN (
        SELECT id FROM employees WHERE auth_user_id = auth.uid()
    ));

-- Supervisors can see their team's time records
CREATE POLICY "Supervisors can view team time records"
    ON time_records FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM employees e 
            WHERE e.auth_user_id = auth.uid() 
            AND e.role IN ('supervisor', 'hr', 'admin')
            AND (e.role IN ('hr', 'admin') OR e.department_id = time_records.employee_id)
        )
    );

-- HR/Admin can see all time records
CREATE POLICY "HR/Admin can view all time records"
    ON time_records FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM employees 
            WHERE employees.auth_user_id = auth.uid() 
            AND employees.role IN ('hr', 'admin')
        )
    );

-- Employees can insert their own time records (check-in/out)
CREATE POLICY "Employees can insert own time records"
    ON time_records FOR INSERT
    WITH CHECK (employee_id IN (
        SELECT id FROM employees WHERE auth_user_id = auth.uid()
    ));

-- Employees can update their own time records (check-out)
CREATE POLICY "Employees can update own time records"
    ON time_records FOR UPDATE
    USING (employee_id IN (
        SELECT id FROM employees WHERE auth_user_id = auth.uid()
    ));

-- HR/Admin can manage all time records
CREATE POLICY "HR/Admin can manage all time records"
    ON time_records FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM employees 
            WHERE employees.auth_user_id = auth.uid() 
            AND employees.role IN ('hr', 'admin')
        )
    );

-- ============================================
-- REQUESTS RLS POLICIES
-- ============================================
-- Employees can see their own requests
CREATE POLICY "Employees can view own requests"
    ON requests FOR SELECT
    USING (employee_id IN (
        SELECT id FROM employees WHERE auth_user_id = auth.uid()
    ));

-- Supervisors can see pending requests from their team
CREATE POLICY "Supervisors can view team pending requests"
    ON requests FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM employees e 
            WHERE e.auth_user_id = auth.uid() 
            AND e.role IN ('supervisor', 'hr', 'admin')
            AND (e.role IN ('hr', 'admin') OR e.department_id = requests.employee_id)
        )
        AND status = 'pending'
    );

-- HR/Admin can see all requests
CREATE POLICY "HR/Admin can view all requests"
    ON requests FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM employees 
            WHERE employees.auth_user_id = auth.uid() 
            AND employees.role IN ('hr', 'admin')
        )
    );

-- Employees can insert their own requests
CREATE POLICY "Employees can insert own requests"
    ON requests FOR INSERT
    WITH CHECK (employee_id IN (
        SELECT id FROM employees WHERE auth_user_id = auth.uid()
    ));

-- Supervisors/HR/Admin can update requests (approve/reject)
CREATE POLICY "Supervisors/HR/Admin can update requests"
    ON requests FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM employees e 
            WHERE e.auth_user_id = auth.uid() 
            AND e.role IN ('supervisor', 'hr', 'admin')
        )
    );

-- ============================================
-- OVERTIME RLS POLICIES
-- ============================================
-- Employees can see their own overtime
CREATE POLICY "Employees can view own overtime"
    ON overtime FOR SELECT
    USING (employee_id IN (
        SELECT id FROM employees WHERE auth_user_id = auth.uid()
    ));

-- Supervisors can see pending overtime from their team
CREATE POLICY "Supervisors can view team pending overtime"
    ON overtime FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM employees e 
            WHERE e.auth_user_id = auth.uid() 
            AND e.role IN ('supervisor', 'hr', 'admin')
            AND (e.role IN ('hr', 'admin') OR e.department_id = overtime.employee_id)
        )
        AND status = 'pending'
    );

-- HR/Admin can see all overtime
CREATE POLICY "HR/Admin can view all overtime"
    ON overtime FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM employees 
            WHERE employees.auth_user_id = auth.uid() 
            AND employees.role IN ('hr', 'admin')
        )
    );

-- Employees can insert their own overtime
CREATE POLICY "Employees can insert own overtime"
    ON overtime FOR INSERT
    WITH CHECK (employee_id IN (
        SELECT id FROM employees WHERE auth_user_id = auth.uid()
    ));

-- Supervisors/HR/Admin can update overtime (approve/reject)
CREATE POLICY "Supervisors/HR/Admin can update overtime"
    ON overtime FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM employees e 
            WHERE e.auth_user_id = auth.uid() 
            AND e.role IN ('supervisor', 'hr', 'admin')
        )
    );

-- ============================================
-- LEAVE REQUESTS RLS POLICIES
-- ============================================
-- Employees can see their own leave requests
CREATE POLICY "Employees can view own leave requests"
    ON leave_requests FOR SELECT
    USING (employee_id IN (
        SELECT id FROM employees WHERE auth_user_id = auth.uid()
    ));

-- Supervisors can see pending leave requests from their team
CREATE POLICY "Supervisors can view team pending leave requests"
    ON leave_requests FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM employees e 
            WHERE e.auth_user_id = auth.uid() 
            AND e.role IN ('supervisor', 'hr', 'admin')
            AND (e.role IN ('hr', 'admin') OR e.department_id = leave_requests.employee_id)
        )
        AND status = 'pending'
    );

-- HR/Admin can see all leave requests
CREATE POLICY "HR/Admin can view all leave requests"
    ON leave_requests FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM employees 
            WHERE employees.auth_user_id = auth.uid() 
            AND employees.role IN ('hr', 'admin')
        )
    );

-- Employees can insert their own leave requests
CREATE POLICY "Employees can insert own leave requests"
    ON leave_requests FOR INSERT
    WITH CHECK (employee_id IN (
        SELECT id FROM employees WHERE auth_user_id = auth.uid()
    ));

-- Supervisors/HR/Admin can update leave requests (approve/reject)
CREATE POLICY "Supervisors/HR/Admin can update leave requests"
    ON leave_requests FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM employees e
            WHERE e.auth_user_id = auth.uid()
            AND e.role IN ('supervisor', 'hr', 'admin')
        )
    );

-- ============================================
-- >>> STOP HERE FOR PART 1 <<<
-- ============================================
-- The rest of this file (Storage policies) should be run separately.
-- See QUICKSTART.md for instructions.
-- ============================================

-- ============================================
-- STORAGE RLS POLICIES
-- ============================================
-- Note: Storage policies are managed via Supabase Dashboard or Storage API
-- The following SQL creates policies for the 'attendance' bucket
-- Run these commands in the Supabase Dashboard → Storage → attendance → Policies

-- Alternatively, you can run this via SQL Editor with admin privileges:
-- First, ensure the bucket exists
INSERT INTO storage.buckets (id, name, public) 
VALUES ('attendance', 'attendance', true)
ON CONFLICT (id) DO NOTHING;

-- Create policy for uploading images (run in SQL Editor with proper permissions)
DO $$
BEGIN
    -- Check if policy already exists
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'objects' 
        AND schemaname = 'storage'
        AND policyname = 'Users can upload attendance images'
    ) THEN
        CREATE POLICY "Users can upload attendance images"
            ON storage.objects FOR INSERT
            WITH CHECK (
                bucket_id = 'attendance'
                AND auth.uid() IS NOT NULL
            );
    END IF;

    -- Check if view policy already exists
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'objects' 
        AND schemaname = 'storage'
        AND policyname = 'Users can view attendance images'
    ) THEN
        CREATE POLICY "Users can view attendance images"
            ON storage.objects FOR SELECT
            USING (
                bucket_id = 'attendance'
                AND auth.uid() IS NOT NULL
            );
    END IF;

    -- Check if delete policy already exists
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'objects' 
        AND schemaname = 'storage'
        AND policyname = 'Users can delete own attendance images'
    ) THEN
        CREATE POLICY "Users can delete own attendance images"
            ON storage.objects FOR DELETE
            USING (
                bucket_id = 'attendance'
                AND auth.uid() IS NOT NULL
            );
    END IF;
END $$;

-- ============================================
-- FUNCTIONS
-- ============================================

-- Function to get employee ID from auth user ID
CREATE OR REPLACE FUNCTION get_employee_id()
RETURNS UUID AS $$
BEGIN
    RETURN (SELECT id FROM employees WHERE auth_user_id = auth.uid());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get employee role
CREATE OR REPLACE FUNCTION get_employee_role()
RETURNS TEXT AS $$
BEGIN
    RETURN (SELECT role FROM employees WHERE auth_user_id = auth.uid());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user is HR or Admin
CREATE OR REPLACE FUNCTION is_hr_or_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM employees 
        WHERE auth_user_id = auth.uid() 
        AND role IN ('hr', 'admin')
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user is Supervisor or above
CREATE OR REPLACE FUNCTION is_supervisor_or_above()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM employees 
        WHERE auth_user_id = auth.uid() 
        AND role IN ('supervisor', 'hr', 'admin')
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- TRIGGERS FOR UPDATED_AT
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc', NOW());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to all tables with updated_at
CREATE TRIGGER update_departments_updated_at
    BEFORE UPDATE ON departments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_employees_updated_at
    BEFORE UPDATE ON employees
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_time_records_updated_at
    BEFORE UPDATE ON time_records
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_requests_updated_at
    BEFORE UPDATE ON requests
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_overtime_updated_at
    BEFORE UPDATE ON overtime
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_leave_requests_updated_at
    BEFORE UPDATE ON leave_requests
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- SAMPLE DATA (Optional - for testing)
-- ============================================

-- Insert sample department
-- INSERT INTO departments (name) VALUES ('Engineering');
-- INSERT INTO departments (name) VALUES ('Sales');
-- INSERT INTO departments (name) VALUES ('HR');

-- ============================================
-- NOTES FOR HIDDEN USERS SETUP
-- ============================================
-- After creating employees, you need to create corresponding auth.users
-- This can be done via Supabase Admin API or SQL:
--
-- Example using SQL (for testing only - use Admin API in production):
-- INSERT INTO auth.users (email, encrypted_password, email_confirmed_at, created_at, updated_at)
-- VALUES ('employee1@company.com', crypt('password123', gen_salt('bf')), NOW(), NOW(), NOW());
--
-- Then link to employee:
-- UPDATE employees SET auth_user_id = (SELECT id FROM auth.users WHERE email = 'employee1@company.com')
-- WHERE id = 'employee-uuid';
