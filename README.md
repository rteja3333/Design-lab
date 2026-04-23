# CrowdSpot

Community-powered mobile app for issue reporting and admin request management.

Tech stack: React Native (Expo), Firebase Auth, Firestore, Storage, AsyncStorage.

## 1) Prerequisites

- Node.js 18+ (recommended)
- npm
- Expo CLI (optional globally): `npm install -g expo-cli`
- Android Studio (Android) or Xcode (iOS)
- Firebase project with:
  - Authentication (Phone)
  - Firestore Database
  - Firebase Storage

## 2) Clone the repository

```bash
git clone https://github.com/rteja3333/Design-lab.git
cd "design lab"
```

## 3) Install dependencies

```bash
npm install
```

## 4) Create environment file

Create `.env` in project root and copy values from your Firebase project:

```dotenv
EXPO_PUBLIC_FIREBASE_API_KEY=<your_api_key>
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=<project>.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=<project_id>
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=<project>.firebasestorage.app
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=<sender_id>
EXPO_PUBLIC_FIREBASE_APP_ID=<app_id>

EXPO_PROJECT_ID=<expo_project_id>
GOOGLE_MAPS_API_KEY=<google_maps_key_optional>
```

## 5) Firebase setup

1. Open [Firebase Console](https://console.firebase.google.com).
2. Create/select project.
3. Enable **Phone Authentication**.
4. Create **Firestore** database.
5. Create **Storage** bucket.

Optional (if Firebase CLI is configured):

```bash
firebase deploy --only firestore:rules
firebase deploy --only storage
```

## 6) Run the app

Start Expo:

```bash
npm start
```

Run on specific platform:

```bash
npm run android
npm run ios
npm run web
```

## 7) Development checks

```bash
npm run lint
npm run type-check
```

## 8) Runtime permissions

App requests:

- Camera
- Foreground location
- Device motion / magnetometer

## 9) Main features

- Phone OTP login
- Report creation with media and location
- Admin request creation and tracking
- Map-based report/request view
- Profile dashboard
- Offline queue for failed report submissions

## License

MIT — see `LICENSE`.