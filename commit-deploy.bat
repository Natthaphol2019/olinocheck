@echo off
REM Commit, Push to GitHub, and Deploy to Vercel
echo ====================================
echo   Commit, Push ^& Deploy
echo ====================================
echo.

REM Check if there are changes
git status --porcelain
if %errorlevel% equ 0 (
    echo No changes to commit.
    pause
    exit /b 0
)

REM Step 1: Get commit message
set /p COMMIT_MSG="Enter commit message: "

if "%COMMIT_MSG%"=="" (
    set COMMIT_MSG=Update
)

echo.
echo Step 1: Adding files...
git add .

echo.
echo Step 2: Committing...
git commit -m "%COMMIT_MSG%"

if %errorlevel% neq 0 (
    echo.
    echo ❌ Commit failed!
    pause
    exit /b %errorlevel%
)

echo.
echo Step 3: Pushing to GitHub...
git push origin main

if %errorlevel% neq 0 (
    echo.
    echo ❌ Push failed!
    pause
    exit /b %errorlevel%
)

echo.
echo ✅ Pushed to GitHub successfully!
echo.
echo Step 4: Deploying to Vercel...
echo.

call vercel --prod

echo.
echo ====================================
echo   All Done!
echo ====================================
pause
