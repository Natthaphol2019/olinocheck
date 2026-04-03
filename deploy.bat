@echo off
REM Build and Deploy to Vercel
echo ====================================
echo   OlinoCheck - Build & Deploy
echo ====================================
echo.

echo Step 1: Building for production...
call npm run build

if %errorlevel% neq 0 (
    echo.
    echo ❌ Build failed! Please fix the errors above.
    pause
    exit /b %errorlevel%
)

echo.
echo ✅ Build successful!
echo.
echo Step 2: Deploying to Vercel...
echo.

call vercel --prod

echo.
echo ====================================
echo   Deployment Complete!
echo ====================================
pause
