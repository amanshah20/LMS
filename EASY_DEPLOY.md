# 🚀 Simple Deployment Guide (No Render/Vercel Required!)

## ✅ Easiest Options - Choose ONE:

### Option 1: GitHub Pages (Frontend) + Railway (Backend)
**Best for**: Quick deployment, free tier available

#### Frontend on GitHub Pages (100% Free):
1. Go to your repository: https://github.com/amanshah20/LMS
2. Click **Settings** → **Pages** (left sidebar)
3. Under "Build and deployment":
   - Source: **GitHub Actions**
4. Push any code to main branch
5. **Your site will be live at**: `https://amanshah20.github.io/LMS/`

#### Backend on Railway (Free $5/month credit):
1. Go to: https://railway.app
2. Click **"Start a New Project"**
3. Select **"Deploy from GitHub repo"**
4. Choose **amanshah20/LMS**
5. Click **"Add Variables"** and set:
   ```
   NODE_ENV=production
   JWT_SECRET=your-secret-key-here
   PORT=5000
   ```
6. In Settings → set **Root Directory** to: `backend`
7. Click **"Deploy"**
8. Copy the generated URL (e.g., `https://lms-production.up.railway.app`)

#### Connect Frontend to Backend:
1. Go to repository Settings → Secrets → Actions
2. Add secret: `BACKEND_URL` = your Railway URL
3. Push any change to trigger redeployment

---

### Option 2: Netlify (Frontend + Backend Functions)
**Best for**: All-in-one solution

1. Go to: https://netlify.com
2. Click **"Add new site"** → **"Import an existing project"**
3. Connect GitHub and select **amanshah20/LMS**
4. Build settings:
   - Base directory: `frontend`
   - Build command: `npm run build`
   - Publish directory: `frontend/build`
5. Click **"Deploy site"**
6. Your site will be live at: `https://your-site-name.netlify.app`

For backend, you can use Netlify Functions or keep using Railway.

---

### Option 3: Heroku (Both Frontend & Backend)
**Best for**: Traditional deployment

#### Backend:
```powershell
# Install Heroku CLI first: https://devcenter.heroku.com/articles/heroku-cli
heroku login
heroku create lms-backend-app
git subtree push --prefix backend heroku main
heroku open
```

#### Frontend:
```powershell
heroku create lms-frontend-app
git subtree push --prefix frontend heroku main
heroku config:set REACT_APP_API_URL=https://lms-backend-app.herokuapp.com
heroku open
```

---

### Option 4: Deploy Locally (No Cloud Needed)
**Best for**: Testing/development

#### Backend:
```powershell
cd backend
npm install
npm start
```
Backend runs at: http://localhost:5000

#### Frontend:
```powershell
cd frontend
npm install
npm start
```
Frontend runs at: http://localhost:3000

---

## 🎯 Recommended: GitHub Pages + Railway

This is the **EASIEST** and **FREE** option:

### Step-by-Step (5 minutes):

1. **Enable GitHub Pages**:
   - Repository → Settings → Pages
   - Source: GitHub Actions
   - Done! ✅

2. **Deploy Backend to Railway**:
   - Go to https://railway.app
   - Login with GitHub
   - New Project → Deploy from GitHub
   - Select amanshah20/LMS
   - Set root directory: `backend`
   - Add environment variables
   - Deploy! ✅

3. **Connect them**:
   - Copy Railway backend URL
   - GitHub repo → Settings → Secrets → Actions
   - New secret: `BACKEND_URL` = Railway URL
   - Push code to trigger GitHub Pages deployment ✅

**That's it!** Your app will be live in 5 minutes.

---

## 🔧 Current GitHub Actions Workflows:

We now have **3 workflows**:

1. **`deploy.yml`** - Original (Render + Vercel) - requires secrets
2. **`deploy-github-pages.yml`** - NEW! Frontend to GitHub Pages
3. **`deploy-railway.yml`** - NEW! Backend to Railway

### Disable Old Workflow (Optional):
If you want to use GitHub Pages + Railway instead of Render + Vercel:

```powershell
# Rename the old workflow to disable it
git mv .github/workflows/deploy.yml .github/workflows/deploy.yml.disabled
git add .
git commit -m "chore: disable Render/Vercel workflow"
git push origin main
```

---

## 🆓 Cost Comparison:

| Platform | Frontend | Backend | Total/Month |
|----------|----------|---------|-------------|
| **GitHub Pages + Railway** | Free | $5 credit (free) | **$0** |
| Netlify | Free | Free | $0 |
| Render + Vercel | Free | Free (limited) | $0 |
| Heroku | $7 | $7 | $14 |

---

## 🎉 Quick Start (GitHub Pages + Railway):

```powershell
# 1. Enable GitHub Pages (do this in browser)
# Go to: https://github.com/amanshah20/LMS/settings/pages
# Set source to: GitHub Actions

# 2. Push this commit (triggers GitHub Pages deploy)
git add .
git commit -m "feat: add GitHub Pages and Railway deployment"
git push origin main

# 3. Deploy backend to Railway (do this in browser)
# Go to: https://railway.app
# Deploy from GitHub → amanshah20/LMS → Set root: backend

# 4. Add backend URL secret
# Go to: https://github.com/amanshah20/LMS/settings/secrets/actions
# Add: BACKEND_URL = your-railway-url
```

**Your frontend will be live at**: `https://amanshah20.github.io/LMS/`

---

## 📞 Need Help?

- GitHub Pages not working? Check: https://github.com/amanshah20/LMS/actions
- Railway issues? Check: https://railway.app/dashboard
- Frontend can't connect to backend? Verify `BACKEND_URL` secret is set correctly

---

## 🔄 Auto-Deployment:

- **Frontend**: Every push to `main` auto-deploys to GitHub Pages via workflow
- **Backend**: Railway auto-deploys on every push to `main` (once connected)

No manual steps needed after initial setup! 🎯
