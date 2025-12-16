@echo off
echo ========================================
echo   Deploying Backend to Vercel
echo ========================================
echo.

echo Checking for changes...
git status

echo.
echo Installing dependencies...
call npm install

echo.
echo Running deployment...
call vercel --prod

echo.
echo ========================================
echo   Deployment Complete!
echo ========================================
echo.
echo Check your deployment at:
echo https://vercel.com/dashboard
echo.
echo View logs with:
echo vercel logs --follow
echo.
pause
