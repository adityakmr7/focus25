# 🔥 Focus25 Improved Firestore Setup Guide

This guide will help you set up the improved Firestore database structure with subcollections for better performance, scalability, and pro user features.

## 📋 Prerequisites

1. **Node.js** installed (version 14 or higher)
2. **Firebase project** created in [Firebase Console](https://console.firebase.google.com)
3. **Authentication enabled** (Google and/or Apple Sign-In)
4. **Service account key** from Firebase Console

## 🚀 Quick Setup (Automated)

### Step 1: Get Firebase Service Account Key

1. Go to [Firebase Console](https://console.firebase.google.com) → Your Project
2. **Project Settings** → **Service accounts** tab
3. Click **"Generate new private key"**
4. Save the JSON file as `service-account-key.json` in your project root

### Step 2: Run Setup Script

**macOS/Linux:**

```bash
./setup-firestore.sh
```

**Windows:**

```batch
setup-firestore.bat
```

**Manual:**

```bash
cd scripts
npm install firebase-admin
node setupFirestore.js
```

## 📊 What Gets Created

The script creates the following Firestore structure:

### Collections

#### 📁 `users` Collection

```javascript
{
  uid: "user_123",
  email: "user@example.com",
  displayName: "John Doe",
  photoURL: "https://...",
  isPro: false,
  provider: "google",
  createdAt: Timestamp,
  lastSignIn: Timestamp
}
```

#### 📁 `userData` Collection

```javascript
{
  statistics: [
    {
      date: "2024-12-13",
      totalCount: 5,
      flows: { started: 5, completed: 4, minutes: 100 },
      breaks: { started: 4, completed: 4, minutes: 20 },
      interruptions: 2,
      sessions: [...],
      productivityScore: 88,
      focusQuality: "excellent"
    }
  ],
  flowMetrics: {
    currentStreak: 4,
    bestStreak: 12,
    totalFocusMinutes: 450,
    // ... more metrics
  },
  settings: {
    timeDuration: 25,
    breakDuration: 5,
    soundEffects: true,
    // ... app settings
  },
  theme: {
    mode: "auto",
    primaryColor: "#007AFF",
    customThemes: [...],
    // ... theme data
  },
  todos: [
    {
      id: "todo_123",
      text: "Complete task",
      completed: false,
      priority: "high"
    }
  ],
  lastSync: Timestamp,
  version: "1.5.0",
  deviceInfo: {...}
}
```

## 🔒 Security Rules

After running the script, apply these rules in **Firebase Console → Firestore → Rules**:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only access their own profile
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }

    // Users can only access their own app data
    match /userData/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

## ✅ Verification Steps

### 1. Check Firebase Console

- Go to **Firestore Database → Data**
- Verify `users` and `userData` collections exist
- Check sample data structure matches above

### 2. Test App Integration

1. **Sign in** to your app (Google/Apple)
2. Go to **Settings** → **Data & Sync**
3. Try **"Backup to Cloud"** - should show success
4. Check Firebase Console for your user's data
5. Try **"Restore from Cloud"** - should work without errors

### 3. Debug Menu (Development Only)

In development mode, you'll see a **"🔧 Firestore Debug"** option in Settings → Danger Zone:

- **Show Status**: Check connection and auth
- **Setup Sample Data**: Create test data
- **Test Security Rules**: Verify permissions
- **Clear All Data**: Remove test data

## 🛠️ Manual Setup (Alternative)

If the automated script doesn't work, you can set up manually:

### 1. Create Firestore Database

1. Firebase Console → **Firestore Database**
2. **Create database** → **Production mode**
3. Choose your region

### 2. Create Collections

1. Create collection: `users`
2. Create collection: `userData`
3. Add sample documents using the structure above

### 3. Apply Security Rules

Copy the rules from above into **Firestore → Rules**

## 🐛 Troubleshooting

### ❌ "Permission denied"

- **Fix**: Check security rules are published correctly
- **Check**: User is signed in and UID matches

### ❌ "Service account key not found"

- **Fix**: Download service account key from Firebase Console
- **Save as**: `service-account-key.json` in project root

### ❌ "Firestore not configured"

- **Fix**: Create Firestore database in Firebase Console first
- **Check**: Database is in production mode

### ❌ "Network error"

- **Fix**: Check internet connection
- **Check**: Firebase project ID is correct

### ❌ "Module not found"

- **Fix**: Run `npm install` in scripts directory
- **Check**: Node.js version 14+ installed

## 📁 Generated Files

The script creates these files:

- `firestore.rules` - Security rules for manual application
- `firestore.indexes.json` - Performance indexes
- `scripts/node_modules/` - Script dependencies

## 🔄 Data Sync Flow

Once set up, the sync flow works like this:

1. **User signs in** → Profile created in `users` collection
2. **"Backup to Cloud"** → App data saved to `userData` collection
3. **"Restore from Cloud"** → Data downloaded from `userData` collection
4. **Cross-device sync** → Same user can access data on multiple devices

## 🎯 Next Steps

After successful setup:

1. **Test thoroughly** on different devices
2. **Monitor usage** in Firebase Console → Usage
3. **Set up billing alerts** if needed
4. **Deploy to production** with confidence

## 📞 Support

If you encounter issues:

1. Check the **troubleshooting section** above
2. Look at **console logs** in your app
3. Verify **Firebase Console** settings
4. Use the **debug menu** in development mode

---

🎉 **Congratulations!** Your Focus25 app now has full cloud sync capabilities!
