"use client";

import { storage } from "@/lib/storage";
import { STORAGE_KEYS } from "@/lib/constants";

function safeSessionStorageRemove(key: string) {
  try {
    sessionStorage.removeItem(key);
  } catch {
    // ignore
  }
}

/**
 * Best-effort client-side session cleanup.
 * Safe to call from error boundaries or catch-all routes.
 */
export function clearClientSessionState() {
  try {
    const sessionIdFromStorage = storage.get<string>(STORAGE_KEYS.SESSION_ID);
    const sessionIdFromSessionStorage =
      sessionStorage.getItem("current_session_id");
    const activeSessionId = sessionIdFromStorage || sessionIdFromSessionStorage;

    // Clears diabetes_kiosk_* localStorage keys via wrapper
    storage.clear();

    // Clear demographics + session tracking
    safeSessionStorageRemove("demographics");
    safeSessionStorageRemove("current_session_id");

    // Clear cached results (stored under session id)
    if (activeSessionId) {
      safeSessionStorageRemove(activeSessionId);
    }
  } catch {
    // ignore
  }
}
