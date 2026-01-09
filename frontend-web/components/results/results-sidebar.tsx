import React from "react";
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
      {/* Profile Card with All Info */}
      <div className="bg-white rounded-2xl shadow-lg border-2 border-gray-200 p-5 h-full flex flex-col overflow-hidden">
        {/* BLOOD AND DIABETES RESULTS */}
        <div className="flex flex-col mb-6 gap-3 justify-center items-stretch text-sm leading-tight">
          {/* Diabetes Risk Card - Compact */}
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
                  className={`text-[11px] font-semibold mb-0.5 ${
                    result?.diabetes_risk?.toLowerCase() === "diabetic" ||
                    result?.diabetes_risk?.toLowerCase() === "high"
                      ? "text-red-700"
                      : "text-green-700"
                  }`}
                >
                  Diabetes Risk Assessment
                </p>
                <p
                  className={`text-2xl font-bold truncate ${
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
                  className={`text-xs ${
                    result?.diabetes_risk?.toLowerCase() === "diabetic" ||
                    result?.diabetes_risk?.toLowerCase() === "high"
                      ? "text-red-600"
                      : "text-green-600"
                  }`}
                >
                  Confidence Level:{" "}
                  <span className="font-bold text-base">
                    {(result.confidence * 100).toFixed(1)}%
                  </span>
                </p>
              </div>
            )}
          </div>

          {/* Blood Type Card - Compact */}
          <div className="flex-1 min-w-0 bg-linear-to-br from-blue-50 to-cyan-50 border border-blue-200 rounded-xl p-4 shadow-lg">
            <div className="flex items-center mb-2.5">
              <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center mr-3">
                <Droplets className="w-6 h-6 text-white" />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-semibold text-blue-700 mb-0.5">
                  Predicted Blood Type
                </p>
                <p className="text-2xl font-bold text-blue-900 truncate">
                  {bloodGroupResult?.predicted_blood_group || "Unknown"}
                </p>
              </div>
            </div>
            {bloodGroupResult?.confidence && (
              <div className="mt-3 pt-3 border-t border-blue-200">
                <p className="text-xs text-blue-600">
                  Confidence Level:{" "}
                  <span className="font-bold text-base">
                    {(bloodGroupResult.confidence * 100).toFixed(1)}%
                  </span>
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Demographics Section */}
        <div className="flex-1 overflow-y-auto">
          <h4 className="text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">
            <User className="w-4 h-4 inline mr-2" />
            Demographics
          </h4>
          {demographics ? (
            <div className="space-y-1.5">
              <div className="flex justify-between items-center bg-gray-50 rounded-lg p-2">
                <span className="text-sm text-gray-600">Age</span>
                <span className="text-sm font-bold text-gray-900">
                  {demographics?.age || "N/A"} years
                </span>
              </div>
              <div className="flex justify-between items-center bg-gray-50 rounded-lg p-2">
                <span className="text-sm text-gray-600">Gender</span>
                <span className="text-sm font-bold text-gray-900 capitalize">
                  {demographics?.gender || "N/A"}
                </span>
              </div>
              <div className="flex justify-between items-center bg-gray-50 rounded-lg p-2.5">
                <span className="text-sm text-gray-600">Blood Type</span>
                <span className="text-sm font-bold text-gray-900 capitalize">
                  {demographics?.blood_type || "Unknown"}
                </span>
              </div>
              <div className="flex justify-between items-center bg-gray-50 rounded-lg p-2.5">
                <span className="text-sm text-gray-600">Height</span>
                <span className="text-sm font-bold text-gray-900">
                  {demographics?.height_cm || "N/A"} cm
                </span>
              </div>
              <div className="flex justify-between items-center bg-gray-50 rounded-lg p-2.5">
                <span className="text-sm text-gray-600">Weight</span>
                <span className="text-sm font-bold text-gray-900">
                  {demographics?.weight_kg || "N/A"} kg
                </span>
              </div>
              <div className="flex justify-between items-center bg-gray-50 rounded-lg p-2.5">
                <span className="text-sm text-gray-600">BMI</span>
                <span className="text-sm font-bold text-gray-900">
                  {participantData?.bmi?.toFixed(1) || "N/A"}
                </span>
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-500">Loading demographics...</p>
          )}
        </div>
      </div>
    </div>
  );
}
