# Vercel Deployment Guide - OlinoCheck

## ✅ Pre-Deployment Checklist

### 1. Files Ready for Vercel
- ✅ `vercel.json` - Configured with rewrites for SPA
- ✅ `vite.config.js` - Optimized build with code splitting
- ✅ `package.json` - Build scripts configured
- ✅ `.env.production` - Default environment variables
- ✅ `.gitignore` - Excludes sensitive files

### 2. Required Environment Variables for Vercel

You **MUST** add these in Vercel Dashboard → Project Settings → Environment Variables:

```
VITE_SUPABASE_URL=https://yvtpkvtmudzwwgsnlxek.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl2dHBrdnRtdWR6d3dnc25seGVrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUwNTYwMTMsImV4cCI6MjA5MDYzMjAxM30.5cd7ztapxb8xtr1HlVvM3tGqlN6yT0w33_QfBW655Mg
```

⚠️ **Important**: These are already in `.env.production` but you should still add them in Vercel for better security and easy rotation.

---

## 🚀 Deploy to Vercel (Step-by-Step)

### Option 1: Deploy via Vercel CLI (Easiest)

```bash
# 1. Install Vercel CLI globally (one-time)
npm install -g vercel

# 2. Login to Vercel
vercel login

# 3. Deploy to production
vercel --prod
```

Follow the prompts:
- Set up and deploy? **Y**
- Which scope? **Select your account**
- Link to existing project? **N** (first time)
- Project name: **olinocheck** (or your choice)
- Directory: **.** (current directory)
- Override settings? **N**

### Option 2: Deploy via GitHub (Recommended for teams)

```bash
# 1. Initialize git (if not already done)
git init
git add .
git commit -m "Initial commit - ready for Vercel"

# 2. Push to GitHub
git remote add origin https://github.com/YOUR_USERNAME/olinocheck.git
git push -u origin main

# 3. Go to vercel.com
# 4. Click "New Project"
# 5. Import your GitHub repository
# 6. Configure:
#    - Framework Preset: Vite
#    - Build Command: npm run build
#    - Output Directory: dist
#    - Install Command: npm install
# 7. Add Environment Variables (see above)
# 8. Click "Deploy"
```

---

## 📋 Vercel Configuration Details

### vercel.json
```json
{
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ],
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite",
  "installCommand": "npm install"
}
```

**What this does:**
- ✅ Rewrites all routes to `index.html` (required for React Router)
- ✅ Uses Vite build system
- ✅ Outputs to `dist` folder
- ✅ Auto-installs dependencies

---

## 🔧 Build Optimization

The `vite.config.js` includes:
- **Code Splitting**: Separates vendor, router, UI, and chart libraries
- **Minification**: Removes console logs in production
- **Smaller bundle size**: Faster load times

### Expected Build Output
```
dist/
├── assets/
│   ├── index-[hash].js          (main app)
│   ├── vendor-[hash].js         (react, react-dom)
│   ├── router-[hash].js         (react-router)
│   ├── ui-[hash].js             (radix components)
│   └── charts-[hash].js         (recharts)
├── index.html
└── ... (other assets)
```

---

## ⚙️ Local Testing Before Deploy

### 1. Build the project
```bash
npm run build
```

### 2. Preview production build
```bash
npm run preview
```

This will serve the built files on `http://localhost:4173`

### 3. Check for errors
Open browser console and verify:
- No 404 errors
- Supabase connection successful
- All assets loaded correctly

---

## 🐛 Common Deployment Issues

### Issue 1: "Module not found" errors
**Solution**: Run `npm install` and ensure all dependencies are in `package.json`

### Issue 2: Blank page after deploy
**Solution**: Check that `vercel.json` has the rewrites configuration

### Issue 3: Supabase connection error
**Solution**: Verify environment variables are set in Vercel dashboard

### Issue 4: Images not loading
**Solution**: Ensure Supabase Storage bucket is public and policies are set

---

## 🔄 Updating After Deployment

### Via Vercel CLI:
```bash
vercel --prod
```

### Via GitHub:
```bash
git add .
git commit -m "Update description"
git push
```
Vercel will auto-deploy on push to `main` branch.

---

## 📊 Performance Tips

1. **Enable Vercel Analytics** (optional)
   - Go to Vercel Dashboard → Analytics → Enable

2. **Add Custom Domain**
   - Go to Vercel Dashboard → Domains → Add your domain

3. **Set up Preview Deployments**
   - Every branch gets a unique URL for testing

---

## 🎯 Quick Deploy Command

```bash
npm run build && vercel --prod
```

This builds and deploys in one command!

---

## 🔐 Security Notes

- ✅ Never commit `.env.local` to git
- ✅ Use Vercel Environment Variables for secrets
- ✅ Rotate Supabase keys periodically
- ✅ Enable Vercel's "Automatic HTTPS"

---

## 📞 Support

If deployment fails:
1. Check Vercel build logs
2. Verify all environment variables
3. Run `npm run build` locally first
4. Check `vercel.json` is in root directory

Your app is now **100% ready** for Vercel deployment! 🚀
