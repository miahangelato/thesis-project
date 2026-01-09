"use client";
import { useState } from "react";
import { useSession } from "@/contexts/session-context";
import { ProgressHeader } from "@/components/layout/progress-header";
import { Footer } from "@/components/layout/footer";
import React from "react";
import { useRouter } from "next/navigation";
import { ROUTES, STEPS } from "@/lib/constants";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { SessionEndModal } from "@/components/modals/session-end-modal";
import { useBackNavigation } from "@/hooks/use-back-navigation";
import { sessionAPI } from "@/lib/api";
import { useResultsData } from "@/hooks/use-results-data";
import { ResultsEmpty } from "@/components/results/results-empty";
import { ResultsLoading } from "@/components/results/results-loading";
import { ResultsSidebar } from "@/components/results/results-sidebar";
import { ResultsTabs } from "@/components/results/results-tabs";
import { ResultsTabContent } from "@/components/results/results-tab-content";

type TabType = "analysis" | "facilities" | "blood" | "download";

export default function ResultPage() {
  const router = useRouter();
  const { sessionId, clearSession } = useSession();
  const [activeTab, setActiveTab] = useState<TabType>("analysis");
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [pdfError, setPdfError] = useState<string | null>(null);
  const { showModal, handleConfirm, handleCancel, promptBackNavigation } =
    useBackNavigation(true);

  const { loading, result, bloodGroupResult, participantData, demographics } =
    useResultsData(sessionId);

  const handleNewSession = () => {
    clearSession();
    router.push(ROUTES.HOME);
  };

  const generatePDF = async () => {
    const activeSessionId =
      sessionId || sessionStorage.getItem("current_session_id");
    if (!activeSessionId) return;
    try {
      setPdfLoading(true);
      setPdfError(null);
      const response = await sessionAPI.generatePDF(activeSessionId);
      setPdfUrl(response.data.download_url || response.data.pdf_url);
    } catch (err: unknown) {
      console.error("Failed to generate PDF:", err);

      let message = "Failed to generate PDF report.";
      const errObj =
        err && typeof err === "object"
          ? (err as Record<string, unknown>)
          : null;
      const response =
        errObj && typeof errObj.response === "object"
          ? (errObj.response as Record<string, unknown>)
          : null;
      const data =
        response && typeof response.data === "object"
          ? (response.data as Record<string, unknown>)
          : null;
      if (data && typeof data.error === "string") message = data.error;

      setPdfError(message);
    } finally {
      setPdfLoading(false);
    }
  };

  const handleDirectDownload = async () => {
    if (!pdfUrl) return;
    try {
      const link = document.createElement("a");
      link.href = pdfUrl;
      const activeSessionId =
        sessionId || sessionStorage.getItem("current_session_id");
      link.download = `health_report_${activeSessionId ?? "report"}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error("Download failed:", err);
      setPdfError("Failed to download PDF. Please try again.");
    }
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
                {/* Left Sidebar - Results & Profile */}
                <ResultsSidebar
                  result={result}
                  bloodGroupResult={bloodGroupResult}
                  participantData={participantData}
                  demographics={demographics}
                />

                {/* Right Content Area - Tabs */}
                <div className="col-span-8 flex flex-col min-h-0">
                  {/* Tab Navigation */}
                  <ResultsTabs
                    activeTab={activeTab}
                    onTabChange={setActiveTab}
                    canShowBloodTab={canShowBloodTab}
                  />

                  {/* Tab Content */}
                  <ResultsTabContent
                    activeTab={activeTab}
                    participantData={participantData}
                    canShowBloodTab={canShowBloodTab}
                    pdfUrl={pdfUrl}
                    pdfLoading={pdfLoading}
                    pdfError={pdfError}
                    onGeneratePDF={generatePDF}
                    onDirectDownload={handleDirectDownload}
                    onResetPDF={() => {
                      setPdfUrl(null);
                      setPdfError(null);
                    }}
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
