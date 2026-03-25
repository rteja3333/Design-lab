# CrowdSpot - Community-Powered Data Collection App

CrowdSpot is a comprehensive mobile application built with Expo and React Native that enables community-driven data collection through crowd-sourcing. Users can report issues in their area while administrators can create location-based requests for specific information.

## 🌟 Key Features

### For Users:
- **Phone Authentication**: Secure login/signup using Firebase OTP
- **Report Issues**: Submit reports with title, description, images, videos, and tags
- **Category-Based Guidelines**: Get specific instructions for photo/video capture based on category
- **Location Integration**: Automatic location tagging for reports
- **Profile Management**: View personal reports and reputation
- **Push Notifications**: Receive location-based requests from administrators

### For Administrators:
- **Location-Based Requests**: Create requests for specific geographic areas
- **Radius Control**: Set the radius for request notifications
- **Request Management**: Close or expire requests based on completion
- **Category & Tag System**: Organize requests by categories and tags

## 🎨 Design & UI

### Color Theme
- **Primary**: Indigo (#6366f1) - Modern and trustworthy
- **Secondary**: Amber (#f59e0b) - Attention-grabbing for urgent items
- **Success**: Emerald (#10b981) - Positive feedback
- **Error**: Red (#ef4444) - Critical issues
- **Background**: Clean white with gray accents

### Key UI Features
- Clean, modern interface with card-based design
- Intuitive navigation with bottom tabs
- Category-based color coding
- Status indicators and badges
- Responsive design for all screen sizes

## 🏗️ Technical Architecture

### Frontend Stack:
- **React Native** with Expo managed workflow
- **React Navigation** for screen navigation
- **Expo Vector Icons** for consistent iconography
- **React Hooks** for state management

### Backend Services:
- **Firebase Authentication** (Phone OTP)
- **Firestore Database** for data storage
- **Firebase Storage** for media files
- **Firebase Cloud Messaging** for push notifications

### Key Services:
- `authService` - Handle phone authentication
- `databaseService` - Firestore operations
- `storageService` - Media file management  
- `locationService` - GPS and mapping
- `notificationService` - Push notifications

## 📊 Database Schema

### Users Collection
```javascript
{
  uid: string,                    // Firebase Auth UID
  phoneNumber: string,           // Phone number from auth
  displayName: string,           // User display name
  profileImage: string,          // Firebase Storage URL
  location: GeoPoint,           // Last known location
  createdAt: timestamp,         // Account creation date
  totalReports: number,         // Count of submitted reports
  reputation: number            // User reputation score
}
```

### Reports Collection
```javascript
{
  id: string,                   // Document ID
  userId: string,               // Reference to user
  title: string,                // Report title
  description: string,          // Detailed description
  category: string,             // Category ID
  tags: string[],              // Array of tags
  images: string[],            // Firebase Storage URLs
  videos: string[],            // Firebase Storage URLs
  location: GeoPoint,          // Report location
  address: string,             // Human-readable address
  status: 'pending|approved|rejected',
  createdAt: timestamp,
  requestId?: string           // If fulfilling admin request
}
```

### Requests Collection
```javascript
{
  id: string,                  // Document ID
  adminId: string,            // Admin user ID
  title: string,              // Request title
  description: string,        // Request description
  category: string,           // Category ID
  tags: string[],            // Related tags
  location: GeoPoint,        // Center location
  radius: number,            // Radius in meters
  status: 'active|closed|expired',
  targetCount: number,       // Desired number of reports
  currentCount: number,      // Current submissions
  createdAt: timestamp,
  expiresAt: timestamp,
  instructions: string       // Specific instructions
}
```

## 🚀 Setup Instructions

### Prerequisites
- Node.js 16+ installed
- Expo CLI installed globally
- Firebase project with the following services enabled:
  - Authentication (Phone provider)
  - Firestore Database
  - Storage
  - Cloud Messaging

### Firebase Setup

1. **Create Firebase Project**
   - Go to [Firebase Console](https://console.firebase.google.com)
   - Create new project or select existing one
   - Add a web app to get configuration

2. **Enable Authentication**
   - Go to Authentication > Sign-in method
   - Enable Phone provider
   - Configure your app verification

3. **Setup Firestore**
   - Go to Firestore Database
   - Create database in production mode
   - Set up security rules as needed

4. **Configure Storage**
   - Go to Storage
   - Create default bucket
   - Set up security rules

5. **Setup Cloud Messaging**
   - Go to Cloud Messaging
   - Generate server key for notifications

6. **Update Configuration**
   - Replace placeholders in `src/services/firebase.js` with your Firebase config
   - Update Expo project ID in notification service

### Installation

1. **Clone and Install Dependencies**
   ```bash
   npm install
   ```

2. **Start Development Server**
   ```bash
   npm start
   ```

3. **Run on Device/Emulator**
   ```bash
   npm run android  # Android
   npm run ios      # iOS
   npm run web      # Web browser
   ```

## 📱 App Navigation Flow

### Authentication Flow
```
LoginScreen → OTPVerificationScreen → HomeScreen
```

### Main App Flow
```
HomeScreen ←→ ProfileScreen
    ↓
ReportCreateScreen
    ↓
CameraScreen (Future)
```

### Request Flow
```
HomeScreen → RequestDetailsScreen
```

## 🔧 Development Guidelines

### File Structure
```
src/
├── components/          # Reusable UI components
├── screens/            # Screen components
│   ├── auth/          # Authentication screens
│   └── main/          # Main app screens
├── navigation/         # Navigation configuration
├── services/          # Backend service integrations
├── constants/         # App constants and themes
└── utils/             # Helper functions
```

### Code Organization
- **Components**: Reusable UI elements
- **Screens**: Full-screen components
- **Services**: External service integrations
- **Constants**: Theme, colors, and configuration
- **Utils**: Helper functions and utilities

### State Management
- React Hooks for local state
- Context API for global state (if needed)
- Firebase real-time listeners for data sync

# Guided Image Capture

An Expo-based React Native app for guided, task-driven image capture. The app walks a user through a structured capture flow, uses live telemetry to assist navigation and alignment, captures an image, and prepares a capture result for downstream processing.

## Overview

This project is built around a lightweight capture engine with explicit state transitions:

- `START`
- `NAVIGATE`
- `ALIGN`
- `CAPTURE`
- `VALIDATE`
- `RETAKE`
- `SUBMIT`
- `DONE`

The current implementation already supports:

- camera capture via `expo-camera`
- GPS, device motion, and compass telemetry collection
- navigation validation against a target capture location
- alignment validation against a required facing direction
- on-screen HUD/instruction orchestration
- local test-task driven development flow

The module is designed so that capture outputs can later be routed into custom backend, review, or image-processing pipelines.

## Current Flow

1. The app loads a capture task.
2. The user is guided to the expected location.
3. The app checks device heading against the requested orientation.
4. The user captures an image.
5. The app runs validation logic.
6. The app either requests a retake or completes submission.
7. A final capture result object is built and returned for downstream handling.

At the moment, location and orientation checks are implemented, while image-quality and post-processing stages are still placeholders.

## Tech Stack

- Expo
- React Native
- Expo Router
- TypeScript
- Zustand
- Expo Camera
- Expo Location
- Expo Sensors

## Project Structure

Key areas of the codebase:

- `app/`
   - route entry points
   - `index.tsx` starts the capture flow
   - `capture.tsx` loads the task and mounts the guided camera screen
- `components/GuidedImageCapture/`
   - main feature module
- `components/GuidedImageCapture/engine/`
   - state machine, validation, telemetry math, and capture helpers
- `components/GuidedImageCapture/hooks/`
   - live telemetry subscriptions
- `components/GuidedImageCapture/hud/`
   - instructions, controls, scanner, and developer overlay
- `components/GuidedImageCapture/stores/`
   - Zustand stores for engine, capture, and telemetry state
- `components/GuidedImageCapture/types/`
   - task schema, feature config, and shared types

## Setup

Install dependencies:

```bash
npm install
```

Start the Expo development server:

```bash
npm start
```

You can also run platform-specific commands:

```bash
npm run android
npm run ios
npm run web
```

Lint the project:

```bash
npm run lint
```

## Task-Driven Development

The capture screen currently supports a local test task loaded from:

- `components/GuidedImageCapture/types/task.json`

This task defines:

- capture location coordinates and allowed radius
- expected facing direction and orientation
- subject details and contextual hints
- capture requirements such as shot id and label
- quality thresholds such as resolution, blur, brightness, tilt, and file size

## Configuration

Feature behavior is controlled in:

- `components/GuidedImageCapture/types/config.ts`

Important configuration includes:

- `DEV_MODE` to show the developer overlay
- `TEST_MODE` to run with a local task or bypass parts of validation
- telemetry polling intervals
- GPS tolerance values
- compass tolerance values

## Permissions and Sensors

The app relies on runtime access to:

- camera
- foreground location
- device motion sensors
- magnetometer / compass

Without these, guided capture cannot function correctly.

## Pending Work

- add real-time guidance on the capture screen before and during image capture

## Development Notes

- `app/capture.tsx` currently uses the local test task unless test mode is turned off.
- The completion path logs and returns a `CaptureResult`, which is the integration point for later pipeline work.

## Future Enhancements

Potential next steps beyond the pending items above:

- load remote tasks instead of relying on bundled test JSON
- add richer image-quality metrics such as blur, framing, glare, and brightness analysis
- support multi-shot capture requirements
- persist capture sessions and audit data
- connect submission to an API or storage backend


## 🚀 Future Enhancements

### Phase 2 Features
- [ ] Camera integration for in-app photo/video capture
- [ ] Map view with report clustering
- [ ] Advanced filtering and search
- [ ] Real-time chat for request coordination
- [ ] Offline support with sync

### Phase 3 Features
- [ ] Admin dashboard web interface
- [ ] Analytics and reporting
- [ ] Gamification elements
- [ ] Social features and user following
- [ ] API for third-party integrations

## 🤝 Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature/new-feature`
3. Commit changes: `git commit -am 'Add new feature'`
4. Push to branch: `git push origin feature/new-feature`
5. Submit Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support & Contact

For support, email [your-email@domain.com] or join our [Discord community].

---

**Built with ❤️ for community empowerment**