# DEPLOYMENT GUIDE - OlinoCheck Employee Attendance System

## Complete Step-by-Step Deployment Instructions

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Supabase Setup](#supabase-setup)
3. [Local Development Setup](#local-development-setup)
4. [Creating First Admin User](#creating-first-admin-user)
5. [Production Build](#production-build)
6. [Vercel Deployment](#vercel-deployment)
7. [Post-Deployment Configuration](#post-deployment-configuration)
8. [Testing Checklist](#testing-checklist)
9. [Troubleshooting](#troubleshooting)

---

## Prerequisites

Before starting, ensure you have:

- **Node.js 18+** - Download from [nodejs.org](https://nodejs.org)
- **npm** - Comes with Node.js
- **Git** - Download from [git-scm.com](https://git-scm.com)
- **Supabase Account** - Free tier at [supabase.com](https://supabase.com)
- **Vercel Account** - Free tier at [vercel.com](https://vercel.com)
- **GitHub Account** - Free at [github.com](https://github.com)

---

## Supabase Setup

### Step 1: Create New Project

1. Go to [supabase.com](https://supabase.com)
2. Click "Start your project" or "New Project"
3. Fill in:
   - **Name**: `olinocheck` (or your preferred name)
   - **Database Password**: Choose a strong password (save it!)
   - **Region**: Choose closest to your users
4. Click "Create new project"
5. Wait 2-5 minutes for provisioning

### Step 2: Get API Credentials

1. In your Supabase dashboard, go to **Settings** (gear icon) → **API**
2. Copy these values:
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon/public key**: `eyJhbG...` (long string)

Save these for later!

### Step 3: Run Database Migration

1. Go to **SQL Editor** in Supabase dashboard
2. Click "New query"
3. Copy the entire content of `supabase_migration.sql`
4. Paste into the editor
5. Click "Run" or press Ctrl+Enter
6. Verify all tables are created (check **Table Editor**)

### Step 4: Create Storage Bucket

The migration should create this automatically, but verify:

1. Go to **Storage** in sidebar
2. Look for `attendance` bucket
3. If not exists, click "New bucket":
   - **Name**: `attendance`
   - **Public**: ✓ Yes
   - Click "Create bucket"

### Step 5: Create Initial Departments

1. Go to **SQL Editor**
2. Run this query:

```sql
INSERT INTO departments (name) VALUES 
  ('Engineering'),
  ('Sales'),
  ('Marketing'),
  ('Human Resources'),
  ('Finance'),
  ('Operations'),
  ('Customer Support'),
  ('IT');
```

3. Verify in **Table Editor** → `departments` table

---

## Local Development Setup

### Step 1: Clone/Setup Project

If starting from existing code:
```bash
cd olinocheck
npm install
```

### Step 2: Create Environment File

Create `.env` in project root:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

### Step 3: Test Local Development

```bash
npm run dev
```

Open browser to `http://localhost:3000`

---

## Creating First Admin User

This is the most critical step. Follow carefully:

### Method 1: Using Supabase Dashboard (Recommended)

#### Step 1: Create Auth User

1. Go to **Authentication** → **Users**
2. Click **Add user** → **Create new user**
3. Fill in:
   - **Email**: `admin@yourcompany.com`
   - **Password**: `Admin123!` (temporary - change later)
   - **Auto Confirm User**: ✓ Check this box
4. Click **Create user**
5. **Copy the User UUID** (looks like: `550e8400-e29b-41d4-a716-446655440000`)

#### Step 2: Generate PIN Hash

You need to hash a 4-6 digit PIN using bcrypt. Use this online tool or Node.js:

**Option A: Online Bcrypt Tool**
1. Go to [bcrypt-generator.com](https://bcrypt-generator.com) or similar
2. Enter your desired PIN (e.g., `123456`)
3. Choose rounds: `10`
4. Copy the hash

**Option B: Using Node.js Console**
```javascript
// In browser console or Node REPL
import bcrypt from 'bcryptjs'
const hash = await bcrypt.hash('123456', 10)
console.log(hash)
```

#### Step 3: Create Employee Record

1. Go to **SQL Editor**
2. Run this (replace placeholders):

```sql
INSERT INTO employees (
  name, 
  pin_hash, 
  role, 
  department_id, 
  auth_user_id, 
  is_active
) VALUES (
  'System Administrator',
  '$2a$10$YOUR_HASHED_PIN_HERE',  -- Replace with actual hash
  'admin',
  (SELECT id FROM departments WHERE name = 'Human Resources' LIMIT 1),
  'USER_UUID_FROM_STEP_1',      -- Replace with auth user ID
  true
);
```

#### Step 4: Update Auth User Password

The auth user password must match the PIN hash for authentication to work:

1. Go to **Authentication** → **Users**
2. Find your admin user
3. Click the three dots (⋮) → **Edit user**
4. Change password to the **same PIN hash** you generated
5. Save

**Note**: Supabase stores passwords differently. For PIN authentication, we use the PIN hash as both the database PIN and the auth password.

### Method 2: Using SQL (Advanced)

If you prefer, create a helper function:

```sql
-- Create a function to create employee with PIN
CREATE OR REPLACE FUNCTION create_employee_with_pin(
  emp_name TEXT,
  emp_pin TEXT,
  emp_role TEXT,
  emp_email TEXT,
  dept_name TEXT
) RETURNS UUID AS $$
DECLARE
  new_user_id UUID;
  new_emp_id UUID;
  pin_hash TEXT;
BEGIN
  -- Generate PIN hash (this requires plpgsql extension)
  pin_hash := crypt(emp_pin, gen_salt('bf', 10));
  
  -- Create auth user
  INSERT INTO auth.users (
    email, 
    encrypted_password, 
    email_confirmed_at, 
    created_at, 
    updated_at
  ) VALUES (
    emp_email,
    pin_hash,
    NOW(),
    NOW(),
    NOW()
  ) RETURNING id INTO new_user_id;
  
  -- Create employee
  INSERT INTO employees (
    name,
    pin_hash,
    role,
    department_id,
    auth_user_id,
    is_active
  ) VALUES (
    emp_name,
    pin_hash,
    emp_role,
    (SELECT id FROM departments WHERE name = dept_name LIMIT 1),
    new_user_id,
    true
  ) RETURNING id INTO new_emp_id;
  
  RETURN new_emp_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

Then call:
```sql
SELECT create_employee_with_pin(
  'System Administrator',
  '123456',  -- PIN
  'admin',
  'admin@company.com',
  'Human Resources'
);
```

---

## Production Build

### Step 1: Test Production Build Locally

```bash
npm run build
npm run preview
```

Check for errors. Fix any issues before deploying.

### Step 2: Prepare for Git

Create `.gitignore` if not exists:

```gitignore
node_modules
dist
.env
.env.local
*.log
.DS_Store
```

**IMPORTANT**: Never commit `.env` file!

---

## Vercel Deployment

### Step 1: Push to GitHub

```bash
# Initialize git (if not done)
git init
git add .
git commit -m "Initial commit - OlinoCheck setup"

# Create repo on GitHub first, then:
git remote add origin https://github.com/yourusername/olinocheck.git
git branch -M main
git push -u origin main
```

### Step 2: Connect to Vercel

1. Go to [vercel.com](https://vercel.com)
2. Sign in with GitHub
3. Click **"Add New..."** → **"Project"**
4. Under "Import Git Repository", find and select `olinocheck`
5. Click **"Import"**

### Step 3: Configure Build Settings

Vercel auto-detects most settings. Verify:

- **Framework Preset**: Vite
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm install`

### Step 4: Add Environment Variables

Click **"Environment Variables"** → **"Add Variable"**:

```
Name: VITE_SUPABASE_URL
Value: https://your-project.supabase.co
Environment: Production ✓
```

```
Name: VITE_SUPABASE_ANON_KEY
Value: your-full-anon-key-string
Environment: Production ✓
```

### Step 5: Deploy

1. Click **"Deploy"**
2. Wait 2-3 minutes for build
3. Click **"Visit"** to see your live site

### Step 6: Configure Custom Domain (Optional)

1. Go to project **Settings** → **Domains**
2. Add your custom domain
3. Update DNS records as instructed

---

## Post-Deployment Configuration

### Step 1: Update Supabase Site URL

1. In Supabase dashboard, go to **Settings** → **Auth**
2. Under **Site URL**, add your Vercel URL:
   ```
   https://your-project.vercel.app
   ```
3. Under **Redirect URLs**, add:
   ```
   https://your-project.vercel.app/**
   ```
4. Click **Save**

### Step 2: Create Additional Employees

Use the Admin account you created to add more employees:

1. Login with admin PIN
2. Navigate to **Manager** → **Employees**
3. Click **"Add Employee"**
4. Fill in details and set PIN

### Step 3: Test All Features

Go through the testing checklist below.

---

## Testing Checklist

### Authentication
- [ ] Admin can login with PIN
- [ ] Wrong PIN shows error
- [ ] Logout works correctly

### Employee Features
- [ ] Check-in with photo capture
- [ ] GPS location is recorded
- [ ] Check-out works
- [ ] History shows correct records
- [ ] Can submit time correction request
- [ ] Can submit leave request
- [ ] Can submit overtime request

### Manager Features
- [ ] Dashboard shows statistics
- [ ] Can view all employees
- [ ] Can approve/reject requests
- [ ] Can approve/reject leave
- [ ] Can export reports to CSV

### Security
- [ ] Employee can only see own data
- [ ] Supervisor sees only their department
- [ ] HR/Admin sees all data
- [ ] Storage images are accessible

---

## Troubleshooting

### Issue: "Missing Supabase environment variables"

**Solution**: 
- Check `.env` file exists in project root
- Verify variable names are exactly `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
- Restart dev server after adding `.env`

### Issue: "Invalid PIN" even with correct PIN

**Solution**:
- Verify PIN hash is correctly generated with bcrypt (rounds: 10)
- Check `employees.pin_hash` matches auth user password
- Ensure employee record has `is_active = true`

### Issue: Camera not working in production

**Solution**:
- HTTPS is required for camera access
- Vercel provides HTTPS automatically
- Check browser permissions for camera

### Issue: "permission denied for table"

**Solution**:
- RLS policies may not be set up correctly
- Re-run the migration SQL script
- Verify user is authenticated (check Supabase logs)

### Issue: Images not uploading

**Solution**:
- Verify `attendance` storage bucket exists
- Check bucket is set to public
- Verify RLS policies on storage.objects

### Issue: Build fails on Vercel

**Solution**:
- Check build logs for specific error
- Verify all dependencies in `package.json`
- Test `npm run build` locally first

---

## Quick Reference

### Default Admin Credentials
- **Email**: admin@company.com (or what you set)
- **PIN**: The 4-6 digit PIN you chose

### Key URLs
- **Local**: http://localhost:3000
- **Production**: https://your-project.vercel.app
- **Supabase Dashboard**: https://app.supabase.com

### Important Files
- **Environment**: `.env`
- **Database Schema**: `supabase_migration.sql`
- **Main Config**: `vite.config.js`
- **Dependencies**: `package.json`

---

## Support Resources

- **Supabase Docs**: [supabase.com/docs](https://supabase.com/docs)
- **Vercel Docs**: [vercel.com/docs](https://vercel.com/docs)
- **React Docs**: [react.dev](https://react.dev)
- **Tailwind CSS**: [tailwindcss.com/docs](https://tailwindcss.com/docs)

---

## Security Best Practices

1. **Change default admin PIN** immediately
2. **Use strong database password** in Supabase
3. **Enable 2FA** on Supabase account
4. **Regular backups** of your database
5. **Monitor usage** in Supabase dashboard
6. **Keep dependencies updated** (`npm audit`)

---

**Congratulations!** Your Employee Attendance System is now live! 🎉
