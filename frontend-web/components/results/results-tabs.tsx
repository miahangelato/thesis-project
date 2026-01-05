import React from "react";
import { Activity, FileText, Heart, Hospital } from "lucide-react";

type TabType = "analysis" | "facilities" | "blood" | "download";

export function ResultsTabs({
  activeTab,
  onTabChange,
  canShowBloodTab,
}: {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  canShowBloodTab: boolean;
}) {
  return (
    <div className="flex space-x-3 mb-3">
      <button
        onClick={() => onTabChange("analysis")}
        className={`flex-1 py-3 px-4 rounded-lg font-bold text-base transition-all cursor-pointer ${
          activeTab === "analysis"
            ? "bg-linear-to-r from-teal-500 to-cyan-500 text-white shadow-lg"
            : "bg-white text-gray-600 hover:bg-gray-50 border-2 border-gray-200"
        }`}
      >
        <Activity className="w-5 h-5 inline mr-2" />
        Health Analysis
      </button>
      <button
        onClick={() => onTabChange("facilities")}
        className={`flex-1 py-3 px-4 rounded-lg font-bold text-base transition-all cursor-pointer ${
          activeTab === "facilities"
            ? "bg-linear-to-r from-teal-500 to-cyan-500 text-white shadow-lg"
            : "bg-white text-gray-600 hover:bg-gray-50 border-2 border-gray-200"
        }`}
      >
        <Hospital className="w-5 h-5 inline mr-2" />
        Recommended Facilities
      </button>

      {canShowBloodTab && (
        <button
          onClick={() => onTabChange("blood")}
          className={`flex-1 py-3 px-4 rounded-lg font-bold text-base transition-all cursor-pointer ${
            activeTab === "blood"
              ? "bg-linear-to-r from-rose-500 to-red-500 text-white shadow-lg"
              : "bg-white text-gray-600 hover:bg-gray-50 border-2 border-gray-200"
          }`}
        >
          <Heart className="w-5 h-5 inline mr-2" />
          Blood Donation Centers
        </button>
      )}

      <button
        onClick={() => onTabChange("download")}
        className={`flex-1 py-3 px-4 rounded-lg font-bold text-base transition-all cursor-pointer ${
          activeTab === "download"
            ? "bg-linear-to-r from-teal-500 to-cyan-500 text-white shadow-lg"
            : "bg-white text-gray-600 hover:bg-gray-50 border-2 border-gray-200"
        }`}
      >
        <FileText className="w-5 h-5 inline mr-2" />
        Download Results
      </button>
    </div>
  );
}
