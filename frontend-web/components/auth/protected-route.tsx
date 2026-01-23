"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/contexts/session-context";
import { FullScreenLoader } from "@/components/ui/full-screen-loader";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireSession?: boolean;
  requiredStep?: number; // The minimum step required to access this page
}

export function ProtectedRoute({
  children,
  requireSession = true,
  requiredStep = 0,
}: ProtectedRouteProps) {
  const router = useRouter();
  const { sessionId, currentStep, isLoading } = useSession();

  useEffect(() => {
    if (isLoading) return;
    if (requireSession && !sessionId) {
      // No session, redirect to landing page
      router.replace("/");
    } else if (requiredStep > 0 && currentStep < requiredStep) {
      // User is trying to access a page they haven't reached yet
      router.replace("/");
    }
  }, [sessionId, currentStep, requireSession, requiredStep, router, isLoading]);

  if (isLoading) {
    return <FullScreenLoader title="Loading" subtitle="Please wait a moment…" />;
  }

  if (requireSession && !sessionId) {
    return null;
  }

  if (requiredStep > 0 && currentStep < requiredStep) {
    return null;
  }

  return <>{children}</>;
}
