"use client";
import { useEffect, useState } from "react";
import { useSession } from "@/contexts/session-context";
import { ProgressHeader } from "@/components/layout/progress-header";
import { Footer } from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import React from "react";
import { useRouter } from "next/navigation";
import { ROUTES, STEPS } from "@/lib/constants";
import {
  Droplets,
  TrendingUp,
  Heart,
  Hospital,
  CheckCircle,
  Info,
  MapPin,
  Clock,
  AlertTriangle,
  XCircle,
} from "lucide-react";

interface DiabetesResult {
  diabetes_risk?: string;
  confidence?: number;
}

interface BloodGroupResult {
  predicted_blood_group?: string;
  confidence?: number;
}

export default function ResultPage() {
  const router = useRouter();
  const { sessionId, clearSession } = useSession();
  const [result, setResult] = useState<DiabetesResult | null>(null);
  const [bloodGroupResult, setBloodGroupResult] =
    useState<BloodGroupResult | null>(null);
  const [participantData, setParticipantData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      console.log("🔍 [Results Page - New] Loading results...");
      
      // Try to get sessionId from context or fallback to sessionStorage
      let activeSessionId = sessionId;
      if (!activeSessionId) {
        activeSessionId = sessionStorage.getItem('current_session_id');
        console.log("⚠️ No sessionId from context, using fallback:", activeSessionId);
      }
      
      if (!activeSessionId) {
        console.warn("⚠️ No session ID available");
        setLoading(false);
        return;
      }

      try {
        // Try to get data from sessionStorage first
        const encodedData = sessionStorage.getItem(activeSessionId!);
        
        if (encodedData) {
          console.log("📦 Found data in sessionStorage");
          const dataString = atob(encodedData);
          const dataWithExpiry = JSON.parse(dataString);
          
          // Check expiry
          if (Date.now() > dataWithExpiry.expiry) {
            console.warn("⏰ Data expired");
            sessionStorage.removeItem(activeSessionId!);
            setLoading(false);
            return;
          }
          
          const data = dataWithExpiry.data;
          console.log("✅ Loaded data:", data);
          
          // Map API response to component state
          setResult({
            diabetes_risk: data.risk_level || "Unknown",
            confidence: data.diabetes_risk || 0
          });
          
          setBloodGroupResult({
            predicted_blood_group: data.blood_group || "Unknown",
            confidence: data.blood_group_confidence || 0
          });
          
          setParticipantData({
            age: data.demographics?.age || data.age || 0,
            weight: data.demographics?.weight_kg || data.weight_kg || 0,
            height: data.demographics?.height_cm || data.height_cm || 0,
            gender: data.demographics?.gender || data.gender || "N/A",
            blood_type: data.blood_group || "Unknown",
            willing_to_donate: data.demographics?.willing_to_donate || data.willing_to_donate || false,
            saved: data.saved_to_database || false,
            participant_id: activeSessionId,
            explanation: data.explanation || "",
            blood_centers: data.blood_centers || [],
            nearby_facilities: data.nearby_facilities || [],
            pattern_counts: data.pattern_counts || {},
            bmi: data.bmi || 0
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

  const handleNewSession = () => {
    clearSession();
    router.push(ROUTES.HOME);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500 mx-auto mb-4"></div>
          <p>Loading results...</p>
        </div>
      </div>
    );
  }

  if (!result || !bloodGroupResult || !participantData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-gray-500 mb-4">No results found</p>
          <button
            onClick={handleNewSession}
            className="bg-cyan-500 text-white px-6 py-3 rounded-lg hover:bg-cyan-600"
          >
            Start New Analysis
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-white flex flex-col">
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <ProgressHeader
            currentStep={STEPS.RESULTS}
            totalSteps={4}
            title="Analysis Results"
            subtitle="Your health analysis is complete. Review your results and recommendations below."
          />

          {/* Main Content */}
          <div className="mt-8 space-y-6">
            {/* Results Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Blood Type Card */}
              <div className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800 border rounded-lg p-6">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Droplets className="w-6 h-6 text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                      Predicted Blood Type
                    </p>
                    <p className="text-2xl text-blue-800 dark:text-blue-200 font-semibold">
                      {bloodGroupResult.predicted_blood_group || "Unknown"}
                    </p>
                    {bloodGroupResult.confidence && (
                      <p className="text-xs text-muted-foreground">
                        Confidence: {(bloodGroupResult.confidence * 100).toFixed(1)}%
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Diabetes Risk Card */}
              <div
                className={`border rounded-lg p-6 ${
                  result.diabetes_risk?.toLowerCase() === "diabetic" ||
                  result.diabetes_risk?.toLowerCase() === "high"
                    ? "bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800"
                    : "bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800"
                }`}
              >
                <div className="flex items-center space-x-4">
                  <div
                    className={`w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      result.diabetes_risk?.toLowerCase() === "diabetic" ||
                      result.diabetes_risk?.toLowerCase() === "high"
                        ? "bg-red-100 dark:bg-red-900"
                        : "bg-green-100 dark:bg-green-900"
                    }`}
                  >
                    <TrendingUp
                      className={`w-6 h-6 ${
                        result.diabetes_risk?.toLowerCase() === "diabetic" ||
                        result.diabetes_risk?.toLowerCase() === "high"
                          ? "text-red-600"
                          : "text-green-600"
                      }`}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p
                      className={`text-sm ${
                        result.diabetes_risk?.toLowerCase() === "diabetic" ||
                        result.diabetes_risk?.toLowerCase() === "high"
                          ? "text-red-700 dark:text-red-300"
                          : "text-green-700 dark:text-green-300"
                      }`}
                    >
                      Diabetes Risk Assessment
                    </p>
                    <p
                      className={`text-lg font-semibold ${
                        result.diabetes_risk?.toLowerCase() === "diabetic" ||
                        result.diabetes_risk?.toLowerCase() === "high"
                          ? "text-red-800 dark:text-red-200"
                          : "text-green-800 dark:text-green-200"
                      }`}
                    >
                      {result.diabetes_risk
                        ? result.diabetes_risk.toUpperCase()
                        : "UNKNOWN"}
                    </p>
                    {result.confidence && (
                      <p className="text-xs text-muted-foreground">
                        Confidence: {(result.confidence * 100).toFixed(1)}%
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Participant Details */}
            <div className="bg-gray-50 dark:bg-gray-900/20 border rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4">
                Participant Information
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                <div className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg">
                  <span className="font-medium text-gray-600 dark:text-gray-300">
                    Age
                  </span>
                  <span className="font-semibold text-gray-900 dark:text-gray-100">
                    {participantData.age} years
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg">
                  <span className="font-medium text-gray-600 dark:text-gray-300">
                    Gender
                  </span>
                  <span className="font-semibold text-gray-900 dark:text-gray-100">
                    {participantData.gender}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg">
                  <span className="font-medium text-gray-600 dark:text-gray-300">
                    Height
                  </span>
                  <span className="font-semibold text-gray-900 dark:text-gray-100">
                    {participantData.height} cm
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg">
                  <span className="font-medium text-gray-600 dark:text-gray-300">
                    Weight
                  </span>
                  <span className="font-semibold text-gray-900 dark:text-gray-100">
                    {participantData.weight} kg
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg">
                  <span className="font-medium text-gray-600 dark:text-gray-300">
                    BMI
                  </span>
                  <span className="font-semibold text-gray-900 dark:text-gray-100">
                    {participantData.bmi?.toFixed(1)}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg">
                  <span className="font-medium text-gray-600 dark:text-gray-300">
                    Blood Type
                  </span>
                  <span className="font-semibold text-gray-900 dark:text-gray-100">
                    {participantData.blood_type}
                  </span>
                </div>
              </div>
            </div>

            {/* AI Health Insights Section */}
            {participantData.explanation && (
              <div className="bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-950/20 dark:to-indigo-950/20 border border-purple-200 dark:border-purple-800 rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center">
                  <Info className="w-5 h-5 mr-2 text-purple-600" />
                  AI Health Insights
                </h3>
                <div className="prose prose-sm max-w-none text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                  {participantData.explanation}
                </div>
              </div>
            )}

            {/* Blood Donation Centers Section - Only if willing to donate */}
            {participantData.blood_centers && participantData.blood_centers.length > 0 && (
              <div className="bg-gradient-to-br from-red-50 to-pink-50 dark:from-red-950/20 dark:to-pink-950/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center">
                  <Heart className="w-5 h-5 mr-2 text-red-600" />
                  Blood Donation Centers
                </h3>
                
                {/* Info Banner */}
                <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-300 dark:border-blue-700 rounded-lg">
                  <p className="text-sm text-blue-800 dark:text-blue-200 flex items-start">
                    <Info className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
                    <span>
                      <strong>Interested in saving lives?</strong> Contact these accredited blood donation centers for screening and donation schedules. All centers follow DOH and PRC standards.
                    </span>
                  </p>
                </div>

                <div className="space-y-4">
                  {participantData.blood_centers.map((center: any, idx: number) => (
                    <div key={idx} className="bg-white dark:bg-gray-800 border border-red-200 dark:border-red-700 rounded-lg p-4">
                      <div className="mb-3">
                        <h4 className="font-semibold text-gray-900 dark:text-gray-100 text-lg flex items-center">
                          <Heart className="w-5 h-5 mr-2 text-red-500" />
                          {center.name}
                        </h4>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {center.type}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400 flex items-start mt-2">
                          <MapPin className="w-4 h-4 mr-1 mt-0.5 flex-shrink-0" />
                          {center.address}
                        </p>
                      </div>

                      {/* Map Embed */}
                      <div className="mb-3 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
                        <iframe
                          src={`https://www.google.com/maps?q=${encodeURIComponent(center.google_query)}&output=embed`}
                          width="100%"
                          height="200"
                          style={{ border: 0 }}
                          loading="lazy"
                          title={center.name}
                        ></iframe>
                      </div>

                      {/* Contact Information */}
                      {center.phone && (
                        <div className="mb-3">
                          <a
                            href={`tel:${center.phone}`}
                            className="inline-flex items-center px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors"
                          >
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                            </svg>
                            Call {center.phone}
                          </a>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                            📞 Call to inquire about donation schedules and requirements
                          </p>
                        </div>
                      )}

                      {/* General Requirements */}
                      {center.general_requirements && center.general_requirements.length > 0 && (
                        <div className="mb-3">
                          <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            General Requirements:
                          </p>
                          <ul className="list-disc list-inside text-sm text-gray-600 dark:text-gray-400 space-y-1">
                            {center.general_requirements.map((req: string, ridx: number) => (
                              <li key={ridx}>{req}</li>
                            ))}
                          </ul>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 italic">
                            Note: Final eligibility determined by medical staff during screening
                          </p>
                        </div>
                      )}

                      {/* Website/FB Links */}
                      <div className="flex gap-2">
                        {center.website && (
                          <a
                            href={center.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-200 rounded-lg text-xs font-medium hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors"
                          >
                            🌐 Website
                          </a>
                        )}
                        {center.facebook && (
                          <a
                            href={center.facebook}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-200 rounded-lg text-xs font-medium hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors"
                          >
                            📱 Facebook
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recommended Health Facilities Section */}
            {participantData.nearby_facilities && participantData.nearby_facilities.length > 0 && (
              <div className="bg-gray-50 dark:bg-gray-900/20 border rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center">
                  <Hospital className="w-5 h-5 mr-2 text-indigo-600" />
                  Recommended Health Facilities
                </h3>
                
                {/* Important Notice */}
                <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-300 dark:border-blue-700 rounded-lg">
                  <p className="text-sm text-blue-800 dark:text-blue-200 flex items-start">
                    <Info className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
                    <span>
                      <strong>Verified facilities nearby.</strong> Call each facility directly to confirm current hours, availability, and specialized services.
                    </span>
                  </p>
                </div>

                <div className="space-y-4">
                  {participantData.nearby_facilities.map((facility: any, idx: number) => (
                    <div key={idx} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                      <div className="mb-3">
                        <h4 className="font-semibold text-gray-900 dark:text-gray-100 text-lg">
                          {facility.name}
                        </h4>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {facility.type}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400 flex items-start mt-2">
                          <MapPin className="w-4 h-4 mr-1 mt-0.5 flex-shrink-0" />
                          {facility.address}
                        </p>
                      </div>
                      
                      {/* Map Embed */}
                      <div className="mb-3 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
                        <iframe
                          src={`https://www.google.com/maps?q=${encodeURIComponent(facility.google_query)}&output=embed`}
                          width="100%"
                          height="200"
                          style={{ border: 0 }}
                          loading="lazy"
                          title={facility.name}
                        ></iframe>
                      </div>

                      {/* Real Contact Information */}
                      {facility.phone && (
                        <div className="mb-3">
                          <a
                            href={`tel:${facility.phone}`}
                            className="inline-flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors"
                          >
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                            </svg>
                            Call {facility.phone}
                          </a>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                            📞 Call to verify current hours, doctor availability, and services
                          </p>
                        </div>
                      )}

                      {/* Interactive Map Link */}
                      <div className="mb-2">
                        <a
                          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(facility.google_query)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
                        >
                          <MapPin className="w-4 h-4 mr-2" />
                          View on Google Maps
                        </a>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                          🗺️ See real-time hours, reviews, and directions on Google Maps
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons - Bottom */}
          <div className="flex justify-between items-center pt-6 mt-8 border-t">
            <Button
              variant="outline"
              onClick={() => router.push(ROUTES.CONSENT)}
              className="px-6 py-3 text-sm"
            >
              Back To Consent
            </Button>

            <Button
              onClick={handleNewSession}
              className="px-6 py-3 text-sm bg-[#00c2cb] hover:bg-[#00adb5] text-white"
            >
              End Process
            </Button>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
