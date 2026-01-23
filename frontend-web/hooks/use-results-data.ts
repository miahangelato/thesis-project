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

const decodeBase64Json = (encoded: string) => {
  try {
    const binary = atob(encoded);
    const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
    const decoded = new TextDecoder().decode(bytes);
    return JSON.parse(decoded);
  } catch (err) {
    return null;
  }
};

const readDemographicsFromSessionStorage = (): StoredDemographics | null => {
  if (typeof window === "undefined") return null;

  const storedDemo = window.sessionStorage.getItem("demographics");
  if (!storedDemo) {
    return null;
  }

  try {
    const parsed = JSON.parse(storedDemo) as StoredDemographics;
    return parsed;
  } catch (e) {
    return null;
  }
};

const readRecord = (value: unknown): Record<string, unknown> | null => {
  if (!value || typeof value !== "object") return null;
  return value as Record<string, unknown>;
};

export function useResultsData(sessionId: string | null) {
  const [result, setResult] = useState<DiabetesResult | null>(null);
  const [bloodGroupResult, setBloodGroupResult] = useState<BloodGroupResult | null>(null);
  const [participantData, setParticipantData] = useState<ResultsParticipantData | null>(
    null
  );
  const [demographics] = useState<StoredDemographics | null>(
    readDemographicsFromSessionStorage
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      let activeSessionId = sessionId;
      if (!activeSessionId) {
        activeSessionId = sessionStorage.getItem("current_session_id");
      }

      if (!activeSessionId) {
        setLoading(false);
        return;
      }

      try {
        const encodedData = sessionStorage.getItem(activeSessionId);

        if (encodedData) {
          const dataWithExpiry = decodeBase64Json(encodedData);

          if (!dataWithExpiry) {
            setLoading(false);
            return;
          }

          const expiry = (dataWithExpiry as { expiry?: unknown })?.expiry;
          if (typeof expiry === "number" && Date.now() > expiry) {
            sessionStorage.removeItem(activeSessionId);
            setLoading(false);
            return;
          }

          const data = (dataWithExpiry as { data?: unknown })?.data;
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
            readRecord(dataObj.pattern_counts) ?? ({} as Record<string, unknown>);

          let storedDemographics: StoredDemographics | null = null;
          const storedDemoRaw = sessionStorage.getItem("demographics");
          if (storedDemoRaw) {
            try {
              storedDemographics = JSON.parse(storedDemoRaw) as StoredDemographics;
            } catch (err) {}
          }

          const hasBloodCenters =
            Array.isArray(dataObj.blood_centers) && dataObj.blood_centers.length > 0;

          const willingToDonate =
            normalizeBoolean(demographicsObj?.willing_to_donate) ||
            normalizeBoolean(dataObj.willing_to_donate) ||
            normalizeBoolean(storedDemographics?.willing_to_donate) ||
            hasBloodCenters;

          setResult({
            diabetes_risk:
              (typeof dataObj.risk_level === "string" ? dataObj.risk_level : undefined) ||
              "Unknown",
            confidence:
              typeof dataObj.diabetes_risk === "number" ? dataObj.diabetes_risk : 0,
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
              typeof dataObj.explanation === "string" ? dataObj.explanation : "",
            blood_centers: bloodCenters,
            nearby_facilities: nearbyFacilities,
            pattern_counts: patternCounts,
            bmi: typeof dataObj.bmi === "number" ? dataObj.bmi : 0,
            qr_code_url:
              typeof dataObj.qr_code_url === "string" ? dataObj.qr_code_url : undefined,
            download_url:
              typeof dataObj.download_url === "string" ? dataObj.download_url : undefined,
          });

          setLoading(false);
        } else {
          setLoading(false);
        }
      } catch (error) {
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
