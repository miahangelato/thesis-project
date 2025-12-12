'use client'

import React, { createContext, useContext, useState, ReactNode } from 'react'

import Cookies from 'js-cookie'

interface SessionContextType {
  sessionId: string | null
  consent: boolean | null
  currentStep: number
  setSession: (id: string, consent: boolean) => void
  setCurrentStep: (step: number) => void
  clearSession: () => void
}

const SessionContext = createContext<SessionContextType | undefined>(undefined)

export function SessionProvider({ children }: { children: ReactNode }) {
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [consent, setConsent] = useState<boolean | null>(null)
  const [currentStep, setCurrentStepState] = useState<number>(0)

  // Load session from cookies on mount
  React.useEffect(() => {
    try {
      const stored = Cookies.get('printalyzer_session')
      if (stored) {
        const data = JSON.parse(stored)
        setSessionId(data.sessionId)
        setConsent(data.consent)
        setCurrentStepState(data.currentStep || 0)
      }
    } catch (e) {
      console.error("Failed to restore session", e)
    }
  }, [])

  const setSession = (id: string, consentGiven: boolean) => {
    setSessionId(id)
    setConsent(consentGiven)
    try {
      Cookies.set('printalyzer_session', JSON.stringify({ 
        sessionId: id, 
        consent: consentGiven,
        currentStep 
      }), { expires: 1 })
    } catch (e) {
      console.error("Failed to save session", e)
    }
  }

  const setCurrentStep = (step: number) => {
    setCurrentStepState(step)
    try {
      const stored = Cookies.get('printalyzer_session')
      if (stored) {
        const data = JSON.parse(stored)
        Cookies.set('printalyzer_session', JSON.stringify({ 
          ...data,
          currentStep: step 
        }), { expires: 1 })
      }
    } catch (e) {
      console.error("Failed to save step", e)
    }
  }

  const clearSession = () => {
    setSessionId(null)
    setConsent(null)
    setCurrentStepState(0)
    Cookies.remove('printalyzer_session')
  }

  return (
    <SessionContext.Provider value={{ sessionId, consent, currentStep, setSession, setCurrentStep, clearSession }}>
      {children}
    </SessionContext.Provider>
  )
}

export function useSession() {
  const context = useContext(SessionContext)
  if (context === undefined) {
    throw new Error('useSession must be used within SessionProvider')
  }
  return context
}
