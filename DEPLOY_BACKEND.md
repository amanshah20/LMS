# Railway Deployment for Backend

## Quick Deploy to Railway (5 minutes)

1. **Go to Railway**: https://railway.app
2. **Sign in with GitHub**
3. **Click "New Project"**
4. **Select "Deploy from GitHub repo"**
5. **Choose**: amanshah20/LMS
6. **Click Settings** → **Root Directory**: `backend`
7. **Click Variables** → Add these:
   ```
   NODE_ENV=production
   JWT_SECRET=your-super-secret-key-change-this
   PORT=5000
   ```
8. **Railway will give you a URL** like: `https://lms-production-xxxx.up.railway.app`

## Update Netlify with Backend URL

1. **Go to Netlify**: https://app.netlify.com
2. **Your site** → Site settings → Environment variables
3. **Add variable**:
   - Key: `REACT_APP_API_URL`
   - Value: `https://your-railway-url.up.railway.app/api`
4. **Redeploy** → Site overview → Trigger deploy → Deploy site

Done! Now mobile and laptop will both work! 🎉

## Backend URL Examples
- Railway: `https://lms-production-xxxx.up.railway.app/api`
- Render: `https://your-app.onrender.com/api`
- Heroku: `https://your-app.herokuapp.com/api`
