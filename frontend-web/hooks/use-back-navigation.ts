"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/contexts/session-context";

export function useBackNavigation(enabled: boolean = true) {
    const router = useRouter();
    const { clearSession } = useSession();
    const [showModal, setShowModal] = useState(false);
    const [pendingNavigation, setPendingNavigation] = useState(false);

    useEffect(() => {
        if (!enabled) return;

        const handlePopState = (event: PopStateEvent) => {
            event.preventDefault();

            // Show the modal instead of browser confirm
            setShowModal(true);
            setPendingNavigation(true);

            // Push state back to prevent navigation until user confirms
            window.history.pushState(null, "", window.location.pathname);
        };

        // Push current state to prevent immediate back
        window.history.pushState(null, "", window.location.pathname);

        window.addEventListener("popstate", handlePopState);

        return () => {
            window.removeEventListener("popstate", handlePopState);
        };
    }, [enabled, clearSession, router]);

    const handleConfirm = () => {
        setShowModal(false);
        setPendingNavigation(false);
        clearSession();
        router.replace("/");
    };

    const handleCancel = () => {
        setShowModal(false);
        setPendingNavigation(false);
        // Push state again to maintain the current position
        window.history.pushState(null, "", window.location.pathname);
    };

    return { showModal, handleConfirm, handleCancel };
}

