"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/contexts/session-context";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireSession?: boolean;
  requiredStep?: number; // The minimum step required to access this page
}

export function ProtectedRoute({ 
  children, 
  requireSession = true,
  requiredStep = 0 
}: ProtectedRouteProps) {
  const router = useRouter();
  const { sessionId, currentStep } = useSession();

  useEffect(() => {
    if (requireSession && !sessionId) {
      // No session, redirect to landing page
      router.replace("/");
    } else if (requiredStep > 0 && currentStep < requiredStep) {
      // User is trying to access a page they haven't reached yet
      router.replace("/");
    }
  }, [sessionId, currentStep, requireSession, requiredStep, router]);

  if (requireSession && !sessionId) {
    return null;
  }

  if (requiredStep > 0 && currentStep < requiredStep) {
    return null;
  }

  return <>{children}</>;
}
