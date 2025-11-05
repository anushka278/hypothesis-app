# Firebase Setup for App Suggestions

This feature requires Firebase/Firestore to save user app suggestions. Follow these steps to set it up:

## 1. Install Firebase

```bash
npm install firebase
```

## 2. Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project (or use an existing one)
3. Enable Firestore Database:
   - Go to "Firestore Database" in the left sidebar
   - Click "Create database"
   - Start in **production mode** (or test mode for development)
   - Choose a location for your database

## 3. Get Firebase Configuration

1. In Firebase Console, go to Project Settings (gear icon)
2. Scroll down to "Your apps" section
3. Click the web icon (`</>`) to add a web app
4. Register your app (give it a nickname)
5. Copy the Firebase configuration object

## 4. Add Environment Variables

Add these to your `.env.local` file:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key-here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-messaging-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id
```

Replace all values with your actual Firebase configuration.

## 5. Set Up Firestore Security Rules (Important!)

In Firebase Console → Firestore Database → Rules, add:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow public read/write to app suggestions (for demo - you may want to restrict this)
    match /artifacts/{appId}/public/data/app_suggestions/{suggestionId} {
      allow read: if true;
      allow create: if request.resource.data.appName is string 
                    && request.resource.data.appName.size() > 0
                    && request.resource.data.suggestedAt == request.time;
    }
  }
}
```

**Note:** For production, you may want to add authentication checks or rate limiting.

## 6. Restart Your Dev Server

```bash
npm run dev
```

## 7. Test It

1. Go to Settings → Connect My Data → Add App
2. Click "Suggest an App..."
3. Enter an app name (e.g., "Whoop")
4. Submit and verify the suggestion appears in Firestore

## 8. View Suggestions

In Firebase Console → Firestore Database, navigate to:
```
artifacts/default/public/data/app_suggestions
```

You'll see all user suggestions with their app names and timestamps.

## Troubleshooting

**Error: "Firebase is not installed"**
- Run: `npm install firebase`

**Error: "Firebase is not configured"**
- Check that all `NEXT_PUBLIC_FIREBASE_*` variables are set in `.env.local`
- Restart your dev server after adding environment variables

**Error: "Permission denied"**
- Check your Firestore security rules
- Make sure the collection path matches: `artifacts/{appId}/public/data/app_suggestions`

**Suggestions not appearing in Firestore**
- Check browser console for errors
- Verify Firestore is enabled in Firebase Console
- Check network tab to see if the API call is being made

