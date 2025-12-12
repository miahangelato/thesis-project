"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { 
  TestTube, Shield, UserCheck, Lock, Zap, Ban, CheckCircle, XCircle,
  ArrowLeft, ArrowRight, AlertTriangle
} from "lucide-react";
import { useSession } from "@/contexts/session-context";
import { ProgressHeader } from "@/components/layout/progress-header";
import { Footer } from "@/components/layout/footer";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { useBackNavigation } from "@/hooks/use-back-navigation";
import { SessionEndModal } from "@/components/modals/session-end-modal";

export default function ConsentPage() {
  const router = useRouter();
  const { setSession, sessionId, setCurrentStep } = useSession();
  const [consent, setConsent] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);

  const { showModal, handleConfirm, handleCancel } = useBackNavigation(true);

  const handleNext = async () => {
    // Allow continuing even if consent is null - default to false (don't save)
    const finalConsent = consent === null ? false : consent;
    
    setLoading(true);
    try {
      if (sessionId) {
        setSession(sessionId, finalConsent);
      }
      setCurrentStep(2); // Moving to demographics page (step 2)
      router.push("/demographics");
    } catch (err) {
      console.error("Navigation error:", err);
      router.push("/demographics");
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => router.back();

  return (
    <ProtectedRoute requireSession={true} requiredStep={1}>
    <>
      <SessionEndModal 
        isOpen={showModal}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
      />
      {/* Loading Overlay */}
      {loading && (
        <div className="fixed inset-0 bg-white/95 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="relative">
              <div className="w-16 h-16 border-4 border-teal-200 border-t-teal-600 rounded-full animate-spin"></div>
              <div className="absolute inset-0 w-16 h-16 border-4 border-transparent border-b-teal-400 rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1s' }}></div>
            </div>
            <div className="text-center">
              <p className="text-lg font-semibold text-gray-800 mb-1">Preparing Your Session</p>
              <p className="text-sm text-gray-600">Please wait a moment...</p>
            </div>
          </div>
        </div>
      )}

      <div className="h-screen bg-white flex flex-col overflow-hidden">
      
      <div className="flex flex-col page-content-max h-full">
        <main className="w-full page-container flex-1 flex flex-col overflow-y-auto">
          <div className="w-full flex flex-col">
        
          <ProgressHeader 
            currentStep={1}
            totalSteps={4}
            title="Your Privacy Comes First"
            subtitle="Before we analyze your fingerprints, we want you to clearly understand what happens to your data — and what doesn't."
            accentColor="#14b8a6"
          />

          <div className="grid md:grid-cols-2 gap-6 mb-4 mt-4">
          
          {/* Card 1: What We Analyze */}
          <div className="bg-white rounded-2xl p-6 border border-teal-200 hover:shadow-lg transition-all duration-200 h-fit">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-gradient-to-br from-teal-100 to-cyan-100 flex-shrink-0">
                <TestTube className="text-teal-600 h-5 w-5" />
              </div>
              <h2 className="text-2xl font-bold text-gray-800">What We Analyze</h2>
            </div>
            <p className="text-base text-gray-600 mb-4 leading-relaxed">
                
              We analyze fingerprint patterns and basic information to provide:
            </p>

            <div className="space-y-3 mb-5">
              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-teal-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-gray-900">Blood type prediction</p>
                  <p className="text-base text-gray-600">(non-invasive)</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-teal-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-gray-900">Diabetes risk assessment</p>
                  <p className="text-base text-gray-600">(screening only)</p>
                </div>
              </div>
            </div>

            <div className="bg-teal-50 rounded-lg p-4 border-l-4 border-teal-500 mb-4">
              <p className="text-base text-gray-700 leading-relaxed">
                Your fingerprints contain dermatoglyphic patterns formed before birth. 
                Research shows these patterns can be linked to genetics and health-related traits.
              </p>
            </div>

            <div className="bg-red-50 border border-red-500 rounded-lg px-4 py-3 flex items-center justify-center space-x-2 shadow-sm">
              <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0" />
              <p className="text-base text-red-900 font-medium text-center">
                <strong>Important:</strong> This is a screening tool, not a medical diagnosis.
              </p>
            </div>
          </div>

          {/* Card 2: Your Privacy */}
          <div className="bg-white rounded-2xl p-6 border border-teal-200 hover:shadow-lg transition-all duration-200 h-fit">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-gradient-to-br from-teal-100 to-cyan-100 flex-shrink-0">
                <Shield className="text-teal-600 h-5 w-5" />
              </div>
              <h2 className="text-2xl font-bold text-gray-800">Your Privacy, Protected by Design</h2>
            </div>

            <div className="grid grid-cols-2 gap-6 mb-5">
              <div>
                <h3 className="text-base font-bold text-teal-600 mb-3 uppercase tracking-wide">✅ We Collect</h3>
                <div className="space-y-2">
                  <div className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-teal-600 flex-shrink-0 mt-0.5" />
                    <p className="text-base text-gray-700">Basic info (age, gender, etc.)</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-teal-600 flex-shrink-0 mt-0.5" />
                    <p className="text-base text-gray-700">Fingerprint patterns (session only)</p>
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-3 italic">This improves prediction accuracy.</p>
              </div>

              <div>
                <h3 className="text-sm font-bold text-red-600 mb-3 uppercase tracking-wide">❌ We Don't</h3>
                <div className="space-y-2">
                  <div className="flex items-start gap-2">
                    <XCircle className="h-4 w-4 text-red-600 flex-shrink-0 mt-0.5" />
                    <p className="text-base text-gray-700">Store personal identifiers</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <XCircle className="h-4 w-4 text-red-600 flex-shrink-0 mt-0.5" />
                    <p className="text-base text-gray-700">Save fingerprint images</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <XCircle className="h-4 w-4 text-red-600 flex-shrink-0 mt-0.5" />
                    <p className="text-base text-gray-700">Share with third parties</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-center gap-4 py-3 bg-gradient-to-r from-teal-50 to-cyan-50 rounded-lg border border-teal-100">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-700">
                <Lock className="h-4 w-4 text-teal-600" />
                <span>Encrypted</span>
              </div>
              <div className="w-px h-4 bg-gray-300" />
              <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-700">
                <Zap className="h-4 w-4 text-teal-600" />
                <span>AI-processed</span>
              </div>
              <div className="w-px h-4 bg-gray-300" />
              <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-700">
                <Ban className="h-4 w-4 text-teal-600" />
                <span>Never sold</span>
              </div>
            </div>

            {/* Legal Disclaimer */}
            <div className="mt-5 bg-gray-50 rounded-lg px-4 py-3 border border-gray-200">
              <p className="text-base text-gray-600 leading-relaxed">
                <strong className="text-gray-800">Legal Disclaimer:</strong> Printalyzer provides predictive insights based on fingerprint analysis 
                and demographic data. It does not replace laboratory tests, blood typing, or medical diagnosis. 
                Always consult healthcare professionals for clinical decisions.
              </p>
            </div>
          </div>
        </div>

        {/* Your Choice Section */}
        <div className="bg-white rounded-xl p-6 border-2 border-teal-200 hover:shadow-lg transition-shadow duration-200 mb-4 shrink-0">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="md:flex-1">
              <div className="flex items-center mb-2 gap-3">
                <UserCheck className="text-teal-600 h-7 w-7" />
                <h2 className="text-2xl font-bold text-gray-800">You're in Control</h2>
              </div>
              <p className="text-base text-gray-600 leading-relaxed mb-1">
                Choose whether to save your data for research purposes. Either way, you can continue with the analysis.
              </p>
              <p className="text-sm text-gray-500 font-medium">
                Your choice will not affect the analysis quality.
              </p>
            </div>
            
            <div className="flex gap-4 items-center">
              <button
                onClick={() => setConsent(true)}
                className={`flex items-center gap-2 px-6 py-4 rounded-xl font-bold text-base transition-all duration-200 shadow-md ${
                  consent === true 
                  ? "bg-teal-600 text-white ring-4 ring-teal-200 scale-105" 
                  : "bg-white text-teal-700 border-2 border-teal-400 hover:bg-teal-50"
                }`}
              >
                <span>Save My Data</span>
              </button>
              
              <button
                onClick={() => setConsent(false)}
                className={`flex items-center gap-2 px-6 py-4 rounded-xl font-bold text-base transition-all duration-200 shadow-md ${
                  consent === false 
                  ? "bg-gray-600 text-white ring-4 ring-gray-200 scale-105" 
                  : "bg-white text-gray-600 border-2 border-gray-300 hover:bg-gray-50"
                }`}
              >
                <span>Don't Save Data</span>
              </button>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex justify-between items-center pt-2 pb-4 shrink-0">
          <Button 
            variant="outline"
            onClick={handleBack}
            className="flex items-center gap-2 border-gray-300 hover:bg-gray-50"
          >
            <ArrowLeft size={16} />
            Back
          </Button>

          <div className="flex flex-col items-end">
            <Button 
              onClick={handleNext}
              disabled={loading}
              className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white px-10 py-6 text-lg font-bold rounded-xl shadow-lg disabled:opacity-50"
            >
              {loading ? (
                <>
                  <span className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></span>
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <span>Continue to Analysis</span>
                  <ArrowRight size={18} />
                </>
              )}
            </Button>
            <p className="text-xs mt-2 text-gray-500">
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
