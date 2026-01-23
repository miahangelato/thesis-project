"use client";

import { storage } from "@/lib/storage";
import { STORAGE_KEYS } from "@/lib/constants";

function safeSessionStorageRemove(key: string) {
  try {
    sessionStorage.removeItem(key);
  } catch {}
}

export function clearClientSessionState() {
  try {
    const sessionIdFromStorage = storage.get<string>(STORAGE_KEYS.SESSION_ID);
    const sessionIdFromSessionStorage = sessionStorage.getItem("current_session_id");
    const activeSessionId = sessionIdFromStorage || sessionIdFromSessionStorage;

    storage.clear();

    safeSessionStorageRemove("demographics");
    safeSessionStorageRemove("current_session_id");

    if (activeSessionId) {
      safeSessionStorageRemove(activeSessionId);
    }
  } catch {}
}
