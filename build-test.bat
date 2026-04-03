@echo off
REM Quick Build Test
echo ====================================
echo   OlinoCheck - Build Test
echo ====================================
echo.

echo Building for production...
call npm run build

if %errorlevel% neq 0 (
    echo.
    echo ❌ Build failed!
    pause
    exit /b %errorlevel%
)

echo.
echo ✅ Build successful!
echo.
echo You can preview with: npm run preview
echo Or deploy with: npm run deploy
pause
