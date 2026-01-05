import React from "react";

import { ResultsAnalysisTab } from "@/components/results/tabs/results-analysis-tab";
import { ResultsBloodTab } from "@/components/results/tabs/results-blood-tab";
import { ResultsDownloadTab } from "@/components/results/tabs/results-download-tab";
import { ResultsFacilitiesTab } from "@/components/results/tabs/results-facilities-tab";
import type { ResultsParticipantData } from "@/types/results";

type TabType = "analysis" | "facilities" | "blood" | "download";

export function ResultsTabContent({
  activeTab,
  participantData,
  canShowBloodTab,
  pdfUrl,
  pdfLoading,
  pdfError,
  onGeneratePDF,
  onDirectDownload,
  onResetPDF,
}: {
  activeTab: TabType;
  participantData: ResultsParticipantData;
  canShowBloodTab: boolean;
  pdfUrl: string | null;
  pdfLoading: boolean;
  pdfError: string | null;
  onGeneratePDF: () => void;
  onDirectDownload: () => void;
  onResetPDF: () => void;
}) {
  return (
    <div className="flex-1 bg-white rounded-lg shadow-lg border-2 border-gray-200 overflow-hidden min-h-0">
      <div className="h-full overflow-y-auto p-5">
        {/* RESULTS */}
        {activeTab === "analysis" && (
          <ResultsAnalysisTab participantData={participantData} />
        )}

        {/* FACILITIES */}
        {activeTab === "facilities" && (
          <ResultsFacilitiesTab participantData={participantData} />
        )}

        {/* BLOOD DONATION */}
        {activeTab === "blood" && (
          <ResultsBloodTab
            participantData={participantData}
            canShowBloodTab={canShowBloodTab}
          />
        )}

        {activeTab === "download" && (
          <ResultsDownloadTab
            pdfUrl={pdfUrl}
            pdfLoading={pdfLoading}
            pdfError={pdfError}
            onGeneratePDF={onGeneratePDF}
            onDirectDownload={onDirectDownload}
            onReset={onResetPDF}
          />
        )}
      </div>
    </div>
  );
}
