"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { storage } from "@/lib/storage";
import { STORAGE_KEYS, STEPS } from "@/lib/constants";

interface SessionState {
  sessionId: string | null;
  consent: boolean;
  currentStep: number;
}

interface SessionContextType extends SessionState {
  setSession: (id: string, consent: boolean) => void;
  setCurrentStep: (step: number) => void;
  clearSession: () => void;
  isLoading: boolean;
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [consent, setConsent] = useState<boolean>(false);
  const [currentStep, setCurrentStepState] = useState<number>(STEPS.LANDING);
  const [isLoading, setIsLoading] = useState(true);

  // Load session from storage on mount
  useEffect(() => {
    try {
      const storedSessionId = storage.get<string>(STORAGE_KEYS.SESSION_ID);
      const storedConsent = storage.get<boolean>(STORAGE_KEYS.CONSENT);
      const storedStep = storage.get<number>(STORAGE_KEYS.CURRENT_STEP);

      if (storedSessionId) {
        setSessionId(storedSessionId);
        setConsent(storedConsent || false);
        setCurrentStepState(storedStep || STEPS.LANDING);
      }
    } catch (e) {
      console.error("Failed to restore session", e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Persist state changes
  useEffect(() => {
    if (!isLoading) {
      if (sessionId) {
        storage.set(STORAGE_KEYS.SESSION_ID, sessionId);
        storage.set(STORAGE_KEYS.CONSENT, consent);
        storage.set(STORAGE_KEYS.CURRENT_STEP, currentStep);
      } else {
        storage.remove(STORAGE_KEYS.SESSION_ID);
        storage.remove(STORAGE_KEYS.CONSENT);
        storage.remove(STORAGE_KEYS.CURRENT_STEP);
      }
    }
  }, [sessionId, consent, currentStep, isLoading]);

  const setSession = (id: string, consentGiven: boolean) => {
    setSessionId(id);
    setConsent(consentGiven);
    // Step is usually updated separately or defaults to consent
  };

  const setCurrentStep = (step: number) => {
    setCurrentStepState(step);
  };

  const clearSession = () => {
    const currentSessionId = sessionId;
    setSessionId(null);
    setConsent(false);
    setCurrentStepState(STEPS.LANDING);
    storage.clear();
    // Clear demographics data from sessionStorage
    sessionStorage.removeItem("demographics");
    sessionStorage.removeItem("current_session_id");
    sessionStorage.removeItem("scanned_fingerprints");
    // Clear analysis results from sessionStorage
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
      }}
    >
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  const context = useContext(SessionContext);
  if (context === undefined) {
    throw new Error("useSession must be used within SessionProvider");
  }
  return context;
}
