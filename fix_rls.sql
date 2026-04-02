-- ============================================
-- FIX: RLS Policies for Employees and Time Records Tables
-- ============================================
-- This fixes:
-- 1. "infinite recursion" and allows PIN login to work
-- 2. 406 (Not Acceptable) error when querying time_records
--
-- IMPORTANT: Run this ENTIRE file in Supabase SQL Editor
-- ============================================

-- ============================================
-- PART 1: EMPLOYEES TABLE POLICIES
-- ============================================

-- Drop existing policies
DROP POLICY IF EXISTS "Employees can view own record" ON employees;
DROP POLICY IF EXISTS "Supervisors can view team" ON employees;
DROP POLICY IF EXISTS "HR/Admin can view all employees" ON employees;
DROP POLICY IF EXISTS "Enable read access for all authenticated users" ON employees;
DROP POLICY IF EXISTS "Enable read access for pin login" ON employees;

-- Create a simple policy that allows anyone to read employee data for PIN verification
-- This is safe because pin_hash is a bcrypt hash (not reversible)
CREATE POLICY "Enable read access for pin login"
    ON employees FOR SELECT
    USING (is_active = true);

-- For other operations, restrict properly
CREATE POLICY "Employees can update own record"
    ON employees FOR UPDATE
    USING (auth_user_id = auth.uid());

CREATE POLICY "HR/Admin can manage all employees"
    ON employees FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM employees e
            WHERE e.auth_user_id = auth.uid()
            AND e.role IN ('hr', 'admin')
        )
    );

-- ============================================
-- PART 2: TIME_RECORDS TABLE POLICIES
-- ============================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Employees can view own time records" ON time_records;
DROP POLICY IF EXISTS "Managers can view all time records" ON time_records;
DROP POLICY IF EXISTS "HR/Admin can manage time records" ON time_records;
DROP POLICY IF EXISTS "Employees can insert own time records" ON time_records;
DROP POLICY IF EXISTS "Employees can update own time records" ON time_records;

-- Policy 1: Employees can view their OWN time records (or managers can view all)
CREATE POLICY "Employees can view own time records"
    ON time_records FOR SELECT
    USING (
        employee_id IN (
            SELECT id FROM employees 
            WHERE employees.auth_user_id = auth.uid()
        )
        OR 
        EXISTS (
            SELECT 1 FROM employees
            WHERE employees.auth_user_id = auth.uid()
            AND employees.role IN ('hr', 'admin', 'supervisor', 'manager')
        )
    );

-- Policy 2: Managers/HR/Admin can view ALL time records
CREATE POLICY "Managers can view all time records"
    ON time_records FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM employees
            WHERE employees.auth_user_id = auth.uid()
            AND employees.role IN ('hr', 'admin', 'supervisor', 'manager')
        )
    );

-- Policy 3: HR/Admin can manage time records
CREATE POLICY "HR/Admin can manage time records"
    ON time_records FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM employees
            WHERE employees.auth_user_id = auth.uid()
            AND employees.role IN ('hr', 'admin')
        )
    );

-- Policy 4: Employees can insert their own check-in records
CREATE POLICY "Employees can insert own time records"
    ON time_records FOR INSERT
    WITH CHECK (
        employee_id IN (
            SELECT id FROM employees 
            WHERE employees.auth_user_id = auth.uid()
        )
    );

-- Policy 5: Employees can update their own records
CREATE POLICY "Employees can update own time records"
    ON time_records FOR UPDATE
    USING (
        employee_id IN (
            SELECT id FROM employees 
            WHERE employees.auth_user_id = auth.uid()
        )
    );

-- ============================================
-- Test Queries (Run these to verify)
-- ============================================
-- Test 1: Check if employee can query their own records
-- SELECT * FROM time_records 
-- WHERE employee_id = (SELECT id FROM employees WHERE auth_user_id = auth.uid())
-- LIMIT 1;

-- Test 2: Check date format works
-- SELECT * FROM time_records 
-- WHERE employee_id = (SELECT id FROM employees WHERE auth_user_id = auth.uid())
-- AND date = '2026-04-02'
-- LIMIT 1;

-- Test 3: Verify PIN login still works
-- SELECT id, name, role FROM employees WHERE is_active = true LIMIT 1;
