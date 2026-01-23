"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/contexts/session-context";

export function useBackNavigation(enabled: boolean = true) {
  const router = useRouter();
  const { clearSession } = useSession();
  const [showModal, setShowModal] = useState(false);
  const [pendingNavigation, _setPendingNavigation] = useState(false);

  useEffect(() => {
    if (!enabled || typeof window === "undefined") return;

    const handlePopState = (event: PopStateEvent) => {
      event.preventDefault();

      setShowModal(true);
      _setPendingNavigation(true);

      window.history.pushState(null, "", window.location.pathname);
    };

    window.history.pushState(null, "", window.location.pathname);

    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, [enabled, clearSession, router]);

  const handleConfirm = () => {
    setShowModal(false);
    _setPendingNavigation(false);
    clearSession();

    if (typeof window !== "undefined") {
      setTimeout(() => {
        window.location.href = "/";
      }, 150);
    }
  };

  const handleCancel = () => {
    setShowModal(false);
    _setPendingNavigation(false);
    window.history.pushState(null, "", window.location.pathname);
  };

  const promptBackNavigation = () => {
    setShowModal(true);
    _setPendingNavigation(true);
  };

  return { showModal, handleConfirm, handleCancel, promptBackNavigation };
}
