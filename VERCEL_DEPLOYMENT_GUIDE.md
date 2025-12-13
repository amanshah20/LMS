# 🚀 Complete Vercel Deployment Guide - Frontend & Backend

## 📋 Prerequisites

- GitHub account
- Vercel account (sign up at https://vercel.com)
- Free PostgreSQL database (we'll use Neon.tech)

---

## Part 1: Setup PostgreSQL Database (5 minutes)

### Step 1: Create Free PostgreSQL Database

1. Go to **https://neon.tech**
2. Click **"Sign Up"** → Sign in with GitHub
3. Click **"Create a project"**
4. Settings:
   - **Project name**: `lms-database`
   - **Region**: Choose closest to you
   - **PostgreSQL version**: Latest (16+)
5. Click **"Create Project"**
6. **Copy the connection string** - looks like:
   ```
   postgresql://username:password@ep-xxx.region.aws.neon.tech/neondb?sslmode=require
   ```
   Save this! You'll need it later.

---

## Part 2: Deploy Backend to Vercel (10 minutes)

### Step 2: Import Backend to Vercel

1. Go to **https://vercel.com/dashboard**
2. Click **"Add New..."** → **"Project"**
3. Import your repository: **`amanshah20/LMS`**
4. Click **"Import"**

### Step 3: Configure Backend Project

| Setting | Value |
|---------|-------|
| **Project Name** | `lms-backend` |
| **Framework Preset** | Other |
| **Root Directory** | `backend` ⚠️ **Click "Edit" and select this!** |
| **Build Command** | Leave empty |
| **Output Directory** | Leave empty |
| **Install Command** | `npm install` |

### Step 4: Add Backend Environment Variables

Click **"Environment Variables"** section and add these:

```
NODE_ENV = production

DATABASE_URL = postgresql://your-connection-string-from-neon

JWT_SECRET = your-super-secret-jwt-key-at-least-32-characters-long-random

SESSION_SECRET = your-session-secret-key-also-random-and-long

PORT = 5000

FRONTEND_URL = https://your-frontend-name.vercel.app
```

⚠️ **Important**:
- Replace `DATABASE_URL` with your Neon connection string from Step 1
- Generate random strings for `JWT_SECRET` and `SESSION_SECRET`
- You'll update `FRONTEND_URL` after deploying frontend (use placeholder for now)

Select: **Production, Preview, Development** (all three)

### Step 5: Deploy Backend

1. Click **"Deploy"**
2. Wait 2-3 minutes for deployment
3. **Copy your backend URL**: `https://lms-backend-xxxx.vercel.app`
4. Test it: Open `https://lms-backend-xxxx.vercel.app/api/health`
   - Should show: `{"status":"Server is running","timestamp":"..."}`

---

## Part 3: Deploy Frontend to Vercel (5 minutes)

### Step 6: Import Frontend to Vercel

1. Still in Vercel dashboard
2. Click **"Add New..."** → **"Project"**
3. Import **same repository**: `amanshah20/LMS`
4. Click **"Import"**

### Step 7: Configure Frontend Project

| Setting | Value |
|---------|-------|
| **Project Name** | `lms-frontend` |
| **Framework Preset** | Create React App (auto-detected) |
| **Root Directory** | `frontend` ⚠️ **Click "Edit" and select this!** |
| **Build Command** | `npm run build` |
| **Output Directory** | `build` |
| **Install Command** | `npm install` |

### Step 8: Add Frontend Environment Variable

Click **"Environment Variables"** section:

```
REACT_APP_API_URL = https://lms-backend-xxxx.vercel.app/api
```

⚠️ **Important**: 
- Replace with your actual backend URL from Step 5
- Must end with `/api`

Select: **Production, Preview, Development** (all three)

### Step 9: Deploy Frontend

1. Click **"Deploy"**
2. Wait 2-3 minutes
3. **Copy your frontend URL**: `https://lms-frontend-xxxx.vercel.app`
4. Click **"Visit"** to open your app!

---

## Part 4: Update Backend with Frontend URL (2 minutes)

### Step 10: Update Backend Environment Variable

1. Go to Vercel dashboard → **`lms-backend`** project
2. Click **"Settings"** → **"Environment Variables"**
3. Find `FRONTEND_URL`
4. Click **"Edit"**
5. Update value to: `https://lms-frontend-xxxx.vercel.app`
6. Click **"Save"**
7. Go to **"Deployments"** → Click **"..."** → **"Redeploy"**

---

## Part 5: Test Your Deployment (5 minutes)

### Step 11: Test Everything

1. **Open frontend**: `https://lms-frontend-xxxx.vercel.app`
2. **Try Sign Up**: Create a new account
3. **Try Login**: Login with your account
4. **Check on mobile**: Open same URL on your phone

✅ Everything should work on both laptop and mobile!

---

## 🎯 Your Deployed URLs

- **Frontend**: `https://lms-frontend-xxxx.vercel.app`
- **Backend**: `https://lms-backend-xxxx.vercel.app`
- **Database**: Neon PostgreSQL (managed automatically)

---

## 🐛 Troubleshooting

### Backend deployment fails?
1. Check logs in Vercel dashboard
2. Verify `Root Directory` is set to `backend`
3. Make sure all environment variables are added
4. Check `DATABASE_URL` is correct

### Frontend shows blank page?
1. Check browser console (F12) for errors
2. Verify `REACT_APP_API_URL` is set correctly
3. Make sure it ends with `/api`
4. Try clearing browser cache

### Login/Signup not working?
1. Check backend health: `https://your-backend.vercel.app/api/health`
2. Verify database connection in backend logs
3. Check CORS settings allow your frontend domain
4. Clear browser cookies and try again

### Database connection fails?
1. Verify connection string from Neon is correct
2. Make sure it includes `?sslmode=require` at the end
3. Check Neon dashboard - database should be "Active"
4. Try creating a new connection string in Neon

---

## 📝 Important Notes

### Vercel Free Tier
- ✅ Unlimited deployments
- ✅ 100GB bandwidth/month
- ✅ Automatic HTTPS
- ✅ Global CDN
- ⚠️ Serverless functions timeout after 10 seconds (hobby plan)

### Neon PostgreSQL Free Tier
- ✅ 512 MB storage
- ✅ 10 databases
- ✅ Auto-suspend after inactivity (wakes up automatically)
- ✅ Perfect for development/small projects

### Auto-Deployments
- 🔄 Every push to `main` branch auto-deploys both frontend and backend
- 🌿 Pull requests get preview deployments
- 🔙 Easy rollback to previous versions

---

## 🔧 Update Environment Variables Later

### For Backend:
1. Vercel → `lms-backend` → Settings → Environment Variables
2. Edit variable → Save
3. Deployments → Redeploy

### For Frontend:
1. Vercel → `lms-frontend` → Settings → Environment Variables
2. Edit variable → Save
3. Deployments → Redeploy

⚠️ **Must redeploy after changing environment variables!**

---

## 🚀 Next Steps After Deployment

1. ✅ Set up custom domain (optional)
   - Vercel → Project → Settings → Domains
2. ✅ Enable analytics (optional)
   - Vercel → Project → Analytics
3. ✅ Set up monitoring
   - Check logs regularly in Vercel dashboard
4. ✅ Backup database
   - Neon has automatic backups on paid plans

---

## 💡 Pro Tips

- **Testing**: Always test on mobile after deployment
- **Database**: Neon auto-suspends - first request after inactivity takes 2-3 seconds
- **Logs**: Check Vercel logs if something breaks
- **Updates**: Push to GitHub → Vercel auto-deploys
- **Rollback**: Vercel → Deployments → Click old deployment → "Promote to Production"

---

## 🎉 You're Done!

Your LMS is now fully deployed on Vercel and accessible from anywhere!

**Share your app**:
- Frontend URL: `https://lms-frontend-xxxx.vercel.app`
- Works on laptop ✅
- Works on mobile ✅
- Works anywhere with internet ✅

---

## Need Help?

If something doesn't work:
1. Check Vercel deployment logs for errors
2. Verify all environment variables are correct
3. Test backend health endpoint
4. Check browser console for frontend errors
5. Make sure database is active in Neon dashboard
