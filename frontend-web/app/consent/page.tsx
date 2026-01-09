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
import { StepNavigation } from "@/components/layout/step-navigation";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { useBackNavigation } from "@/hooks/use-back-navigation";
import { SessionEndModal } from "@/components/modals/session-end-modal";
import { FullScreenLoader } from "@/components/ui/full-screen-loader";

import { ROUTES, STEPS } from "@/lib/constants";

export default function ConsentPage() {
  const router = useRouter();
  const { setSession, sessionId, setCurrentStep } = useSession();
  const [consent, setConsent] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);

  const { showModal, handleConfirm, handleCancel, promptBackNavigation } =
    useBackNavigation(true);

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

  const handleBack = () => promptBackNavigation();

  return (
    <ProtectedRoute requireSession={true} requiredStep={STEPS.CONSENT}>
      <>
        <SessionEndModal
          isOpen={showModal}
          onConfirm={handleConfirm}
          onCancel={handleCancel}
        />

        <FullScreenLoader
          isOpen={loading}
          title="Preparing Your Session"
          subtitle="Please wait a moment…"
        />

        <div className="h-screen px-28 py-6 bg-white flex flex-col overflow-hidden select-none">
          <main className="w-full flex-1 flex flex-col overflow-hidden">
            <div className="w-full flex flex-col">
              <ProgressHeader
                currentStep={STEPS.CONSENT}
                totalSteps={4}
                title="Your Privacy Comes First"
                subtitle="Before we analyze your fingerprints, here's exactly what happens to your data and what doesn't."
                accentColor="#00c2cb"
              />

              {/* Bigger spacing + larger default text for kiosk */}
              <div className="grid md:grid-cols-2 gap-4 mb-4">
                {/* Card 1: What We Analyze */}
                {/* Card 1: What We Analyze */}
                <div className="bg-white rounded-3xl p-8 border-2 border-[#00c2cb]/20 hover:shadow-xl transition-all duration-200 h-fit">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-12 h-12 flex items-center justify-center rounded-2xl bg-[#e4f7f8] shrink-0">
                      <TestTube className="text-[#00c2cb] h-6 w-6" />
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
                      <CheckCircle className="h-6 w-6 text-[#00c2cb] shrink-0 mt-0.5" />
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
                      <CheckCircle className="h-6 w-6 text-[#00c2cb] shrink-0 mt-0.5" />
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

                  <div className="bg-[#e4f7f8] rounded-2xl p-3 border-l-4 border-[#00c2cb] mb-4">
                    <p className="text-base text-gray-800 leading-relaxed">
                      Fingerprint patterns form before birth. Research suggests
                      some patterns may correlate with genetics and
                      health-related traits.
                    </p>
                  </div>

                  <div className="bg-red-50 border-2 border-red-500 rounded-2xl px-5 py-3 flex items-center justify-center space-x-3 shadow-sm">
                    <AlertTriangle className="h-6 w-6 text-red-600 shrink-0" />
                    <p className="text-base text-red-900 font-semibold text-center leading-relaxed">
                      <strong>Important:</strong> This is a screening tool — not
                      a medical diagnosis.
                    </p>
                  </div>
                </div>

                {/* Card 2: Your Privacy */}
                {/* Card 2: Your Privacy */}
                <div className="bg-white rounded-3xl p-8 border-2 border-[#00c2cb]/20 hover:shadow-xl transition-all duration-200 h-fit">
                  <div className="flex items-center gap-4 mb-5">
                    <div className="w-12 h-12 flex items-center justify-center rounded-2xl bg-[#e4f7f8] shrink-0">
                      <Shield className="text-[#00c2cb] h-6 w-6" />
                    </div>
                    <h2 className="text-3xl font-bold text-gray-900">
                      Your Privacy, Protected
                    </h2>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 mb-4">
                    <div>
                      <h3 className="text-base font-extrabold text-[#00c2cb] uppercase tracking-wide">
                        ✅ We Collect
                      </h3>

                      <div className="space-y-1">
                        <div className="flex items-start gap-3">
                          <CheckCircle className="h-5 w-5 text-[#00c2cb] shrink-0 mt-0.5" />
                          <p className="text-lg text-gray-800">
                            Basic info (age, gender, etc.)
                          </p>
                        </div>

                        <div className="flex items-start gap-3">
                          <CheckCircle className="h-5 w-5 text-[#00c2cb] shrink-0 mt-0.5" />
                          <p className="text-lg text-gray-800">
                            Fingerprint patterns (by consent)
                          </p>
                        </div>
                      </div>

                      <p className="text-sm text-gray-500 mt-2 italic">
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
                  <div className="flex flex-wrap items-center justify-center gap-4 py-2 bg-[#e4f7f8] rounded-2xl border-2 border-[#00c2cb]/20">
                    <div className="flex items-center gap-2 text-sm font-bold text-gray-700 px-3 py-2 bg-white rounded-xl border border-[#00c2cb]/20">
                      <Lock className="h-5 w-5 text-[#00c2cb]" />
                      <span>Encrypted</span>
                    </div>

                    <div className="flex items-center gap-2 text-sm font-bold text-gray-700 px-3 py-2 bg-white rounded-xl border border-[#00c2cb]/20">
                      <Zap className="h-5 w-5 text-[#00c2cb]" />
                      <span>AI-processed</span>
                    </div>

                    <div className="flex items-center gap-2 text-sm font-bold text-gray-700 px-3 py-2 bg-white rounded-xl border border-[#00c2cb]/20">
                      <Ban className="h-5 w-5 text-[#00c2cb]" />
                      <span>Never sold</span>
                    </div>
                  </div>

                  {/* Legal Disclaimer - larger + calmer */}
                  <div className="mt-4 bg-gray-50 rounded-2xl px-5 py-4 border-2 border-gray-200">
                    <p className="text-base text-gray-700 leading-relaxed">
                      <strong className="text-gray-900 mr-1">
                        Legal Disclaimer:
                      </strong>
                      This tool provides predictive insights based on
                      fingerprint and demographic data. It does not replace
                      laboratory tests, blood typing, or medical diagnosis.
                      Always consult healthcare professionals for clinical
                      decisions.
                    </p>
                  </div>
                </div>
              </div>

              {/* Your Choice Section (bigger + finger-friendly) */}
              <div className="bg-white rounded-3xl p-8 border-2 border-[#00c2cb]/30 hover:shadow-xl transition-shadow duration-200 mb-4 shrink-0">
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8">
                  <div className="lg:flex-1">
                    <div className="flex items-center mb-3 gap-4">
                      <UserCheck className="text-[#00c2cb] h-8 w-8" />
                      <h2 className="text-3xl font-bold text-gray-900">
                        You're in Control
                      </h2>
                    </div>

                    <p className="text-lg text-gray-700 leading-relaxed ">
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
                          ? "bg-[#00c2cb] text-white ring-4 ring-[#00c2cb]/20 scale-[1.02]"
                          : "bg-white text-[#00c2cb] border-2 border-[#00c2cb] hover:bg-[#e4f7f8]"
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
            </div>
          </main>
          <div className="mt-2 mb-4">
            <StepNavigation
              onBack={handleBack}
              onNext={handleNext}
              isNextDisabled={loading || consent === null}
              nextLabel="Continue to Analysis"
              loading={loading}
              isSubmit={false}
            />
          </div>

          <Footer
            transparent
            customContent={<>No needles • Non-invasive • Privacy-first</>}
          />
        </div>
      </>
    </ProtectedRoute>
  );
}
