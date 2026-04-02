# OlinoCheck - Employee Attendance System

A complete Employee Attendance System built with React, Vite, Tailwind CSS, shadcn/ui, and Supabase.

## Features

### Employee Features
- **PIN Login**: Secure 4-6 digit PIN authentication
- **Check-in/Check-out**: Photo capture with GPS location tracking
- **Attendance History**: View monthly records with filters
- **Requests**: Submit time correction, retroactive check-in/out requests
- **Leave Requests**: 7 types (Annual, Sick, Personal, Maternity, Paternity, Bereavement, Unpaid)
- **Overtime**: Submit and track overtime requests

### Manager Features
- **Dashboard**: Overview of attendance, pending requests, and statistics
- **Employee Management**: Create, update, activate/deactivate employees
- **Pending Requests**: Approve/reject time-related requests
- **Leave Approvals**: Manage leave request approvals
- **Reports**: Export attendance, overtime, and leave data to CSV

### Role-Based Access
- **Employee**: Personal attendance, requests, history
- **Supervisor**: Team visibility, approvals for their department
- **HR**: Full organization visibility, all approvals
- **Admin**: Full access + employee management

## Tech Stack

- **Frontend**: React 18 + Vite
- **Styling**: Tailwind CSS + shadcn/ui components
- **Backend**: Supabase (PostgreSQL + Storage + Auth)
- **Routing**: react-router-dom
- **Camera**: react-webcam
- **Date Handling**: date-fns
- **CSV Export**: papaparse
- **Password Hashing**: bcryptjs

## Project Structure

```
src/
├── pages/
│   ├── Login.jsx
│   ├── CheckInOut.jsx
│   ├── History.jsx
│   ├── Requests.jsx
│   ├── LeaveRequests.jsx
│   ├── Overtime.jsx
│   └── manager/
│       ├── Dashboard.jsx
│       ├── Employees.jsx
│       ├── PendingRequests.jsx
│       ├── Reports.jsx
│       └── LeaveApprovals.jsx
├── components/
│   ├── Layout.jsx
│   ├── CameraCapture.jsx
│   ├── GPSPicker.jsx
│   ├── PinLogin.jsx
│   ├── ProtectedRoute.jsx
│   └── ui/ (shadcn components)
├── services/
│   ├── supabase.js
│   ├── authService.js
│   ├── timeService.js
│   ├── requestService.js
│   ├── leaveService.js
│   ├── overtimeService.js
│   └── employeeService.js
├── hooks/
│   ├── useAuth.js
│   ├── useCheckIn.js
│   └── useRole.js
├── lib/
│   └── utils.js
├── App.jsx
├── main.jsx
└── index.css
```

## Setup Instructions

### Prerequisites
- Node.js 18+ and npm
- Supabase account (free tier works)

### Step 1: Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Wait for the project to be provisioned
3. Go to SQL Editor and run the main migration script (`supabase_migration.sql`)
   - Copy the entire content of `supabase_migration.sql`
   - Paste into SQL Editor
   - Click "Run"
4. **Important**: Run the storage policies separately:
   - Go to **Storage** in the sidebar
   - Create a new bucket named `attendance` (set to **Public**)
   - Click on the bucket → **Policies** tab
   - Either use the visual policy builder OR run `storage_policies.sql` in SQL Editor

### Step 1.5: Alternative Storage Setup (if SQL fails)

If you get permission errors when running the migration:

1. Run only the main tables from `supabase_migration.sql` (lines 1-430)
2. Then set up storage manually:
   - Go to Supabase Dashboard → **Storage**
   - Create bucket: `attendance` (Public: Yes)
   - Click bucket → **Policies** → **New Policy**
   - Add these 3 policies:
     - **INSERT**: `bucket_id = 'attendance'`
     - **SELECT**: `bucket_id = 'attendance'`
     - **DELETE**: `bucket_id = 'attendance'`

### Step 2: Configure Environment Variables

Create a `.env` file in the project root:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

You can find these values in:
- Project Settings → API

### Step 3: Create Departments

Run this SQL to create initial departments:

```sql
INSERT INTO departments (name) VALUES 
  ('Engineering'),
  ('Sales'),
  ('Marketing'),
  ('HR'),
  ('Finance'),
  ('Operations');
```

### Step 4: Create First Employee (Admin)

You need to create the first admin user manually. Run this SQL (replace values):

```sql
-- First, create the auth user
-- Note: You'll need to use Supabase Admin API or the Dashboard
-- The easiest way is to use the Supabase Dashboard:
-- 1. Go to Authentication → Users → Add User
-- 2. Create a user with email: admin@company.com
-- 3. Set a temporary password
-- 4. Copy the user ID

-- Then create the employee record (replace USER_ID with the actual ID)
INSERT INTO employees (name, pin_hash, role, department_id, auth_user_id, is_active)
VALUES (
  'System Admin',
  '$2a$10$YourHashedPINHere',  -- Use bcrypt to hash a 4-6 digit PIN
  'admin',
  (SELECT id FROM departments WHERE name = 'HR'),
  'USER_ID_FROM_AUTH_STEP',
  true
);
```

**Alternative**: Use the provided script in `scripts/create-admin.js` (to be created).

### Step 5: Install Dependencies

```bash
npm install
```

### Step 6: Run Development Server

```bash
npm run dev
```

The app will open at `http://localhost:3000`

### Step 7: Build for Production

```bash
npm run build
```

## Deployment to Vercel

### Step 1: Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin your-repo-url
git push -u origin main
```

### Step 2: Connect to Vercel

1. Go to [vercel.com](https://vercel.com)
2. Click "New Project"
3. Import your GitHub repository
4. Configure the project:
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`

### Step 3: Add Environment Variables

In Vercel project settings → Environment Variables:

```
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Step 4: Deploy

Click "Deploy" and Vercel will build and deploy your application.

## Database Schema

### Tables

1. **departments** - Company departments
2. **employees** - Employee records with PIN hash and role
3. **time_records** - Daily check-in/check-out records
4. **requests** - Time correction and retroactive requests
5. **overtime** - Overtime requests
6. **leave_requests** - Leave applications (7 types)

### Security (RLS)

Row Level Security policies ensure:
- Employees can only see their own data
- Supervisors can see their department's data
- HR/Admin can see all data
- Storage bucket restricts image access by role

## API Reference

### Authentication

```javascript
// Verify PIN and sign in
import { verifyPinAndSignIn } from '@/services/authService'
const result = await verifyPinAndSignIn('1234')

// Sign out
import { signOut } from '@/services/authService'
await signOut()

// Get current employee
import { getCurrentEmployee } from '@/services/authService'
const employee = await getCurrentEmployee()
```

### Time Records

```javascript
// Check in
import { checkIn } from '@/services/timeService'
await checkIn(employeeId, imageBlob, lat, lng, 'office')

// Check out
import { checkOut } from '@/services/timeService'
await checkOut(employeeId, imageBlob, lat, lng)

// Get records
import { getTimeRecords } from '@/services/timeService'
const records = await getTimeRecords(employeeId, startDate, endDate)
```

### Requests

```javascript
// Create request
import { createRequest } from '@/services/requestService'
await createRequest(employeeId, 'time_correction', 'Reason', '2024-01-15', '09:00', file)

// Get pending requests
import { getPendingRequests } from '@/services/requestService'
const requests = await getPendingRequests(departmentId, role)

// Approve/Reject
import { updateRequestStatus } from '@/services/requestService'
await updateRequestStatus(requestId, 'approved', approverId)
```

## Storage Setup

The app uses Supabase Storage for:
- Check-in photos
- Check-out photos
- Request attachments
- Leave request documents

Bucket name: `attendance`

The bucket is automatically created when you run the migration script.

## Troubleshooting

### Camera Not Working
- Ensure HTTPS is enabled (required for camera access)
- Check browser permissions
- Try a different browser

### GPS Not Accurate
- GPS accuracy depends on device
- Manual entry is available as fallback

### PIN Login Failing
- Verify the PIN hash is correctly generated with bcrypt
- Check that the employee record is linked to auth.users

### RLS Policy Errors
- Ensure auth.uid() returns the correct user
- Check that employees.auth_user_id matches auth.users.id

## License

MIT License

## Support

For issues and questions, please create an issue in the repository.
