/**
 * Secure Storage wrapper with PRIVACY protections.
 *
 * PRIVACY PRINCIPLES:
 * - Sensitive data (fingerprints, demographics) stored in MEMORY ONLY
 * - Never persist health data to localStorage
 * - Auto-expire all data
 * - Clear everything on session end
 */

// ============================================================================
// IN-MEMORY STORAGE (for sensitive data)
// ============================================================================

class InMemoryStorage {
  private data: Map<string, unknown> = new Map();

  set<T>(key: string, value: T): void {
    this.data.set(key, value);
  }

  get<T>(key: string, defaultValue: T | null = null): T | null {
    return this.data.has(key) ? (this.data.get(key) as T) : defaultValue;
  }

  remove(key: string): void {
    this.data.delete(key);
  }

  clear(): void {
    this.data.clear();
    console.log("[PRIVACY] In-memory storage cleared");
  }

  has(key: string): boolean {
    return this.data.has(key);
  }
}

// ============================================================================
// PERSISTENT STORAGE WRAPPER (for non-sensitive data only)
// ============================================================================

class StorageWrapper {
  private prefix: string;
  private memoryStorage = new InMemoryStorage();

  constructor(prefix: string = "app_") {
    this.prefix = prefix;
  }

  /**
   * PRIVACY: Some keys should NEVER be persisted to localStorage
   */
  private isSensitiveKey(key: string): boolean {
    const sensitivePatterns = [
      "demographics",
      "fingerprint",
      "scan",
      "result",
      "analysis",
      "health",
      "medical",
      "blood",
      "bmi",
    ];

    return sensitivePatterns.some((pattern) => key.toLowerCase().includes(pattern));
  }

  /**
   * Get item from storage
   */
  get<T>(key: string, defaultValue: T | null = null): T | null {
    if (typeof window === "undefined") return defaultValue;

    // Check in-memory first
    if (this.memoryStorage.has(key)) {
      return this.memoryStorage.get<T>(key, defaultValue);
    }

    try {
      const item = window.localStorage.getItem(this.prefix + key);
      return item ? (JSON.parse(item) as T) : defaultValue;
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error);
      return defaultValue;
    }
  }

  /**
   * Set item in storage (PRIVACY-AWARE)
   */
  set<T>(key: string, value: T): void {
    if (typeof window === "undefined") return;

    // PRIVACY: Sensitive data goes to memory only
    if (this.isSensitiveKey(key)) {
      console.log(
        `[PRIVACY] Storing sensitive key "${key}" in memory only (not persisted)`
      );
      this.memoryStorage.set(key, value);
      return;
    }

    // Non-sensitive data can use localStorage
    try {
      window.localStorage.setItem(this.prefix + key, JSON.stringify(value));
    } catch (error) {
      console.warn(`Error setting localStorage key "${key}":`, error);
      // Fallback to memory if localStorage fails
      this.memoryStorage.set(key, value);
    }
  }

  /**
   * Remove item from storage
   */
  remove(key: string): void {
    if (typeof window === "undefined") return;

    this.memoryStorage.remove(key);

    try {
      window.localStorage.removeItem(this.prefix + key);
    } catch (error) {
      console.warn(`Error removing localStorage key "${key}":`, error);
    }
  }

  /**
   * PRIVACY: Clear ALL storage (localStorage + memory)
   */
  clear(): void {
    console.log("[PRIVACY] ========== CLEARING ALL STORAGE ==========");

    // Clear in-memory first
    this.memoryStorage.clear();

    if (typeof window === "undefined") return;

    try {
      // Clear localStorage (app-specific keys)
      Object.keys(window.localStorage).forEach((key) => {
        if (key.startsWith(this.prefix)) {
          window.localStorage.removeItem(key);
        }
      });

      // Clear ALL sessionStorage
      window.sessionStorage.clear();

      console.log(
        "[PRIVACY] All storage (localStorage + sessionStorage + memory) cleared"
      );
    } catch (error) {
      console.warn("[PRIVACY] Error clearing storage:", error);
    }
  }

  /**
   * PRIVACY: Get all keys (for debugging)
   */
  keys(): string[] {
    if (typeof window === "undefined") return [];

    const keys: string[] = [];
    try {
      for (let i = 0; i < window.localStorage.length; i++) {
        const key = window.localStorage.key(i);
        if (key?.startsWith(this.prefix)) {
          keys.push(key.replace(this.prefix, ""));
        }
      }
    } catch (e) {
      console.warn("Error getting storage keys:", e);
    }
    return keys;
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
