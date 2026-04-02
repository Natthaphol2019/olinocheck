-- ============================================
-- FIX: RLS Policies for time_records Table
-- ============================================
-- This fixes the 406 (Not Acceptable) error by adding proper SELECT policies

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Employees can view own time records" ON time_records;
DROP POLICY IF EXISTS "Managers can view all time records" ON time_records;
DROP POLICY IF EXISTS "HR/Admin can manage time records" ON time_records;

-- ============================================
-- NEW POLICIES
-- ============================================

-- Policy 1: Employees can view their OWN time records
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

-- Policy 3: HR/Admin can insert/update/delete time records
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

-- Policy 5: Employees can update their own check-in/check-out records
CREATE POLICY "Employees can update own time records"
    ON time_records FOR UPDATE
    USING (
        employee_id IN (
            SELECT id FROM employees 
            WHERE employees.auth_user_id = auth.uid()
        )
    );

-- ============================================
-- Test Queries
-- ============================================
-- Run these to verify the fix works:

-- Test 1: Check if employee can query their own records
-- SELECT * FROM time_records 
-- WHERE employee_id = (SELECT id FROM employees WHERE auth_user_id = auth.uid())
-- LIMIT 1;

-- Test 2: Check date format works
-- SELECT * FROM time_records 
-- WHERE employee_id = (SELECT id FROM employees WHERE auth_user_id = auth.uid())
-- AND date = '2026-04-02'
-- LIMIT 1;

-- ============================================
-- IMPORTANT: Run this in Supabase SQL Editor
-- ============================================
-- 1. Go to Supabase Dashboard → SQL Editor
-- 2. Paste this entire file
-- 3. Click "Run"
-- 4. Test the check-in page again
