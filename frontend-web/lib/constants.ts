export const API_CONFIG = {
  BASE_URL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api",
  TIMEOUT: 30000,
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000,
} as const;

export const SCANNER_CONFIG = {
  PORT: process.env.NEXT_PUBLIC_SCANNER_PORT || "5000",
  BASE_URL: process.env.NEXT_PUBLIC_SCANNER_URL || "http://localhost:5000",
  TIMEOUT: 30000,
} as const;

export const ROUTES = {
  HOME: "/",
  CONSENT: "/consent",
  DEMOGRAPHICS: "/demographics",
  SCAN: "/scan",
  RESULTS: "/results",
  DOWNLOAD: "/download",
} as const;

export const API_ENDPOINTS = {
  HEALTH: "/health",
  SESSION_START: "/session/start",
  SESSION_DEMOGRAPHICS: (sessionId: string) => `/session/${sessionId}/demographics`,
  SESSION_FINGERPRINT: (sessionId: string) => `/session/${sessionId}/fingerprint`,
  SESSION_ANALYZE: (sessionId: string) => `/session/${sessionId}/analyze`,
  SESSION_RESULTS: (sessionId: string) => `/session/${sessionId}/results`,
  SESSION_GENERATE_PDF: (sessionId: string) => `/session/${sessionId}/generate-pdf`,
  ANALYZE: "/analyze",
} as const;

export const FINGERPRINT_CONFIG = {
  REQUIRED_COUNT: 10,
  MAX_RETRY: 3,
  SCAN_TIMEOUT: 30000,
  IMAGE_FORMAT: "image/png" as const,
  FINGER_NAMES: [
    "thumb_right",
    "index_right",
    "middle_right",
    "ring_right",
    "pinky_right",
    "thumb_left",
    "index_left",
    "middle_left",
    "ring_left",
    "pinky_left",
  ] as const,
} as const;

export const VALIDATION = {
  AGE: {
    MIN: 18,
    MAX: 120,
    ERROR_MIN: "Age must be at least 18 years",
    ERROR_MAX: "Age cannot exceed 120 years",
  },
  WEIGHT: {
    MIN: 20,
    MAX: 300,
    ERROR_MIN: "Weight must be at least 20 kg",
    ERROR_MAX: "Weight cannot exceed 300 kg",
  },
  HEIGHT: {
    MIN: 100,
    MAX: 250,
    ERROR_MIN: "Height must be at least 100 cm",
    ERROR_MAX: "Height cannot exceed 250 cm",
  },
} as const;

export const UI = {
  CAROUSEL_INTERVAL: 6000,
  TOAST_DURATION: 5000,
  DEBOUNCE_DELAY: 300,
  ANIMATION_DURATION: 200,
  // Privacy/Session timeouts (aligned with backend)
  SESSION_ABSOLUTE_TIMEOUT: 30 * 60 * 1000, // 30 minutes
  SESSION_INACTIVITY_TIMEOUT: 10 * 60 * 1000, // 10 minutes
  SESSION_WARNING_BEFORE: 2 * 60 * 1000, // 2 minutes warning
} as const;

export const STEPS = {
  LANDING: 0,
  CONSENT: 1,
  DEMOGRAPHICS: 2,
  SCAN: 3,
  RESULTS: 4,
  DOWNLOAD: 5,
} as const;

export const STEP_NAMES = {
  [STEPS.LANDING]: "Welcome",
  [STEPS.CONSENT]: "Consent",
  [STEPS.DEMOGRAPHICS]: "Demographics",
  [STEPS.SCAN]: "Fingerprint Scan",
  [STEPS.RESULTS]: "Results",
  [STEPS.DOWNLOAD]: "Download",
} as const;

export const RISK_LEVELS = {
  LOW: "Low",
  MODERATE: "Moderate",
  HIGH: "High",
} as const;

export const RISK_COLORS = {
  [RISK_LEVELS.LOW]: "#10B981",
  [RISK_LEVELS.MODERATE]: "#F59E0B",
  [RISK_LEVELS.HIGH]: "#EF4444",
} as const;

export const BLOOD_GROUPS = [
  "A+",
  "A-",
  "B+",
  "B-",
  "AB+",
  "AB-",
  "O+",
  "O-",
  "Unknown",
] as const;

export type BloodGroup = (typeof BLOOD_GROUPS)[number];

export const ERROR_MESSAGES = {
  NETWORK_ERROR: "Network error. Please check your connection.",
  SESSION_EXPIRED:
    "Your session ended automatically to protect your privacy. Please start a new screening.",
  INVALID_SESSION: "Invalid session. Please start a new screening.",
  SCANNER_NOT_FOUND: "Scanner not found. Please check the connection.",
  SCANNER_TIMEOUT: "Scanner timeout. Please try again.",
  INCOMPLETE_FINGERPRINTS: "Please scan all 10 fingerprints.",
  VALIDATION_FAILED: "Please check your input and try again.",
  SERVER_ERROR: "Server error. Please try again later.",
  UNKNOWN_ERROR: "An unexpected error occurred. Please try again.",
} as const;

export const SUCCESS_MESSAGES = {
  SESSION_STARTED: "Session started successfully",
  CONSENT_SAVED: "Consent preferences saved",
  DEMOGRAPHICS_SAVED: "Information saved successfully",
  FINGERPRINT_CAPTURED: "Fingerprint captured successfully",
  ANALYSIS_COMPLETE: "Analysis complete",
  PDF_GENERATED: "Report generated successfully",
} as const;

export const STORAGE_KEYS = {
  SESSION_ID: "session_id",
  CURRENT_STEP: "current_step",
  CONSENT: "consent",
  THEME: "theme",
} as const;

export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  TIMEOUT: 408,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
} as const;

export const IS_PRODUCTION = process.env.NODE_ENV === "production";
export const IS_DEVELOPMENT = process.env.NODE_ENV === "development";
export const IS_TEST = process.env.NODE_ENV === "test";
