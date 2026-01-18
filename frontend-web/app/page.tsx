"use client";
import { useState } from "react";
import { FileText, User, ScanLine, BarChart3 } from "lucide-react";
import { useRouter } from "next/navigation";
import { Footer } from "@/components/layout/footer";
import { sessionAPI } from "@/lib/api";
import { useSession } from "@/contexts/session-context";
import { MainCarousel } from "@/components/features/landing/main-carousel";
import { WarningHeader } from "@/components/layout/warning-header";
import { ROUTES, STEPS } from "@/lib/constants";

const features = [
  {
    title: "Consent",
    description: "Review and agree to our privacy-first consent form before starting.",
    icon: <FileText />,
  },
  {
    title: "Personal Information",
    description: "Enter your age, gender, height, weight, and donation eligibility.",
    icon: <User />,
  },
  {
    title: "Fingerprint Scan & Analysis",
    description: "Scan your fingerprint for AI-powered dermatoglyphic analysis.",
    icon: <ScanLine />,
  },
  {
    title: "Results & Recommendations",
    description: "Get instant predictions, risk assessment, and donation guidance.",
    icon: <BarChart3 />,
  },
];

export default function LandingPage() {
  const router = useRouter();
  const { setSession, setCurrentStep } = useSession();
  const [loading, setLoading] = useState(false);

  const handleStartClick = async () => {
    setLoading(true);
    try {
      // Start session immediately (consent status pending)
      const response = await sessionAPI.start(false); // Start without consent

      // Use logical OR to handle different response structures if backend API varies
      const session_id = response.data?.session_id || response.data?.sessionId;

      if (session_id) {
        setSession(session_id, false);
        setCurrentStep(STEPS.CONSENT);
        router.push(ROUTES.CONSENT);
      } else {
        throw new Error("Invalid session response");
      }
    } catch (err) {
      console.error("Failed to start session:", err);
      // Fallback for demo/offline mode if needed, but preferably handle error UI
      const mockId = "dev-session-" + Date.now();
      setSession(mockId, false);
      setCurrentStep(STEPS.CONSENT);
      router.push(ROUTES.CONSENT);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex flex-col h-screen w-full page-content-max overflow-hidden">
      {/* Warning Banner */}
      <div className="w-full page-container pt-4 pb-0 z-20 select-none">
        <WarningHeader />
      </div>

      {/* Hero Section - Carousel */}
      <div className="relative flex-1 w-full min-h-0 flex items-center">
        <MainCarousel
          autoPlayInterval={6000}
          onStartClick={handleStartClick}
          loading={loading}
        />
      </div>

      {/* Features Section - Static Cards */}
      <div className="w-full page-container pb-2 -mt-8 grid grid-cols-4 gap-6 z-10 select-none">
        {features.map((feature, index) => (
          <div
            key={index}
            className="bg-white rounded-xl p-6 border-2 border-[#00c2cb] hover:shadow-xl transition-all duration-200 hover:border-[#00adb5] hover:-translate-y-1"
          >
            <div className="w-16 h-16 flex items-center justify-center rounded-xl bg-[#e4f7f8] mb-4">
              <span className="text-[#00c2cb] text-3xl">{feature.icon}</span>
            </div>
            <h3 className="text-xl lg:text-2xl font-semibold mb-3 text-gray-800">
              {feature.title}
            </h3>
            <p className="text-lg lg:text-xl text-gray-600 leading-normal">
              {feature.description}
            </p>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="py-2 z-30">
        <Footer />
      </div>
    </div>
  );
}
