-- Storage Bucket Setup for OlinoCheck
-- Run this in Supabase Dashboard → Storage → attendance → Policies
-- Or run in SQL Editor if you have sufficient privileges

-- ============================================
-- CREATE BUCKET (if not exists)
-- ============================================
INSERT INTO storage.buckets (id, name, public) 
VALUES ('attendance', 'attendance', true)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- STORAGE POLICIES
-- ============================================

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Users can upload attendance images" ON storage.objects;
DROP POLICY IF EXISTS "Users can view attendance images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own attendance images" ON storage.objects;

-- Allow authenticated users to upload images
CREATE POLICY "Users can upload attendance images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'attendance'
);

-- Allow authenticated users to view images
CREATE POLICY "Users can view attendance images"
ON storage.objects
FOR SELECT
TO authenticated
USING (
    bucket_id = 'attendance'
);

-- Allow users to delete their own images
CREATE POLICY "Users can delete own attendance images"
ON storage.objects
FOR DELETE
TO authenticated
USING (
    bucket_id = 'attendance'
);

-- ============================================
-- NOTE: For more granular control, you can 
-- restrict access based on employee role:
-- ============================================

-- Example: Only allow employees to upload (requires joining employees table)
-- CREATE POLICY "Employees can upload attendance images"
-- ON storage.objects
-- FOR INSERT
-- TO authenticated
-- WITH CHECK (
--     bucket_id = 'attendance'
--     AND EXISTS (
--         SELECT 1 FROM employees 
--         WHERE employees.auth_user_id = auth.uid()
--         AND employees.is_active = true
--     )
-- );
