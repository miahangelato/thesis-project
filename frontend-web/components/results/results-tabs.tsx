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
    <div className="flex space-x-1 shrink-0 px-2 relative z-10 top-0.5">
      <button
        onClick={() => onTabChange("analysis")}
        className={`py-3 px-5 rounded-t-lg font-bold text-base whitespace-nowrap transition-all cursor-pointer border-t-2 border-x-2 relative ${
          activeTab === "analysis"
            ? "bg-white text-teal-700 border-gray-200 border-b-white pb-3.5"
            : "bg-teal-50 text-teal-600 border-transparent hover:bg-teal-100/50 border-b-gray-200"
        }`}
      >
        <Activity className="w-4 h-4 inline mr-2" />
        Health Analysis
      </button>
      <button
        onClick={() => onTabChange("facilities")}
        className={`py-3 px-5 rounded-t-lg font-bold text-base whitespace-nowrap transition-all cursor-pointer border-t-2 border-x-2 relative ${
          activeTab === "facilities"
            ? "bg-white text-teal-700 border-gray-200 border-b-white pb-3.5"
            : "bg-teal-50 text-teal-600 border-transparent hover:bg-teal-100/50 border-b-gray-200"
        }`}
      >
        <Hospital className="w-4 h-4 inline mr-2" />
        Recommended Facilities
      </button>

      {canShowBloodTab && (
        <button
          onClick={() => onTabChange("blood")}
          className={`py-3 px-5 rounded-t-lg font-bold text-base whitespace-nowrap transition-all cursor-pointer border-t-2 border-x-2 relative ${
            activeTab === "blood"
              ? "bg-white text-teal-700 border-gray-200 border-b-white pb-3.5"
              : "bg-teal-50 text-teal-600 border-transparent hover:bg-teal-100/50 border-b-gray-200"
          }`}
        >
          <Heart className="w-4 h-4 inline mr-2" />
          Blood Donation Centers
        </button>
      )}

      <button
        onClick={() => onTabChange("download")}
        className={`py-3 px-5 rounded-t-lg font-bold text-base whitespace-nowrap transition-all cursor-pointer border-t-2 border-x-2 relative ${
          activeTab === "download"
            ? "bg-white text-teal-700 border-gray-200 border-b-white pb-3.5"
            : "bg-teal-50 text-teal-600 border-transparent hover:bg-teal-100/50 border-b-gray-200"
        }`}
      >
        <FileText className="w-4 h-4 inline mr-2" />
        Download Results
      </button>
    </div>
  );
}
