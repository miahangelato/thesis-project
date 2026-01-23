import { api } from "./api-client";
import { API_ENDPOINTS } from "./constants";

export const sessionAPI = {
  start: (consent: boolean) => api.post(API_ENDPOINTS.SESSION_START, { consent }),

  submitDemographics: (
    sessionId: string,
    data: {
      age: number;
      weight_kg: number;
      height_cm: number;
      gender: string;
      willing_to_donate: boolean;
      blood_type?: string;
    }
  ) => api.post(API_ENDPOINTS.SESSION_DEMOGRAPHICS(sessionId), data),

  submitFingerprint: (
    sessionId: string,
    data: {
      finger_name: string;
      image: string;
    }
  ) => api.post(API_ENDPOINTS.SESSION_FINGERPRINT(sessionId), data),

  updateConsent: (sessionId: string, consent: boolean) =>
    api.patch(`/session/${sessionId}/consent`, { consent }),

  analyze: (sessionId: string) => api.post(API_ENDPOINTS.SESSION_ANALYZE(sessionId)),

  getResults: (sessionId: string) => api.get(API_ENDPOINTS.SESSION_RESULTS(sessionId)),

  generatePDF: (sessionId: string) =>
    api.post(API_ENDPOINTS.SESSION_GENERATE_PDF(sessionId)),

  downloadPDF: (sessionId: string) =>
    api.get(API_ENDPOINTS.SESSION_GENERATE_PDF(sessionId), { responseType: "blob" }),
};

export interface AnalyzePatientRequest {
  age: number;
  weight_kg: number;
  height_cm: number;
  gender: string;
  blood_type?: string;
  consent: boolean;
  willing_to_donate: boolean;
  fingerprint_images: string[];
}

export interface AnalyzePatientResponse {
  success: boolean;
  record_id?: string;
  diabetes_risk_score: number;
  diabetes_risk_level: string;
  diabetes_confidence: number;
  pattern_counts: {
    Arc: number;
    Loop: number;
    Whorl: number;
  };
  bmi: number;
  predicted_blood_group: string;
  blood_group_confidence: number;
  explanation: string;
  saved: boolean;
  timestamp: string;
}

export const analysisAPI = {
  analyze: (data: AnalyzePatientRequest) =>
    api.post<AnalyzePatientResponse>(API_ENDPOINTS.ANALYZE, data),
};

export const healthCheck = () => api.get(API_ENDPOINTS.HEALTH);
