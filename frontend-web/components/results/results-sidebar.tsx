import { Droplets, TrendingUp, User } from "lucide-react";

import type {
  BloodGroupResult,
  DiabetesResult,
  ResultsParticipantData,
  StoredDemographics,
} from "@/types/results";

export function ResultsSidebar({
  result,
  bloodGroupResult,
  participantData,
  demographics,
}: {
  result: DiabetesResult;
  bloodGroupResult: BloodGroupResult;
  participantData: ResultsParticipantData;
  demographics: StoredDemographics | null;
}) {
  return (
    <div className="col-span-4 flex flex-col h-full min-h-0 self-start">
      <div className="bg-white rounded-2xl shadow-lg border-2 border-gray-200 p-5 h-full flex flex-col overflow-hidden">
        <div className="flex flex-col mb-6 gap-3 justify-center items-stretch text-sm leading-tight">
          <div
            className={`flex-1 min-w-0 border rounded-xl p-4 shadow-lg ${
              result?.diabetes_risk?.toLowerCase() === "diabetic" ||
              result?.diabetes_risk?.toLowerCase() === "high"
                ? "bg-linear-to-br from-red-50 to-pink-50 border-red-200"
                : "bg-linear-to-br from-green-50 to-emerald-50 border-green-200"
            }`}
          >
            <div className="flex items-center mb-2.5">
              <div
                className={`w-12 h-12 rounded-xl flex items-center justify-center mr-3 ${
                  result?.diabetes_risk?.toLowerCase() === "diabetic" ||
                  result?.diabetes_risk?.toLowerCase() === "high"
                    ? "bg-red-500"
                    : "bg-green-500"
                }`}
              >
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <div className="min-w-0">
                <p
                  className={`text-lg font-bold mb-1 ${
                    result?.diabetes_risk?.toLowerCase() === "diabetic" ||
                    result?.diabetes_risk?.toLowerCase() === "high"
                      ? "text-red-700"
                      : "text-green-700"
                  }`}
                >
                  Diabetes Risk Assessment
                </p>
                <p
                  className={`text-4xl font-bold truncate ${
                    result?.diabetes_risk?.toLowerCase() === "diabetic" ||
                    result?.diabetes_risk?.toLowerCase() === "high"
                      ? "text-red-900"
                      : "text-green-900"
                  }`}
                >
                  {result?.diabetes_risk || "Unknown"}
                </p>
              </div>
            </div>
            {result?.confidence && (
              <div
                className={`mt-3 pt-3 border-t ${
                  result?.diabetes_risk?.toLowerCase() === "diabetic" ||
                  result?.diabetes_risk?.toLowerCase() === "high"
                    ? "border-red-200"
                    : "border-green-200"
                }`}
              >
                <p
                  className={`text-base ${
                    result?.diabetes_risk?.toLowerCase() === "diabetic" ||
                    result?.diabetes_risk?.toLowerCase() === "high"
                      ? "text-red-600"
                      : "text-green-600"
                  }`}
                >
                  Confidence Level:{" "}
                  <span className="font-bold text-xl">
                    {(result.confidence * 100).toFixed(1)}%
                  </span>
                </p>
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0 bg-linear-to-br from-blue-50 to-cyan-50 border border-blue-200 rounded-xl p-4 shadow-lg">
            <div className="flex items-center mb-2.5">
              <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center mr-3">
                <Droplets className="w-6 h-6 text-white" />
              </div>
              <div className="min-w-0">
                <p className="text-lg font-bold text-blue-700 mb-1">
                  Predicted Blood Type
                </p>
                <p className="text-4xl font-bold text-blue-900 truncate">
                  {bloodGroupResult?.predicted_blood_group || "Unknown"}
                </p>
              </div>
            </div>
            {bloodGroupResult?.confidence && (
              <div className="mt-3 pt-3 border-t border-blue-200">
                <p className="text-base text-blue-600">
                  Confidence Level:{" "}
                  <span className="font-bold text-xl">
                    {(bloodGroupResult.confidence * 100).toFixed(1)}%
                  </span>
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          <h4 className="text-xl font-bold text-slate-800 mb-4 uppercase tracking-wide flex items-center border-b pb-2">
            <User className="w-6 h-6 mr-2 text-slate-500" />
            Demographics
          </h4>
          {demographics ? (
            <div className="grid grid-cols-2 gap-x-8 gap-y-5 pt-2 px-6">
              <div className="space-y-5">
                <div className="flex flex-col">
                  <span className="text-base text-slate-500 font-bold mb-1 uppercase tracking-wider">
                    Age
                  </span>
                  <span className="text-2xl font-bold text-slate-900">
                    {demographics?.age || "N/A"}{" "}
                    <span className="text-lg text-slate-500 font-normal">years</span>
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="text-base text-slate-500 font-bold mb-1 uppercase tracking-wider">
                    Weight
                  </span>
                  <span className="text-2xl font-bold text-slate-900">
                    {demographics?.weight_kg || "N/A"}{" "}
                    <span className="text-lg text-slate-500 font-normal">kg</span>
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="text-base text-slate-500 font-bold mb-1 uppercase tracking-wider">
                    Height
                  </span>
                  <span className="text-2xl font-bold text-slate-900">
                    {demographics?.height_cm || "N/A"}{" "}
                    <span className="text-lg text-slate-500 font-normal">cm</span>
                  </span>
                </div>
              </div>

              <div className="space-y-5">
                <div className="flex flex-col">
                  <span className="text-base text-slate-500 font-bold mb-1 uppercase tracking-wider">
                    Gender
                  </span>
                  <span className="text-2xl font-bold text-slate-900 capitalize">
                    {demographics?.gender || "N/A"}
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="text-base text-slate-500 font-bold mb-1 uppercase tracking-wider">
                    Blood Type
                  </span>
                  <span className="text-2xl font-bold text-slate-900 capitalize">
                    {demographics?.blood_type || "Unknown"}
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="text-base text-slate-500 font-bold mb-1 uppercase tracking-wider">
                    BMI
                  </span>
                  <span className="text-2xl font-bold text-slate-900">
                    {participantData?.bmi?.toFixed(1) || "N/A"}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-32 text-slate-400">
              <p className="text-lg">Loading demographics...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
