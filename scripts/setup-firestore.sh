#!/bin/bash

# Focus25 Firestore Setup Script
# This script sets up the complete Firestore database structure

echo "🔥 Focus25 Firestore Setup"
echo "=========================="
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    echo "   Download from: https://nodejs.org/"
    exit 1
fi

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Please run this script from the Focus25 project root directory"
    exit 1
fi

echo "✅ Node.js found: $(node --version)"

# Check for service account key
SERVICE_ACCOUNT_FILES=(
    "service-account-key.json"
    "firebase-service-account.json" 
    "serviceAccountKey.json"
)

SERVICE_ACCOUNT_FOUND=false
for file in "${SERVICE_ACCOUNT_FILES[@]}"; do
    if [ -f "$file" ]; then
        echo "✅ Service account key found: $file"
        SERVICE_ACCOUNT_FOUND=true
        break
    fi
done

if [ "$SERVICE_ACCOUNT_FOUND" = false ]; then
    echo ""
    echo "❌ Firebase service account key not found!"
    echo ""
    echo "📋 Setup Instructions:"
    echo "1. Go to Firebase Console → Project Settings → Service accounts"
    echo "2. Click 'Generate new private key'"
    echo "3. Save the JSON file as 'service-account-key.json' in this directory"
    echo "4. Run this script again"
    echo ""
    echo "Expected file locations:"
    for file in "${SERVICE_ACCOUNT_FILES[@]}"; do
        echo "  - $file"
    done
    exit 1
fi

# Create scripts directory if it doesn't exist
mkdir -p scripts

# Install dependencies for the setup script
echo ""
echo "📦 Installing script dependencies..."
cd scripts
npm install firebase-admin@^12.0.0 --no-save --silent
cd ..

echo "✅ Dependencies installed"

# Run the setup script
echo ""
echo "🚀 Running Firestore setup script..."
node scripts/setupFirestore.js

echo ""
echo "🎉 Setup script completed!"
echo ""
echo "Next steps:"
echo "1. Check Firebase Console → Firestore → Data"
echo "2. Apply the security rules from firestore.rules"
echo "3. Test your app's cloud sync functionality"