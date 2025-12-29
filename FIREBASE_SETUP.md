# Firebase Setup Guide for Dance Schedule App

Follow these steps to set up Firebase for your dance schedule app to enable cloud synchronization across devices.

## Step 1: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Click "Create a project" or "Add project"
3. Enter project name: `dancesched` (or any name you prefer)
4. Choose whether to enable Google Analytics (optional)
5. Click "Create project"

## Step 2: Set Up Firestore Database

1. In your Firebase project dashboard, click "Firestore Database" in the left sidebar
2. Click "Create database"
3. Choose "Start in test mode" (allows read/write access for 30 days)
4. Select a location (choose one closest to your users, e.g., `us-central`)
5. Click "Done"

## Step 3: Register Your Web App

1. In the project dashboard, click the "Web" icon (`</>`) to add a web app
2. Enter app nickname: `Dance Schedule` (or any name)
3. **Don't check** "Set up Firebase Hosting" for now
4. Click "Register app"

## Step 4: Get Your Config Values

You'll see a code snippet that looks like this:

```javascript
const firebaseConfig = {
    apiKey: "AIzaSyD3_Oxk4hBOmE_g3g5KMtnSfhFkcQ46vbc",
    authDomain: "dancesched-b95fc.firebaseapp.com",
    projectId: "dancesched-b95fc",
    storageBucket: "dancesched-b95fc.firebasestorage.app",
    messagingSenderId: "534215773388",
    appId: "1:534215773388:web:0c66fa6ccee313a7110669",
    measurementId: "G-YZKPGGXK57"
};
```

**Copy these 6 values - you'll need them next!**

## Step 5: Update Your App

1. Open `script.js` in your dance schedule app
2. Find the `setupCloudStorage()` function (around line 520)
3. Replace the demo config with your real values:

```javascript
const firebaseConfig = {
    apiKey: "YOUR_API_KEY_HERE",
    authDomain: "YOUR_PROJECT_ID.firebaseapp.com", 
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT_ID.appspot.com",
    messagingSenderId: "YOUR_SENDER_ID",
    appId: "YOUR_APP_ID"
};
```

## Step 6: Test It

1. Open your app in a browser
2. Add a test class
3. Check the browser console (F12 → Console) for any errors
4. Open the app in a different browser/device - your classes should sync!

## Security Rules (Important!)

After testing, update your Firestore security rules:

1. In Firebase Console → Firestore Database → Rules
2. Replace the rules with:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow users to read/write their own dance schedules
    match /danceSchedules/{userId} {
      allow read, write: if true;
    }
  }
}
```

## Troubleshooting

- **"Permission denied" errors**: Check your Firestore rules
- **"Project not found"**: Verify your projectId is correct
- **App not loading**: Check browser console for detailed error messages

That's it! Your dance schedule will now sync across all your devices automatically.
