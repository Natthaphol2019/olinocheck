# 🔧 Troubleshooting Guide - OlinoCheck

## Common Issues and Solutions

---

## Database Setup Issues

### Error: "must be owner of table objects"

**When:** Running storage policies in migration SQL

**Why:** The `storage.objects` table is owned by Supabase, not your user

**Solution:**
1. Skip the storage policies in the migration SQL
2. Set up storage manually:
   - Go to Dashboard → Storage
   - Create bucket: `attendance` (Public: Yes)
   - Click bucket → Policies → New Policy
   - Add 3 policies (see QUICKSTART.md)

OR run `storage_policies.sql` separately if you have admin privileges.

---

### Error: "relation 'departments' does not exist"

**When:** Running migration or creating admin user

**Why:** Migration SQL hasn't been run yet

**Solution:**
1. Go to SQL Editor in Supabase
2. Copy lines 1-430 from `supabase_migration.sql`
3. Run the SQL
4. Verify tables exist in Table Editor

---

### Error: "duplicate key value violates unique constraint"

**When:** Running migration multiple times

**Why:** Tables already exist

**Solution:**
- This is normal if you've already run the migration
- The migration uses `IF NOT EXISTS` so it's safe to ignore
- Or drop tables first: `DROP TABLE IF EXISTS ... CASCADE;`

---

## Authentication Issues

### Error: "Invalid PIN" (even with correct PIN)

**Possible Causes:**

1. **PIN hash not generated correctly**
   - Must use bcrypt with 10 rounds
   - Online tool: [bcrypt-generator.com](https://bcrypt-generator.com)
   - Or use: `await bcrypt.hash('123456', 10)`

2. **Employee not linked to auth user**
   ```sql
   -- Check the link exists
   SELECT e.id, e.name, e.auth_user_id, u.email 
   FROM employees e
   LEFT JOIN auth.users u ON e.auth_user_id = u.id
   WHERE e.id = 'your-employee-id';
   ```

3. **Employee is inactive**
   ```sql
   UPDATE employees SET is_active = true WHERE id = 'your-employee-id';
   ```

4. **Auth user password doesn't match PIN hash**
   - The auth user password must be the same bcrypt hash
   - Update via Dashboard → Authentication → Users → Edit user

---

### Error: "User not found"

**When:** Trying to login

**Why:** No employee record matches the auth user

**Solution:**
```sql
-- Verify employee exists and is linked
SELECT * FROM employees WHERE auth_user_id = auth.uid();
```

---

### Session expires immediately

**Why:** Auth configuration issue

**Solution:**
1. Check VITE_SUPABASE_URL is correct (no trailing slash)
2. Verify VITE_SUPABASE_ANON_KEY is the anon key, not service role
3. Restart dev server after changing .env

---

## Camera/GPS Issues

### Camera not working

**Possible Causes:**

1. **HTTPS required**
   - Camera only works on HTTPS or localhost
   - Vercel provides HTTPS automatically

2. **Browser permissions**
   - Check browser camera permissions
   - Chrome: Settings → Privacy → Camera
   - Firefox: Settings → Privacy & Security → Camera

3. **No camera device**
   - Use a device with a camera
   - Or test with mobile device

**Debug:**
```javascript
// Check camera permission
navigator.mediaDevices.getUserMedia({ video: true })
  .then(() => console.log('Camera OK'))
  .catch(err => console.error('Camera error:', err));
```

---

### GPS location inaccurate

**Why:** GPS accuracy depends on device and browser

**Solutions:**
1. Use manual entry option in GPSPicker component
2. Enable high accuracy mode in browser
3. Use mobile device with GPS

**Note:** GPS is optional - employees can enter coordinates manually

---

## Storage Issues

### Image upload fails

**Possible Causes:**

1. **Bucket doesn't exist**
   ```sql
   -- Check bucket exists
   SELECT * FROM storage.buckets WHERE id = 'attendance';
   ```

2. **No storage policies**
   - See QUICKSTART.md for policy setup

3. **File too large**
   - Supabase free tier: 50MB limit per file
   - Compress images before upload

4. **Wrong content type**
   - Use 'image/jpeg' for JPEG files
   - Check file extension matches content

**Debug:**
```javascript
// Test storage access
const { data, error } = await supabase.storage
  .from('attendance')
  .list();
console.log('Storage error:', error);
```

---

### Image URL returns 404

**Why:** Public access not enabled

**Solution:**
1. Go to Dashboard → Storage
2. Click `attendance` bucket
3. Ensure "Public" is enabled
4. Check RLS policies allow SELECT

---

## RLS (Row Level Security) Issues

### Error: "new row violates row-level security policy"

**When:** Inserting data

**Why:** RLS policy prevents the operation

**Solution:**
1. Check which policy is failing in Supabase logs
2. Verify user is authenticated: `SELECT auth.uid();`
3. Verify employee record exists for the user
4. Check role-based policies match user's role

**Debug queries:**
```sql
-- Check current user
SELECT auth.uid();

-- Check employee record
SELECT * FROM employees WHERE auth_user_id = auth.uid();

-- Check employee role
SELECT role FROM employees WHERE auth_user_id = auth.uid();
```

---

### Can't see data in Table Editor

**Why:** RLS policies apply to Table Editor too

**Solution:**
1. Use a service role key to bypass RLS
2. Or temporarily disable RLS for testing:
   ```sql
   ALTER TABLE time_records DISABLE ROW LEVEL SECURITY;
   -- Re-enable after testing
   ALTER TABLE time_records ENABLE ROW LEVEL SECURITY;
   ```

**Warning:** Don't disable RLS in production!

---

## Build/Deployment Issues

### Build fails with "Module not found"

**Why:** Missing dependency

**Solution:**
```bash
# Install missing dependency
npm install <package-name>

# Or reinstall all
rm -rf node_modules package-lock.json
npm install
```

---

### "Failed to parse source for import analysis"

**Why:** JSX in .js file

**Solution:**
- Rename file from `.js` to `.jsx`
- Files with JSX must use `.jsx` extension

---

### Vercel build succeeds but app doesn't work

**Possible Causes:**

1. **Missing environment variables**
   - Check Vercel → Settings → Environment Variables
   - Redeploy after adding variables

2. **Wrong build settings**
   - Framework: Vite
   - Build Command: `npm run build`
   - Output Directory: `dist`

3. **Supabase URL wrong**
   - Must be full URL: `https://xxxxx.supabase.co`
   - No trailing slash

---

## Performance Issues

### App is slow

**Solutions:**
1. Enable Supabase query caching
2. Add database indexes (already included in migration)
3. Reduce data fetched per page (implement pagination)
4. Use React.memo for expensive components

---

### Images load slowly

**Solutions:**
1. Compress images before upload
2. Use Supabase image transformations
3. Implement lazy loading
4. Use CDN (Supabase has built-in CDN)

---

## Development Issues

### Hot reload not working

**Solution:**
```bash
# Restart dev server
Ctrl+C
npm run dev
```

---

### TypeScript errors (if using TS)

**Solution:**
- This project uses JavaScript, not TypeScript
- If converting to TS, add proper type definitions

---

## Getting Help

### Check Logs

1. **Browser Console** - F12 → Console
2. **Supabase Logs** - Dashboard → Logs
3. **Vercel Logs** - Project → Deployments → View logs

### Useful Debug Queries

```sql
-- Check all employees
SELECT id, name, role, is_active, auth_user_id FROM employees;

-- Check today's attendance
SELECT * FROM time_records WHERE date = CURRENT_DATE;

-- Check pending requests
SELECT * FROM requests WHERE status = 'pending';

-- Check storage usage
SELECT bucket_id, COUNT(*) FROM storage.objects GROUP BY bucket_id;
```

### Still Stuck?

1. Check the documentation:
   - README.md
   - QUICKSTART.md
   - DEPLOYMENT_GUIDE.md

2. Enable debug logging in browser console

3. Check Supabase dashboard for errors

4. Create a fresh Supabase project and re-run migration

---

## Quick Fix Checklist

When something doesn't work:

- [ ] Check browser console for errors
- [ ] Verify .env file exists and is correct
- [ ] Restart dev server
- [ ] Check Supabase dashboard for errors
- [ ] Verify database tables exist
- [ ] Test with a different browser
- [ ] Clear browser cache
- [ ] Check network tab for failed requests

---

**Remember:** Most issues are environment-related. Double-check your setup first!
