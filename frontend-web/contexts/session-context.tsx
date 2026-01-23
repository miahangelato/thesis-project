"use client";
import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { storage } from "@/lib/storage";
import { STEPS } from "@/lib/constants";
import {
  getPrivacyCleanupManager,
  PRIVACY_MESSAGES,
  preventBFCache,
} from "@/lib/privacy";
import { useRouter } from "next/navigation";

interface SessionState {
  sessionId: string | null;
  consent: boolean;
  currentStep: number;
}

interface SessionContextType extends SessionState {
  setSession: (id: string, consent: boolean) => void;
  setCurrentStep: (step: number) => void;
  clearSession: (showMessage?: boolean, reason?: string) => void;
  isLoading: boolean;
  sessionActive: boolean;
  expirationReason: string | null;
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [consent, setConsent] = useState<boolean>(false);
  const [currentStep, setCurrentStepState] = useState<number>(STEPS.LANDING);
  const [isLoading, setIsLoading] = useState(true);
  const sessionActive = !!sessionId;
  const [expirationReason, setExpirationReason] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined" && !privacyManagerRef.current) {
      privacyManagerRef.current = getPrivacyCleanupManager();
    }
  }, []);

  useEffect(() => {
    console.log(
      "[PRIVACY] SessionProvider mounted - starting fresh (no session restoration)"
    );

    // Prevent browser back/forward cache restoration
    preventBFCache();

    // Clear any stale data immediately
    storage.clear();
    if (typeof window !== "undefined") {
      window.sessionStorage.clear();
    }

    setIsLoading(false);
  }, []);

  // Define clearSession BEFORE it is used in useEffect
  const clearSession = useCallback(
    (showMessage = false, reason?: string) => {
      console.log("[PRIVACY] ========== CLEARING SESSION ==========");
      const currentSessionId = sessionId;

      // Stop monitoring
      if (privacyManagerRef.current) {
        privacyManagerRef.current.stopSession();
      }

      // Clear React state
      setSessionId(null);
      setConsent(false);
      setCurrentStepState(STEPS.LANDING);

      if (reason) {
        setExpirationReason(reason);
      }

      // PRIVACY: Clear ALL storage
      storage.clear();

      if (typeof window !== "undefined") {
        // Clear sessionStorage
        window.sessionStorage.clear();

        // Clear any results data
        if (currentSessionId) {
          window.sessionStorage.removeItem(currentSessionId);
        }

        console.log("[PRIVACY] All client-side data cleared");
      }

      console.log("[PRIVACY] ========== SESSION CLEARED ==========");

      // Navigate to home if showing expiration message
      if (showMessage && typeof window !== "undefined") {
        setTimeout(() => {
          router.push("/?expired=true");
        }, 100);
      }
    },
    [sessionId, router]
  );

  useEffect(() => {
    if (sessionId && !isLoading) {
      console.log(`[PRIVACY] Starting session monitoring for ${sessionId}`);
      setExpirationReason(null);

      // Start automatic expiration monitoring (only on client)
      const manager = privacyManagerRef.current;
      if (manager) {
        manager.startSession((reason) => {
          console.log(`[PRIVACY] Session expired: ${reason}`);

          const message =
            reason === "inactivity"
              ? PRIVACY_MESSAGES.SESSION_EXPIRED_INACTIVITY
              : reason === "absolute"
                ? PRIVACY_MESSAGES.SESSION_EXPIRED_MAX_TIME
                : PRIVACY_MESSAGES.SESSION_EXPIRED_GENERIC;

          clearSession(true, message);
        });
      }
    }

    const manager = privacyManagerRef.current;
    return () => {
      if (sessionId && manager) {
        manager.stopSession();
      }
    };
  }, [sessionId, isLoading, clearSession]);

  const setSession = useCallback((id: string, consentGiven: boolean) => {
    console.log(`[PRIVACY] Session created: ${id}`);
    setSessionId(id);
    setConsent(consentGiven);
  };

  const setCurrentStep = useCallback((step: number) => {
    setCurrentStepState(step);
  }, []);

  const clearSession = () => {
    const currentSessionId = sessionId;
    setSessionId(null);
    setConsent(false);
    setCurrentStepState(STEPS.LANDING);
    storage.clear();
    sessionStorage.removeItem("demographics");
    sessionStorage.removeItem("current_session_id");
    sessionStorage.removeItem("scanned_fingerprints");
    if (currentSessionId) {
      sessionStorage.removeItem(currentSessionId);
    }
  };

  return (
    <SessionContext.Provider
      value={{
        sessionId,
        consent,
        currentStep,
        setSession,
        setCurrentStep,
        clearSession,
        isLoading,
        sessionActive,
        expirationReason,
      }}
    >
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  const context = useContext(SessionContext);
  if (context === undefined) {
    throw new Error("useSession must be used within a SessionProvider");
  }
  return context;
}
