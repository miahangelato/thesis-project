import React from "react";
import { Info } from "lucide-react";
import type { ResultsParticipantData } from "@/types/results";

export function ResultsAnalysisTab({
  participantData,
}: {
  participantData: ResultsParticipantData;
}) {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-gray-800 mb-4">Health Analysis</h2>

      {/* AI Health Insights */}
      {participantData?.explanation && (
        <div className="bg-linear-to-br from-purple-50 to-indigo-50 border-2 border-purple-200 rounded-xl p-6 shadow-lg">
          <h3 className="font-bold text-lg text-purple-900 mb-3 flex items-center">
            <Info className="w-6 h-6 mr-2" />
            AI-Generated Health Insights
          </h3>
          <div className="prose max-w-none text-gray-700 whitespace-pre-wrap leading-relaxed text-base">
            {participantData.explanation}
          </div>
        </div>
      )}
    </div>
  );
}
