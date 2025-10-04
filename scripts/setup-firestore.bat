@echo off
setlocal enabledelayedexpansion

echo 🔥 Focus25 Firestore Setup
echo ==========================
echo.

REM Check if Node.js is installed
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js is not installed. Please install Node.js first.
    echo    Download from: https://nodejs.org/
    pause
    exit /b 1
)

REM Check if we're in the right directory
if not exist package.json (
    echo ❌ Please run this script from the Focus25 project root directory
    pause
    exit /b 1
)

for /f %%i in ('node --version') do echo ✅ Node.js found: %%i

REM Check for service account key
set SERVICE_ACCOUNT_FOUND=false
set SERVICE_ACCOUNT_FILES=service-account-key.json firebase-service-account.json serviceAccountKey.json

for %%f in (%SERVICE_ACCOUNT_FILES%) do (
    if exist "%%f" (
        echo ✅ Service account key found: %%f
        set SERVICE_ACCOUNT_FOUND=true
        goto :found_key
    )
)

:found_key
if "%SERVICE_ACCOUNT_FOUND%"=="false" (
    echo.
    echo ❌ Firebase service account key not found!
    echo.
    echo 📋 Setup Instructions:
    echo 1. Go to Firebase Console → Project Settings → Service accounts
    echo 2. Click 'Generate new private key'
    echo 3. Save the JSON file as 'service-account-key.json' in this directory
    echo 4. Run this script again
    echo.
    echo Expected file locations:
    for %%f in (%SERVICE_ACCOUNT_FILES%) do echo   - %%f
    pause
    exit /b 1
)

REM Create scripts directory if it doesn't exist
if not exist scripts mkdir scripts

REM Install dependencies for the setup script
echo.
echo 📦 Installing script dependencies...
cd scripts
npm install firebase-admin@^12.0.0 --no-save --silent
cd ..

echo ✅ Dependencies installed

REM Run the setup script
echo.
echo 🚀 Running Firestore setup script...
node scripts/setupFirestore.js

echo.
echo 🎉 Setup script completed!
echo.
echo Next steps:
echo 1. Check Firebase Console → Firestore → Data
echo 2. Apply the security rules from firestore.rules  
echo 3. Test your app's cloud sync functionality
echo.
pause