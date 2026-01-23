class StorageWrapper {
  private prefix: string;

  constructor(prefix: string = "app_") {
    this.prefix = prefix;
  }

  get<T>(key: string, defaultValue: T | null = null): T | null {
    if (typeof window === "undefined") return defaultValue;

    try {
      const item = window.localStorage.getItem(this.prefix + key);
      return item ? (JSON.parse(item) as T) : defaultValue;
    } catch (error) {
      return defaultValue;
    }
  }

  set<T>(key: string, value: T): void {
    if (typeof window === "undefined") return;

    try {
      window.localStorage.setItem(this.prefix + key, JSON.stringify(value));
    } catch (error) {}
  }

  remove(key: string): void {
    if (typeof window === "undefined") return;

    try {
      window.localStorage.removeItem(this.prefix + key);
    } catch (error) {}
  }

  clear(): void {
    if (typeof window === "undefined") return;

    try {
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
