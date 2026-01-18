import React from "react";

import { ResultsAnalysisTab } from "@/components/results/tabs/results-analysis-tab";
import { ResultsBloodTab } from "@/components/results/tabs/results-blood-tab";
import { ResultsDownloadTab } from "@/components/results/tabs/results-download-tab";
import { ResultsFacilitiesTab } from "@/components/results/tabs/results-facilities-tab";
import type { MapPlace, ResultsParticipantData } from "@/types/results";

type TabType = "analysis" | "facilities" | "blood" | "download";

export function ResultsTabContent({
  activeTab,
  participantData,
  canShowBloodTab,
  onOpenQR,
}: {
  activeTab: TabType;
  participantData: ResultsParticipantData;
  canShowBloodTab: boolean;
  onOpenQR: (facility: MapPlace) => void;
}) {
  const contentClassName = "h-full overflow-hidden";

  return (
    <div className="flex-1 bg-white rounded-b-xl rounded-tr-xl shadow-sm border-2 border-gray-200 overflow-hidden min-h-0 relative z-0">
      <div className={contentClassName}>
        {/* RESULTS */}
        {activeTab === "analysis" && (
          <ResultsAnalysisTab participantData={participantData} />
        )}

        {/* FACILITIES */}
        {activeTab === "facilities" && (
          <ResultsFacilitiesTab 
            participantData={participantData} 
            onOpenQR={onOpenQR}
          />
        )}

        {/* BLOOD DONATION */}
        {activeTab === "blood" && (
          <ResultsBloodTab
            participantData={participantData}
            canShowBloodTab={canShowBloodTab}
            onOpenQR={onOpenQR}
          />
        )}

        {activeTab === "download" && (
          <ResultsDownloadTab
            qrCodeUrl={participantData.qr_code_url}
            downloadUrl={participantData.download_url}
          />
        )}
      </div>
    </div>
  );
}
