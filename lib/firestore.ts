/**
 * Firestore helper functions
 * 
 * To use this, you need to:
 * 1. Install Firebase: npm install firebase
 * 2. Configure Firebase in your .env.local file
 * 3. Get your Firebase config from https://console.firebase.google.com
 */

// Dynamic imports for Firebase (works in both client and server)
let firebaseApp: any = null;
let firestoreModule: any = null;

async function getFirebaseModules() {
  if (!firebaseApp) {
    try {
      firebaseApp = await import('firebase/app');
      firestoreModule = await import('firebase/firestore');
    } catch (error) {
      throw new Error('Firebase is not installed. Please run: npm install firebase');
    }
  }
  return { firebaseApp, firestoreModule };
}

// Firebase configuration - Replace with your actual config
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || 'your-api-key',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || 'your-auth-domain',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'your-project-id',
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'your-storage-bucket',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || 'your-messaging-sender-id',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || 'your-app-id',
};

let app: any = undefined;
let db: any = undefined;

/**
 * Initialize Firebase (only once)
 */
async function initializeFirebase(): Promise<any> {
  const { firebaseApp } = await getFirebaseModules();
  const { initializeApp, getApps } = firebaseApp;

  if (!app) {
    const existingApps = getApps();
    if (existingApps.length > 0) {
      app = existingApps[0];
    } else {
      app = initializeApp(firebaseConfig);
    }
  }
  return app;
}

/**
 * Get Firestore instance
 */
async function getDb(): Promise<any> {
  if (!db) {
    await initializeFirebase();
    const { firestoreModule } = await getFirebaseModules();
    const { getFirestore } = firestoreModule;
    db = getFirestore(app);
  }
  return db;
}

/**
 * Save an app suggestion to Firestore
 * @param appName The name of the app suggested by the user
 * @param appId Your application ID (for organizing suggestions)
 * @returns Promise<void>
 */
export async function saveAppSuggestion(appName: string, appId: string = 'default'): Promise<void> {
  try {
    if (!isFirebaseConfigured()) {
      throw new Error('Firebase is not configured. Please set up your Firebase credentials in .env.local');
    }

    const firestore = await getDb();
    const { firestoreModule } = await getFirebaseModules();
    const { collection, addDoc, serverTimestamp } = firestoreModule;
    const suggestionsRef = collection(firestore, `artifacts/${appId}/public/data/app_suggestions`);
    
    await addDoc(suggestionsRef, {
      appName: appName.trim(),
      suggestedAt: serverTimestamp(),
    });
  } catch (error: any) {
    console.error('Error saving app suggestion to Firestore:', error);
    // Re-throw with a more helpful message if it's a configuration error
    if (error.message?.includes('not installed') || error.message?.includes('not configured')) {
      throw error;
    }
    throw new Error('Failed to save suggestion to Firestore');
  }
}

/**
 * Check if Firebase is configured
 */
export function isFirebaseConfigured(): boolean {
  return (
    process.env.NEXT_PUBLIC_FIREBASE_API_KEY !== 'your-api-key' &&
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID !== 'your-project-id'
  );
}

