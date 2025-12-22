"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  TestTube,
  Shield,
  UserCheck,
  Lock,
  Zap,
  Ban,
  CheckCircle,
  XCircle,
  ArrowLeft,
  ArrowRight,
  AlertTriangle,
  X,
} from "lucide-react";
import { useSession } from "@/contexts/session-context";
import { ProgressHeader } from "@/components/layout/progress-header";
import { Footer } from "@/components/layout/footer";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { useBackNavigation } from "@/hooks/use-back-navigation";
import { SessionEndModal } from "@/components/modals/session-end-modal";

import { ROUTES, STEPS } from "@/lib/constants";

export default function ConsentPage() {
  const router = useRouter();
  const { setSession, sessionId, setCurrentStep } = useSession();
  const [consent, setConsent] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);

  const { showModal, handleConfirm, handleCancel } = useBackNavigation(true);

  const handleNext = async () => {
    const finalConsent = consent ?? false;

    setLoading(true);

    if (sessionId) {
      setSession(sessionId, finalConsent);
    }

    setCurrentStep(STEPS.DEMOGRAPHICS);

    // Let React paint the loading UI
    requestAnimationFrame(() => {
      router.push(ROUTES.DEMOGRAPHICS);
    });
  };

  const handleBack = () => router.back();

  return (
    <ProtectedRoute requireSession={true} requiredStep={STEPS.CONSENT}>
      <>
        <SessionEndModal
          isOpen={showModal}
          onConfirm={handleConfirm}
          onCancel={handleCancel}
        />

        {/* Loading Overlay (bigger, kiosk-friendly) */}
        {loading && (
          <div className="fixed inset-0 bg-white/95 backdrop-blur-sm z-50 flex items-center justify-center">
            <div className="flex flex-col items-center gap-5">
              <div className="relative">
                <div className="w-20 h-20 border-4 border-teal-200 border-t-teal-600 rounded-full animate-spin" />
                <div
                  className="absolute inset-0 w-20 h-20 border-4 border-transparent border-b-teal-400 rounded-full animate-spin"
                  style={{
                    animationDirection: "reverse",
                    animationDuration: "1s",
                  }}
                />
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-800 mb-1">
                  Preparing Your Session
                </p>
                <p className="text-base text-gray-600">Please wait a moment…</p>
              </div>
            </div>
          </div>
        )}

        <div className="h-screen bg-white flex flex-col overflow-hidden select-none">
          <div className="flex flex-col page-content-max h-full">
            <main className="w-full page-container flex-1 flex flex-col overflow-y-auto">
              <div className="w-full flex flex-col">
                <ProgressHeader
                  currentStep={STEPS.CONSENT}
                  totalSteps={4}
                  title="Your Privacy Comes First"
                  subtitle="Before we analyze your fingerprints, here’s exactly what happens to your data — and what doesn’t."
                  accentColor="#14b8a6"
                />

                {/* Bigger spacing + larger default text for kiosk */}
                <div className="grid md:grid-cols-2 gap-4 mb-4">
                  {/* Card 1: What We Analyze */}
                  <div className="bg-white rounded-3xl p-8 border-2 border-teal-100 hover:shadow-xl transition-all duration-200 h-fit">
                    <div className="flex items-center gap-4 mb-6">
                      <div className="w-12 h-12 flex items-center justify-center rounded-2xl bg-linear-to-br from-teal-100 to-cyan-100 shrink-0">
                        <TestTube className="text-teal-700 h-6 w-6" />
                      </div>
                      <h2 className="text-3xl font-bold text-gray-900">
                        What We Analyze
                      </h2>
                    </div>

                    <p className="text-lg text-gray-700 mb-3 leading-relaxed">
                      We analyze fingerprint patterns and basic info to provide:
                    </p>

                    <div className="space-y-4 mb-3">
                      <div className="flex items-start gap-4">
                        <CheckCircle className="h-6 w-6 text-teal-600 shrink-0 mt-0.5" />
                        <div>
                          <p className="font-bold text-gray-900 text-lg">
                            Blood type prediction
                          </p>
                          <p className="text-base text-gray-600">
                            Non-invasive estimate (not lab-verified).
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-4">
                        <CheckCircle className="h-6 w-6 text-teal-600 shrink-0 mt-0.5" />
                        <div>
                          <p className="font-bold text-gray-900 text-lg">
                            Diabetes risk screening
                          </p>
                          <p className="text-base text-gray-600">
                            Early signal check (not a diagnosis).
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-teal-50 rounded-2xl p-3 border-l-4 border-teal-500 mb-4">
                      <p className="text-base text-gray-800 leading-relaxed">
                        Fingerprint patterns form before birth. Research
                        suggests some patterns may correlate with genetics and
                        health-related traits.
                      </p>
                    </div>

                    <div className="bg-red-50 border-2 border-red-500 rounded-2xl px-5 py-3 flex items-center justify-center space-x-3 shadow-sm">
                      <AlertTriangle className="h-6 w-6 text-red-600 shrink-0" />
                      <p className="text-base text-red-900 font-semibold text-center leading-relaxed">
                        <strong>Important:</strong> This is a screening tool —
                        not a medical diagnosis.
                      </p>
                    </div>
                  </div>

                  {/* Card 2: Your Privacy */}
                  <div className="bg-white rounded-3xl p-8 border-2 border-teal-100 hover:shadow-xl transition-all duration-200 h-fit">
                    <div className="flex items-center gap-4 mb-5">
                      <div className="w-12 h-12 flex items-center justify-center rounded-2xl bg-linear-to-br from-teal-100 to-cyan-100 shrink-0">
                        <Shield className="text-teal-700 h-6 w-6" />
                      </div>
                      <h2 className="text-3xl font-bold text-gray-900">
                        Your Privacy, Protected
                      </h2>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 mb-4">
                      <div>
                        <h3 className="text-base font-extrabold text-teal-700 uppercase tracking-wide">
                          ✅ We Collect
                        </h3>

                        <div className="space-y-1">
                          <div className="flex items-start gap-3">
                            <CheckCircle className="h-5 w-5 text-teal-600 shrink-0 mt-0.5" />
                            <p className="text-lg text-gray-800">
                              Basic info (age, gender, etc.)
                            </p>
                          </div>

                          <div className="flex items-start gap-3">
                            <CheckCircle className="h-5 w-5 text-teal-600 shrink-0 mt-0.5" />
                            <p className="text-lg text-gray-800">
                              Fingerprint patterns (session only)
                            </p>
                          </div>
                        </div>

                        <p className="text-sm text-gray-500 mt-4 italic">
                          Used to improve prediction quality.
                        </p>
                      </div>

                      <div>
                        <h3 className="text-base font-extrabold text-red-700 uppercase tracking-wide">
                          ❌ We Don't
                        </h3>

                        <div className="space-y-1">
                          <div className="flex items-start gap-3">
                            <XCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
                            <p className="text-lg text-gray-800">
                              Store personal identifiers
                            </p>
                          </div>

                          <div className="flex items-start gap-3">
                            <XCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
                            <p className="text-lg text-gray-800">
                              Save fingerprint images
                            </p>
                          </div>

                          <div className="flex items-start gap-3">
                            <XCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
                            <p className="text-lg text-gray-800">
                              Share with third parties
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Trust chips - bigger */}
                    <div className="flex flex-wrap items-center justify-center gap-4 py-2 bg-linear-to-r from-teal-50 to-cyan-50 rounded-2xl border-2 border-teal-100">
                      <div className="flex items-center gap-2 text-sm font-bold text-gray-700 px-3 py-2 bg-white rounded-xl border border-teal-100">
                        <Lock className="h-5 w-5 text-teal-600" />
                        <span>Encrypted</span>
                      </div>

                      <div className="flex items-center gap-2 text-sm font-bold text-gray-700 px-3 py-2 bg-white rounded-xl border border-teal-100">
                        <Zap className="h-5 w-5 text-teal-600" />
                        <span>AI-processed</span>
                      </div>

                      <div className="flex items-center gap-2 text-sm font-bold text-gray-700 px-3 py-2 bg-white rounded-xl border border-teal-100">
                        <Ban className="h-5 w-5 text-teal-600" />
                        <span>Never sold</span>
                      </div>
                    </div>

                    {/* Legal Disclaimer - larger + calmer */}
                    <div className="mt-4 bg-gray-50 rounded-2xl px-5 py-4 border-2 border-gray-200">
                      <p className="text-base text-gray-700 leading-relaxed">
                        <strong className="text-gray-900 mr-1">
                          Legal Disclaimer:
                        </strong>
                        Printalyzer provides predictive insights based on
                        fingerprint and demographic data. It does not replace
                        laboratory tests, blood typing, or medical diagnosis.
                        Always consult healthcare professionals for clinical
                        decisions.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Your Choice Section (bigger + finger-friendly) */}
                <div className="bg-white rounded-3xl p-8 border-2 border-teal-200 hover:shadow-xl transition-shadow duration-200 mb-4 shrink-0">
                  <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8">
                    <div className="lg:flex-1">
                      <div className="flex items-center mb-3 gap-4">
                        <UserCheck className="text-teal-600 h-8 w-8" />
                        <h2 className="text-3xl font-bold text-gray-900">
                          You're in Control
                        </h2>
                      </div>

                      <p className="text-lg text-gray-700 leading-relaxed mb-2">
                        Choose whether to save your data for research purposes.
                        Either way, you can continue with the analysis.
                      </p>

                      <p className="text-base text-gray-500 font-semibold">
                        Your choice will not affect the analysis quality.
                      </p>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center w-full lg:w-auto">
                      <button
                        onClick={() => setConsent(true)}
                        className={`w-full sm:w-auto flex items-center justify-center gap-3 px-8 h-16 rounded-2xl font-extrabold text-lg transition-all duration-200 shadow-lg cursor-pointer ${
                          consent === true
                            ? "bg-teal-600 text-white ring-4 ring-teal-200 scale-[1.02]"
                            : "bg-white text-teal-700 border-2 border-teal-400 hover:bg-teal-50"
                        }`}
                      >
                        <span>Save My Data</span>
                      </button>

                      <button
                        onClick={() => setConsent(false)}
                        className={`w-full sm:w-auto flex items-center justify-center gap-3 px-8 h-16 rounded-2xl font-extrabold text-lg transition-all duration-200 shadow-lg cursor-pointer ${
                          consent === false
                            ? "bg-gray-700 text-white ring-4 ring-gray-200 scale-[1.02]"
                            : "bg-white text-gray-700 border-2 border-gray-300 hover:bg-gray-50"
                        }`}
                      >
                        <span>Don't Save Data</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Navigation (bigger buttons + text) */}
                <div className="flex justify-between items-center">
                  <div className="flex gap-10 justify-center items-center">
                    <Button
                      variant="outline"
                      onClick={() => router.push("/")}
                      className="flex items-center gap-2 border-2 border-gray-300 hover:bg-gray-50 h-14 px-6 text-base font-bold cursor-pointer rounded-xl"
                    >
                      <ArrowLeft size={18} />
                      Back
                    </Button>
                  </div>

                  <div className="flex flex-col items-end">
                    <Button
                      onClick={handleNext}
                      disabled={loading || consent === null}
                      className="flex items-center gap-3 bg-teal-600 hover:bg-teal-700 text-white px-12 h-14 text-xl font-extrabold rounded-2xl shadow-xl disabled:opacity-50 cursor-pointer"
                    >
                      {loading ? (
                        <>
                          <span className="animate-spin h-6 w-6 border-2 border-white border-t-transparent rounded-full" />
                          <span>Processing…</span>
                        </>
                      ) : (
                        <>
                          <span>Continue to Analysis</span>
                          <ArrowRight size={20} />
                        </>
                      )}
                    </Button>

                    <p className="text-sm mt-3 text-gray-500 font-medium">
                      Takes less than 2 minutes • No needles • Non-invasive
                    </p>
                  </div>
                </div>
              </div>
            </main>

            <Footer transparent />
          </div>
        </div>
      </>
    </ProtectedRoute>
  );
}
