# 🚀 GitHub Actions Auto-Deployment Setup

## ✅ What's Been Created

I've set up **automatic deployment** for your LMS project using GitHub Actions!

### Files Created:
- `.github/workflows/deploy.yml` - Auto-deploys on push to main
- `.github/workflows/manual-deploy.yml` - Manual deployment trigger

---

## 📋 Setup Instructions (5 minutes)

### Step 1: Deploy Backend to Render

1. **Go to [Render.com](https://render.com)** and sign in with GitHub

2. **Create New Web Service:**
   - Click "New +" → "Web Service"
   - Connect repository: `amanshah20/LMS`
   - Name: `lms-backend`
   - Root Directory: `backend`
   - Build Command: `npm install`
   - Start Command: `node server.js`

3. **Add Environment Variables:**
   ```
   PORT=5000
   NODE_ENV=production
   JWT_SECRET=<generate-random-64-char-string>
   SESSION_SECRET=<generate-random-64-char-string>
   FRONTEND_URL=https://your-frontend.vercel.app
   ```

4. **Get Deploy Hook:**
   - Go to Settings → Deploy Hook
   - Copy the webhook URL
   - Save it for Step 3

### Step 2: Deploy Frontend to Vercel

1. **Go to [Vercel.com](https://vercel.com)** and sign in with GitHub

2. **Import Project:**
   - Click "Add New..." → "Project"
   - Select `amanshah20/LMS`
   - Root Directory: `frontend`
   - Framework: Create React App
   - Build Command: `npm run build`

3. **Add Environment Variable:**
   ```
   REACT_APP_API_URL=https://lms-backend-xxxx.onrender.com
   ```
   (Use your Render backend URL from Step 1)

4. **Deploy!**

5. **Get Vercel Token:**
   - Go to Settings → Tokens
   - Create new token
   - Copy it for Step 3

6. **Get Project IDs:**
   - Go to Project Settings → General
   - Copy "Project ID"
   - Copy "Org ID" (from account settings)

### Step 3: Configure GitHub Secrets

1. **Go to your GitHub repository:**
   https://github.com/amanshah20/LMS

2. **Navigate to:**
   Settings → Secrets and variables → Actions

3. **Add these secrets:**

   Click "New repository secret" for each:

   ```
   Name: RENDER_DEPLOY_HOOK_BACKEND
   Value: <paste-render-webhook-url>

   Name: BACKEND_URL
   Value: https://lms-backend-xxxx.onrender.com

   Name: FRONTEND_URL
   Value: https://lms-xxxx.vercel.app

   Name: VERCEL_TOKEN
   Value: <paste-vercel-token>

   Name: VERCEL_ORG_ID
   Value: <paste-org-id>

   Name: VERCEL_PROJECT_ID
   Value: <paste-project-id>
   ```

---

## 🎯 How It Works

### Automatic Deployment (deploy.yml)
When you push code to `main` branch:
1. ✅ Tests backend & frontend
2. ✅ Builds frontend
3. 🚀 Auto-deploys to Render (backend)
4. 🚀 Auto-deploys to Vercel (frontend)

### Manual Deployment (manual-deploy.yml)
You can manually trigger deployment:
1. Go to Actions tab on GitHub
2. Select "Manual Deploy"
3. Click "Run workflow"
4. Choose environment and deploy!

---

## 🔥 After Setup - Usage

### Every Time You Push Code:

```bash
git add .
git commit -m "your changes"
git push origin main
```

GitHub Actions will automatically:
- ✅ Test your code
- ✅ Build frontend
- 🚀 Deploy backend to Render
- 🚀 Deploy frontend to Vercel

**View Progress:**
- Go to: https://github.com/amanshah20/LMS/actions
- See real-time deployment status

---

## 📊 Monitoring Deployments

### Check Status:
1. **GitHub Actions:** https://github.com/amanshah20/LMS/actions
2. **Render Dashboard:** https://dashboard.render.com
3. **Vercel Dashboard:** https://vercel.com/dashboard

### View Logs:
- GitHub Actions: Click on any workflow run
- Render: Click service → Logs
- Vercel: Click deployment → View Function Logs

---

## 🐛 Troubleshooting

### Deployment Fails?

**Check:**
1. All GitHub secrets are added correctly
2. Render service is running
3. Vercel project is connected
4. Environment variables are set

**Fix:**
- Go to Actions tab → Failed workflow
- Click on failed step to see error
- Fix the issue and push again

### Secrets Not Working?

Double-check the secret names match exactly:
- `RENDER_DEPLOY_HOOK_BACKEND`
- `VERCEL_TOKEN`
- `VERCEL_ORG_ID`
- `VERCEL_PROJECT_ID`

---

## ✅ Quick Test

After setup, test the deployment:

```bash
# Make a small change
echo "# Test deployment" >> README.md

# Commit and push
git add README.md
git commit -m "test: verify auto-deployment"
git push origin main

# Watch deployment
# Go to: https://github.com/amanshah20/LMS/actions
```

You should see:
- ✅ Green checkmark when successful
- 🚀 Live updates on Render & Vercel

---

## 🎉 That's It!

Your LMS now has **automatic deployment**!

Every code push = automatic deployment to production 🚀

**Your Live URLs:**
- Frontend: https://lms-xxxx.vercel.app
- Backend: https://lms-backend-xxxx.onrender.com

---

## 📞 Need Help?

- Check Actions tab for error logs
- Review Render/Vercel dashboards
- Verify all secrets are set correctly
