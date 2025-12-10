# Deployment Guide - Quick Start

## 🚀 Option 1: Deploy to Render (Recommended - FREE)

### Backend Deployment

1. **Go to [Render](https://render.com/)** and sign up/login

2. **Click "New +" → "Web Service"**

3. **Connect your GitHub repository**
   - Repository: `amanshah20/LMS`
   - Branch: `main`

4. **Configure:**
   ```
   Name: lms-backend
   Root Directory: backend
   Environment: Node
   Build Command: npm install
   Start Command: node server.js
   ```

5. **Add Environment Variables:**
   ```
   PORT=5000
   JWT_SECRET=your_64_character_random_secret_here
   SESSION_SECRET=your_64_character_random_secret_here
   FRONTEND_URL=https://your-frontend-url.vercel.app
   NODE_ENV=production
   ```

6. **Click "Create Web Service"**
   - Your backend will be live at: `https://lms-backend-xxxx.onrender.com`

### Frontend Deployment

1. **Go to [Vercel](https://vercel.com/)** and sign up/login

2. **Click "Add New..." → "Project"**

3. **Import your GitHub repository**
   - Select `amanshah20/LMS`

4. **Configure:**
   ```
   Framework Preset: Create React App
   Root Directory: frontend
   Build Command: npm run build
   Output Directory: build
   ```

5. **Add Environment Variable:**
   ```
   REACT_APP_API_URL=https://lms-backend-xxxx.onrender.com
   ```
   (Use your Render backend URL)

6. **Click "Deploy"**
   - Your frontend will be live at: `https://lms-xxxx.vercel.app`

7. **Update Backend FRONTEND_URL**
   - Go back to Render
   - Update `FRONTEND_URL` environment variable with your Vercel URL
   - Restart the backend service

---

## 🚀 Option 2: Deploy to Heroku

### Prerequisites
```bash
# Install Heroku CLI
npm install -g heroku
heroku login
```

### Backend Deployment

```bash
cd backend

# Create Heroku app
heroku create lms-backend-your-name

# Set environment variables
heroku config:set JWT_SECRET=your_secret
heroku config:set SESSION_SECRET=your_secret
heroku config:set NODE_ENV=production

# Deploy
git init
git add .
git commit -m "Deploy backend"
heroku git:remote -a lms-backend-your-name
git push heroku main

# View logs
heroku logs --tail
```

### Frontend Deployment

```bash
cd frontend

# Update .env with backend URL
echo "REACT_APP_API_URL=https://lms-backend-your-name.herokuapp.com" > .env.production

# Build
npm run build

# Deploy to Vercel or Netlify (see Option 1)
```

---

## 🚀 Option 3: Deploy to Railway

### Backend

1. Go to [Railway.app](https://railway.app/)
2. Click "Start a New Project"
3. Select "Deploy from GitHub repo"
4. Choose your repository
5. Add environment variables
6. Deploy!

---

## 📋 Post-Deployment Checklist

After deployment:

- [ ] Backend is accessible (test: `https://your-backend-url/health`)
- [ ] Frontend loads correctly
- [ ] Can create admin account
- [ ] Can login as student/teacher
- [ ] File uploads work
- [ ] Database persists data
- [ ] CORS configured correctly

---

## 🔧 Environment Variables Reference

### Backend (.env)
```env
PORT=5000
NODE_ENV=production
JWT_SECRET=<64-char-random-string>
SESSION_SECRET=<64-char-random-string>
FRONTEND_URL=https://your-frontend-url.vercel.app
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_CALLBACK_URL=https://your-backend-url/api/auth/google/callback
```

### Frontend (.env.production)
```env
REACT_APP_API_URL=https://your-backend-url.onrender.com
```

---

## 🐛 Troubleshooting

### CORS Errors
- Ensure `FRONTEND_URL` in backend matches your frontend URL exactly
- Restart backend after changing environment variables

### Database Not Persisting
- On Render: Add persistent disk storage
- Or migrate to PostgreSQL (free on Render)

### File Uploads Not Working
- Configure persistent storage
- Or use cloud storage (AWS S3, Cloudinary)

---

## 📞 Need Help?

- Backend URL: Check Render/Heroku dashboard
- Frontend URL: Check Vercel dashboard
- Logs: Use platform-specific log viewers

Your LMS is now LIVE! 🎉
