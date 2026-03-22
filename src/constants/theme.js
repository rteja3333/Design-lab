// App Constants and Theme Configuration

// Color Palette - Modern and vibrant theme
export const COLORS = {
  // Primary colors
  primary: '#6366f1',       // Indigo - main brand color
  primaryLight: '#818cf8',   // Light indigo
  primaryDark: '#4f46e5',    // Dark indigo
  
  // Secondary colors
  secondary: '#f59e0b',      // Amber - for highlights and accents
  secondaryLight: '#fbbf24', // Light amber
  secondaryDark: '#d97706',  // Dark amber
  
  // Success, warning, error
  success: '#10b981',        // Emerald
  warning: '#f59e0b',        // Amber
  error: '#ef4444',          // Red
  info: '#3b82f6',           // Blue
  
  // Grayscale
  white: '#ffffff',
  gray50: '#f9fafb',
  gray100: '#f3f4f6',
  gray200: '#e5e7eb',
  gray300: '#d1d5db',
  gray400: '#9ca3af',
  gray500: '#6b7280',
  gray600: '#4b5563',
  gray700: '#374151',
  gray800: '#1f2937',
  gray900: '#111827',
  black: '#000000',
  
  // Background colors
  background: '#ffffff',
  backgroundSecondary: '#f9fafb',
  backgroundDark: '#1f2937',
  
  // Text colors
  textPrimary: '#111827',
  textSecondary: '#6b7280',
  textLight: '#9ca3af',
  textDark: '#ffffff',
  
  // Border colors
  border: '#e5e7eb',
  borderLight: '#f3f4f6',
  borderDark: '#d1d5db',
  
  // Status colors
  pending: '#f59e0b',
  approved: '#10b981',
  rejected: '#ef4444',
  active: '#3b82f6',
  closed: '#6b7280',
  expired: '#ef4444'
};

// Typography
export const FONTS = {
  regular: 'System',
  medium: 'System',
  bold: 'System',
  light: 'System'
};

export const FONT_SIZES = {
  xs: 12,
  sm: 14,
  base: 16,
  lg: 18,
  xl: 20,
  xxl: 24,
  title: 28,
  header: 32
};

// Spacing
export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48
};

// Border Radius
export const RADIUS = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  full: 999
};

// Elevation/Shadow
export const SHADOWS = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  }
};

// App Dimensions
export const DIMENSIONS = {
  headerHeight: 56,
  tabBarHeight: 60,
  buttonHeight: 48,
  inputHeight: 48
};

// Report Categories with instructions
export const CATEGORIES = [
  {
    id: 'infrastructure',
    name: 'Infrastructure',
    icon: 'construct-outline',
    color: COLORS.primary,
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
    color: COLORS.success,
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
    color: COLORS.error,
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
    color: COLORS.secondary,
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
    color: COLORS.info,
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