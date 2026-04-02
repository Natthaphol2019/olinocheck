# 🚀 Quick Start Guide - OlinoCheck

## 5-Minute Setup

### Step 1: Supabase Setup (3 minutes)

1. **Create Project**
   - Go to [supabase.com](https://supabase.com/new)
   - Create new project (name: `olinocheck`)
   - Save your database password!

2. **Run Migration**
   - Go to **SQL Editor** → **New Query**
   - Copy content from `supabase_migration.sql` (lines 1-430 only)
   - Paste and click **Run**

3. **Create Storage Bucket**
   - Go to **Storage** → **Create Bucket**
   - Name: `attendance`
   - Public: ✓ Yes
   - Click **Create**

4. **Add Storage Policies**
   - Click on `attendance` bucket
   - Go to **Policies** → **New Policy**
   - Create 3 policies:

   **Policy 1 - Upload:**
   ```
   Name: Users can upload attendance images
   Operation: INSERT
   Roles: authenticated
   Definition: bucket_id = 'attendance'
   ```

   **Policy 2 - View:**
   ```
   Name: Users can view attendance images
   Operation: SELECT
   Roles: authenticated
   Definition: bucket_id = 'attendance'
   ```

   **Policy 3 - Delete:**
   ```
   Name: Users can delete own attendance images
   Operation: DELETE
   Roles: authenticated
   Definition: bucket_id = 'attendance'
   ```

5. **Create Departments**
   - Go to **SQL Editor** → **New Query**
   ```sql
   INSERT INTO departments (name) VALUES 
     ('Engineering'), ('Sales'), ('HR'), ('Operations');
   ```
   - Click **Run**

6. **Copy API Keys**
   - Go to **Settings** → **API**
   - Copy:
     - Project URL: `https://xxxxx.supabase.co`
     - anon/public key: `eyJhbG...`

---

### Step 2: Local Setup (2 minutes)

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Create .env File**
   ```bash
   cp .env.example .env
   ```

3. **Edit .env**
   ```env
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key-here
   ```

4. **Create Admin User**
   
   **Option A - Using Script (Recommended):**
   ```bash
   # Edit scripts/create-admin.js first with your Supabase credentials
   npm run create-admin
   ```

   **Option B - Manual SQL:**
   ```sql
   -- 1. Create auth user in Dashboard: Authentication → Users → Add User
   -- Email: admin@company.com
   -- Password: [use bcrypt hash of PIN, e.g., hash of "123456"]
   
   -- 2. Link to employee table:
   INSERT INTO employees (name, pin_hash, role, department_id, auth_user_id, is_active)
   VALUES (
     'Admin User',
     '$2a$10$YOUR_BCRYPT_HASH_HERE',
     'admin',
     (SELECT id FROM departments WHERE name = 'HR' LIMIT 1),
     'AUTH_USER_ID_FROM_STEP_1',
     true
   );
   ```

5. **Run Development Server**
   ```bash
   npm run dev
   ```

6. **Login**
   - Open http://localhost:3000
   - Enter admin PIN (e.g., `123456`)

---

## Testing Checklist

### Employee Flow
- [ ] Login with PIN
- [ ] Check-in with photo
- [ ] Check-out with photo
- [ ] View history
- [ ] Submit request
- [ ] Submit leave request
- [ ] Submit overtime

### Manager Flow
- [ ] View dashboard
- [ ] See pending requests
- [ ] Approve/reprove requests
- [ ] Export reports

---

## Common Issues

### "Invalid PIN"
- Make sure PIN hash is generated with bcrypt (10 rounds)
- Check employee record exists and `is_active = true`

### Camera not working
- Must use HTTPS in production
- Check browser permissions

### Storage upload fails
- Verify `attendance` bucket exists
- Check storage policies are set correctly

### RLS errors
- Re-run migration SQL
- Verify auth.uid() matches employees.auth_user_id

---

## Next Steps

1. **Add more employees** via Manager → Employees page
2. **Configure departments** for your organization
3. **Test all features** before deploying
4. **Deploy to Vercel** (see DEPLOYMENT_GUIDE.md)

---

## Support Files

- `README.md` - Full documentation
- `DEPLOYMENT_GUIDE.md` - Production deployment
- `supabase_migration.sql` - Database schema
- `storage_policies.sql` - Storage RLS policies

---

**Need help?** Check the full documentation or create an issue on GitHub.
