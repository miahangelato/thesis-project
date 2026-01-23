"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

import { useSession } from "@/contexts/session-context";
import { useResultsData } from "@/hooks/use-results-data";
import { useBackNavigation } from "@/hooks/use-back-navigation";

import { ROUTES, STEPS } from "@/lib/constants";

import { ProgressHeader } from "@/components/layout/progress-header";
import { Footer } from "@/components/layout/footer";

import { ProtectedRoute } from "@/components/auth/protected-route";
import { SessionEndModal } from "@/components/modals/session-end-modal";

import { ResultsTabs } from "@/components/results/results-tabs";
import { ResultsEmpty } from "@/components/results/results-empty";
import { ResultsLoading } from "@/components/results/results-loading";
import { ResultsSidebar } from "@/components/results/results-sidebar";
import { FacilityQRModal } from "@/components/modals/facility-qr-modal";
import { ResultsTabContent } from "@/components/results/results-tab-content";

import type { MapPlace } from "@/types/results";
type TabType = "analysis" | "facilities" | "blood" | "download";

export default function ResultPage() {
  const router = useRouter();
  const { sessionId, clearSession } = useSession();
  const [activeTab, setActiveTab] = useState<TabType>("analysis");
  const { showModal, handleConfirm, handleCancel, promptBackNavigation } =
    useBackNavigation(false);

  const [isQRModalOpen, setIsQRModalOpen] = useState(false);
  const [selectedFacility, setSelectedFacility] = useState<MapPlace | null>(null);

  const { loading, result, bloodGroupResult, participantData, demographics } =
    useResultsData(sessionId);

  const handleOpenQR = (facility: MapPlace) => {
    setSelectedFacility(facility);
    setIsQRModalOpen(true);
  };

  const handleNewSession = () => {
    clearSession();
    router.push(ROUTES.HOME);
  };

  if (loading) {
    return <ResultsLoading />;
  }

  if (!result || !bloodGroupResult || !participantData) {
    return <ResultsEmpty onStartNew={handleNewSession} />;
  }

  const canShowBloodTab =
    participantData?.willing_to_donate ||
    (participantData?.blood_centers?.length ?? 0) > 0;

  return (
    <ProtectedRoute requireSession={true} requiredStep={STEPS.SCAN}>
      <>
        <SessionEndModal
          isOpen={showModal}
          onConfirm={handleConfirm}
          onCancel={handleCancel}
        />
        <FacilityQRModal
          isOpen={isQRModalOpen}
          onClose={() => setIsQRModalOpen(false)}
          facility={selectedFacility}
        />
        <div className="h-screen bg-white flex flex-col overflow-hidden">
          <main className="flex-1 flex flex-col overflow-hidden select-none">
            <div className="flex flex-col flex-1 min-h-0 px-28 py-6 overflow-hidden">
              <ProgressHeader
                currentStep={STEPS.RESULTS}
                totalSteps={4}
                title="Analysis Results"
                subtitle="Your health analysis is complete"
                accentColor="#00c2cb"
                onEndSession={promptBackNavigation}
              />

              <div className="grid grid-cols-12 gap-6 flex-1 min-h-0 pb-4 mb-6">
                <ResultsSidebar
                  result={result}
                  bloodGroupResult={bloodGroupResult}
                  participantData={participantData}
                  demographics={demographics}
                />

                <div className="col-span-8 flex flex-col min-h-0">
                  <ResultsTabs
                    activeTab={activeTab}
                    onTabChange={setActiveTab}
                    canShowBloodTab={canShowBloodTab}
                  />

                  <ResultsTabContent
                    activeTab={activeTab}
                    participantData={participantData}
                    canShowBloodTab={canShowBloodTab}
                    onOpenQR={handleOpenQR}
                  />
                </div>
              </div>
            </div>
            <Footer fixed={true} />
          </main>
        </div>
      </>
    </ProtectedRoute>
  );
}
