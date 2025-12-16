# Vercel Environment Variables Setup

## Required Environment Variables for Production

Add these environment variables in your Vercel project settings:

### Critical - Must Set These:

```
NODE_ENV=production
DATABASE_URL=postgresql://neondb_owner:npg_BuKZOrXckP82@ep-shiny-feather-a17addae-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
JWT_SECRET=7c321bd1791e38f2ae2de0cdbed824da459a492184a562d13d308e483677889c
SESSION_SECRET=fdd5445efe07afbb8375ccd497633a7c1e777eed062e446c1f8ae9003e87bb8f
FRONTEND_URL=https://your-frontend-url.netlify.app
```

### Optional (if using these features):

```
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_CALLBACK_URL=https://your-backend.vercel.app/api/auth/google/callback
OPENAI_API_KEY=your_openai_api_key_here
```

## How to Add Environment Variables in Vercel:

1. Go to your project: https://vercel.com/amans-projects-44c9f6a5/lms-natq
2. Click **Settings** tab
3. Click **Environment Variables** in the left sidebar
4. Add each variable:
   - Variable Name: `NODE_ENV`
   - Value: `production`
   - Environment: Select all (Production, Preview, Development)
5. Click **Save**
6. Repeat for all other variables

## Important Notes:

⚠️ **File Uploads**: Currently file uploads (assignments, profiles, voice messages) use local filesystem which **won't work on Vercel**. Files will be lost after function execution. You need to:
- Implement Cloudinary for images/audio
- Or use Vercel Blob Storage
- Or use AWS S3

⚠️ **Sessions**: Google OAuth is disabled in production as sessions don't persist in serverless. Only JWT-based authentication will work.

⚠️ **Database**: Using Neon PostgreSQL with connection pooling enabled.

## After Setting Environment Variables:

Trigger a redeployment:
```bash
git commit --allow-empty -m "Trigger redeployment"
git push origin main
```

Or use the "Redeploy" button in Vercel dashboard.
