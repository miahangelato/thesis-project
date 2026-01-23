export interface DiabetesResult {
  diabetes_risk?: string;
  confidence?: number;
}

export interface BloodGroupResult {
  predicted_blood_group?: string;
  confidence?: number;
}

export interface StoredDemographics {
  age?: number | string;
  gender?: string;
  blood_type?: string;
  height_cm?: number | string;
  weight_kg?: number | string;
  willing_to_donate?: unknown;
}

export interface MapPlace {
  name: string;
  address: string;
  google_query: string;
  phone?: string;
  type?: string;
  email?: string;
  website?: string;
  facebook?: string;
}

export interface ResultsParticipantData {
  age: number;
  weight: number;
  height: number;
  gender: string;
  blood_type: string;
  willing_to_donate: boolean;
  saved: boolean;
  participant_id: string;
  explanation: string;
  blood_centers: MapPlace[];
  nearby_facilities: MapPlace[];
  pattern_counts: Record<string, unknown>;
  bmi: number;
  qr_code_url?: string;
  download_url?: string;
}
