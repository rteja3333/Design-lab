import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, initializeFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import firebaseCompat from 'firebase/compat/app';
import 'firebase/compat/auth';

// Firebase configuration
// Replace these values with your Firebase project configuration
// You can find these in Firebase Console -> Project Settings -> General -> Your apps
export const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || 'YOUR_API_KEY',
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || 'YOUR_PROJECT_ID.firebaseapp.com',
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || 'YOUR_PROJECT_ID',
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || 'YOUR_PROJECT_ID.appspot.com',
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || 'YOUR_MESSAGING_SENDER_ID',
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || 'YOUR_APP_ID'
};

export const firebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig);

if (!firebaseCompat.apps.length) {
  firebaseCompat.initializeApp(firebaseConfig);
}

export const firebaseAuth = firebaseCompat.auth();
let firestoreInstance;
try {
  firestoreInstance = initializeFirestore(firebaseApp, {
    experimentalForceLongPolling: true,
    useFetchStreams: false,
  });
} catch (error) {
  firestoreInstance = getFirestore(firebaseApp);
}

export const firebaseDb = firestoreInstance;
export const firebaseStorage = getStorage(firebaseApp);

// Instructions to get Firebase configuration:
// 1. Go to https://console.firebase.google.com/
// 2. Create a new project or select existing project
// 3. Click on "Add app" and select "Web" 
// 4. Register your app with name "CrowdSpot"
// 5. Copy the configuration object and replace the values above
// 6. Enable Authentication with Phone provider
// 7. Create Firestore Database
// 8. Set up Firebase Storage
// 9. Enable Cloud Messaging for push notifications