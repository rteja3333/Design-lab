// App Constants and Theme Configuration — Eco-Minimalism with Blue Accents

// Color Palette — Warm neutrals, earthy tones, blue focal points
export const COLORS = {
  // Primary — Calm ocean blue
  primary: '#2563eb',
  primaryLight: '#60a5fa',
  primaryDark: '#1d4ed8',
  primaryMuted: '#dbeafe',      // very soft blue tint

  // Secondary — Warm sage green
  secondary: '#6b8f71',
  secondaryLight: '#a3c4a8',
  secondaryDark: '#4a6b4f',

  // Status
  success: '#6b8f71',
  warning: '#c4915e',
  error: '#c2635a',
  info: '#2563eb',

  // Neutrals — warm-tinted grays
  white: '#ffffff',
  gray50: '#fafaf8',            // warm off-white
  gray100: '#f5f4f0',           // stone 100
  gray200: '#e8e6e1',           // stone 200
  gray300: '#d6d3cc',
  gray400: '#a8a39b',
  gray500: '#787370',
  gray600: '#5c5856',
  gray700: '#3d3a38',
  gray800: '#292725',
  gray900: '#1c1b19',
  black: '#000000',

  // Backgrounds
  background: '#fafaf8',
  backgroundSecondary: '#f5f4f0',
  backgroundDark: '#292725',
  card: '#ffffff',
  surface: '#f5f4f0',

  // Text
  textPrimary: '#1c1b19',
  textSecondary: '#787370',
  textLight: '#a8a39b',
  textDark: '#ffffff',

  // Borders — very subtle
  border: '#e8e6e1',
  borderLight: '#f5f4f0',
  borderDark: '#d6d3cc',

  // Status colors
  pending: '#c4915e',
  approved: '#6b8f71',
  rejected: '#c2635a',
  active: '#2563eb',
  closed: '#787370',
  expired: '#c2635a',
};

// Typography
export const FONTS = {
  regular: 'System',
  medium: 'System',
  bold: 'System',
  light: 'System',
};

export const FONT_SIZES = {
  xs: 11,
  sm: 13,
  base: 15,
  lg: 17,
  xl: 20,
  xxl: 24,
  title: 28,
  header: 34,
};

// Spacing — generous for breathing room
export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 36,
  xxl: 56,
};

// Border Radius — organic, rounded, pill-like
export const RADIUS = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 999,
};

// Shadows — barely-there, soft
export const SHADOWS = {
  sm: {
    shadowColor: '#1c1b19',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  md: {
    shadowColor: '#1c1b19',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  lg: {
    shadowColor: '#1c1b19',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },
};

// App Dimensions
export const DIMENSIONS = {
  headerHeight: 56,
  tabBarHeight: 64,
  buttonHeight: 52,
  inputHeight: 52,
};

// Report Categories with instructions
export const CATEGORIES = [
  {
    id: 'infrastructure',
    name: 'Infrastructure',
    icon: 'construct-outline',
    color: '#2563eb',       // blue accent
    instructions: {
      photo: 'Take clear photos showing the issue from multiple angles. Include overview and close-up shots.',
      video: 'Record a 30-60 second video showing the problem and its impact on the area.'
    },
    tags: ['road', 'bridge', 'pothole', 'traffic', 'streetlight']
  },
  {
    id: 'environment',
    name: 'Environment',
    icon: 'leaf-outline',
    color: '#6b8f71',       // sage green
    instructions: {
      photo: 'Capture the environmental issue clearly. Show the extent and impact on surroundings.',
      video: 'Record evidence of the environmental problem and any immediate effects visible.'
    },
    tags: ['pollution', 'waste', 'water', 'air', 'noise', 'cleanliness']
  },
  {
    id: 'safety',
    name: 'Safety & Security',
    icon: 'shield-outline',
    color: '#c2635a',       // terra cotta
    instructions: {
      photo: 'Document safety hazards clearly. Prioritize your safety while capturing evidence.',
      video: 'Record safety concerns but do not put yourself at risk. Keep recordings brief.'
    },
    tags: ['crime', 'accident', 'hazard', 'emergency', 'vandalism']
  },
  {
    id: 'public_services',
    name: 'Public Services',
    icon: 'business-outline',
    color: '#c4915e',       // warm sand
    instructions: {
      photo: 'Show the service issue and how it affects public access or functionality.',
      video: 'Demonstrate the problem with public service and its impact on users.'
    },
    tags: ['transport', 'healthcare', 'education', 'utilities', 'government']
  },
  {
    id: 'events',
    name: 'Events & Activities',
    icon: 'calendar-outline',
    color: '#7c8dba',       // muted lavender-blue
    instructions: {
      photo: 'Capture key moments and crowd participation. Include wide shots and details.',
      video: 'Record significant moments, speeches, or activities. Keep videos under 2 minutes.'
    },
    tags: ['festival', 'protest', 'celebration', 'gathering', 'ceremony']
  }
];

// Report Status Types
export const REPORT_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected'
};

export const REQUEST_STATUS = {
  ACTIVE: 'active',
  CLOSED: 'closed',
  EXPIRED: 'expired'
};

// Default Images (use placeholder URLs or local assets)
export const DEFAULT_IMAGES = {
  profile: 'https://via.placeholder.com/150x150/6366f1/ffffff?text=User',
  categoryPlaceholder: 'https://via.placeholder.com/300x200/f3f4f6/6b7280?text=Category',
  reportPlaceholder: 'https://via.placeholder.com/300x200/f3f4f6/6b7280?text=Report'
};

// Navigation Routes
export const ROUTES = {
  // Auth
  LOGIN: 'Login',
  REGISTER: 'Register',
  OTP_VERIFICATION: 'OTPVerification',
  
  // Main App
  HOME: 'Home',
  PROFILE: 'Profile',
  REPORT_CREATE: 'ReportCreate',
  REPORT_DETAILS: 'ReportDetails',
  REQUEST_DETAILS: 'RequestDetails',
  CAMERA: 'Camera',
  MAP_VIEW: 'MapView',
  
  // Admin
  ADMIN_DASHBOARD: 'AdminDashboard',
  CREATE_REQUEST: 'CreateRequest'
};

// API Endpoints (if using external services)
export const API = {
  BASE_URL: 'https://your-api-endpoint.com',
  ENDPOINTS: {
    REPORTS: '/reports',
    REQUESTS: '/requests',
    USERS: '/users'
  }
};