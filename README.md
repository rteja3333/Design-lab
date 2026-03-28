# CrowdSpot

Community-powered, location-based data collection platform. Users report issues in their area; administrators create targeted requests for specific data at specific locations. A guided camera engine walks users through precise, sensor-validated image capture.

Built with React Native 0.81, Expo 54, and Firebase.

---

## Table of Contents

- [Setup and Installation](#setup-and-installation)
- [Key Features](#key-features)
- [UI and Design System](#ui-and-design-system)
- [Screen Flows](#screen-flows)
- [Camera Engine](#camera-engine)
- [Architecture](#architecture)
- [Future Scope](#future-scope)
- [License](#license)

---

## Setup and Installation

### Prerequisites

- Node.js 16+
- Expo CLI (`npm install -g expo-cli`)
- Android Studio (for Android emulator) or Xcode (for iOS simulator)
- A Firebase project with the following enabled:
  - Authentication (Phone provider)
  - Firestore Database
  - Firebase Storage
  - Cloud Messaging

### 1. Clone and install

```bash
git clone <repo-url>
cd Design-lab
npm install
```

### 2. Firebase setup

1. Go to [Firebase Console](https://console.firebase.google.com), create a project (or use an existing one), and register a web app.
2. **Authentication** — Enable Phone sign-in under Authentication > Sign-in method.
3. **Firestore** — Create a database. Deploy the included rules:
   ```bash
   firebase deploy --only firestore:rules
   ```
4. **Storage** — Create a default bucket and configure storage rules.
5. **Cloud Messaging** — Generate a server key (for push notifications in production).

### 3. Environment variables

Create a `.env` file in the project root:

```dotenv
# Firebase
EXPO_PUBLIC_FIREBASE_API_KEY=<your_api_key>
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=<project>.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=<project>
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=<project>.firebasestorage.app
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=<sender_id>
EXPO_PUBLIC_FIREBASE_APP_ID=<app_id>

# Expo
EXPO_PROJECT_ID=<your_expo_project_id>

# Maps (optional)
GOOGLE_MAPS_API_KEY=<your_google_maps_key>
```

### 4. Run

```bash
npm start            # Start Expo dev server
npm run android      # Run on Android
npm run ios          # Run on iOS
npm run web          # Run in browser
```

### 5. Lint and type-check

```bash
npm run lint         # ESLint
npm run type-check   # TypeScript compiler
```

### Permissions

The app requests at runtime:

- **Camera** — for image capture
- **Location (foreground)** — for GPS tagging and guided navigation
- **Device motion & magnetometer** — for compass heading in guided capture

---

## Key Features

### User Features

| Feature | Description |
|---|---|
| **Phone OTP Auth** | Firebase phone authentication with 6-digit OTP, auto-verify, and resend cooldown |
| **Report Creation** | Submit reports with title, description, category, tags, photos/videos, and auto-detected location |
| **Guided Image Capture** | Sensor-fused camera engine that navigates the user to a location, aligns heading, captures, and validates image quality |
| **Normal Image Capture** | Simplified capture flow for ad-hoc reports without GPS/compass validation |
| **Map View** | Google Maps integration with blue (reports) and orange (requests) markers, search, and card previews |
| **Category System** | Category-specific capture guidelines, tag selection, and photo/video requirements |
| **Profile & Stats** | Personal report history, approval stats, and reputation score |
| **Offline Queue** | Reports created offline are queued in AsyncStorage and synced when connectivity returns |

### Admin Features

| Feature | Description |
|---|---|
| **Create Requests** | Define a data collection task with location, radius, target count, category, tags, and expiry |
| **Progress Tracking** | Live progress bar (currentCount / targetCount) on each request |
| **Request Lifecycle** | Requests transition through active → closed / expired states |

---

## UI and Design System

### Design Philosophy

**Eco-minimalist.** Warm neutrals, organic rounded corners, generous whitespace, and calm blue focal points. Card-based layouts with subtle shadows prioritize readability and scannability.

### Color Palette

| Token | Hex | Usage |
|---|---|---|
| Primary | `#2563eb` | CTAs, active states, links |
| Primary Light | `#60a5fa` | Hover/focus states |
| Primary Dark | `#1d4ed8` | Pressed states |
| Secondary | `#6b8f71` | Success, approved, nature accent |
| Warning | `#c4915e` | Pending status, caution |
| Error | `#c2635a` | Rejected, destructive actions |
| Background | `#fafaf8` | App background (warm off-white) |
| Surface | `#f5f5f0` | Cards, elevated surfaces |
| Text Primary | `#1c1b19` | Headlines, body |
| Text Secondary | `#787370` | Captions, metadata |

### Typography

System fonts with a modular scale: `xs(11)` → `sm(13)` → `base(15)` → `lg(17)` → `xl(20)` → `xxl(24)` → `title(28)` → `header(34)`. Uppercase kicker labels use `1.5px` letter spacing.

### Spacing and Radii

- **Spacing:** 4 · 8 · 16 · 24 · 36 · 56 px
- **Border radius:** `sm(8)` · `md(12)` · `lg(16)` · `xl(24)` · `full(999)` (pill buttons)

### Component Patterns

- **Cards** — Rounded containers (`md` radius) with subtle elevation, used for reports, requests, and categories
- **Status Badges** — Color-coded pills (pending/amber, approved/green, rejected/red, active/blue, expired/gray)
- **Bottom Tabs** — 3-tab layout: Home, Map, Profile with Ionicons
- **Shutter Button** — Color-reactive to engine gate state (green = progress, red = regress, yellow = static) with pulsing animation
- **Instruction HUD** — Blurred dark overlay at top of camera with uppercase title and large centered message
- **Dev Overlay** — Slide-out panel showing live GPS, orientation, and engine state (dev mode only)

---

## Screen Flows

### Authentication

```
LoginScreen → OTPVerificationScreen → (App)
```

Phone input with country code validation → 6-digit OTP with auto-focus and 60s resend timer → redirects to main app on success.

### Main Tab Navigation

The app uses a bottom tab navigator with three tabs, each containing its own stack:

```
┌─────────────┬─────────────┬─────────────┐
│   Home Tab  │   Map Tab   │ Profile Tab │
└─────────────┴─────────────┴─────────────┘
```

### Home Tab Stack

```
HomeScreen
  ├──→ ReportCreateScreen ──→ CameraScreen (normal capture)
  ├──→ RequestDetailsScreen ──→ ReportCreateScreen ──→ CameraScreen (guided capture)
  ├──→ ReportDetailsScreen
  ├──→ MapViewScreen
  └──→ AdminCreateRequestScreen
```

**HomeScreen** shows a greeting with current location, a "Report an Issue" CTA, a horizontal category carousel, and a list of nearby active requests with pull-to-refresh.

### Request → Report → Camera (Primary Data Collection Flow)

```
HomeScreen
  → RequestDetailsScreen       (view request details, progress, instructions)
    → ReportCreateScreen        (fill report form linked to request)
      → CameraScreen            (guided capture with GPS + compass validation)
        → ReportCreateScreen    (return with captured photo)
          → (submit to Firestore + Storage)
```

This is the core guided flow. The request's `TaskJson` drives the camera engine.

### Ad-Hoc Report Flow

```
HomeScreen
  → ReportCreateScreen          (fill report form, pick category)
    → CameraScreen              (normal capture, no GPS/compass)
      → ReportCreateScreen      (return with photo)
        → (submit)
```

### Map Tab Stack

```
MapViewScreen
  ├──→ ReportDetailsScreen
  └──→ RequestDetailsScreen
```

Map with search bar, marker clustering, and tap-to-preview cards.

### Profile Tab Stack

```
ProfileScreen
  └──→ ReportDetailsScreen
```

User info, stats (reports/approved/reputation), report history, sign-out, and admin request creation shortcut.

---

## Camera Engine

The camera screen routes to one of two engine variants based on context:

- **Guided** — when a `request` param is passed (task-driven, sensor-validated)
- **Normal** — when no request exists (simple capture)

### Guided Engine States

```
START → NAVIGATE → ALIGN → CAPTURE → VALIDATE → SUBMIT → DONE
                                         ↓
                                      RETAKE ──→ CAPTURE
```

| State | What happens | Gate condition |
|---|---|---|
| **START** | Engine initializes, telemetry streams start | Button press |
| **NAVIGATE** | User walks toward target location. HUD shows distance and turn-by-turn instructions ("Turn slightly right… 128m away"). Validator checks GPS within radius + 10m tolerance | GPS within radius |
| **ALIGN** | User rotates to face the required heading. HUD shows compass delta ("Turn right 45°"). Validator checks heading within ±25° | Heading aligned |
| **CAPTURE** | Camera is live. User presses shutter | Button press (photo taken) |
| **VALIDATE** | Post-capture quality checks: resolution, blur score, brightness, tilt, file size against `quality_thresholds` in TaskJson. Scanner animation plays | All checks pass → SUBMIT; any fail → RETAKE |
| **RETAKE** | Failure-specific feedback ("Photo was too blurry", "Photo was too dark"). User retries | Button press → CAPTURE |
| **SUBMIT** | Capture result is built (image URI + telemetry snapshot). User confirms submission | Button press |
| **DONE** | Result returned to calling screen via navigation callback | — |

**Engine loops:**
- Validator runs every ~1.4s, checking current state's pass criteria
- Instructor runs every ~1.7s, generating contextual HUD messages from live telemetry

**Telemetry sources:**
- GPS (lat, lng, altitude, accuracy) — polled every 1s
- Device motion (pitch, roll, yaw) — polled every 250ms
- Magnetometer (compass heading) — polled every 250ms

### Normal Engine States

```
START → CAPTURE → SUBMIT → DONE
```

| State | What happens |
|---|---|
| **START** | Camera mounts, minimal initialization | 
| **CAPTURE** | User takes a photo |
| **SUBMIT** | Result built and confirmed |
| **DONE** | Result returned |

No GPS navigation, no compass alignment, no image quality validation. Used for ad-hoc reports.

### TaskJson Schema

Each guided capture is driven by a `TaskJson` object:

```typescript
{
  task_id: string
  report_id: string
  issued_at: string
  expires_at: string
  capture_location: {
    lat: number
    lng: number
    radius_meters: number
    landmark_hint: string
  }
  capture_orientation: {
    facing_direction: number       // compass degrees
    distance_from_subject: number  // meters
    subject_hint: string
    orientation: "portrait" | "landscape"
  }
  subject: {
    object_of_interest: string
    fault_description: string
    focus_region: string
    secondary_context: string
    background_context: string
  }
  capture_requirements: [{
    shot_id: string
    label: string
    media_type: string
    priority: number
  }]
  quality_thresholds: {
    min_resolution: { width: number, height: number }
    max_blur_score: number
    min_brightness: number
    max_tilt_degrees: number
    file_size_mb: number
  }
}
```

### Configuration

Defined in `src/components/GuidedImageCapture/types/config.ts`:

| Setting | Default | Description |
|---|---|---|
| `DEV_MODE` | `true` | Shows telemetry dev overlay |
| `TEST_MODE` | `0` | 0 = off, 1 = bypass validation, 2 = run validation on test task |
| GPS tolerance | `10m` | Added to task radius |
| Compass tolerance | `±25°` | Heading alignment threshold |
| Navigate tolerance | `±15°` | Turn instruction threshold |

---

## Architecture

### Project Structure

```
src/
├── components/
│   ├── CategoryCard.js             # Category display (icon + name, compact/full)
│   ├── RecentReportCard.js         # Report thumbnail card with time-ago
│   ├── ReportCard.js               # Full report card (status, media count, tags)
│   ├── RequestCard.js              # Request card (progress, distance, priority)
│   └── GuidedImageCapture/
│       ├── GuidedCameraScreen.tsx   # Full guided capture (mounts engine + loops)
│       ├── NormalCameraScreen.tsx   # Simplified capture (no sensor validation)
│       ├── engine/
│       │   ├── useEngine.ts         # Main engine hook (validator + instructor loops)
│       │   ├── useNormalEngine.ts   # Simplified engine for normal capture
│       │   ├── useEngineUtils.ts    # State transition helpers
│       │   ├── instructor.ts        # Contextual instruction generator
│       │   ├── validator.ts         # Per-state validation logic
│       │   ├── telemetryMath.ts     # Haversine, bearing, heading math
│       │   └── processors/
│       │       ├── viewfinder.ts    # Pre-capture processing
│       │       └── postCapture.ts   # Post-capture processing
│       ├── hooks/
│       │   └── useTelemetry.ts      # Multi-sensor subscription hook
│       ├── hud/
│       │   ├── HUD.tsx              # Top-level HUD orchestrator
│       │   ├── theme.ts             # Camera-specific theme tokens
│       │   ├── ControlBar/          # Shutter button + nav controls
│       │   ├── InstructionHUD/      # Blurred instruction overlay
│       │   ├── Scanner/             # Validation progress animation
│       │   └── DevOverlay/          # Live telemetry debug panel
│       ├── stores/
│       │   ├── useCaptureStore.ts   # Image, task, preview state
│       │   ├── useEngineStore.ts    # State machine + instructions
│       │   └── useTelemetryStore.ts # Real-time sensor data
│       └── types/
│           ├── config.ts            # Feature flags and tolerances
│           ├── types.ts             # TypeScript interfaces
│           ├── task.json            # Test task for development
│           └── task.template.json   # Task schema template
├── constants/
│   └── theme.js                     # Design tokens (colors, typography, spacing)
├── navigation/
│   ├── AppNavigator.js              # Bottom tabs + per-tab stacks
│   └── AuthNavigator.js             # Login + OTP stack
├── screens/
│   ├── auth/
│   │   ├── LoginScreen.js           # Phone input + Firebase reCAPTCHA
│   │   └── OTPVerificationScreen.js # 6-digit OTP entry
│   └── main/
│       ├── HomeScreen.js            # Landing: CTA, categories, active requests
│       ├── ReportCreateScreen.js    # Report form with media + location
│       ├── ReportDetailsScreen.js   # Report view (status, images, tags)
│       ├── RequestDetailsScreen.js  # Request view (progress, instructions)
│       ├── CameraScreen.js          # Router: guided vs normal camera
│       ├── MapViewScreen.js         # Map with markers and search
│       ├── ProfileScreen.js         # User profile and report history
│       ├── AdminCreateRequestScreen.js # Admin request creation
│       └── PlaceholderScreens.js    # Stubs for unimplemented screens
├── services/
│   ├── firebase.js                  # Firebase init (auth, firestore, storage)
│   ├── auth.js                      # Phone OTP auth service
│   ├── database.js                  # Firestore CRUD (users, reports, requests)
│   ├── storage.js                   # Firebase Storage upload/delete
│   ├── location.js                  # GPS, geocoding, distance calculations
│   └── notifications.js            # Push notifications (stubbed for Expo Go)
└── utils/
    └── helpers.js                   # Shared utility functions
```

### Tech Stack

| Layer | Technology |
|---|---|
| Framework | React Native 0.81 + Expo 54 (managed workflow) |
| Language | JavaScript + TypeScript (camera engine) |
| Navigation | React Navigation v6 (stack + bottom tabs) |
| State | Zustand 5 (camera stores), React hooks (screen state) |
| Backend | Firebase Auth, Firestore, Storage, Cloud Messaging |
| Maps | react-native-maps 1.20 (Google Maps on Android) |
| Camera | expo-camera with manual `takePictureAsync` |
| Sensors | expo-sensors (accelerometer, gyroscope, magnetometer) |
| Location | expo-location (GPS + geocoding) |
| Animations | react-native-reanimated 3 |

### Firestore Collections

| Collection | Key Fields |
|---|---|
| `users` | uid, phoneNumber, displayName, profileImage, location, totalReports, reputation |
| `reports` | userId, title, description, category, tags, images, videos, location, address, status, requestId? |
| `requests` | adminId, title, description, category, tags, location, radius, status, targetCount, currentCount, expiresAt, instructions |
| `categories` | Read-only reference data |

### Security Rules

- **users** — read/write own profile only
- **reports** — create (authenticated, userId match, title/description required), read (any authenticated), update/delete (owner only)
- **requests** — read (any authenticated), create/update (any authenticated; admin enforcement is app-level)
- **categories** — read-only
- **notifications** — blocked

---

## Future Scope

### Near Term
- [ ] Richer image-quality metrics (blur detection, framing, glare, brightness analysis)
- [ ] Multi-shot capture requirements per task
- [ ] Remote task loading from Firestore (replace bundled test JSON)
- [ ] Post-capture image processing pipeline
- [ ] Real-time guidance overlays during capture (AR-style framing hints)

### Medium Term
- [ ] Offline-first architecture with full sync
- [ ] Report clustering on map view
- [ ] Advanced search and filtering (by category, date, status, distance)
- [ ] Real-time chat for request coordination
- [ ] Capture session persistence and audit logging
- [ ] Push notification delivery via FCM (currently stubbed for Expo Go)

### Long Term
- [ ] Admin dashboard (web interface)
- [ ] Analytics and reporting pipeline
- [ ] Gamification (badges, leaderboards, streaks)
- [ ] Social features (follow users, comment on reports)
- [ ] Public API for third-party integrations
- [ ] Multi-language support

---

## License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.