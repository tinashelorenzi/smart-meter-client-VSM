// API Configuration
export const API_CONFIG = {
    BASE_URL: import.meta.env.VITE_API_BASE_URL || 'http://poc-vsm.vertexcatalystgroup.co.za:562/api',
    TIMEOUT: parseInt(import.meta.env.VITE_API_TIMEOUT) || 10000,
  };
  
  // App Configuration
  export const APP_CONFIG = {
    NAME: import.meta.env.VITE_APP_NAME || 'SmartMeter',
    VERSION: import.meta.env.VITE_APP_VERSION || '1.0.0',
    DESCRIPTION: import.meta.env.VITE_APP_DESCRIPTION || 'Smart Meter Energy Management Platform',
  };
  
  // Storage Keys
  export const STORAGE_KEYS = {
    AUTH_TOKEN: 'authToken',
    USER_DATA: 'user',
    THEME: 'theme',
    PREFERENCES: 'userPreferences',
  };
  
  // Routes
  export const ROUTES = {
    HOME: '/',
    LOGIN: '/login',
    REGISTER: '/register',
    DASHBOARD: '/dashboard',
    ADMIN: '/admin',
    PROFILE: '/profile',
    SETTINGS: '/settings',
  };
  
  // User Roles
  export const USER_ROLES = {
    ADMIN: 'admin',
    USER: 'user',
  };
  
  // Meter Status
  export const METER_STATUS = {
    ACTIVE: 'active',
    INACTIVE: 'inactive',
    MAINTENANCE: 'maintenance',
    ERROR: 'error',
  };
  
  // Transaction Status
  export const TRANSACTION_STATUS = {
    PENDING: 'pending',
    COMPLETED: 'completed',
    FAILED: 'failed',
    CANCELLED: 'cancelled',
  };
  
  // Alert Types
  export const ALERT_TYPES = {
    SUCCESS: 'success',
    ERROR: 'error',
    WARNING: 'warning',
    INFO: 'info',
  };
  
  // Animation Durations
  export const ANIMATIONS = {
    FAST: 0.2,
    NORMAL: 0.3,
    SLOW: 0.5,
    VERY_SLOW: 0.8,
  };
  
  // Breakpoints (matching Tailwind)
  export const BREAKPOINTS = {
    SM: 640,
    MD: 768,
    LG: 1024,
    XL: 1280,
    '2XL': 1536,
  };
  
  // Colors
  export const COLORS = {
    PRIMARY: '#677AE5',
    SUCCESS: '#10B981',
    WARNING: '#F59E0B',
    ERROR: '#EF4444',
    INFO: '#3B82F6',
  };
  
  // Default Values
  export const DEFAULTS = {
    PAGE_SIZE: 20,
    DEBOUNCE_DELAY: 300,
    TOAST_DURATION: 4000,
    REFRESH_INTERVAL: 30000, // 30 seconds
  };
  
  // Validation Rules
  export const VALIDATION = {
    USERNAME: {
      MIN_LENGTH: 3,
      MAX_LENGTH: 20,
      PATTERN: /^[a-zA-Z0-9_]+$/,
    },
    PASSWORD: {
      MIN_LENGTH: 8,
      PATTERN: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
    },
    EMAIL: {
      PATTERN: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    },
  };
  
  // Error Messages
  export const ERROR_MESSAGES = {
    NETWORK_ERROR: 'Network error. Please check your connection.',
    UNAUTHORIZED: 'Your session has expired. Please login again.',
    FORBIDDEN: 'You do not have permission to access this resource.',
    NOT_FOUND: 'The requested resource was not found.',
    SERVER_ERROR: 'Internal server error. Please try again later.',
    VALIDATION_ERROR: 'Please check your input and try again.',
    UNKNOWN_ERROR: 'An unexpected error occurred.',
  };
  
  // Success Messages
  export const SUCCESS_MESSAGES = {
    LOGIN: 'Login successful!',
    LOGOUT: 'Logged out successfully',
    REGISTER: 'Registration successful!',
    UPDATE: 'Updated successfully!',
    DELETE: 'Deleted successfully!',
    SAVE: 'Saved successfully!',
  };
  
  export default {
    API_CONFIG,
    APP_CONFIG,
    STORAGE_KEYS,
    ROUTES,
    USER_ROLES,
    METER_STATUS,
    TRANSACTION_STATUS,
    ALERT_TYPES,
    ANIMATIONS,
    BREAKPOINTS,
    COLORS,
    DEFAULTS,
    VALIDATION,
    ERROR_MESSAGES,
    SUCCESS_MESSAGES,
  };