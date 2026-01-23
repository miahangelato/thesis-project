/**
 * Privacy-focused utilities for automatic data cleanup
 * Implements "palagi" (always clear) strategy on the frontend
 */

// ============================================================================
// SESSION TIMEOUT CONFIGURATION
// ============================================================================

export const PRIVACY_CONFIG = {
  // Session timeouts (aligned with backend)
  ABSOLUTE_TIMEOUT_MS: 30 * 60 * 1000, // 30 minutes max lifetime
  INACTIVITY_TIMEOUT_MS: 10 * 60 * 1000, // 10 minutes of inactivity

  // Warning before timeout
  WARNING_BEFORE_TIMEOUT_MS: 60 * 1000, // 1 minute warning

  // Visibility check interval
  VISIBILITY_CHECK_INTERVAL_MS: 1000, // Check every second
} as const;

export const PRIVACY_MESSAGES = {
  SESSION_EXPIRED_INACTIVITY:
    "Your session ended automatically after 10 minutes of inactivity to protect your privacy.",
  SESSION_EXPIRED_MAX_TIME:
    "Your session ended automatically after 30 minutes to protect your privacy.",
  SESSION_EXPIRED_GENERIC: "Your session ended automatically to protect your privacy.",
  START_NEW_SESSION: "Please start a new screening to continue.",
  WARNING_TIMEOUT_SOON:
    "Your session will end soon for privacy. Continue to stay active.",
} as const;

// ============================================================================
// AUTOMATIC CLEANUP MANAGER
// ============================================================================

export class PrivacyCleanupManager {
  private absoluteTimeoutId: NodeJS.Timeout | null = null;
  private inactivityTimeoutId: NodeJS.Timeout | null = null;
  private visibilityCheckId: NodeJS.Timeout | null = null;
  private sessionStartTime: number | null = null;
  private lastActivityTime: number | null = null;
  private onExpire: ((reason: "inactivity" | "absolute" | "visibility") => void) | null =
    null;

  constructor() {
    if (typeof window !== "undefined") {
      // Bind event listeners
      this.bindPageVisibilityListener();
      this.bindBeforeUnloadListener();
      this.bindActivityListeners();
    }
  }

  /**
   * Start session timeout monitoring
   */
  startSession(
    onExpireCallback: (reason: "inactivity" | "absolute" | "visibility") => void
  ) {
    this.sessionStartTime = Date.now();
    this.lastActivityTime = Date.now();
    this.onExpire = onExpireCallback;

    // Set absolute timeout (30 minutes)
    this.absoluteTimeoutId = setTimeout(() => {
      console.log("[PRIVACY] Session expired: Max lifetime reached (30min)");
      this.expireSession("absolute");
    }, PRIVACY_CONFIG.ABSOLUTE_TIMEOUT_MS);

    // Set initial inactivity timeout (10 minutes)
    this.resetInactivityTimer();

    console.log("[PRIVACY] Session monitoring started (30min max, 10min inactivity)");
  }

  /**
   * Reset inactivity timer on user activity
   */
  private resetInactivityTimer() {
    if (this.inactivityTimeoutId) {
      clearTimeout(this.inactivityTimeoutId);
    }

    this.lastActivityTime = Date.now();

    this.inactivityTimeoutId = setTimeout(() => {
      console.log("[PRIVACY] Session expired: Inactivity timeout (10min)");
      this.expireSession("inactivity");
    }, PRIVACY_CONFIG.INACTIVITY_TIMEOUT_MS);
  }

  /**
   * Record user activity
   */
  private recordActivity = () => {
    if (this.sessionStartTime) {
      this.resetInactivityTimer();
    }
  };

  /**
   * Bind activity listeners (mouse, keyboard, touch)
   */
  private bindActivityListeners() {
    if (typeof window === "undefined") return;

    const events = ["mousedown", "keydown", "scroll", "touchstart", "click"];
    events.forEach((event) => {
      window.addEventListener(event, this.recordActivity, { passive: true });
    });
  }

  /**
   * Unbind activity listeners
   */
  private unbindActivityListeners() {
    if (typeof window === "undefined") return;

    const events = ["mousedown", "keydown", "scroll", "touchstart", "click"];
    events.forEach((event) => {
      window.removeEventListener(event, this.recordActivity);
    });
  }

  /**
   * Bind page visibility listener (clear when tab hidden)
   */
  private bindPageVisibilityListener() {
    if (typeof document === "undefined") return;

    document.addEventListener("visibilitychange", () => {
      if (document.hidden && this.sessionStartTime) {
        // Page went to background - could clear immediately or set shorter timeout
        console.log("[PRIVACY] Page hidden - session may expire faster");

        // Option 1: Expire immediately when page hidden (MOST SECURE)
        // this.expireSession('visibility');

        // Option 2: Reduce inactivity timeout to 2 minutes when hidden
        // (Currently using standard timeout)
      } else if (!document.hidden && this.sessionStartTime) {
        // Page came back to foreground
        console.log("[PRIVACY] Page visible again - recording activity");
        this.recordActivity();
      }
    });
  }

  /**
   * Bind beforeunload listener (clear on close/refresh)
   */
  private bindBeforeUnloadListener() {
    if (typeof window === "undefined") return;

    window.addEventListener("beforeunload", () => {
      console.log("[PRIVACY] Page unloading - clearing session data");
      // Don't call expireSession here as it may trigger navigation
      // Just clear storage directly
      this.clearAllStorage();
    });
  }

  /**
   * Expire the session
   */
  private expireSession(reason: "inactivity" | "absolute" | "visibility") {
    if (this.onExpire) {
      this.onExpire(reason);
    }
    this.stopSession();
  }

  /**
   * Stop session monitoring
   */
  stopSession() {
    if (this.absoluteTimeoutId) {
      clearTimeout(this.absoluteTimeoutId);
      this.absoluteTimeoutId = null;
    }

    if (this.inactivityTimeoutId) {
      clearTimeout(this.inactivityTimeoutId);
      this.inactivityTimeoutId = null;
    }

    if (this.visibilityCheckId) {
      clearInterval(this.visibilityCheckId);
      this.visibilityCheckId = null;
    }

    this.sessionStartTime = null;
    this.lastActivityTime = null;
    this.onExpire = null;

    console.log("[PRIVACY] Session monitoring stopped");
  }

  /**
   * Get time remaining in session (for countdown UI)
   */
  getTimeRemaining(): { absolute: number; inactivity: number } | null {
    if (!this.sessionStartTime || !this.lastActivityTime) {
      return null;
    }

    const now = Date.now();
    const absoluteRemaining = Math.max(
      0,
      PRIVACY_CONFIG.ABSOLUTE_TIMEOUT_MS - (now - this.sessionStartTime)
    );
    const inactivityRemaining = Math.max(
      0,
      PRIVACY_CONFIG.INACTIVITY_TIMEOUT_MS - (now - this.lastActivityTime)
    );

    return {
      absolute: absoluteRemaining,
      inactivity: inactivityRemaining,
    };
  }

  /**
   * Clear all storage (localStorage + sessionStorage)
   */
  clearAllStorage() {
    if (typeof window === "undefined") return;

    try {
      // Clear localStorage
      const keysToRemove: string[] = [];
      for (let i = 0; i < window.localStorage.length; i++) {
        const key = window.localStorage.key(i);
        if (key?.startsWith("diabetes_kiosk_")) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach((key) => window.localStorage.removeItem(key));

      // Clear sessionStorage entirely
      window.sessionStorage.clear();

      console.log("[PRIVACY] All storage cleared");
    } catch (e) {
      console.error("[PRIVACY] Error clearing storage:", e);
    }
  }

  /**
   * Cleanup on destroy
   */
  destroy() {
    this.stopSession();
    this.unbindActivityListeners();
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

let globalCleanupManager: PrivacyCleanupManager | null = null;

export function getPrivacyCleanupManager(): PrivacyCleanupManager | null {
  // Only create manager on client side
  if (typeof window === "undefined") {
    return null;
  }
  
  if (!globalCleanupManager) {
    globalCleanupManager = new PrivacyCleanupManager();
  }
  return globalCleanupManager;
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Prevent browser back/forward cache (bfcache) restoration
 */
export function preventBFCache() {
  if (typeof window === "undefined") return;

  window.addEventListener("pageshow", (event) => {
    if (event.persisted) {
      console.log("[PRIVACY] Page restored from bfcache - forcing reload");
      window.location.reload();
    }
  });
}

/**
 * Clear data on beforeunload
 */
export function setupBeforeUnloadCleanup(clearFunction: () => void) {
  if (typeof window === "undefined") return;

  window.addEventListener("beforeunload", () => {
    clearFunction();
  });
}

/**
 * Format time remaining for display
 */
export function formatTimeRemaining(ms: number): string {
  const minutes = Math.floor(ms / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}
