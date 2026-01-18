/**
 * Secure LocalStorage wrapper with type safety.
 * Handles serialization, error catching, and type checking.
 */

// ============================================================================
// GENERIC STORAGE WRAPPER
// ============================================================================

class StorageWrapper {
  private prefix: string;

  constructor(prefix: string = "app_") {
    this.prefix = prefix;
  }

  /**
   * Get item from storage
   */
  get<T>(key: string, defaultValue: T | null = null): T | null {
    if (typeof window === "undefined") return defaultValue;

    try {
      const item = window.localStorage.getItem(this.prefix + key);
      return item ? (JSON.parse(item) as T) : defaultValue;
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error);
      return defaultValue;
    }
  }

  /**
   * Set item in storage
   */
  set<T>(key: string, value: T): void {
    if (typeof window === "undefined") return;

    try {
      window.localStorage.setItem(this.prefix + key, JSON.stringify(value));
    } catch (error) {
      console.warn(`Error setting localStorage key "${key}":`, error);
    }
  }

  /**
   * Remove item from storage
   */
  remove(key: string): void {
    if (typeof window === "undefined") return;

    try {
      window.localStorage.removeItem(this.prefix + key);
    } catch (error) {
      console.warn(`Error removing localStorage key "${key}":`, error);
    }
  }

  /**
   * Clear all app-specific keys
   */
  clear(): void {
    if (typeof window === "undefined") return;

    try {
      Object.keys(window.localStorage).forEach((key) => {
        if (key.startsWith(this.prefix)) {
          window.localStorage.removeItem(key);
        }
      });
    } catch (error) {
      console.warn("Error clearing localStorage:", error);
    }
  }
}

// ============================================================================
// EXPORT INSTANCE
// ============================================================================

export const storage = new StorageWrapper("diabetes_kiosk_");

// ============================================================================
// SPECIFIC HELPERS
// ============================================================================

export const sessionStorage = {
  getSessionId: () => storage.get<string>("session_id"),
  setSessionId: (id: string) => storage.set("session_id", id),
  clearSessionId: () => storage.remove("session_id"),
};
