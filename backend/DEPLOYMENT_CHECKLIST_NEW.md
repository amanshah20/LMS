# ✅ Pre-Deployment Checklist

## Before You Deploy

### 1. Verify Vercel Environment Variables
- [ ] Go to Vercel Dashboard → Your Project → Settings → Environment Variables
- [ ] Check DATABASE_URL is set (should start with `postgresql://`)
- [ ] Check NODE_ENV is set to `production`
- [ ] Check JWT_SECRET is set
- [ ] Check SESSION_SECRET is set
- [ ] Check FRONTEND_URL is set (your Netlify URL)

### 2. Verify Database is Active
- [ ] Log into your Neon dashboard
- [ ] Check database status is "Active" (not suspended)
- [ ] If suspended, run any query to wake it up

### 3. Commit Changes
```powershell
git add .
git commit -m "Fix: Resolve FUNCTION_INVOCATION_FAILED error permanently"
git push
```

### 4. Deploy
```powershell
cd g:\Semester-7\Capstone_Project\backend
vercel --prod
```

### 5. Test After Deployment
- [ ] Test health check: `https://[your-backend].vercel.app/api/health`
  - Should show `"dbConnected": true`
- [ ] Test any API endpoint
  - Should NOT show FUNCTION_INVOCATION_FAILED
- [ ] Check logs: `vercel logs --follow`
  - Should see "Database Connected Successfully"

---

## If Still Having Issues

### Check These:

1. **Vercel Logs**
   ```powershell
   vercel logs [deployment-url]
   ```
   Look for specific error messages

2. **Database URL Format**
   Must be: `postgresql://username:password@host:port/database?sslmode=require`

3. **Database Active**
   Neon free tier suspends after 5 minutes of inactivity
   First request will be slower (5-10 seconds)

4. **Environment Variables**
   Make sure they're set for "Production" environment in Vercel

---

## Expected Behavior

### ✅ Success:
- First request: 5-10 seconds (cold start + DB connection)
- Subsequent requests: < 1 second
- Health check shows: `"dbConnected": true`
- No FUNCTION_INVOCATION_FAILED errors

### ❌ Still Failing:
- Check Vercel logs for specific error
- Verify DATABASE_URL is correct
- Confirm database is not suspended
- Check firewall/network settings

---

**All fixes are ready! Deploy now and the error should be gone permanently!** 🎉
