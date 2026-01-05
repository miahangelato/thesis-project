"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { ROUTES } from "@/lib/constants";
import { clearClientSessionState } from "@/lib/end-session";

export default function CatchAll() {
  const router = useRouter();

  useEffect(() => {
    // Unknown route: end any active session and return home.
    clearClientSessionState();
    router.replace(ROUTES.HOME);
  }, [router]);

  return (
    <div className="min-h-screen w-full bg-white flex items-center justify-center p-6">
      <div className="max-w-md w-full rounded-2xl border border-gray-200 bg-white shadow-sm p-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Page not found
        </h1>
        <p className="text-base text-gray-600">
          Returning to Home and ending your session…
        </p>
      </div>
    </div>
  );
}
