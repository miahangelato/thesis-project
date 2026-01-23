class StorageWrapper {
  private prefix: string;
  private memoryStorage = new InMemoryStorage();

  constructor(prefix: string = "app_") {
    this.prefix = prefix;
  }

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
      return defaultValue;
    }
  }

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
    } catch (error) {}
  }

  remove(key: string): void {
    if (typeof window === "undefined") return;

    this.memoryStorage.remove(key);

    try {
      window.localStorage.removeItem(this.prefix + key);
    } catch (error) {}
  }

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
    } catch (error) {}
  }
}

export const storage = new StorageWrapper("diabetes_kiosk_");

export const sessionStorage = {
  getSessionId: () => storage.get<string>("session_id"),
  setSessionId: (id: string) => storage.set("session_id", id),
  clearSessionId: () => storage.remove("session_id"),
};
