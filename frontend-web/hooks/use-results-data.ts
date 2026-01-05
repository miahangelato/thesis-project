"use client";

import { useEffect, useState } from "react";

import type {
  BloodGroupResult,
  DiabetesResult,
  MapPlace,
  ResultsParticipantData,
  StoredDemographics,
} from "@/types/results";

const normalizeBoolean = (value: unknown): boolean => {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    return ["yes", "y", "true", "1", "on"].includes(normalized);
  }
  return false;
};

// Decode UTF-8 base64 JSON safely (handles emoji/unicode from AI text)
const decodeBase64Json = (encoded: string) => {
  try {
    const binary = atob(encoded);
    const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
    const decoded = new TextDecoder().decode(bytes);
    return JSON.parse(decoded);
  } catch (err) {
    console.error("Failed to decode stored session data", err);
    return null;
  }
};

const readDemographicsFromSessionStorage = (): StoredDemographics | null => {
  if (typeof window === "undefined") return null;

  const storedDemo = window.sessionStorage.getItem("demographics");
  if (!storedDemo) {
    console.warn("⚠️ No demographics found in sessionStorage");
    return null;
  }

  try {
    const parsed = JSON.parse(storedDemo) as StoredDemographics;
    console.log("✅ Loaded demographics from sessionStorage:", storedDemo);
    return parsed;
  } catch (e) {
    console.error("Failed to parse demographics:", e);
    return null;
  }
};

const readRecord = (value: unknown): Record<string, unknown> | null => {
  if (!value || typeof value !== "object") return null;
  return value as Record<string, unknown>;
};

export function useResultsData(sessionId: string | null) {
  const [result, setResult] = useState<DiabetesResult | null>(null);
  const [bloodGroupResult, setBloodGroupResult] =
    useState<BloodGroupResult | null>(null);
  const [participantData, setParticipantData] =
    useState<ResultsParticipantData | null>(null);
  const [demographics] = useState<StoredDemographics | null>(
    readDemographicsFromSessionStorage
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      console.log("🔍 [Results Page - New] Loading results...");

      // Try to get sessionId from context or fallback to sessionStorage
      let activeSessionId = sessionId;
      if (!activeSessionId) {
        activeSessionId = sessionStorage.getItem("current_session_id");
        console.log(
          "⚠️ No sessionId from context, using fallback:",
          activeSessionId
        );
      }

      if (!activeSessionId) {
        console.warn("⚠️ No session ID available");
        setLoading(false);
        return;
      }

      try {
        // Try to get data from sessionStorage first
        const encodedData = sessionStorage.getItem(activeSessionId);

        if (encodedData) {
          console.log("📦 Found data in sessionStorage");
          const dataWithExpiry = decodeBase64Json(encodedData);

          if (!dataWithExpiry) {
            setLoading(false);
            return;
          }

          // Check expiry
          const expiry = (dataWithExpiry as { expiry?: unknown })?.expiry;
          if (typeof expiry === "number" && Date.now() > expiry) {
            console.warn("⏰ Data expired");
            sessionStorage.removeItem(activeSessionId);
            setLoading(false);
            return;
          }

          const data = (dataWithExpiry as { data?: unknown })?.data;
          console.log("✅ Loaded data:", data);

          const dataObj = readRecord(data) ?? {};
          const demographicsObj = readRecord(dataObj.demographics);

          const bloodCenters = (
            Array.isArray(dataObj.blood_centers)
              ? (dataObj.blood_centers as unknown[])
              : []
          ) as MapPlace[];
          const nearbyFacilities = (
            Array.isArray(dataObj.nearby_facilities)
              ? (dataObj.nearby_facilities as unknown[])
              : []
          ) as MapPlace[];

          const patternCounts =
            readRecord(dataObj.pattern_counts) ??
            ({} as Record<string, unknown>);

          // Pull stored demographics for willingness fallback
          let storedDemographics: StoredDemographics | null = null;
          const storedDemoRaw = sessionStorage.getItem("demographics");
          if (storedDemoRaw) {
            try {
              storedDemographics = JSON.parse(
                storedDemoRaw
              ) as StoredDemographics;
            } catch (err) {
              console.error("Failed to parse stored demographics", err);
            }
          }

          const hasBloodCenters =
            Array.isArray(dataObj.blood_centers) &&
            dataObj.blood_centers.length > 0;

          const willingToDonate =
            normalizeBoolean(demographicsObj?.willing_to_donate) ||
            normalizeBoolean(dataObj.willing_to_donate) ||
            normalizeBoolean(storedDemographics?.willing_to_donate) ||
            hasBloodCenters;

          // Map API response to component state
          setResult({
            diabetes_risk:
              (typeof dataObj.risk_level === "string"
                ? dataObj.risk_level
                : undefined) || "Unknown",
            confidence:
              typeof dataObj.diabetes_risk === "number"
                ? dataObj.diabetes_risk
                : 0,
          });

          setBloodGroupResult({
            predicted_blood_group:
              (typeof dataObj.blood_group === "string"
                ? dataObj.blood_group
                : undefined) || "Unknown",
            confidence:
              typeof dataObj.blood_group_confidence === "number"
                ? dataObj.blood_group_confidence
                : 0,
          });

          setParticipantData({
            age:
              (typeof demographicsObj?.age === "number"
                ? demographicsObj.age
                : typeof dataObj.age === "number"
                ? dataObj.age
                : 0) || 0,
            weight:
              (typeof demographicsObj?.weight_kg === "number"
                ? demographicsObj.weight_kg
                : typeof dataObj.weight_kg === "number"
                ? dataObj.weight_kg
                : 0) || 0,
            height:
              (typeof demographicsObj?.height_cm === "number"
                ? demographicsObj.height_cm
                : typeof dataObj.height_cm === "number"
                ? dataObj.height_cm
                : 0) || 0,
            gender:
              (typeof demographicsObj?.gender === "string"
                ? demographicsObj.gender
                : typeof dataObj.gender === "string"
                ? dataObj.gender
                : "N/A") || "N/A",
            blood_type:
              (typeof dataObj.blood_group === "string"
                ? dataObj.blood_group
                : undefined) || "Unknown",
            willing_to_donate: willingToDonate,
            saved:
              typeof dataObj.saved_to_database === "boolean"
                ? dataObj.saved_to_database
                : false,
            participant_id: activeSessionId,
            explanation:
              typeof dataObj.explanation === "string"
                ? dataObj.explanation
                : "",
            blood_centers: bloodCenters,
            nearby_facilities: nearbyFacilities,
            pattern_counts: patternCounts,
            bmi: typeof dataObj.bmi === "number" ? dataObj.bmi : 0,
          });

          console.log("✅ State updated successfully");
          setLoading(false);
        } else {
          console.error("❌ No data in sessionStorage for session:", sessionId);
          setLoading(false);
        }
      } catch (error) {
        console.error("❌ Error parsing session data:", error);
        setLoading(false);
      }
    };

    fetchData();
  }, [sessionId]);

  return {
    loading,
    result,
    bloodGroupResult,
    participantData,
    demographics,
  } as const;
}
